import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  Alert, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Store, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  Users, 
  Clock, 
  X, 
  ArrowRight, 
  Handshake,
  MapPin,
  ShieldCheck,
  Briefcase
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { resolveImageSource } from '../../src/data/verifiedPartners';

interface ChefBrandItem {
  id: string;
  brandName: string;
  tagline: string;
  chefName: string;
  chefExperience: string;
  chefBg: string;
  chefImage: any;
  rating: number;
  reviews: number;
  conceptDescription: string;
  model: 'Cloud Kitchen' | 'Artisanal FMCG' | 'QSR Micro-Franchise' | 'Meal Subscription';
  investmentRange: string;
  readyStatus: string;
  keyDishes: string[];
  location: string;
}

const CHEF_BRANDS: ChefBrandItem[] = [
  {
    id: 'brand-dumwala',
    brandName: 'Dumwala',
    tagline: 'Signature slow-charcoal dum biryani pots & kebab handis',
    chefName: 'Chef Farhan Akhtar',
    chefExperience: '10+ Years Dum Pukht Specialist',
    chefBg: 'Royal Nawabi Dastarkhwan master and catering director for 200+ weddings & banquet feasts',
    chefImage: require('../../assets/images/chef_farhan.jpg'),
    rating: 4.9,
    reviews: 186,
    conceptDescription: 'Specialized cloud kitchen & express takeout model delivering authentic handi dum biryanis sealed with whole-wheat dough. Standardized spice premixes enable a 12-minute prep time per handi with high gross margins.',
    model: 'Cloud Kitchen',
    investmentRange: '₹3.5L - ₹6L per cloud pod',
    readyStatus: 'Tested recipes & standardized spice-premixes ready',
    keyDishes: ['Hyderabadi Dum Biryani', 'Kachchi Gosht Handi', 'Galouti Kebab Rolls'],
    location: 'Bengaluru (Begur / HSR / Koramangala)'
  },
  {
    id: 'brand-kumbakonam',
    brandName: 'Kumbakonam coffee shop',
    tagline: 'Heritage degree filter coffee, brass davara brews & hot tiffin snacks',
    chefName: 'Chef Meenakshi Iyer',
    chefExperience: '8+ Years Heritage South Indian Cuisine',
    chefBg: 'Third-generation Kaveri delta coffee roaster and traditional South Indian tiffin curator',
    chefImage: { uri: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=600&auto=format&fit=crop' },
    rating: 4.95,
    reviews: 210,
    conceptDescription: 'Compact QSR & high-footfall kiosk model serving authentic chicory-blended Kumbakonam degree filter coffee in traditional brass davaras, hot crispy vadas, and fresh banana leaf snacks with rapid customer turnover.',
    model: 'QSR Micro-Franchise',
    investmentRange: '₹2.5L - ₹5L per kiosk',
    readyStatus: 'Turnkey kiosk design & daily roasted bean supply ready',
    keyDishes: ['Degree Filter Coffee', 'Crispy Medu Vada', 'Ghee Podi Mini Idli'],
    location: 'Bengaluru & Chennai Metro Corridors'
  },
  {
    id: 'brand-western-waffle',
    brandName: 'western waffle',
    tagline: 'Belgian liege waffles, loaded waffle sandwiches & dessert shakes',
    chefName: 'Chef Shalini Rao',
    chefExperience: '6+ Years European Pastry & Dessert Innovation',
    chefBg: 'Pastry specialist trained in Brussels, focused on pearl-sugar caramelized liege waffles and dessert cloud kitchens',
    chefImage: require('../../assets/images/chef_shalini.jpg'),
    rating: 4.88,
    reviews: 145,
    conceptDescription: 'Trendy fast-casual dessert and late-night delivery concept serving warm Belgian liege waffles, savory waffle sandwiches, and artisanal shakes with high gross margins (78%+) and low kitchen equipment overhead.',
    model: 'Artisanal FMCG',
    investmentRange: '₹3L - ₹5.5L per pod',
    readyStatus: 'Custom pearl-sugar dough premix & branding ready',
    keyDishes: ['Belgian Chocolate Overload', 'Red Velvet Berry Waffle', 'Nutella Hazelnut Crunch'],
    location: 'Bengaluru (Indiranagar / HSR / Whitefield)'
  },
  {
    id: 'brand-fresh-idly',
    brandName: 'Fresh idly',
    tagline: 'Piping hot button idlis, 4-variety chutney flights & breakfast subscriptions',
    chefName: 'Chef Arun Kumar',
    chefExperience: '9+ Years Commercial Kitchen Scale & Operations',
    chefBg: 'Operations director for high-volume south Indian breakfast brands and automated steam idli hubs',
    chefImage: require('../../assets/images/chef_arun.jpg'),
    rating: 4.92,
    reviews: 230,
    conceptDescription: 'Hyper-local automated clean idli hub offering ultra-fluffy melt-in-mouth steamed idlis, podi tosses, and monthly morning breakfast subscriptions delivered to gated societies before 7:30 AM.',
    model: 'Meal Subscription',
    investmentRange: '₹2L - ₹4L per hub',
    readyStatus: 'Standardized stone-ground batter supply & packaging pilot active',
    keyDishes: ['Steamed Ghee Button Idli', 'Thatte Idli with Vadakari', 'Guntur Podi Tossed Idli'],
    location: 'Bengaluru (Begur / Electronic City / Sarjapur)'
  }
];

export default function ChefBrandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<ChefBrandItem | null>(null);
  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userNote, setUserNote] = useState('');
  const [submittedInterest, setSubmittedInterest] = useState(false);
  const [interestedBrandIds, setInterestedBrandIds] = useState<string[]>([]);

  const models = ['All', 'Cloud Kitchen', 'Artisanal FMCG', 'QSR Micro-Franchise', 'Meal Subscription'];

  const filteredBrands = CHEF_BRANDS.filter(brand => {
    if (activeFilter === 'All') return true;
    return brand.model === activeFilter;
  });

  const handleOpenInterest = (brand: ChefBrandItem) => {
    setSelectedBrand(brand);
    setSubmittedInterest(false);
    setInterestModalVisible(true);
  };

  const handleInterestSubmit = () => {
    if (!userName.trim() || !userPhone.trim()) {
      Alert.alert('Details Required', 'Please enter your name and phone number to connect with this chef.');
      return;
    }

    if (selectedBrand) {
      setInterestedBrandIds(prev => [...new Set([...prev, selectedBrand.id])]);
    }
    setSubmittedInterest(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} 
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Chef Brand</Text>
          <Text style={styles.headerSubtitle}>Partner with chefs. Build a food business.</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO BANNER */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Store size={12} color="#5F259F" />
            <Text style={styles.heroBadgeText}>CULINARY VENTURES & FRANCHISES</Text>
          </View>
          <Text style={styles.heroTitle}>Partner with Chefs</Text>
          <Text style={styles.heroSubtitle}>
            Explore trusted professional chefs, their vetted business ideas, cloud kitchen concepts, and artisanal food brands looking for cloud partners, cloud space, and expansion co-founders.
          </Text>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>4</Text>
              <Text style={styles.metricLabel}>Vetted Concepts</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>100%</Text>
              <Text style={styles.metricLabel}>Verified Chefs</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>24h</Text>
              <Text style={styles.metricLabel}>Direct Response</Text>
            </View>
          </View>
        </View>

        {/* CATEGORY FILTER TABS */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Business Models</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {models.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.filterChip, activeFilter === m && styles.filterChipActive]}
                onPress={() => setActiveFilter(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, activeFilter === m && styles.filterChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CHEF BRAND LISTINGS */}
        <View style={styles.listingsContainer}>
          {filteredBrands.map(item => {
            const isInterested = interestedBrandIds.includes(item.id);
            return (
              <View key={item.id} style={styles.brandCard}>
                
                {/* Brand Header & Model Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.modelPill}>
                    <Briefcase size={12} color="#5F259F" />
                    <Text style={styles.modelPillText}>{item.model}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewsText}>({item.reviews})</Text>
                  </View>
                </View>

                {/* Brand Title & Tagline */}
                <Text style={styles.brandName}>{item.brandName}</Text>
                <Text style={styles.brandTagline}>{item.tagline}</Text>

                {/* Chef Bio Snippet */}
                <View style={styles.chefSnippetCard}>
                  <Image 
                    source={resolveImageSource(item.chefImage)} 
                    style={styles.chefAvatar}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.chefNameRow}>
                      <Text style={styles.chefName}>{item.chefName}</Text>
                      <ShieldCheck size={13} color="#16A34A" />
                    </View>
                    <Text style={styles.chefExp}>{item.chefExperience}</Text>
                    <Text style={styles.chefBg} numberOfLines={2}>{item.chefBg}</Text>
                  </View>
                </View>

                {/* Business Concept */}
                <View style={styles.conceptBox}>
                  <Text style={styles.conceptLabel}>THE BUSINESS CONCEPT</Text>
                  <Text style={styles.conceptText}>{item.conceptDescription}</Text>
                </View>

                {/* Key Dishes / Offerings */}
                <View style={styles.dishesRow}>
                  {item.keyDishes.map((dish, i) => (
                    <View key={i} style={styles.dishTag}>
                      <Text style={styles.dishTagText}>{dish}</Text>
                    </View>
                  ))}
                </View>

                {/* Investment & Readiness Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Capital Est:</Text>
                    <Text style={styles.metaVal}>{item.investmentRange}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Location:</Text>
                    <Text style={styles.metaVal}>{item.location}</Text>
                  </View>
                </View>

                {/* Action Row with "Interested" Button */}
                <View style={styles.cardActionRow}>
                  <View style={styles.readinessWrap}>
                    <CheckCircle2 size={13} color="#16A34A" />
                    <Text style={styles.readinessText}>{item.readyStatus}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.interestedBtn, isInterested && styles.interestedBtnActive]}
                    onPress={() => handleOpenInterest(item)}
                    activeOpacity={0.88}
                  >
                    {isInterested ? (
                      <>
                        <CheckCircle2 size={14} color="#16A34A" style={{ marginRight: 5 }} />
                        <Text style={[styles.interestedBtnText, { color: '#16A34A' }]}>Interested ✓</Text>
                      </>
                    ) : (
                      <>
                        <Handshake size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.interestedBtnText}>Interested</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}
        </View>

        {/* BOTTOM CALLOUT FOR PRO CHEFS */}
        <View style={styles.partnerCalloutCard}>
          <Text style={styles.partnerCalloutTitle}>Are you a Chef with a food brand idea?</Text>
          <Text style={styles.partnerCalloutSub}>
            Submit your concept to be listed in Chef Brand and find partners, kitchen spaces, and micro-investors.
          </Text>
          <TouchableOpacity 
            style={styles.partnerCalloutBtn}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.partnerCalloutBtnText}>Submit Your Brand Idea</Text>
            <ArrowRight size={14} color="#5F259F" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* INTEREST EXPRESSION MODAL */}
      <Modal
        visible={interestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInterestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Connect with Chef</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedBrand?.brandName} &bull; {selectedBrand?.chefName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInterestModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {submittedInterest ? (
              <View style={styles.submittedBox}>
                <View style={styles.submittedIconCircle}>
                  <CheckCircle2 size={40} color="#16A34A" />
                </View>
                <Text style={styles.submittedTitle}>Interest Recorded!</Text>
                <Text style={styles.submittedSub}>
                  Thank you, {userName}! We have notified {selectedBrand?.chefName} and the Instacome Brand Partnerships desk. A partner representative will connect with you at {userPhone} within 24 hours.
                </Text>

                <TouchableOpacity 
                  style={styles.submittedDoneBtn}
                  onPress={() => setInterestModalVisible(false)}
                >
                  <Text style={styles.submittedDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.formNote}>
                  Express your interest to partner, invest, or offer kitchen space to {selectedBrand?.chefName}.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Your Full Name *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. Rahul Sharma"
                    value={userName}
                    onChangeText={setUserName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="+91 98765 43210"
                    value={userPhone}
                    onChangeText={setUserPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>How would you like to collaborate? (Optional)</Text>
                  <TextInput
                    style={[styles.inputField, { height: 75, textAlignVertical: 'top' }]}
                    placeholder="e.g. I have a commercial cloud kitchen in HSR / I want to invest capital / I am looking for a catering partner"
                    value={userNote}
                    onChangeText={setUserNote}
                    multiline
                  />
                </View>

                <TouchableOpacity 
                  style={styles.submitInterestBtn}
                  onPress={handleInterestSubmit}
                  activeOpacity={0.88}
                >
                  <Text style={styles.submitInterestBtnText}>Submit Expression of Interest</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5F259F',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5F259F',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listingsContainer: {
    gap: 16,
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  modelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5F259F',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewsText: {
    fontSize: 11,
    color: '#64748B',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  chefSnippetCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  chefAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  chefNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chefName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  chefExp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5F259F',
    marginTop: 1,
  },
  chefBg: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  conceptBox: {
    marginBottom: 10,
  },
  conceptLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  conceptText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  dishesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  dishTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  dishTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  readinessWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
  },
  readinessText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  interestedBtn: {
    backgroundColor: '#5F259F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  interestedBtnActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  interestedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  partnerCalloutCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 16,
    marginTop: 12,
  },
  partnerCalloutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  partnerCalloutSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  partnerCalloutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerCalloutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5F259F',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formNote: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitInterestBtn: {
    backgroundColor: '#5F259F',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitInterestBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  submittedBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  submittedIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  submittedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  submittedSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  submittedDoneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  submittedDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
