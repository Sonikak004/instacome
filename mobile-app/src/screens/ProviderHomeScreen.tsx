import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase'; // Using the lib we created earlier

export default function ProviderHomeScreen() {
  const navigation = useNavigation<any>();
  const [isOnline, setIsOnline] = useState(false);
  const [serviceRadius, setServiceRadius] = useState(5); // km
  const [locationStr, setLocationStr] = useState('Fetching...');

  // Effect to handle location updates when online
  useEffect(() => {
    let locationSub: any;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert("Location needed to receive bookings!");
        setIsOnline(false);
        return;
      }

      // Initial ping
      const loc = await Location.getCurrentPositionAsync({});
      updateDatabase(loc.coords.latitude, loc.coords.longitude, true);
      setLocationStr(`${loc.coords.latitude.toFixed(3)}, ${loc.coords.longitude.toFixed(3)}`);

      // In a real app, this would use Background Location tracking (requires EAS Build)
      // For this Expo Go demo, we simulate a foreground watch:
      locationSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 60000, distanceInterval: 50 },
        (newLoc) => {
          updateDatabase(newLoc.coords.latitude, newLoc.coords.longitude, true);
        }
      );
    };

    if (isOnline) {
      startTracking();
    } else {
      // Go offline
      updateDatabase(null, null, false);
      if (locationSub) locationSub.remove();
    }

    return () => {
      if (locationSub) locationSub.remove();
    };
  }, [isOnline]);

  const updateDatabase = async (lat: number | null, lon: number | null, onlineStatus: boolean) => {
    // In production, update Supabase `providers` table:
    // { is_online: onlineStatus, last_location_update: NOW(), current_location: POINT(lon, lat) }
    console.log(`Mock DB Update: Online=${onlineStatus}, Lat=${lat}, Lon=${lon}, Radius=${serviceRadius}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Good morning, Chef Kumar</Text>
        <Text style={styles.subtitle}>Manage your availability and service area.</Text>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>{isOnline ? 'You are ONLINE' : 'You are OFFLINE'}</Text>
              <Text style={styles.cardDesc}>
                {isOnline ? 'Waiting for booking requests...' : 'You are hidden from customers.'}
              </Text>
            </View>
            <Switch 
              value={isOnline} 
              onValueChange={setIsOnline} 
              trackColor={{ false: '#f0e6e0', true: '#f45127' }} 
            />
          </View>
          
          {isOnline && (
            <View style={styles.locationInfo}>
              <Text style={styles.locLabel}>LAST LOCATION PING (Foreground)</Text>
              <Text style={styles.locValue}>{locationStr} (Just now)</Text>
            </View>
          )}
        </View>

        {/* Service Radius */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Radius</Text>
          <Text style={styles.cardDesc}>You will only receive requests within this distance.</Text>
          
          <View style={styles.radiusRow}>
            {[2, 5, 10, 20].map(r => (
              <TouchableOpacity 
                key={r} 
                style={[styles.radiusBtn, serviceRadius === r && styles.radiusBtnActive]}
                onPress={() => setServiceRadius(r)}
              >
                <Text style={[styles.radiusText, serviceRadius === r && styles.radiusTextActive]}>{r} km</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Note: While the app is closed, background tracking requires a native Android/iOS build. 
            Do not test background location inside the Expo Go app.
          </Text>
        </View>

        {isOnline && (
          <TouchableOpacity 
            style={styles.incomingRequestBtn}
            onPress={() => navigation.navigate('ProviderTracking')}
          >
            <Text style={styles.incomingRequestBtnText}>Simulate Incoming Request</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  content: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#152d55', fontFamily: 'Playfair Display' },
  subtitle: { fontSize: 14, color: '#697180', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#f0e6e0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#152d55', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#697180', maxWidth: '80%' },
  locationInfo: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0e6e0' },
  locLabel: { fontSize: 10, fontWeight: '800', color: '#f45127', letterSpacing: 1, marginBottom: 4 },
  locValue: { fontSize: 13, color: '#152d55', fontWeight: '600' },
  radiusRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  radiusBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#f0e6e0' },
  radiusBtnActive: { backgroundColor: '#fff0e9', borderColor: '#f45127' },
  radiusText: { fontSize: 14, fontWeight: '600', color: '#697180' },
  radiusTextActive: { color: '#f45127' },
  notice: { backgroundColor: '#eef4fd', padding: 15, borderRadius: 12, marginTop: 10 },
  noticeText: { fontSize: 12, color: '#152d55', lineHeight: 18, fontStyle: 'italic' },
  incomingRequestBtn: { backgroundColor: '#16845a', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  incomingRequestBtnText: { color: 'white', fontWeight: '800', fontSize: 14 }
});
