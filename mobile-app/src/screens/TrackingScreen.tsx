import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

export default function TrackingScreen() {
  const navigation = useNavigation<any>();
  
  // Mock data for the assigned provider
  const provider = {
    name: 'Chef Kumar',
    category: 'chef',
    eta: 18,
    lat: 28.4550,
    lon: 77.0250
  };

  const customerLat = 28.4595;
  const customerLon = 77.0266;

  const [mapRegion, setMapRegion] = useState({
    latitude: (provider.lat + customerLat) / 2,
    longitude: (provider.lon + customerLon) / 2,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>On the way</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Map View representing the live trip_locations table */}
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            region={mapRegion}
            scrollEnabled={false} // Lock map for tracking view
          >
            {/* Customer Location */}
            <Marker coordinate={{ latitude: customerLat, longitude: customerLon }} title="You" pinColor="#152d55" />
            {/* Provider Location */}
            <Marker coordinate={{ latitude: provider.lat, longitude: provider.lon }} title={provider.name}>
              <View style={styles.providerMarker}><Text style={{fontSize: 20}}>🛵</Text></View>
            </Marker>
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapInstruction}>Live Location Secured by Supabase RLS</Text>
          </View>
        </View>

        {/* Arrival Info */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{provider.name} is on the way</Text>
          <Text style={styles.blockSubtitle}>Estimated arrival · {provider.eta} minutes</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => alert("Chat preview: Message your provider")}>
            <Text style={styles.secondaryBtnText}>Message provider</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View style={styles.block}>
          <View style={[styles.step, styles.stepDone]}>
            <View style={[styles.stepDot, styles.dotDone]} />
            <Text style={styles.stepTitle}>Request accepted</Text>
            <Text style={styles.stepDesc}>Provider confirmed</Text>
          </View>
          <View style={[styles.step, styles.stepDone]}>
            <View style={[styles.stepDot, styles.dotDone]} />
            <Text style={styles.stepTitle}>Travelling to you</Text>
            <Text style={styles.stepDesc}>Live location preview</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepDot} />
            <Text style={styles.stepTitle}>At your door</Text>
            <Text style={styles.stepDesc}>Share the start code on arrival</Text>
          </View>
        </View>

        {/* Arrival OTP */}
        <View style={[styles.block, styles.centerBlock]}>
          <Text style={styles.fieldLabel}>YOUR ARRIVAL CODE</Text>
          <View style={styles.otpRow}>
            {['4','8','2','6'].map((digit, i) => (
              <View key={i} style={styles.otpBox}>
                <Text style={styles.otpText}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.blockSubtitle}>Share only after arrival.</Text>
        </View>

      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => alert("Provider arrived! Location tracking stopped.")}>
          <Text style={styles.primaryButtonText}>Preview arrival & service</Text>
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
  centerBlock: { alignItems: 'center' },
  blockTitle: { fontSize: 16, fontWeight: '700', color: '#152d55', marginBottom: 5 },
  blockSubtitle: { fontSize: 12, color: '#697180', marginBottom: 15 },
  
  secondaryBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#f45127', padding: 12, borderRadius: 13, alignItems: 'center' },
  secondaryBtnText: { color: '#f45127', fontWeight: '800', fontSize: 14 },
  
  step: { paddingLeft: 20, paddingBottom: 20, borderLeftWidth: 2, borderLeftColor: '#f0e6e0', position: 'relative' },
  stepDone: { borderLeftColor: '#f45127' },
  stepDot: { position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#d9ccc5' },
  dotDone: { backgroundColor: '#16845a' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#152d55', marginBottom: 2, marginTop: -3 },
  stepDesc: { fontSize: 12, color: '#697180' },
  
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#697180', letterSpacing: 1, marginBottom: 10 },
  otpRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  otpBox: { backgroundColor: '#fff0e9', borderWidth: 1, borderColor: '#f3a184', borderRadius: 10, width: 46, height: 50, justifyContent: 'center', alignItems: 'center' },
  otpText: { fontSize: 24, fontWeight: '800', color: '#152d55' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 17, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0e6e0' },
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '800' }
});
