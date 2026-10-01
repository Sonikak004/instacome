import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function ProviderLaundryScreen() {
  const navigation = useNavigation<any>();

  const [status, setStatus] = useState('pending_pickup');

  const handleNextStatus = () => {
    switch(status) {
      case 'pending_pickup':
        Alert.alert("Confirm Count", "Have you verified the basket items and agreed on the count with the customer?", [
          { text: "No", style: "cancel" },
          { text: "Yes, Picked Up", onPress: () => setStatus('processing') }
        ]);
        break;
      case 'processing':
        setStatus('ready');
        break;
      case 'ready':
        setStatus('out_for_delivery');
        break;
      case 'out_for_delivery':
        Alert.alert("Confirm Delivery", "Handed over to customer?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delivered", onPress: () => {
            alert("Laundry Order Complete! Earnings recorded.");
            navigation.navigate('ProviderHome');
          }}
        ]);
        break;
    }
  };

  const getActionText = () => {
    switch(status) {
      case 'pending_pickup': return 'Confirm Picked Up';
      case 'processing': return 'Mark as Ready';
      case 'ready': return 'Start Delivery';
      case 'out_for_delivery': return 'Mark as Delivered';
      default: return 'Complete';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laundry Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basket Summary</Text>
          <View style={styles.row}>
            <Text style={styles.itemText}>Men's Shirts (Wash & Iron)</Text>
            <Text style={styles.itemText}>x5</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.itemText}>Trousers (Dry Clean)</Text>
            <Text style={styles.itemText}>x2</Text>
          </View>
          
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>₹350</Text>
          </View>

          {status === 'pending_pickup' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => alert("Opening quote editor...")}>
              <Text style={styles.secondaryBtnText}>Edit Count / Revise Quote</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Custody Tracker</Text>
          
          <View style={[styles.step, status !== 'pending_pickup' && styles.stepDone]}>
            <View style={[styles.stepDot, status !== 'pending_pickup' && styles.dotDone]} />
            <Text style={styles.stepTitle}>Pending Pickup</Text>
            <Text style={styles.stepDesc}>Go to customer address</Text>
          </View>

          <View style={[styles.step, (status === 'ready' || status === 'out_for_delivery') && styles.stepDone]}>
            <View style={[styles.stepDot, (status === 'ready' || status === 'out_for_delivery') && styles.dotDone]} />
            <Text style={styles.stepTitle}>Processing at Shop</Text>
            <Text style={styles.stepDesc}>Washing / Ironing</Text>
          </View>

          <View style={[styles.step, status === 'out_for_delivery' && styles.stepDone]}>
            <View style={[styles.stepDot, status === 'out_for_delivery' && styles.dotDone]} />
            <Text style={styles.stepTitle}>Ready for Delivery</Text>
            <Text style={styles.stepDesc}>Return to customer</Text>
          </View>
          
          <View style={[styles.step, { borderLeftColor: 'transparent' }]}>
            <View style={styles.stepDot} />
            <Text style={styles.stepTitle}>Delivered</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNextStatus}>
          <Text style={styles.primaryButtonText}>{getActionText()} ➔</Text>
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
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#f0e6e0', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#152d55', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemText: { fontSize: 14, color: '#697180' },
  divider: { height: 1, backgroundColor: '#f0e6e0', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#152d55' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#152d55' },
  
  secondaryBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#f45127', padding: 12, borderRadius: 13, alignItems: 'center', marginTop: 15 },
  secondaryBtnText: { color: '#f45127', fontWeight: '800', fontSize: 14 },

  step: { paddingLeft: 20, paddingBottom: 25, borderLeftWidth: 2, borderLeftColor: '#f0e6e0', position: 'relative' },
  stepDone: { borderLeftColor: '#f45127' },
  stepDot: { position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#d9ccc5' },
  dotDone: { backgroundColor: '#16845a' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#152d55', marginBottom: 4, marginTop: -4 },
  stepDesc: { fontSize: 13, color: '#697180' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 17, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0e6e0' },
  primaryButton: { backgroundColor: '#f45127', padding: 16, borderRadius: 13, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '800' }
});
