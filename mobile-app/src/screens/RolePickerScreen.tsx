import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function RolePickerScreen() {
  const navigation = useNavigation<any>();

  const selectRole = (role: 'customer' | 'provider') => {
    // Navigate to shared login, passing the selected role as a parameter
    navigation.navigate('Login', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>Insta<Text style={styles.brandAccent}>Come</Text></Text>
          <Text style={styles.subtitle}>Your day, made easier.</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => selectRole('customer')}>
            <Text style={styles.emoji}>🏠</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDesc}>Book everyday services at your doorstep.</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => selectRole('provider')}>
            <Text style={styles.emoji}>🤝</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>I'm a Service Partner</Text>
              <Text style={styles.cardDesc}>Offer your skills and earn on your schedule.</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  brand: { fontSize: 42, fontWeight: '800', color: '#152d55', letterSpacing: -1 },
  brandAccent: { color: '#f45127' },
  subtitle: { fontSize: 16, color: '#697180', marginTop: 8 },
  cardContainer: { gap: 16 },
  card: { backgroundColor: 'white', padding: 24, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#3e241e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  emoji: { fontSize: 32, marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#152d55', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#697180', lineHeight: 18 },
  arrow: { fontSize: 24, color: '#f45127', fontWeight: 'bold' }
});
