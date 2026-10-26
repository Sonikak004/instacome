import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, TextInput, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, PlusCircle, LayoutDashboard, CheckCircle2, Clock, MapPin, Users, Phone, X, Sparkles, ChefHat, UtensilsCrossed, ChevronRight, LogOut } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { liveService, LiveChefBooking } from '../../src/services/liveService';
import { UserStorage } from '../../src/utils/userStorage';

export default function ProviderDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out of your provider dashboard?') : true;
      if (confirmed) {
        await signOut();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out of your provider dashboard?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const isChef = profile?.role === 'chef';

  const [providerData, setProviderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Home Cook Menu Dishes State
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Chef Booking Requests State
  const [chefBookings, setChefBookings] = useState<any[]>([]);

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishPortions, setNewDishPortions] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const appStatus = await UserStorage.getAppStatus(session.user.id);

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (data) {
        setProviderData(data);
        setIsOnline(data.is_online ?? false);

        // Strict guard: Do not take to provider service page until application is approved!
        if (!data.is_verified || appStatus === 'pending_review') {
          router.replace('/onboarding/review');
          return;
        }
      } else if (profile?.role === 'chef' || profile?.role === 'home_cook') {
        if (appStatus === 'pending_review') {
          router.replace('/onboarding/review');
          return;
        }
        router.replace('/onboarding');
        return;
      } else {
        setProviderData(null);
      }

      // Load live dishes for this provider
      const liveDishes = await liveService.getCustomDishesForProvider(session?.user?.id);
      setMenuItems(liveDishes.map(d => ({
        id: d.id,
        name: d.dishName,
        price: d.price,
        portions: d.portionsLeft,
        isVeg: d.isVeg,
        available: d.isActive,
      })));

      // Load live bookings for chefs
      if (isChef) {
        const liveBookings = await liveService.getChefBookingsForDashboard();
        setChefBookings(liveBookings.map(b => ({
          id: b.id,
          customerName: b.customerName,
          location: b.eventAddress,
          members: b.members,
          preference: b.diet,
          timing: b.timing,
          payout: '₹' + b.totalAmount,
          status: b.status === 'accepted' ? 'accepted' : 'pending',
        })));
      } else {
        setChefBookings([]);
      }
    } catch (err) {
      console.warn("Provider fetch error:", err);
      const appStatus = await UserStorage.getAppStatus(session?.user?.id);
      if (appStatus === 'pending_review') {
        router.replace('/onboarding/review');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async (val: boolean) => {
    setIsOnline(val);
    if (session) {
      await supabase
        .from('providers')
        .update({ is_online: val })
        .eq('id', session.user.id);
    }
  };

  const handleAddDish = async () => {
    if (!newDishName || !newDishPrice) {
      Alert.alert('Required', 'Please enter dish name and price.');
      return;
    }

    try {
      const savedDish = await liveService.addCustomDish({
        providerId: session?.user?.id || 'p1',
        providerName: providerData?.business_name || profile?.full_name || 'My Kitchen',
        dishName: newDishName.trim(),
        price: parseFloat(newDishPrice) || 199,
        portions: parseInt(newDishPortions, 10) || 5,
        isVeg: newDishIsVeg,
      });

      const newItem = {
        id: savedDish.id,
        name: savedDish.dishName,
        price: savedDish.price,
        portions: savedDish.portionsLeft,
        isVeg: savedDish.isVeg,
        available: true,
      };

      setMenuItems([newItem, ...menuItems]);
      setNewDishName('');
      setNewDishPrice('');
      setNewDishPortions('');
      setModalVisible(false);
      Alert.alert('Dish Added', `${newDishName} is now live and visible to customers.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add dish.');
    }
  };

  const toggleDishAvailability = (dishId: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === dishId ? { ...item, available: !item.available } : item
    ));
  };

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'declined') => {
    setChefBookings(chefBookings.map(b => 
      b.id === bookingId ? { ...b, status: action } : b
    ));
    await liveService.updateBookingStatus(bookingId, action === 'accepted' ? 'accepted' : 'cancelled');
    if (action === 'accepted') {
      Alert.alert('Booking Confirmed', 'The customer has been notified. You can see the details in your active appointments.');
    } else {
      Alert.alert('Booking Declined', 'The request has been dismissed.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#5F259F" />
      </View>
    );
  }

  // Gate 1: Not logged in
  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.authGateContainer}>
          <View style={styles.gateIconBox}>
            <LayoutDashboard size={44} color="#5F259F" />
          </View>
          <Text style={styles.gateTitle}>Partner Sign In Required</Text>
          <Text style={styles.gateSub}>
            Please sign in to access your Chef or Home Cook dashboard, manage your menu, and accept customer bookings.
          </Text>

          <TouchableOpacity 
            style={styles.gatePrimaryBtn} 
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.gatePrimaryBtnText}>Log In / Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gateSecondaryBtn} 
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.gateSecondaryBtnText}>Back to Customer App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Gate 2: Customer role with no provider registration yet
  if (profile?.role !== 'chef' && profile?.role !== 'home_cook' && !providerData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Onboarding</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.gateContent} showsVerticalScrollIndicator={false}>
          <View style={styles.gateIconBox}>
            <Sparkles size={44} color="#D97706" />
          </View>
          <Text style={styles.gateTitle}>Become an Insta Come Partner</Text>
          <Text style={styles.gateSub}>
            You are logged in as {profile?.full_name || session.user.email} (Customer). Register below to activate your partner dashboard and start receiving orders:
          </Text>

          <TouchableOpacity 
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => router.push('/onboarding/chef')}
          >
            <View style={[styles.roleCardIconBox, { backgroundColor: '#F3E8FF' }]}>
              <ChefHat size={30} color="#9333EA" />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>Register as Private Chef 👨‍🍳</Text>
              <Text style={styles.roleCardSub}>Accept on-demand cooking gigs at customer homes, set your rates & manage schedule.</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => router.push('/onboarding/home-cook')}
          >
            <View style={[styles.roleCardIconBox, { backgroundColor: '#FDF4FF' }]}>
              <UtensilsCrossed size={30} color="#C026D3" />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>Register as Home Cook 🍲</Text>
              <Text style={styles.roleCardSub}>Cook fresh home meals from your kitchen, list daily portions, and sell locally.</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gateSecondaryBtn} 
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.gateSecondaryBtnText}>Back to Customer App</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* HEADER WITH TOP-RIGHT LOG OUT */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.partnerBadgePill}>
          {isChef ? (
            <ChefHat size={18} color="#9333EA" />
          ) : (
            <UtensilsCrossed size={18} color="#C026D3" />
          )}
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isChef ? "Chef Dashboard" : "Kitchen Dashboard"}
          </Text>
          <Text style={styles.headerSubtitle}>Instacome Partner Hub</Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.headerLogoutBtn}
          activeOpacity={0.8}
        >
          <LogOut size={13} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.headerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* PROVIDER OVERVIEW CARD */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.avatarBox}>
              {isChef ? (
                <ChefHat size={28} color="#9333EA" />
              ) : (
                <UtensilsCrossed size={28} color="#C026D3" />
              )}
            </View>
            <View style={styles.overviewMeta}>
              <Text style={styles.businessName}>{providerData?.business_name}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={12} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified Partner</Text>
                </View>
                <Text style={styles.roleLabel}>{isChef ? "Private Chef" : "Home Kitchen"}</Text>
              </View>
            </View>
            
            {/* ONLINE / OFFLINE TOGGLE */}
            <View style={styles.switchBox}>
              <Text style={[styles.switchLabel, { color: isOnline ? "#16A34A" : "#6B7280" }]}>
                {isOnline ? "LIVE" : "OFFLINE"}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={toggleOnlineStatus}
                trackColor={{ false: "#D1D5DB", true: "#DCFCE7" }}
                thumbColor={isOnline ? "#16A34A" : "#FFFFFF"}
              />
            </View>
          </View>

          {/* QUICK STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹3,450</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>★ 4.9</Text>
              <Text style={styles.statLabel}>Customer Rating</Text>
            </View>
          </View>
        </View>

        {/* CHEF: BOOKINGS & ON-DEMAND REQUESTS */}
        {isChef && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>On-Demand Chef Requests</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{chefBookings.filter(b => b.status === 'pending').length} New</Text>
              </View>
            </View>

            {chefBookings.length === 0 ? (
              <View style={styles.dashboardEmptyBox}>
                <ChefHat size={32} color="#94A3B8" />
                <Text style={styles.dashboardEmptyTitle}>No Chef Requests Yet</Text>
                <Text style={styles.dashboardEmptySub}>You will receive live alerts when customers near you hire your cooking services.</Text>
              </View>
            ) : (
              chefBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View>
                      <Text style={styles.customerName}>{booking.customerName}</Text>
                      <View style={styles.metaRow}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.metaText}>{booking.location}</Text>
                      </View>
                    </View>
                    <Text style={styles.payoutText}>{booking.payout}</Text>
                  </View>

                  <View style={styles.bookingDetailsBox}>
                    <View style={styles.detailRow}>
                      <Users size={14} color="#5F259F" />
                      <Text style={styles.detailText}>{booking.members}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={14} color="#5F259F" />
                      <Text style={styles.detailText}>{booking.timing}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTag}>{booking.preference}</Text>
                    </View>
                  </View>

                  {booking.status === 'pending' ? (
                    <View style={styles.bookingActions}>
                      <TouchableOpacity 
                        style={styles.declineBtn}
                        activeOpacity={0.8}
                        onPress={() => handleBookingAction(booking.id, 'declined')}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.acceptBtn}
                        activeOpacity={0.85}
                        onPress={() => handleBookingAction(booking.id, 'accepted')}
                      >
                        <Text style={styles.acceptBtnText}>Accept Booking</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.statusBanner, booking.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
                      <Text style={styles.statusBannerText}>
                        {booking.status === 'accepted' ? '✓ Booking Accepted • Customer Contacted' : '✗ Request Declined'}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* HOME COOK: TODAY'S MENU & DISHES */}
        {!isChef && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today's Fresh Dishes</Text>
              <TouchableOpacity 
                style={styles.addDishBtn}
                activeOpacity={0.85}
                onPress={() => setModalVisible(true)}
              >
                <PlusCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addDishBtnText}>Add Dish</Text>
              </TouchableOpacity>
            </View>

            {menuItems.length === 0 ? (
              <View style={styles.dashboardEmptyBox}>
                <UtensilsCrossed size={32} color="#94A3B8" />
                <Text style={styles.dashboardEmptyTitle}>No Dishes Published Yet</Text>
                <Text style={styles.dashboardEmptySub}>Tap "+ Add Dish" to publish your homemade food live for customers in Begur.</Text>
                <TouchableOpacity 
                  style={[styles.addDishBtn, { marginTop: 14 }]}
                  activeOpacity={0.85}
                  onPress={() => setModalVisible(true)}
                >
                  <PlusCircle size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addDishBtnText}>Add First Dish</Text>
                </TouchableOpacity>
              </View>
            ) : (
              menuItems.map((dish) => (
                <View key={dish.id} style={styles.dishCard}>
                  <View style={styles.dishLeft}>
                    <View style={[styles.vegBadge, dish.isVeg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                      <View style={[styles.vegDot, dish.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                    </View>
                    <View style={styles.dishMeta}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishPrice}>₹{dish.price} • {dish.portions} portions left</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.availToggleBtn, dish.available ? styles.inStockBtn : styles.outOfStockBtn]}
                    onPress={() => toggleDishAvailability(dish.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.availToggleText, dish.available ? styles.inStockText : styles.outOfStockText]}>
                      {dish.available ? "In Stock" : "Sold Out"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* RECENT SETTLEMENTS & PAYOUTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Payouts & Earnings</Text>
          <View style={styles.payoutCard}>
            <View style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutTitle}>Current Balance</Text>
                <Text style={styles.payoutSub}>Auto-transfers every Tuesday to linked UPI</Text>
              </View>
              <Text style={styles.payoutAmount}>₹{chefBookings.filter(b => b.status === 'accepted').reduce((sum, b) => sum + (parseInt(b.payout.replace('₹', '')) || 0), 0)}</Text>
            </View>
            <View style={styles.payoutStatusRow}>
              <CheckCircle2 size={14} color="#16A34A" />
              <Text style={styles.payoutStatusText}>Direct UPI Transfer verified & active</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ADD DISH MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Dish to Daily Menu</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Dish Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Grandma's Andhra Chicken Curry"
              value={newDishName}
              onChangeText={setNewDishName}
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="220"
                  keyboardType="numeric"
                  value={newDishPrice}
                  onChangeText={setNewDishPrice}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Portions Available</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="8"
                  keyboardType="numeric"
                  value={newDishPortions}
                  onChangeText={setNewDishPortions}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.modalDietRow}>
              <TouchableOpacity 
                style={[styles.modalDietChip, newDishIsVeg && styles.modalDietChipActive]}
                onPress={() => setNewDishIsVeg(true)}
              >
                <Text style={[styles.modalDietText, newDishIsVeg && styles.modalDietTextActive]}>🌱 Pure Veg</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalDietChip, !newDishIsVeg && styles.modalDietChipActive]}
                onPress={() => setNewDishIsVeg(false)}
              >
                <Text style={[styles.modalDietText, !newDishIsVeg && styles.modalDietTextActive]}>🍗 Non-Veg</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalSaveBtn}
              onPress={handleAddDish}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSaveBtnText}>Publish Dish Live</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitleContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 11, color: "#6B7280" },
  partnerBadgePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  customerModeBtn: {
    backgroundColor: "#F4EEFA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  customerModeText: {
    color: "#5F259F",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: { padding: 16, paddingBottom: 40 },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  overviewMeta: { flex: 1 },
  businessName: { fontSize: 17, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  verifiedText: { fontSize: 10, fontWeight: "bold", color: "#16A34A", marginLeft: 3 },
  roleLabel: { fontSize: 11, color: "#6B7280" },
  switchBox: { alignItems: "center" },
  switchLabel: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#6B7280" },
  statDivider: { width: 1, height: 24, backgroundColor: "#E5E7EB" },
  section: { marginBottom: 22 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  countBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 11, fontWeight: "bold", color: "#EF4444" },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 12, color: "#6B7280", marginLeft: 4 },
  payoutText: { fontSize: 18, fontWeight: "900", color: "#16A34A" },
  bookingDetailsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailText: { fontSize: 12, color: "#4B5563", marginLeft: 4, fontWeight: "500" },
  detailTag: { fontSize: 11, color: "#5F259F", fontWeight: "bold", backgroundColor: "#F4EEFA", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bookingActions: { flexDirection: "row" },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginRight: 6,
  },
  declineBtnText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  acceptBtn: {
    flex: 1.5,
    backgroundColor: "#5F259F",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 6,
  },
  acceptBtnText: { fontSize: 13, fontWeight: "bold", color: "#FFFFFF" },
  statusBanner: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  statusAccepted: { backgroundColor: "#DCFCE7" },
  statusDeclined: { backgroundColor: "#FEE2E2" },
  statusBannerText: { fontSize: 12, fontWeight: "bold", color: "#15803D" },
  addDishBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5F259F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addDishBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  dishCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  dishLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  vegBadgeGreen: { borderColor: "#16A34A" },
  vegBadgeRed: { borderColor: "#DC2626" },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  vegDotGreen: { backgroundColor: "#16A34A" },
  vegDotRed: { backgroundColor: "#DC2626" },
  dishMeta: { flex: 1 },
  dishName: { fontSize: 14, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  dishPrice: { fontSize: 12, color: "#6B7280" },
  availToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  inStockBtn: { backgroundColor: "#DCFCE7" },
  outOfStockBtn: { backgroundColor: "#FEE2E2" },
  availToggleText: { fontSize: 11, fontWeight: "bold" },
  inStockText: { color: "#15803D" },
  outOfStockText: { color: "#B91C1C" },
  payoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  payoutTitle: { fontSize: 15, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  payoutSub: { fontSize: 11, color: "#6B7280" },
  payoutAmount: { fontSize: 20, fontWeight: "900", color: "#5F259F" },
  payoutStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  payoutStatusText: { fontSize: 11, color: "#15803D", marginLeft: 6, fontWeight: "500" },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    color: "#111827",
    marginBottom: 14,
  },
  inputRow: { flexDirection: "row" },
  modalDietRow: { flexDirection: "row", marginBottom: 20 },
  modalDietChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginHorizontal: 4,
  },
  modalDietChipActive: { backgroundColor: "#FDF4FF", borderColor: "#C026D3" },
  modalDietText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  modalDietTextActive: { color: "#C026D3", fontWeight: "bold" },
  modalSaveBtn: {
    backgroundColor: "#5F259F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },

  // Gate Styles
  authGateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F9FAFB",
  },
  gateContent: {
    padding: 24,
    alignItems: "center",
  },
  gateIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  gateSub: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  gatePrimaryBtn: {
    backgroundColor: "#5F259F",
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#5F259F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gatePrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  gateSecondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  gateSecondaryBtnText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "600",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  roleCardText: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  roleCardSub: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  dashboardEmptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginVertical: 10,
  },
  dashboardEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 10,
    marginBottom: 4,
  },
  dashboardEmptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
