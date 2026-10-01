import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function AddressScreen() {
  const navigation = useNavigation<any>();
  const [permissionStatus, setPermissionStatus] = useState<string>('pending');
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.4595, // Default Gurgaon
    longitude: 77.0266,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [flatNumber, setFlatNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState('Home');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        if (status === 'granted') {
          setLoading(true);
          // Get last known to be instant, fallback to current if null
          let location = await Location.getLastKnownPositionAsync({});
          if (!location) {
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }
          if (location) {
            setMapRegion({
              ...mapRegion,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
          setLoading(false);
        }
      } catch (e) {
        console.warn(e);
        setLoading(false);
      }
    })();
  }, []);

  const saveAndSelectAddress = () => {
    if (!flatNumber) {
      alert("Please enter Flat/House No.");
      return;
    }
    const fullAddress = `${label} · ${flatNumber}, ${landmark ? landmark + ',' : ''} GPS: ${mapRegion.latitude.toFixed(4)}`;
    navigation.navigate('Home', { selectedAddress: fullAddress });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#f45127" style={{ marginTop: 50 }} />
        ) : (
          <MapView 
            style={styles.map} 
            region={mapRegion}
            onRegionChangeComplete={(region) => setMapRegion(region)}
          >
            <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
          </MapView>
        )}
        <View style={styles.mapOverlay}>
          <Text style={styles.mapInstruction}>Drag map to adjust pin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Text style={styles.title}>Enter complete address</Text>
        
        {permissionStatus !== 'granted' && (
          <Text style={styles.warningText}>Location denied. Please adjust the pin manually.</Text>
        )}

        <Text style={styles.label}>FLAT / HOUSE NO. / FLOOR / BUILDING *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Flat 101, B Block" 
          value={flatNumber} 
          onChangeText={setFlatNumber} 
        />

        <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Near Apollo Pharmacy" 
          value={landmark} 
          onChangeText={setLandmark} 
        />

        <Text style={styles.label}>SAVE AS</Text>
        <View style={styles.chipRow}>
          {['Home', 'Work', 'Other'].map(l => (
            <TouchableOpacity 
              key={l} 
              style={[styles.chip, label === l && styles.chipActive]}
              onPress={() => setLabel(l)}
            >
              <Text style={[styles.chipText, label === l && styles.chipTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveAndSelectAddress}>
          <Text style={styles.saveBtnText}>Save Address</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0e6e0' },
  backBtn: { fontSize: 16, fontWeight: '700', color: '#152d55', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#152d55' },
  mapContainer: { height: 250, backgroundColor: '#eee9e3', position: 'relative' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', top: 10, alignSelf: 'center', backgroundColor: 'rgba(21, 45, 85, 0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mapInstruction: { color: 'white', fontSize: 12, fontWeight: '700' },
  formContent: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#152d55', marginBottom: 20 },
  warningText: { color: '#e50924', fontSize: 12, marginBottom: 15, fontWeight: '600' },
  label: { fontSize: 10, fontWeight: '800', color: '#697180', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#f0e6e0', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 20 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f0e6e0' },
  chipActive: { borderColor: '#f45127', backgroundColor: '#fff0e9' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#697180' },
  chipTextActive: { color: '#f45127' },
  saveBtn: { backgroundColor: '#f45127', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
