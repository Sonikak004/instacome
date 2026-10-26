import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Star, MapPin, CheckCircle2, Award, Clock, Languages, ChefHat, Calendar, ShieldCheck } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { catalogService } from '../../src/services/catalogService';
import { PartnerChef, resolveImageSource } from '../../src/data/verifiedPartners';
import { useAuth } from '../../src/context/AuthContext';
import { liveService } from '../../src/services/liveService';

export default function ChefDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [booked, setBooked] = useState(false);
  const [chef, setChef] = useState<PartnerChef | null>(null);

  useEffect(() => {
    catalogService.getLiveChefById(id as string).then(setChef);
  }, [id]);

  if (!chef) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar style="dark" />
        <ChefHat size={48} color="#94A3B8" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 14 }}>Chef Not Available</Text>
        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
          This private chef profile is currently offline or unlisted.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#5F259F', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 18 }}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/book-chef'))}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBookChef = async () => {
    if (!session) {
      Alert.alert(
        "Sign In Required",
        `Please log in to hire ${chef.name}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/(auth)/login") }
        ]
      );
      return;
    }

    try {
      await liveService.bookChef({
        customerId: session.user.id,
        customerName: profile?.full_name || session.user.email?.split('@')[0] || "Customer",
        chefId: chef.id,
        chefName: chef.name,
        chefImage: chef.image,
        members: "3 - 4 People",
        diet: "Non-Veg",
        cuisines: chef.cuisines,
        timing: "Immediate (30-45 mins)",
        eventAddress: "Begur Main Road, Bengaluru",
        totalAmount: chef.startingPrice || 499,
      });

      setBooked(true);
      Alert.alert(
        "Booking Confirmed",
        `Your request to hire ${chef.name} has been confirmed. You can track their arrival live in Orders.`,
        [{ text: "View in Orders", onPress: () => router.push("/(tabs)/orders") }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to book chef.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER BAR */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/book-chef'))} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{chef.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO IMAGE & BADGE */}
        <View style={styles.imageContainer}>
          <Image source={resolveImageSource(chef.image)} style={styles.chefHeroImage} />
          <View style={styles.imageOverlay} />
          
          <View style={styles.heroBadgeRow}>
            <View style={styles.verifiedTag}>
              <CheckCircle2 size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedTagText}>Verified Instacome Chef</Text>
            </View>
            <View style={styles.ratingTag}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.ratingTagText}>{chef.rating} ({chef.reviews} reviews)</Text>
            </View>
          </View>
        </View>

        {/* CHEF INFO CARD */}
        <View style={styles.cardSection}>
          <View style={styles.titleRow}>
            <Text style={styles.chefName}>{chef.name}</Text>
            <Text style={styles.experienceText}>{chef.experienceYears}+ years exp</Text>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#5F259F" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>Begur, Bengaluru • {chef.distanceKm} km away</Text>
          </View>

          <View style={styles.tagsContainer}>
            {chef.cuisines.map((c, i) => (
              <View key={i} style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* QUICK HIGHLIGHTS */}
          <View style={styles.highlightsGrid}>
            <View style={styles.highlightItem}>
              <Award size={20} color="#5F259F" />
              <Text style={styles.highlightTitle}>Certified</Text>
              <Text style={styles.highlightSub}>FSSAI & Background Checked</Text>
            </View>
            <View style={styles.highlightItem}>
              <Clock size={20} color="#5F259F" />
              <Text style={styles.highlightTitle}>Availability</Text>
              <Text style={styles.highlightSub}>{chef.availableToday ? 'Available Today' : 'Advance Booking'}</Text>
            </View>
            <View style={styles.highlightItem}>
              <Languages size={20} color="#5F259F" />
              <Text style={styles.highlightTitle}>Languages</Text>
              <Text style={styles.highlightSub}>{chef.languages.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Private Chef Booking Works</Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Date & Meal Type</Text>
              <Text style={styles.stepSub}>Choose lunch or dinner and custom menu preferences.</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Chef Cooks in Your Kitchen</Text>
              <Text style={styles.stepSub}>Chef brings fresh spices and ingredients, and prepares hot meals live.</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Kitchen Cleaning Included</Text>
              <Text style={styles.stepSub}>Chef tidies up the kitchen counters before leaving!</Text>
            </View>
          </View>
        </View>

        {/* REVIEWS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews ({chef.reviews || 0})</Text>
          {chef.reviews && chef.reviews > 0 ? (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>Verified Client</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>
                "Exceptional on-demand dining experience. Prepared a delicious multi-course meal on time and left our kitchen spotless."
              </Text>
            </View>
          ) : (
            <View style={[styles.reviewCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 8 }}>
                No customer reviews yet. Book this partner chef to be the first!
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* STICKY BOTTOM ACTION BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>₹{chef.startingPrice} <Text style={styles.priceUnit}>/ session</Text></Text>
        </View>

        <TouchableOpacity 
          style={styles.bookButton}
          activeOpacity={0.8}
          onPress={handleBookChef}
        >
          <ChefHat size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bookButtonText}>Book This Chef</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  chefHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chefName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  experienceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5F259F',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cuisineTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cuisineTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  highlightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  highlightSub: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5F259F',
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
