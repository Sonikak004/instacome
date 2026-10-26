import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { X, Minus, Plus, ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../src/context/CartContext";
import { useAuth } from "../src/context/AuthContext";
import { liveService } from "../src/services/liveService";

export default function Cart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const { items, updateQuantity, totalPrice, clearCart } = useCart();

  const deliveryFee = items.length > 0 ? 40 : 0;
  const platformFee = items.length > 0 ? 5 : 0;
  const grandTotal = totalPrice + deliveryFee + platformFee;

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Text style={styles.title}>Your Cart</Text>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.closeBtn}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ShoppingBag size={48} color="#D1D5DB" />
          <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>Your cart is empty</Text>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    if (!session) {
      Alert.alert(
        "Sign In Required",
        "Please log in to confirm and place your order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/(auth)/login") }
        ]
      );
      return;
    }

    try {
      await liveService.placeOrder({
        customerId: session.user.id,
        customerName: profile?.full_name || session.user.email?.split('@')[0] || "Customer",
        providerId: items[0]?.providerName || "p1",
        providerName: items[0]?.providerName || "Home Kitchen",
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          providerName: i.providerName,
          isVeg: !!i.isVeg
        })),
        totalAmount: grandTotal,
        deliveryAddress: "Begur Main Road, Bengaluru"
      });

      clearCart();
      Alert.alert(
        "Order Confirmed",
        "Your order has been received and is being freshly prepared.",
        [{ text: "Track Order", onPress: () => router.replace("/(tabs)/orders") }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to place order.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.title}>Your Cart</Text>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.closeBtn}>
          <X size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.providerHeader}>
          <Text style={styles.providerName}>{items[0].providerName}</Text>
          <Text style={styles.providerSub}>Ordering from Begur</Text>
        </View>

        {items.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <View style={[styles.fssaiSquare, item.isVeg ? styles.vegSquare : styles.nonVegSquare]}>
                <View style={[styles.fssaiDot, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Minus size={16} color="#5F259F" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Plus size={16} color="#5F259F" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Bill Details */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{totalPrice}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>₹{platformFee}</Text>
          </View>
          
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Checkout Bar */}
      <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutTotal}>₹{grandTotal}</Text>
          <Text style={styles.checkoutSub}>View detailed bill</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder}>
          <Text style={styles.checkoutBtnText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    flexGrow: 1,
  },
  providerHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  providerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  providerSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  itemInfo: {
    flex: 1,
  },
  fssaiSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
    marginBottom: 6,
  },
  fssaiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegSquare: {
    borderColor: "#16A34A",
  },
  vegDot: {
    backgroundColor: "#16A34A",
  },
  nonVegSquare: {
    borderColor: "#DC2626",
  },
  nonVegDot: {
    backgroundColor: "#DC2626",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5F259F",
    paddingHorizontal: 8,
  },
  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  billValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5F259F",
  },
  checkoutBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  checkoutSub: {
    fontSize: 12,
    color: "#5F259F",
    fontWeight: "600",
  },
  checkoutBtn: {
    backgroundColor: "#5F259F",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  }
});
