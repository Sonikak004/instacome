import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function OTPScreen() {
  const [otp, setOtp] = useState('');
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone = route.params?.phone || '99999 99999';

  const role = route.params?.role || 'customer';

  const handleVerify = () => {
    // In demo mode, we just accept any 4 digit OTP
    if (otp.length === 4) {
      if (role === 'customer') {
        navigation.navigate('Preferences');
      } else {
        navigation.navigate('ProviderSetup', { phone });
      }
    } else {
      alert("Please enter a 4-digit OTP");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>We sent a code to +91 {phone}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.otpInput}
          placeholder="0000"
          keyboardType="number-pad"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>Didn't receive it? Resend</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf7',
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#152d55',
    fontWeight: '700',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#152d55',
    fontFamily: 'Playfair Display',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#697180',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#f0e6e0',
    borderRadius: 12,
    height: 60,
    backgroundColor: '#fff9f6',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#152d55',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#f45127',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  resendButton: {
    alignItems: 'center',
    padding: 8,
  },
  resendText: {
    color: '#152d55',
    fontWeight: '700',
    fontSize: 14,
  }
});
