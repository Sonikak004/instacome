import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  Image,
  Animated,
  Easing 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ShieldCheck, 
  Clock, 
  UtensilsCrossed, 
  PhoneCall, 
  HelpCircle, 
  FileCheck2, 
  Edit3,
  LogOut,
  RotateCw
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStorage } from '../../src/utils/userStorage';

export default function OnboardingReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, providerProfile, signOut, refreshProfile } = useAuth();

  const [savedApplication, setSavedApplication] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState('');

  // Pulse animation for "Awaiting Review" live status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleRefreshStatus = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshFeedback('');

    spinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    spinLoop.start();

    try {
      if (refreshProfile) {
        await refreshProfile();
      }
      const app = await UserStorage.getSubmittedApplication(profile?.id);
      if (app) {
        setSavedApplication(app);
      }

      if (providerProfile?.is_verified) {
        router.replace('/dashboard');
        return;
      }

      setRefreshFeedback('Status refreshed • Application under review');
    } catch (err) {
      console.warn('Status refresh error:', err);
      setRefreshFeedback('Checked just now');
    } finally {
      setTimeout(() => {
        spinLoop.stop();
        spinAnim.setValue(0);
        setRefreshing(false);
      }, 700);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out of your partner account?') : true;
      if (confirmed) {
        await signOut();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out of your partner account?', [
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

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const userId = profile?.id;
        const app = await UserStorage.getSubmittedApplication(userId);
        if (app) {
          // Ownership verification: ensure this application actually belongs to this account
          const isUserMatch = !userId || !app.userId || app.userId === userId || 
            (profile?.full_name && app.fullName && app.fullName.toLowerCase() === profile.full_name.toLowerCase());
          if (isUserMatch) {
            setSavedApplication(app);
          } else {
            // Belongs to another user! Redirect this new user to fresh onboarding
            router.replace('/onboarding');
          }
        } else {
          // No application submitted yet by this user!
          router.replace('/onboarding');
        }
      } catch (e) {
        console.warn('Failed loading submitted app:', e);
      }
    };
    loadSaved();
  }, [profile?.id, profile?.full_name]);

  const isChef = savedApplication?.partnerType === 'chef' || profile?.role === 'chef';
  const roleTitle = isChef ? 'Professional Chef' : 'Home Cook';
  const partnerName = savedApplication?.fullName || providerProfile?.business_name || profile?.full_name || 'Partner';
  const verificationId = savedApplication?.userId ? `APP-${savedApplication.userId.slice(-6).toUpperCase()}` : 'APP-628491';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER: Single Clean Log Out Button at Top Right */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLogoWrap}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Application Status</Text>
          <Text style={styles.headerSubtitle}>Partner Verification Desk</Text>
        </View>

        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.headerLogoutBtn}
          activeOpacity={0.8}
        >
          <LogOut size={14} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.headerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STATUS HERO CARD */}
        <View style={styles.statusCard}>
          <View style={styles.iconCircleOuter}>
            <Animated.View 
              style={[
                styles.pulseHalo, 
                { 
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.45, 0.05],
                  })
                }
              ]} 
            />
            <View style={styles.iconCircleInner}>
              <Clock size={32} color="#5F259F" />
            </View>
          </View>

          {/* Animated Awaiting Review Live Badge */}
          <View style={styles.reviewBadge}>
            <View style={styles.livePulseDotWrap}>
              <Animated.View 
                style={[
                  styles.livePulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.15],
                      outputRange: [0.7, 0],
                    })
                  }
                ]} 
              />
              <View style={styles.livePulseDot} />
            </View>
            <Text style={styles.reviewBadgeText}>AWAITING REVIEW</Text>
          </View>

          <Text style={styles.statusTitle}>Application submitted</Text>
          <Text style={styles.statusSubtitle}>
            Our team will review your details and contact you for verification. You’ll be notified once your application is approved.
          </Text>

          {/* Refresh Status Button inside the box */}
          <TouchableOpacity
            style={styles.refreshStatusBtn}
            onPress={handleRefreshStatus}
            disabled={refreshing}
            activeOpacity={0.82}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RotateCw size={15} color="#5F259F" />
            </Animated.View>
            <Text style={styles.refreshStatusBtnText}>
              {refreshing ? 'Checking Status...' : 'Check / Refresh Status'}
            </Text>
          </TouchableOpacity>

          {refreshFeedback ? (
            <Text style={styles.refreshFeedbackText}>{refreshFeedback}</Text>
          ) : null}

          <View style={styles.etaBox}>
            <Clock size={15} color="#B45309" />
            <Text style={styles.etaText}>
              Estimated Verification: <Text style={{ fontWeight: '800' }}>24 – 48 Hours</Text>
            </Text>
          </View>
        </View>

        {/* WHAT HAPPENS NEXT (Simple & Friendly) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What happens next?</Text>
          <Text style={styles.sectionSub}>
            {isChef 
              ? 'Simple steps before you receive your first booking:' 
              : 'Simple steps before your kitchen opens for orders:'}
          </Text>

          <View style={styles.checklist}>
            {isChef ? (
              <>
                {/* Chef Step 1 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <ShieldCheck size={18} color="#5F259F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Quick Identity Check</Text>
                    <Text style={styles.checkItemSub}>A quick verification so customers know who is cooking for them.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>In Review</Text>
                </View>

                {/* Chef Step 2 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <PhoneCall size={18} color="#5F259F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Friendly 5-Minute Call</Text>
                    <Text style={styles.checkItemSub}>Our team calls to welcome you and explain how booking requests work.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>Queued</Text>
                </View>

                {/* Chef Step 3 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <FileCheck2 size={18} color="#5F259F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Profile Goes Live</Text>
                    <Text style={styles.checkItemSub}>Your chef profile is activated and you can start accepting bookings.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>Next Step</Text>
                </View>
              </>
            ) : (
              <>
                {/* Home Cook Step 1 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <UtensilsCrossed size={18} color="#C026D3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Kitchen & Menu Check</Text>
                    <Text style={styles.checkItemSub}>Quick check of your dishes, food hygiene, and daily cooking capacity.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>In Review</Text>
                </View>

                {/* Home Cook Step 2 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <PhoneCall size={18} color="#C026D3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Welcome & Packing Guide</Text>
                    <Text style={styles.checkItemSub}>Tips on meal packing and pickup timing to keep customers happy.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>Queued</Text>
                </View>

                {/* Home Cook Step 3 */}
                <View style={styles.checkItem}>
                  <View style={styles.checkPendingCircle}>
                    <ShieldCheck size={18} color="#C026D3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkItemTitle}>Kitchen Opens for Orders</Text>
                    <Text style={styles.checkItemSub}>Your dishes go live on Instacome for neighbors to browse and order.</Text>
                  </View>
                  <Text style={styles.pendingLabel}>Next Step</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* SUMMARY SUBMITTED */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Application Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applicant Name:</Text>
            <Text style={styles.detailVal}>{partnerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role Category:</Text>
            <Text style={styles.detailVal}>{roleTitle}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location Hub:</Text>
            <Text style={styles.detailVal}>Bengaluru (Begur / HSR / Electronic City)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tracking ID:</Text>
            <Text style={styles.detailVal}>{verificationId}</Text>
          </View>
        </View>

        {/* ACTIONS: Polished Squared Review & Edit Button (No duplicate logout) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.reviewEditBtnSquare}
            onPress={() => router.push('/onboarding?step=5')}
            activeOpacity={0.88}
          >
            <Edit3 size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.reviewEditBtnText}>Review & Edit Application Details</Text>
          </TouchableOpacity>
        </View>

        {/* SUPPORT CALLOUT */}
        <View style={styles.supportBox}>
          <HelpCircle size={16} color="#64748B" />
          <Text style={styles.supportText}>
            Need immediate onboarding assistance? Email our Partner Desk at <Text style={{ fontWeight: '700', color: '#5F259F' }}>partners@instacome.app</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLogoWrap: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerLogo: {
    width: 38,
    height: 38,
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  // Status Hero Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  iconCircleOuter: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  pulseHalo: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E9D5FF',
  },
  iconCircleInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Live Pulsing Awaiting Review Badge
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  livePulseDotWrap: {
    position: 'relative',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  livePulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },

  statusTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },

  // Refresh Status Button inside the box
  refreshStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  refreshStatusBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5F259F',
  },
  refreshFeedbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 10,
  },

  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8,
  },
  etaText: {
    fontSize: 12,
    color: '#92400E',
  },

  // Sections
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  checklist: {
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkPendingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 15,
  },
  pendingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5F259F',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // Summary Rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Actions
  actionsContainer: {
    marginBottom: 16,
  },
  reviewEditBtnSquare: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#5F259F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5F259F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Support Box
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  supportText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 15,
  },
});
