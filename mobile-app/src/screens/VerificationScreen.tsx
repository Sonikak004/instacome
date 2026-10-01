import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function VerificationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  // We receive the data passed from the ProviderSetupScreen
  const { providerData } = route.params || {};

  const [kycStatus, setKycStatus] = useState('pending_submission'); // pending_submission, verifying, verified, rejected
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  const simulateDigilocker = () => {
    setKycStatus('verifying');
    setTimeout(() => {
      setKycStatus('verified');
      Alert.alert("DigiLocker Match", "Identity verified successfully via mock API.");
    }, 2000);
  };

  const handleSubmit = async () => {
    if (kycStatus !== 'verified') {
      Alert.alert("KYC Required", "You must verify your identity via DigiLocker/Face Match before submitting your profile.");
      return;
    }

    try {
      const userId = '11111111-1111-1111-1111-111111111111'; // Mock Auth ID

      const { error: providerError } = await supabase.from('providers').insert({
        id: userId,
        phone_number: providerData?.phone || '+919999999999',
        full_name: providerData?.fullName || 'Demo Provider',
        categories: providerData?.categories || ['chef'],
        languages: providerData?.languages || ['English'],
        years_experience: providerData?.experience || 5,
        hourly_rate: providerData?.hourlyRate || 300,
        kyc_status: 'verified', // Now we actually set it based on the client (server verifies this in prod)
        admin_approval_status: 'pending',
        is_online: false
      });

      if (providerError) throw providerError;

      const { error: bankError } = await supabase.from('provider_bank_details').insert({
        provider_id: userId,
        bank_account_number: bankAccount,
        bank_ifsc: bankIfsc
      });

      if (bankError) throw bankError;

      Alert.alert(
        "Profile Submitted",
        "Your profile is under Admin Review. You cannot receive bookings until an Admin approves you.",
        [{ text: "OK", onPress: () => navigation.navigate('ProviderHome') }]
      );
    } catch (err) {
      Alert.alert("Error", "Could not connect to the database.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Verification & Payouts</Text>
      <Text style={styles.subtitle}>Securely provide your documents so we can pay you.</Text>

      <View style={styles.alertBox}>
        <Text style={styles.alertText}>
          🔐 Your documents and bank details are stored securely. Bank details are placed in a strictly restricted table using Row Level Security (RLS).
        </Text>
      </View>

      <Text style={styles.sectionTitle}>IDENTITY VERIFICATION</Text>
      
      <TouchableOpacity 
        style={[styles.uploadButton, kycStatus === 'verified' && { borderColor: '#16845a', backgroundColor: '#eefcf6' }]} 
        onPress={simulateDigilocker}
        disabled={kycStatus === 'verifying' || kycStatus === 'verified'}
      >
        <Text style={[styles.uploadText, kycStatus === 'verified' && { color: '#16845a' }]}>
          {kycStatus === 'pending_submission' ? '📸 Verify via DigiLocker / Face Match' : 
           kycStatus === 'verifying' ? 'Verifying with external API...' : '✅ Identity Verified'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>PAYOUT ACCOUNT (SENSITIVE)</Text>
      <TextInput style={styles.input} placeholder="Bank Account Number" secureTextEntry value={bankAccount} onChangeText={setBankAccount} />
      <TextInput style={styles.input} placeholder="IFSC Code" autoCapitalize="characters" value={bankIfsc} onChangeText={setBankIfsc} />

      <TouchableOpacity style={[styles.button, kycStatus !== 'verified' && { backgroundColor: '#d9ccc5' }]} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Profile to Database</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#152d55', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#697180', marginBottom: 24 },
  alertBox: { backgroundColor: '#eef4fd', padding: 16, borderRadius: 12, marginBottom: 32 },
  alertText: { fontSize: 12, color: '#152d55', fontWeight: '600', lineHeight: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#f45127', marginBottom: 16, letterSpacing: 1 },
  uploadButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#152d55', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  uploadText: { color: '#152d55', fontWeight: '700', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#f0e6e0', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fff', fontSize: 14, color: '#152d55' },
  button: { backgroundColor: '#f45127', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
