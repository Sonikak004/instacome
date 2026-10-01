import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { serviceName, price, address } = route.params || { serviceName: 'Chef', price: 499, address: 'Home · Koramangala' };
  
  const [isSearching, setIsSearching] = useState(false);
  const [timer, setTimer] = useState(60);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & pay</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Booking Summary */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Booking summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{serviceName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Address</Text>
            <Text style={styles.summaryValue}>{address}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Charge</Text>
            <Text style={styles.summaryValue}>₹{price}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee</Text>
            <Text style={styles.summaryValue}>₹10</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (GST 18%)</Text>
            <Text style={styles.summaryValue}>₹{Math.round((price + 10) * 0.18)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{price + 10 + Math.round((price + 10) * 0.18)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Payment method</Text>
          <View style={styles.optionSelected}>
            <Text style={styles.optionText}>◉ UPI / Card</Text>
            <Text style={styles.optionCheck}>✓</Text>
          </View>
          <Text style={styles.mutedText}>Sandbox Mode: Gateway credentials not found in env. Payment will be simulated and verified.</Text>
        </View>

      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { setIsSearching(true); setTimer(60); }}>
          <Text style={styles.primaryButtonText}>Pay ₹{price + 10 + Math.round((price + 10) * 0.18)} & Request {serviceName}</Text>
        </TouchableOpacity>
      </View>

      {/* Searching Modal (Moved here from Home) */}
      <Modal visible={isSearching} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{fontSize: 40, marginBottom: 10}}>⏱</Text>
            <Text style={styles.modalTitle}>Waiting for Providers</Text>
            <Text style={styles.modalDesc}>They have 60 seconds to accept.</Text>
            
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timer}s</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, { width: '100%', marginBottom: 10 }]} 
              onPress={() => { setIsSearching(false); navigation.navigate('Tracking'); }}
            >
              <Text style={styles.primaryButtonText}>Accepts (Demo)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => { setIsSearching(false); setTimer(60); }}
            >
              <Text style={styles.cancelButtonText}>Cancel Request / Timeout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee9e3' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0e6e0' },
  backBtn: { fontSize: 16, fontWeight: '700', color: '#152d55', marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#152d55' },
  content: { padding: 17, paddingBottom: 100 },
  
  block: { backgroundColor: 'white', padding: 17, borderRadius: 17, marginBottom: 15, borderWidth: 1, borderColor: '#f0e6e0' },
  blockTitle: { fontSize: 16, fontWeight: '700', color: '#152d55', marginBottom: 15 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: '#697180' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#152d55', textAlign: 'right', flex: 1, marginLeft: 20 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#f0e6e0', paddingTop: 12, marginTop: 5, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#152d55' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#f45127' },
  divider: { height: 1, backgroundColor: '#f0e6e0', marginVertical: 10, marginHorizontal: -17 },
  
  optionSelected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#f45127', backgroundColor: '#fff0e9', borderRadius: 12, marginBottom: 10 },
  optionText: { fontSize: 14, fontWeight: '700', color: '#152d55' },
  optionCheck: { fontSize: 16, fontWeight: '800', color: '#f45127' },
  mutedText: { fontSize: 11, color: '#697180', lineHeight: 16 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 17, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0e6e0' },
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(21, 45, 85, 0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', padding: 32, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#152d55', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#697180', textAlign: 'center', marginBottom: 24 },
  timerCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#f45127', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  timerText: { fontSize: 32, fontWeight: '800', color: '#152d55' },
  cancelButton: { padding: 12 },
  cancelButtonText: { color: '#697180', fontWeight: '700', fontSize: 14 },
});
