import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ProviderSetupScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'chef', label: 'Chef', icon: '👩🏽‍🍳' },
    { id: 'maid', label: 'Maid / Cleaning', icon: '🧹' },
    { id: 'laundry', label: 'Laundry', icon: '🧺' },
    { id: 'wash', label: 'Car & Bike Wash', icon: '🚙' },
    { id: 'driver', label: 'Driver', icon: '🚘' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Provider Profile</Text>
      <Text style={styles.subtitle}>Set up your services and pricing.</Text>

      <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
      <TextInput style={styles.input} placeholder="Full Name" />
      <TextInput style={styles.input} placeholder="Languages Spoken (e.g. Hindi, English)" />
      
      <Text style={styles.sectionTitle}>SERVICE CATEGORY</Text>
      <View style={styles.grid}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.tile, selectedCategory === cat.id && styles.tileSelected]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.tileIcon}>{cat.icon}</Text>
            <Text style={[styles.tileText, selectedCategory === cat.id && styles.tileTextSelected]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>EXPERIENCE & PRICING</Text>
      <TextInput style={styles.input} placeholder="Years of Experience" keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Hourly Rate (₹)" keyboardType="number-pad" />
      <Text style={styles.guidance}>* Compare rates: average for this category is ₹250 - ₹400 / hr.</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          if (!selectedCategory) alert("Please select a category");
          else navigation.navigate('Verification');
        }}
      >
        <Text style={styles.buttonText}>Next: KYC & Verification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf7' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#152d55', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#697180', marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#f45127', marginBottom: 16, letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: '#f0e6e0', borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fff', fontSize: 14, color: '#152d55' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  tile: { width: '48%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0e6e0', borderRadius: 12, padding: 16, alignItems: 'center' },
  tileSelected: { borderColor: '#f45127', backgroundColor: '#fff0e9' },
  tileIcon: { fontSize: 32, marginBottom: 8 },
  tileText: { fontSize: 12, fontWeight: '700', color: '#152d55', textAlign: 'center' },
  tileTextSelected: { color: '#f45127' },
  guidance: { fontSize: 11, color: '#697180', fontStyle: 'italic', marginBottom: 32 },
  button: { backgroundColor: '#152d55', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
