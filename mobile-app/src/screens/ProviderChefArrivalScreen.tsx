import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ProviderChefArrivalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [otp, setOtp] = useState('');
  const [jobStarted, setJobStarted] = useState(false);
  
  const handleVerifyOTP = () => {
    // In production, this verifies the OTP against Supabase RPC
    if (otp === '4826') {
      setJobStarted(true);
      Alert.alert("Success", "Cooking timer has started securely.");
    } else {
      Alert.alert("Error", "Invalid Arrival Code. Please ask the customer.");
    }
  };

  const handleComplete = () => {
    Alert.alert(
      "Complete Job?",
      "Are you sure you have finished cooking and cleaning up?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Complete", style: "destructive", onPress: () => {
          alert("Job Completed! Earnings recorded.");
          navigation.navigate('ProviderHome');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chef Service</Text>
      </View>

      <View style={styles.content}>
        {!jobStarted ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You have arrived</Text>
            <Text style={styles.cardDesc}>
              Please enter the 4-digit Arrival Code displayed on the customer's phone to officially start the timer.
            </Text>

            <TextInput 
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP}>
              <Text style={styles.primaryButtonText}>Verify & Start Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Job in Progress</Text>
            <Text style={styles.cardDesc}>The cooking timer is actively running.</Text>
            
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>00:15:32</Text>
              <Text style={styles.timerSub}>elapsed</Text>
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#16845a', marginBottom: 10 }]} onPress={() => alert("Requesting extension...")}>
              <Text style={styles.primaryButtonText}>Request +1 Hour Extension</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#e50924' }]} onPress={handleComplete}>
              <Text style={styles.primaryButtonText}>Cooking Completed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0e6e0' },
  backBtn: { fontSize: 16, fontWeight: '700', color: '#152d55', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#152d55' },
  content: { padding: 20 },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#f0e6e0', alignItems: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#152d55', marginBottom: 10 },
  cardDesc: { fontSize: 14, color: '#697180', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  otpInput: { fontSize: 32, fontWeight: '800', color: '#152d55', letterSpacing: 10, borderBottomWidth: 2, borderBottomColor: '#f45127', paddingBottom: 5, marginBottom: 30, width: 120, textAlign: 'center' },
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center', width: '100%' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '800' },
  timerBox: { padding: 30, backgroundColor: '#fff9f6', borderRadius: 20, borderWidth: 1, borderColor: '#f3a184', alignItems: 'center', marginBottom: 30, width: '100%' },
  timerText: { fontSize: 36, fontWeight: '800', color: '#f45127' },
  timerSub: { fontSize: 12, color: '#697180', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 }
});
