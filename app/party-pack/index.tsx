import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Modal, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  PartyPopper, 
  Users, 
  Calendar, 
  ChefHat, 
  Check, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Clock,
  X,
  Flame,
  Salad
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface MenuItem {
  id: string;
  name: string;
  category: 'starter' | 'main' | 'dessert';
  isVeg: boolean;
  description: string;
}

const PARTY_MENU_ITEMS: MenuItem[] = [
  // --- STARTERS (~10 items) ---
  { id: 's1', name: 'Paneer Tikka Angaare', category: 'starter', isVeg: true, description: 'Char-grilled cottage cheese cubes with tandoori spices & capsicum' },
  { id: 's2', name: 'Chicken Seekh Kebabs', category: 'starter', isVeg: false, description: 'Minced chicken skewers infused with green cardamom, mint & coriander' },
  { id: 's3', name: 'Crispy Corn Chilli Pepper', category: 'starter', isVeg: true, description: 'Golden fried sweet corn tossed with spring onions & crushed pepper' },
  { id: 's4', name: 'Tandoori Soya Chaap', category: 'starter', isVeg: true, description: 'Soy cutlets marinated in mustard oil, hung curd & aromatic spices' },
  { id: 's5', name: 'Galouti Kebabs on Mini Sheermal', category: 'starter', isVeg: false, description: 'Melt-in-mouth Awadhi mutton patties cooked on a copper mahi tawa' },
  { id: 's6', name: 'Hara Bhara Kebab', category: 'starter', isVeg: true, description: 'Crispy spinach and green pea patties stuffed with spiced cottage cheese' },
  { id: 's7', name: 'Fish Amritsari Bites', category: 'starter', isVeg: false, description: 'Crisp carom-seed spiced river sole fillets fried in fresh cold-pressed oil' },
  { id: 's8', name: 'Dahi Ke Kebab', category: 'starter', isVeg: true, description: 'Velvety hung-curd patties infused with green chillies & fresh cilantro' },
  { id: 's9', name: 'Chicken Malai Tikka', category: 'starter', isVeg: false, description: 'Boneless tender chicken thigh chunks glazed with cream, cheese & white pepper' },
  { id: 's10', name: 'Stuffed Mushroom Tikkas', category: 'starter', isVeg: true, description: 'Plump button mushrooms filled with spiced paneer & roasted in tandoor' },

  // --- MAIN COURSES (~12 items) ---
  { id: 'm1', name: 'Dal Makhani Bukhara Style', category: 'main', isVeg: true, description: 'Black lentils slow-simmered for 16 hours with cream & fresh churned butter' },
  { id: 'm2', name: 'Butter Chicken Aslam Style', category: 'main', isVeg: false, description: 'Smoked tandoori chicken cooked in a rich velvety tomato and cashew gravy' },
  { id: 'm3', name: 'Paneer Lababdar', category: 'main', isVeg: true, description: 'Cottage cheese chunks cooked with chopped onions, capsicum & rich gravy' },
  { id: 'm4', name: 'Dum Hyderabadi Chicken Biryani', category: 'main', isVeg: false, description: 'Long-grain aged basmati rice cooked on slow charcoal dum with tender chicken' },
  { id: 'm5', name: 'Kadhai Paneer & Bell Peppers', category: 'main', isVeg: true, description: 'Cottage cheese tossed with hand-pounded coriander seeds & red chillies' },
  { id: 'm6', name: 'Mutton Rogan Josh', category: 'main', isVeg: false, description: 'Traditional Kashmiri style slow-braised tender lamb cooked with ratan jot' },
  { id: 'm7', name: 'Amritsari Pindi Chhole', category: 'main', isVeg: true, description: 'Dark chickpeas cooked with anardana, amla, and home-blended garam masala' },
  { id: 'm8', name: 'Awadhi Subz Dum Biryani', category: 'main', isVeg: true, description: 'Fragrant basmati rice layered with garden fresh vegetables & saffron milk' },
  { id: 'm9', name: 'Yellow Dal Tadka Double Chaunk', category: 'main', isVeg: true, description: 'Arhar dal tempered with desi ghee, garlic, hing, cumin & whole red chillies' },
  { id: 'm10', name: 'Malabar Chicken Curry', category: 'main', isVeg: false, description: 'Coastal chicken prepared with roasted coconut milk, curry leaves & spices' },
  { id: 'm11', name: 'Garlic Butter Naan & Laccha Paratha', category: 'main', isVeg: true, description: 'Freshly rolled flaky layered breads and garlic naan hot off your kitchen stove' },
  { id: 'm12', name: 'Fragrant Jeera Rice & Veg Pulao', category: 'main', isVeg: true, description: 'Steamed basmati rice tempered with cumin seeds and whole fragrant spices' },

  // --- DESSERTS (~8 items) ---
  { id: 'd1', name: 'Hot Gulab Jamun with Kesari Rabdi', category: 'dessert', isVeg: true, description: 'Warm khoya dumplings soaked in saffron syrup, served with chilled thick rabdi' },
  { id: 'd2', name: 'Royal Kesari Phirni in Clay Pots', category: 'dessert', isVeg: true, description: 'Creamy ground rice pudding infused with saffron, cardamom & pistachio flakes' },
  { id: 'd3', name: 'Sizzling Brownie with Vanilla Cream', category: 'dessert', isVeg: true, description: 'Fudgy dark chocolate walnut brownie with warm Belgian chocolate ganache' },
  { id: 'd4', name: 'Shahi Awadhi Tukda', category: 'dessert', isVeg: true, description: 'Crispy fried bread triangles steeped in saffron syrup & draped with mawa' },
  { id: 'd5', name: 'Moong Dal Halwa Desi Ghee', category: 'dessert', isVeg: true, description: 'Rich winter delicacy made with roasted yellow lentils and pure desi ghee' },
  { id: 'd6', name: 'Rasmalai Tres Leches Cups', category: 'dessert', isVeg: true, description: 'Fusion dessert featuring sponge cake soaked in saffron cardamom infused milk' },
  { id: 'd7', name: 'Alphonso Mango Kulfi Platter', category: 'dessert', isVeg: true, description: 'Traditional condensed milk kulfi enriched with real Ratnagiri mango pulp' },
  { id: 'd8', name: 'Classic Gajar Ka Halwa', category: 'dessert', isVeg: true, description: 'Grated red winter carrots cooked in full-cream milk, khoya & golden raisins' }
];

export default function PartyPackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [guests, setGuests] = useState<number>(15);
  const [occasionType, setOccasionType] = useState<string>('Birthday');
  const [occasionDate, setOccasionDate] = useState<string>('Upcoming Weekend');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([
    's1', 's2', 's3',
    'm1', 'm2', 'm4', 'm11',
    'd1'
  ]);
  const [activeTab, setActiveTab] = useState<'all' | 'starter' | 'main' | 'dessert'>('all');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non_veg'>('all');
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Computed values
  const chefCount = guests > 15 ? 2 : 1;
  const baseChefFee = guests <= 10 ? 1999 : guests <= 20 ? 2999 : guests <= 35 ? 3999 : 4999;
  
  const toggleItem = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedItemIds(prev => [...prev, id]);
    }
  };

  const startersCount = selectedItemIds.filter(id => PARTY_MENU_ITEMS.find(m => m.id === id)?.category === 'starter').length;
  const mainsCount = selectedItemIds.filter(id => PARTY_MENU_ITEMS.find(m => m.id === id)?.category === 'main').length;
  const dessertsCount = selectedItemIds.filter(id => PARTY_MENU_ITEMS.find(m => m.id === id)?.category === 'dessert').length;

  const filteredItems = PARTY_MENU_ITEMS.filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (vegFilter === 'veg' && !item.isVeg) return false;
    if (vegFilter === 'non_veg' && item.isVeg) return false;
    return true;
  });

  const occasions = ['Birthday', 'House Party', 'Anniversary', 'Family Feast', 'Corporate Event'];
  const dates = ['Today Evening', 'Tomorrow', 'This Weekend', 'Pick a Date'];

  const handlePlanPartySubmit = () => {
    if (selectedItemIds.length === 0) {
      Alert.alert('Menu Required', 'Please select at least 2-3 dishes from our menu for your celebration.');
      return;
    }
    setConfirmationVisible(true);
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
          <Text style={styles.headerTitle}>Party Pack</Text>
          <Text style={styles.headerSubtitle}>Chefs for your celebrations</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO BANNER */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <PartyPopper size={12} color="#5F259F" />
            <Text style={styles.heroBadgeText}>PRIVATE EVENT DINING</Text>
          </View>
          <Text style={styles.heroTitle}>Live Chefs at Your Venue</Text>
          <Text style={styles.heroSubtitle}>
            1 or 2 verified executive chefs cook hot and fresh at your home or celebration venue using your ingredients. Clean kitchen guaranteed.
          </Text>

          <View style={styles.heroFeatureRow}>
            <View style={styles.heroFeaturePill}>
              <ChefHat size={14} color="#5F259F" />
              <Text style={styles.heroFeatureText}>{chefCount} Chef{chefCount > 1 ? 's' : ''} Allocated</Text>
            </View>
            <View style={styles.heroFeaturePill}>
              <Users size={14} color="#5F259F" />
              <Text style={styles.heroFeatureText}>Up to {guests} Guests</Text>
            </View>
          </View>
        </View>

        {/* 1. GUEST COUNT SELECTOR (UP TO 50 GUESTS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Users size={18} color="#5F259F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Number of Guests</Text>
              <Text style={styles.sectionSub}>Select guest count (up to 50 guests)</Text>
            </View>
            <View style={styles.guestCountDisplay}>
              <Text style={styles.guestCountDisplayText}>{guests}</Text>
              <Text style={styles.guestCountDisplayLabel}>Guests</Text>
            </View>
          </View>

          {/* Stepper Buttons */}
          <View style={styles.guestStepperRow}>
            {[5, 10, 15, 20, 30, 40, 50].map(count => (
              <TouchableOpacity
                key={count}
                style={[styles.guestPill, guests === count && styles.guestPillActive]}
                onPress={() => setGuests(count)}
                activeOpacity={0.8}
              >
                <Text style={[styles.guestPillText, guests === count && styles.guestPillTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Chef allocation alert */}
          <View style={styles.allocationNote}>
            <Info size={14} color="#5F259F" style={{ marginTop: 2, marginRight: 6 }} />
            <Text style={styles.allocationNoteText}>
              {guests <= 15 
                ? '1 Lead Chef is allocated for parties up to 15 guests.' 
                : '2 Professional Chefs (1 Lead Chef + 1 Sous Chef) are allocated for smooth service for 16–50 guests.'}
            </Text>
          </View>
        </View>

        {/* 2. OCCASION & DATE SELECTOR */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <Calendar size={18} color="#5F259F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Occasion & Timing</Text>
              <Text style={styles.sectionSub}>Choose your celebration type & date</Text>
            </View>
          </View>

          {/* Occasion types */}
          <Text style={styles.fieldLabel}>Type of Celebration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {occasions.map(occ => (
              <TouchableOpacity
                key={occ}
                style={[styles.chip, occasionType === occ && styles.chipActive]}
                onPress={() => setOccasionType(occ)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, occasionType === occ && styles.chipTextActive]}>{occ}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date types */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>When is the party?</Text>
          <View style={styles.datesGrid}>
            {dates.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dateCard, occasionDate === d && styles.dateCardActive]}
                onPress={() => setOccasionDate(d)}
                activeOpacity={0.8}
              >
                <Clock size={14} color={occasionDate === d ? '#5F259F' : '#64748B'} style={{ marginRight: 6 }} />
                <Text style={[styles.dateCardText, occasionDate === d && styles.dateCardTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. MENU BUILDER (~30 ITEMS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <ChefHat size={18} color="#5F259F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Select Celebration Menu</Text>
              <Text style={styles.sectionSub}>Choose from ~30 starters, mains & desserts</Text>
            </View>
          </View>

          {/* Selected Summary Pill Bar */}
          <View style={styles.selectedPillsRow}>
            <View style={styles.summaryBadge}>
              <Flame size={12} color="#EA580C" />
              <Text style={styles.summaryBadgeText}>{startersCount} Starters</Text>
            </View>
            <View style={styles.summaryBadge}>
              <ChefHat size={12} color="#5F259F" />
              <Text style={styles.summaryBadgeText}>{mainsCount} Mains</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Sparkles size={12} color="#C026D3" />
              <Text style={styles.summaryBadgeText}>{dessertsCount} Desserts</Text>
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.categoryTabsRow}>
            {(['all', 'starter', 'main', 'dessert'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.catTab, activeTab === tab && styles.catTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.catTabText, activeTab === tab && styles.catTabTextActive]}>
                  {tab === 'all' ? 'All (30)' : tab === 'starter' ? 'Starters' : tab === 'main' ? 'Mains' : 'Desserts'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Veg/Non-Veg Filter */}
          <View style={styles.vegToggleRow}>
            <TouchableOpacity 
              style={[styles.dietToggleBtn, vegFilter === 'all' && styles.dietToggleActive]}
              onPress={() => setVegFilter('all')}
            >
              <Text style={[styles.dietToggleText, vegFilter === 'all' && styles.dietToggleTextActive]}>All Dishes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dietToggleBtn, vegFilter === 'veg' && styles.dietToggleActiveVeg]}
              onPress={() => setVegFilter('veg')}
            >
              <View style={styles.vegDot} />
              <Text style={[styles.dietToggleText, vegFilter === 'veg' && { color: '#16A34A', fontWeight: '700' }]}>Pure Veg</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dietToggleBtn, vegFilter === 'non_veg' && styles.dietToggleActiveNonVeg]}
              onPress={() => setVegFilter('non_veg')}
            >
              <View style={styles.nonVegDot} />
              <Text style={[styles.dietToggleText, vegFilter === 'non_veg' && { color: '#DC2626', fontWeight: '700' }]}>Non-Veg</Text>
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <View style={styles.itemsList}>
            {filteredItems.map(item => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.dishItemCard, isSelected && styles.dishItemCardSelected]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.dishHeader}>
                    <View style={item.isVeg ? styles.vegBox : styles.nonVegBox}>
                      <View style={item.isVeg ? styles.vegInnerDot : styles.nonVegInnerDot} />
                    </View>
                    <Text style={styles.dishCategoryTag}>{item.category.toUpperCase()}</Text>
                  </View>

                  <Text style={[styles.dishName, isSelected && styles.dishNameSelected]}>
                    {item.name}
                  </Text>
                  <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>

                  <View style={styles.dishBottomRow}>
                    <View style={styles.ingredientsPill}>
                      <Text style={styles.ingredientsPillText}>Customer ingredients</Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected ? <Check size={14} color="#FFFFFF" /> : <Plus size={14} color="#64748B" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Instacome Party Pack Works</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>Choose your occasion, guest count up to 50, and customized multi-course menu.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>Receive an exact grocery checklist for your dishes or opt for assisted ingredient delivery.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>1–2 verified chefs arrive at your venue, prepare fresh courses live, and leave your kitchen spotless.</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING ACTION BAR: PLAN YOUR PARTY */}
      <View style={[styles.floatingBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.priceEstimate}>
          <Text style={styles.priceEstimateLabel}>Chef Service Fee ({chefCount} Chef{chefCount > 1 ? 's' : ''})</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceVal}>₹{baseChefFee.toLocaleString()}</Text>
            <Text style={styles.priceUnit}> / {guests} guests</Text>
          </View>
          <Text style={styles.selectedCountText}>{selectedItemIds.length} dishes chosen</Text>
        </View>

        <TouchableOpacity 
          style={styles.planPartyBtn}
          activeOpacity={0.88}
          onPress={handlePlanPartySubmit}
        >
          <Text style={styles.planPartyBtnText}>Plan Your Party</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRMATION / SUMMARY MODAL */}
      <Modal
        visible={confirmationVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Party Pack Summary</Text>
                <Text style={styles.modalSubtitle}>{occasionType} &bull; {occasionDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmationVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {bookingConfirmed ? (
              <View style={styles.confirmedBox}>
                <View style={styles.confirmedIconCircle}>
                  <CheckCircle2 size={40} color="#16A34A" />
                </View>
                <Text style={styles.confirmedTitle}>Party Plan Booked! 🎉</Text>
                <Text style={styles.confirmedSub}>
                  Your reservation for {guests} guests with {chefCount} chefs has been scheduled for {occasionDate}. An event coordinator will reach out shortly.
                </Text>

                <TouchableOpacity 
                  style={styles.confirmedDoneBtn}
                  onPress={() => {
                    setConfirmationVisible(false);
                    setBookingConfirmed(false);
                    router.push('/(tabs)/orders');
                  }}
                >
                  <Text style={styles.confirmedDoneBtnText}>View in My Bookings</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {/* Summary Details */}
                  <View style={styles.modalSummaryBox}>
                    <View style={styles.summaryDetailRow}>
                      <Text style={styles.summaryDetailLabel}>Celebration:</Text>
                      <Text style={styles.summaryDetailVal}>{occasionType}</Text>
                    </View>
                    <View style={styles.summaryDetailRow}>
                      <Text style={styles.summaryDetailLabel}>Occasion Date:</Text>
                      <Text style={styles.summaryDetailVal}>{occasionDate}</Text>
                    </View>
                    <View style={styles.summaryDetailRow}>
                      <Text style={styles.summaryDetailLabel}>Guest Count:</Text>
                      <Text style={styles.summaryDetailVal}>{guests} Guests ({chefCount} Chef{chefCount > 1 ? 's' : ''})</Text>
                    </View>
                    <View style={styles.summaryDetailRow}>
                      <Text style={styles.summaryDetailLabel}>Ingredients:</Text>
                      <Text style={styles.summaryDetailVal}>Customer-provided</Text>
                    </View>
                  </View>

                  {/* Selected Menu List */}
                  <Text style={styles.modalSectionHeading}>Selected Menu ({selectedItemIds.length} Dishes)</Text>
                  {selectedItemIds.map((id, index) => {
                    const item = PARTY_MENU_ITEMS.find(m => m.id === id);
                    if (!item) return null;
                    return (
                      <View key={id} style={styles.modalMenuItemRow}>
                        <Text style={styles.modalMenuIndex}>{index + 1}.</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalMenuName}>{item.name}</Text>
                          <Text style={styles.modalMenuCat}>{item.category.toUpperCase()} &bull; {item.isVeg ? 'Veg' : 'Non-Veg'}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Modal Footer CTA */}
                <View style={styles.modalFooter}>
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Estimated Chef Fare:</Text>
                    <Text style={styles.modalTotalAmount}>₹{baseChefFee.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.confirmPlanBtn}
                    onPress={() => setBookingConfirmed(true)}
                  >
                    <Text style={styles.confirmPlanBtnText}>Confirm Party Booking</Text>
                  </TouchableOpacity>
                </View>
              </>
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
    marginBottom: 14,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  heroFeatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F259F',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  guestCountDisplay: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  guestCountDisplayText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5F259F',
  },
  guestCountDisplayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  guestStepperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  guestPill: {
    width: 44,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestPillActive: {
    backgroundColor: '#5F259F',
    borderColor: '#5F259F',
  },
  guestPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  guestPillTextActive: {
    color: '#FFFFFF',
  },
  allocationNote: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 10,
    padding: 10,
  },
  allocationNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#5F259F',
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateCard: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateCardActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#5F259F',
  },
  dateCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dateCardTextActive: {
    color: '#5F259F',
    fontWeight: '700',
  },
  selectedPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  catTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  catTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  vegToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dietToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  dietToggleActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  dietToggleActiveVeg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  dietToggleActiveNonVeg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dietToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dietToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  nonVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  itemsList: {
    gap: 10,
  },
  dishItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  dishItemCardSelected: {
    borderColor: '#5F259F',
    backgroundColor: '#FAF5FF',
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vegBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  nonVegBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonVegInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  dishCategoryTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  dishNameSelected: {
    color: '#5F259F',
  },
  dishDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 8,
  },
  dishBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientsPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ingredientsPillText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#5F259F',
    borderColor: '#5F259F',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3E8FF',
    color: '#5F259F',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  priceEstimate: {
    flex: 1,
  },
  priceEstimateLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5F259F',
  },
  planPartyBtn: {
    backgroundColor: '#5F259F',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planPartyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Styles
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
    maxHeight: '85%',
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
  modalSummaryBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  modalMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalMenuIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F259F',
    width: 22,
  },
  modalMenuName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalMenuCat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  modalFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  confirmPlanBtn: {
    backgroundColor: '#5F259F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmedBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmedIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  confirmedSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  confirmedDoneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  confirmedDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
