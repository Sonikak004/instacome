import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PreferencesScreen() {
  const [diet, setDiet] = useState<string | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const navigation = useNavigation<any>();

  const toggleCuisine = (cuisine: string) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter(c => c !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };

  const handleFinish = () => {
    navigation.navigate('Home');
  };

  const dietaryOptions = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Both'];
  const cuisineOptions = ['North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian', 'Healthy'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Food Preferences</Text>
      <Text style={styles.subtitle}>
        This helps us suggest the best chefs for you. You can still search for anything later!
      </Text>

      <Text style={styles.sectionTitle}>DIETARY PREFERENCE</Text>
      <View style={styles.chipContainer}>
        {dietaryOptions.map((item) => (
          <TouchableOpacity 
            key={item}
            style={[styles.chip, diet === item && styles.chipActive]}
            onPress={() => setDiet(item)}
          >
            <Text style={[styles.chipText, diet === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>FAVOURITE CUISINES</Text>
      <View style={styles.chipContainer}>
        {cuisineOptions.map((item) => {
          const isActive = cuisines.includes(item);
          return (
            <TouchableOpacity 
              key={item}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => toggleCuisine(item)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf7',
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#152d55',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#697180',
    lineHeight: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f45127',
    marginBottom: 16,
    letterSpacing: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f0e6e0',
  },
  chipActive: {
    backgroundColor: '#fff0e9',
    borderColor: '#f3a184',
  },
  chipText: {
    fontSize: 14,
    color: '#697180',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#f45127',
  },
  button: {
    backgroundColor: '#f45127',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    color: '#152d55',
    fontWeight: '700',
  }
});
