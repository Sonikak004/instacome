import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const role = route.params?.role || 'customer';

  const handleLogin = () => {
    // Demo mode: skip actual SMS integration for now
    if (phone.length >= 10) {
      navigation.navigate('OTP', { phone, role });
    } else {
      alert("Please enter a valid 10-digit phone number");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        {/* We use the logo uploaded by the user */}
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.tagline}>Your day, made easier.</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>ENTER YOUR PHONE NUMBER</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="99999 99999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Get OTP</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf7',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 250,
    height: 80,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#152d55', // Navy
    fontWeight: '600',
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
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f45127', // Orange
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0e6e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 54,
    backgroundColor: '#fff9f6',
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#152d55',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#152d55',
    fontWeight: '600',
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
  disclaimer: {
    fontSize: 11,
    color: '#697180',
    textAlign: 'center',
    lineHeight: 16,
  }
});
