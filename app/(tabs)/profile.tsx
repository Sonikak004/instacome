import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStorage } from '../../src/utils/userStorage';
import { StatusBar } from "expo-status-bar";
import { 
  User, 
  Settings, 
  HelpCircle, 
  MapPin, 
  Heart, 
  ChevronRight, 
  LogOut, 
  ChefHat, 
  UtensilsCrossed, 
  ShieldCheck, 
  ReceiptText,
  LayoutDashboard,
  ArrowRight
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { session, profile, providerProfile, signOut, loginAs, switchRole } = useAuth();
  const router = useRouter();

  const isChef = profile?.role === 'chef';
  const isHomeCook = profile?.role === 'home_cook';
  const isCustomer = !isChef && !isHomeCook;

  useEffect(() => {
    if (session && (isChef || isHomeCook)) {
      if (providerProfile?.is_verified) {
        router.replace('/dashboard');
        return;
      }
      UserStorage.getAppStatus(session.user.id).then((appStatus) => {
        if (appStatus === 'pending_review') {
          router.replace('/onboarding/review');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [session, isChef, isHomeCook, providerProfile]);

  // NEVER show customer profile page to a chef!
  if (session && (isChef || isHomeCook)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5F259F" />
      </View>
    );
  }

  // 1. GUEST VIEW
  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <Text style={styles.title}>Account</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Guest Hero Card */}
          <View style={styles.guestHeroCard}>
            <Image 
              source={require("../../assets/logo.png")} 
              style={styles.guestLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.guestTitle}>Welcome to Instacome</Text>
            <Text style={styles.guestSub}>
              Log in to track on-demand chef bookings, order fresh homemade meals, and manage your account.
            </Text>

            <TouchableOpacity 
              style={styles.loginBtn} 
              activeOpacity={0.85} 
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Become a Partner Callout for Guests */}
          <TouchableOpacity 
            style={styles.partnerCard}
            activeOpacity={0.85}
            onPress={() => router.push("/onboarding")}
          >
            <View style={styles.partnerCardLeft}>
              <View style={styles.partnerBadge}>
                <ShieldCheck size={13} color="#5F259F" />
                <Text style={styles.partnerBadgeText}>PARTNER WITH US</Text>
              </View>
              <Text style={styles.partnerCardTitle}>Are you a Chef or Home Cook?</Text>
              <Text style={styles.partnerCardSub}>Join Instacome to cook for local families and grow your daily income.</Text>
              <View style={styles.partnerCtaRow}>
                <Text style={styles.partnerCtaText}>Apply to Partner</Text>
                <ArrowRight size={14} color="#5F259F" />
              </View>
            </View>
            <View style={styles.partnerIconBox}>
              <ChefHat size={28} color="#0F172A" />
            </View>
          </TouchableOpacity>

          {/* General Menu Options */}
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push("/(tabs)/explore")}>
              <View style={styles.menuIcon}><MapPin size={18} color="#0F172A" /></View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Browse Local Chefs & Food</Text>
                <Text style={styles.menuSub}>Explore authentic menus near Begur</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0 }]} 
              activeOpacity={0.7} 
              onPress={() => Alert.alert("Customer Support", "Email: support@instacome.app\nPhone: +91 98765 43210")}
            >
              <View style={styles.menuIcon}><HelpCircle size={18} color="#0F172A" /></View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Help & Support</Text>
                <Text style={styles.menuSub}>FAQs, safety guarantees and assistance</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. AUTHENTICATED VIEW
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.headerSubtitle}>
            {isChef ? "Private Chef Partner" : isHomeCook ? "Home Kitchen Partner" : "Customer Account"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            {isChef ? (
              <ChefHat size={26} color="#FFFFFF" />
            ) : isHomeCook ? (
              <UtensilsCrossed size={26} color="#FFFFFF" />
            ) : (
              <User size={26} color="#FFFFFF" />
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {profile?.full_name || session.user.email?.split('@')[0] || "Instacome User"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>{session.user.email}</Text>
            
            <View style={styles.roleBadgeRow}>
              <View style={styles.rolePill}>
                {isChef && <ChefHat size={12} color="#0F172A" style={{ marginRight: 4 }} />}
                {isHomeCook && <UtensilsCrossed size={12} color="#0F172A" style={{ marginRight: 4 }} />}
                {isCustomer && <User size={12} color="#0F172A" style={{ marginRight: 4 }} />}
                <Text style={styles.rolePillText}>
                  {isChef ? "Professional Chef" : isHomeCook ? "Home Cook Partner" : "Verified Customer"}
                </Text>
              </View>
              <View style={styles.activeDot} />
            </View>
          </View>
        </View>

        {/* 1-TAP ROLE SWITCHER */}
        <View style={styles.roleSwitcherContainer}>
          <Text style={styles.roleSwitcherLabel}>SWITCH ACTIVE ROLE</Text>
          <View style={styles.roleSwitcherRow}>
            <TouchableOpacity 
              style={[styles.switcherTab, isCustomer && styles.switcherTabActive]}
              onPress={() => switchRole('customer')}
              activeOpacity={0.8}
            >
              <User size={13} color={isCustomer ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.switcherTabText, isCustomer && styles.switcherTabTextActive]}>Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.switcherTab, isChef && styles.switcherTabActive]}
              onPress={() => switchRole('chef')}
              activeOpacity={0.8}
            >
              <ChefHat size={13} color={isChef ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.switcherTabText, isChef && styles.switcherTabTextActive]}>Private Chef</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.switcherTab, isHomeCook && styles.switcherTabActive]}
              onPress={() => switchRole('home_cook')}
              activeOpacity={0.8}
            >
              <UtensilsCrossed size={13} color={isHomeCook ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.switcherTabText, isHomeCook && styles.switcherTabTextActive]}>Home Chef</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHEF SPECIFIC DASHBOARD SECTION */}
        {isChef && (
          <View style={styles.hubCard}>
            <View style={styles.hubHeader}>
              <View>
                <Text style={styles.hubTitle}>Chef Partner Dashboard</Text>
                <Text style={styles.hubSub}>Manage booking requests & schedule</Text>
              </View>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            </View>

            <View style={styles.hubActions}>
              <TouchableOpacity 
                style={styles.hubPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/dashboard")}
              >
                <LayoutDashboard size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.hubPrimaryBtnText}>Open Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.hubSecondaryBtn}
                activeOpacity={0.8}
                onPress={() => router.push("/onboarding")}
              >
                <Text style={styles.hubSecondaryBtnText}>Edit Rates</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* HOME COOK SPECIFIC DASHBOARD SECTION */}
        {isHomeCook && (
          <View style={styles.hubCard}>
            <View style={styles.hubHeader}>
              <View>
                <Text style={styles.hubTitle}>Home Kitchen Dashboard</Text>
                <Text style={styles.hubSub}>Manage menu items & incoming orders</Text>
              </View>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.verifiedPillText}>Kitchen Active</Text>
              </View>
            </View>

            <View style={styles.hubActions}>
              <TouchableOpacity 
                style={styles.hubPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/dashboard")}
              >
                <LayoutDashboard size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.hubPrimaryBtnText}>Open Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.hubSecondaryBtn}
                activeOpacity={0.8}
                onPress={() => router.push("/onboarding")}
              >
                <Text style={styles.hubSecondaryBtnText}>Edit Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CUSTOMER PROMOTIONAL PARTNER BANNER */}
        {isCustomer && (
          <TouchableOpacity 
            style={styles.partnerCard} 
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "chef" } })}
          >
            <View style={styles.partnerCardLeft}>
              <View style={styles.partnerBadge}>
                <ShieldCheck size={13} color="#5F259F" />
                <Text style={styles.partnerBadgeText}>PARTNER WITH US</Text>
              </View>
              <Text style={styles.partnerCardTitle}>Are you a Chef or Home Cook?</Text>
              <Text style={styles.partnerCardSub}>Earn up to ₹50,000/month cooking for nearby families. Quick verification.</Text>
              <View style={styles.partnerCtaRow}>
                <Text style={styles.partnerCtaText}>Apply to Partner</Text>
                <ArrowRight size={14} color="#5F259F" />
              </View>
            </View>
            <View style={styles.partnerIconBox}>
              <ChefHat size={28} color="#0F172A" />
            </View>
          </TouchableOpacity>
        )}

        {/* Navigation & Options Section */}
        <View style={styles.menuContainer}>
          {/* My Orders / Bookings */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <View style={styles.menuIcon}><ReceiptText size={18} color="#0F172A" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>My Bookings & Orders</Text>
              <Text style={styles.menuSub}>Active orders, chef bookings & history</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Book an On-Demand Chef */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push("/book-chef")}
          >
            <View style={styles.menuIcon}>
              <ChefHat size={18} color="#0F172A" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Book a Chef On-Demand</Text>
              <Text style={styles.menuSub}>Direct matching with private chefs in Begur</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Saved Addresses */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Saved Addresses", "Begur Main Road, Bengaluru, Karnataka 560068\n(Current Address)")}
          >
            <View style={styles.menuIcon}><MapPin size={18} color="#0F172A" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Saved Addresses</Text>
              <Text style={styles.menuSub}>Begur Main Road, Bengaluru</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Switch Account */}
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/login")}
          >
            <View style={styles.menuIcon}><Settings size={18} color="#0F172A" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Switch Account / Role</Text>
              <Text style={styles.menuSub}>Log into customer, chef or home cook</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]} 
            activeOpacity={0.7}
            onPress={() => Alert.alert("Instacome Support", "Need help with an order or chef booking?\n\nWhatsApp/Call: +91 98765 43210\nEmail: support@instacome.app")}
          >
            <View style={styles.menuIcon}><HelpCircle size={18} color="#0F172A" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSub}>FAQs and customer assistance</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Single Clean Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={signOut}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  content: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  guestHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  guestLogo: {
    width: 130,
    height: 85,
    marginBottom: 12,
  },
  guestIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
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
    lineHeight: 19,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#5F259F",
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
  partnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  partnerCardLeft: {
    flex: 1,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5F259F",
    letterSpacing: 0.5,
  },
  partnerCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  partnerCardSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    marginBottom: 10,
  },
  partnerCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  partnerCtaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5F259F",
  },
  partnerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  roleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  hubCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  hubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  hubSub: {
    fontSize: 12,
    color: "#64748B",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16A34A",
  },
  hubActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hubPrimaryBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 11,
    borderRadius: 8,
  },
  hubPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hubSecondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 11,
    borderRadius: 8,
  },
  hubSecondaryBtnText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: "#64748B",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },

  // Authenticated 1-Tap Role Switcher
  roleSwitcherContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 16,
  },
  roleSwitcherLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#94A3B8",
    marginBottom: 8,
  },
  roleSwitcherRow: {
    flexDirection: "row",
    gap: 6,
  },
  switcherTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 5,
  },
  switcherTabActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  switcherTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  switcherTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
