import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  // Use passed address or default
  const displayAddress = route.params?.selectedAddress || 'Home · Koramangala';
  
  const [selectedService, setSelectedService] = useState('chef');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(60);

  const categories = [
    { id: 'chef', label: 'Chefs', icon: '👩🏽‍🍳' },
    { id: 'laundry', label: 'Laundry', icon: '🧺' },
    { id: 'pest_control', label: 'Pest Control', icon: '🕷️' },
  ];

  useEffect(() => {
    let interval: any;
    if (isSearching && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsSearching(false);
      alert("No providers available right now. (Simulated Timeout)");
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [isSearching, timer]);

  const handleBookNowPress = () => {
    // Show the pre-booking map pin confirmation first!
    setShowConfirm(true);
  };

  const handleConfirmAddressAndBook = () => {
    setShowConfirm(false);
    setIsSearching(true);
    setTimer(60);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.locationLine}>
            <Text style={{ fontSize: 16 }}>📍</Text>
            <View style={styles.locationCopy}>
              <Text style={styles.locLabel}>SERVICE AT</Text>
              <Text style={styles.address}>{displayAddress} ⌄</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Address')}>
              <Text style={styles.locationChange}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cornerLogo}>
            {/* The Logo SVG is hard to reproduce perfectly without SVG pack, using text/image fallback */}
            <Text style={styles.logoText}>
              <Text style={{color: '#152d55'}}>Insta</Text>
              <Text style={{color: '#f45127'}}>Come</Text>
            </Text>
          </View>
        </View>

        {/* Hero Section matching the HTML */}
        <LinearGradient
          colors={['#09224d', '#164273', '#f45127']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTag}>EVERYDAY HELP, ON DEMAND</Text>
          <Text style={styles.heroTitle}>Good help, right when you need it.</Text>
          <Text style={styles.heroDesc}>Book trusted local pros for cooking, cleaning and more.</Text>
          <Text style={styles.heroIconBackground}>✦</Text>
        </LinearGradient>

        {/* Search Bar matching the HTML */}
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search a service or provider..." 
            placeholderTextColor="#697180" 
            editable={false} // Mock
          />
        </View>

        {/* Category Row matching HTML dishrow */}
        <View style={styles.section}>
          <View style={styles.between}>
            <Text style={styles.sectionTitle}>What do you need?</Text>
            <Text style={styles.sectionBadge}>Available now ✨</Text>
          </View>
          <Text style={styles.sectionSub}>Get help at home, whenever you need it</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishrow}>
            {categories.map((cat) => {
              const isSelected = selectedService === cat.id;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.serviceTile, isSelected && styles.serviceTileSelected]}
                  onPress={() => setSelectedService(cat.id)}
                >
                  <Text style={styles.tileIco}>{cat.icon}</Text>
                  <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>{cat.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Action area for booking */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('Payment', { 
              serviceName: categories.find(c => c.id === selectedService)?.label,
              price: 499,
              address: displayAddress 
            })}
          >
            <Text style={styles.primaryButtonText}>Book {categories.find(c => c.id === selectedService)?.label} Now</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  content: { paddingBottom: 100 },
  topBar: { flexDirection: 'row', padding: 11, paddingHorizontal: 17, marginBottom: 9, backgroundColor: 'white', alignItems: 'center' },
  locationLine: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f6', padding: 8, borderRadius: 14, borderWidth: 1, borderColor: '#efe4df', marginRight: 10 },
  locationCopy: { flex: 1, marginHorizontal: 8 },
  locLabel: { fontSize: 9, fontWeight: '800', color: '#f45127', letterSpacing: 1 },
  address: { fontSize: 12, fontWeight: '800', color: '#152d55' },
  locationChange: { fontSize: 10, fontWeight: '800', color: '#f45127' },
  cornerLogo: { alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', letterSpacing: -1 },
  
  hero: { marginHorizontal: 17, borderRadius: 21, padding: 23, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  heroTag: { fontSize: 10, letterSpacing: 1.7, fontWeight: '800', color: '#ffc4ae', marginBottom: 10 },
  heroTitle: { fontSize: 25, fontWeight: '700', color: 'white', fontFamily: 'Playfair Display', marginBottom: 10, lineHeight: 28 },
  heroDesc: { fontSize: 12, color: '#fff0e9', maxWidth: 200, lineHeight: 18 },
  heroIconBackground: { position: 'absolute', right: 8, bottom: -10, fontSize: 120, color: '#ffa77c', opacity: 0.18, zIndex: -1 },
  
  search: { marginHorizontal: 17, marginTop: 20, marginBottom: 22, backgroundColor: 'white', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 48, shadowColor: '#402318', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 2 },
  searchIcon: { fontSize: 22, color: '#f45127', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#2d2523' },

  section: { marginHorizontal: 17, marginBottom: 22 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#152d55', letterSpacing: -0.5 },
  sectionBadge: { fontSize: 10, color: '#697180' },
  sectionSub: { fontSize: 11, color: '#697180', marginTop: 4, marginBottom: 14 },
  
  dishrow: { flexDirection: 'row', gap: 11, paddingBottom: 10 },
  serviceTile: { width: 107, height: 92, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#f0e6e0', alignItems: 'center', justifyContent: 'center', padding: 8 },
  serviceTileSelected: { backgroundColor: '#fff0e9', borderColor: '#f3a184' },
  tileIco: { fontSize: 32, marginBottom: 5 },
  tileText: { fontSize: 11, fontWeight: '800', color: '#152d55' },
  tileTextSelected: { color: '#f45127' },
  
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center', marginTop: 10, shadowColor: '#e50924', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 7 }, shadowRadius: 14, elevation: 4 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(21, 45, 85, 0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', padding: 32, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#152d55', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#697180', textAlign: 'center', marginBottom: 24 },
  timerCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#f45127', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  timerText: { fontSize: 32, fontWeight: '800', color: '#152d55' },
  cancelButton: { padding: 12 },
  cancelButtonText: { color: '#697180', fontWeight: '700', fontSize: 14 },
});
