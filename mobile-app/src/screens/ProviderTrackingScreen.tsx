import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

export default function ProviderTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Mock data for the active request
  const request = route.params?.request || {
    customer: 'Rohit Sharma',
    address: 'Flat 101, B Block, Koramangala',
    price: 499,
    lat: 28.4595,
    lon: 77.0266,
  };

  const providerLat = 28.4550;
  const providerLon = 77.0250;

  const [mapRegion, setMapRegion] = useState({
    latitude: (providerLat + request.lat) / 2,
    longitude: (providerLon + request.lon) / 2,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  const handleArrive = () => {
    Alert.alert(
      "Demo: Choose Workflow",
      "Which service workflow do you want to test?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Chef (OTP Timer)", onPress: () => navigation.navigate('ProviderChefArrival') },
        { text: "Laundry (Custody)", onPress: () => navigation.navigate('ProviderLaundry') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active trip</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            region={mapRegion}
            scrollEnabled={false}
          >
            {/* Customer Location */}
            <Marker coordinate={{ latitude: request.lat, longitude: request.lon }} title={request.customer} pinColor="#152d55" />
            {/* Provider Location */}
            <Marker coordinate={{ latitude: providerLat, longitude: providerLon }} title="You">
              <View style={styles.providerMarker}><Text style={{fontSize: 20}}>🛵</Text></View>
            </Marker>
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapInstruction}>Live Location Secured by Supabase RLS</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{request.customer}</Text>
          <Text style={styles.blockSubtitle}>{request.address}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => alert("Opening Maps...")}>
            <Text style={styles.secondaryBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Status */}
        <View style={styles.block}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Travelling</Text>
            </View>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Expected earnings</Text>
            <Text style={styles.totalValue}>₹{request.price}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleArrive}>
          <Text style={styles.primaryButtonText}>Slide to arrive ➔</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0e6e0' },
  backBtn: { fontSize: 16, fontWeight: '700', color: '#152d55', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#152d55' },
  content: { padding: 17, paddingBottom: 100 },
  
  mapContainer: { height: 180, borderRadius: 17, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#f0e6e0', position: 'relative' },
  map: { flex: 1 },
  providerMarker: { backgroundColor: 'white', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#f45127' },
  mapOverlay: { position: 'absolute', top: 10, alignSelf: 'center', backgroundColor: 'rgba(21, 45, 85, 0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mapInstruction: { color: 'white', fontSize: 10, fontWeight: '700' },

  block: { backgroundColor: 'white', padding: 17, borderRadius: 17, marginBottom: 15, borderWidth: 1, borderColor: '#f0e6e0' },
  blockTitle: { fontSize: 18, fontWeight: '700', color: '#152d55', marginBottom: 5 },
  blockSubtitle: { fontSize: 13, color: '#697180', marginBottom: 15, lineHeight: 18 },
  
  secondaryBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#f45127', padding: 12, borderRadius: 13, alignItems: 'center' },
  secondaryBtnText: { color: '#f45127', fontWeight: '800', fontSize: 14 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: '#697180' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#f0e6e0', paddingTop: 12, marginTop: 5, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#152d55' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#152d55' },

  statusBadge: { backgroundColor: '#fff0e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { color: '#f45127', fontSize: 12, fontWeight: '700' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 17, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0e6e0' },
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '800' }
});
