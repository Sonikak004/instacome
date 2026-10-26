import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { ShoppingBag, ChevronRight, Clock, ChefHat, CheckCircle2, ArrowRight } from "lucide-react-native";
import { liveService, LiveOrder, LiveChefBooking } from "../../src/services/liveService";

export default function Orders() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [bookings, setBookings] = useState<LiveChefBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLiveData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const [liveOrders, liveBookings] = await Promise.all([
        liveService.getCustomerOrders(session.user.id),
        liveService.getCustomerChefBookings(session.user.id),
      ]);
      setOrders(liveOrders);
      setBookings(liveBookings);
    } catch (e) {
      console.error("Error loading live orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLiveData();
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <Text style={styles.title}>Orders & Bookings</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <ShoppingBag size={32} color="#0F172A" />
          </View>
          <Text style={styles.guestTitle}>Sign in to view orders</Text>
          <Text style={styles.guestSub}>
            Track your live food orders and private chef appointments in real-time.
          </Text>
          <TouchableOpacity 
            style={styles.loginBtn} 
            activeOpacity={0.85} 
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginBtnText}>Log In to Instacome</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasContent = orders.length > 0 || bookings.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.title}>Orders & Bookings</Text>
        <Text style={styles.subtitle}>
          {hasContent ? `${orders.length} food orders • ${bookings.length} chef bookings` : "Track your active orders"}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!hasContent && !loading ? (
          /* EMPTY STATE */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <ShoppingBag size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySub}>
              You haven't placed any food orders or booked a private chef yet. Explore fresh homemade meals or hire a chef for your kitchen.
            </Text>

            <View style={styles.emptyActionsRow}>
              <TouchableOpacity 
                style={styles.emptyPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/book-chef")}
              >
                <ChefHat size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyPrimaryBtnText}>Book a Chef</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.emptySecondaryBtn}
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.emptySecondaryBtnText}>Explore Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* 1. ACTIVE CHEF BOOKINGS */}
            {bookings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Private Chef Bookings</Text>
                {bookings.map(b => (
                  <TouchableOpacity 
                    key={b.id} 
                    style={styles.orderCard} 
                    activeOpacity={0.85}
                    onPress={() => router.push("/book-chef")}
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.statusPill}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.statusText}>
                          {b.status === 'accepted' ? 'CHEF ASSIGNED' : b.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.orderEta}>Arriving in ~{b.etaMins || 28} mins</Text>
                    </View>

                    <View style={styles.orderBody}>
                      <View style={styles.serviceIconBox}>
                        <ChefHat size={22} color="#0F172A" />
                      </View>
                      <View style={styles.orderDetails}>
                        <Text style={styles.providerName}>{b.chefName}</Text>
                        <Text style={styles.orderItems}>
                          {b.members} • {b.diet} • {b.cuisines.join(", ")}
                        </Text>
                        <Text style={styles.orderPrice}>₹{b.totalAmount}</Text>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <TouchableOpacity 
                        style={styles.primaryActionBtn}
                        onPress={() => router.push("/book-chef")}
                      >
                        <Text style={styles.primaryActionText}>Track Chef Status</Text>
                        <ChevronRight size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 2. FOOD ORDERS */}
            {orders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Food Orders</Text>
                {orders.map(order => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={[styles.statusPill, { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }]}>
                        <Clock size={12} color="#0F172A" />
                        <Text style={[styles.statusText, { color: "#0F172A" }]}>
                          {order.status === 'preparing' ? 'BEING PREPARED' : order.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.orderEta}>~{order.estimatedDeliveryMins || 25} mins</Text>
                    </View>

                    <View style={styles.orderBody}>
                      <View style={styles.serviceIconBox}>
                        <ShoppingBag size={20} color="#0F172A" />
                      </View>
                      <View style={styles.orderDetails}>
                        <Text style={styles.providerName}>{order.providerName}</Text>
                        <Text style={styles.orderItems}>
                          {order.items.length > 0 
                            ? order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")
                            : "Delicious home-cooked meal"}
                        </Text>
                        <Text style={styles.orderPrice}>₹{order.totalAmount}</Text>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <Text style={styles.deliveryLocationText} numberOfLines={1}>
                        Delivering to: {order.deliveryAddress}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  guestSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: "#5F259F",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  emptyPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5F259F",
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptySecondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptySecondaryBtnText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.5,
  },
  orderEta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  orderBody: {
    flexDirection: "row",
    padding: 14,
    alignItems: "flex-start",
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryActionBtn: {
    backgroundColor: "#5F259F",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  deliveryLocationText: {
    fontSize: 11,
    color: "#64748B",
  },
});
