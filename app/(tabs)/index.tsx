import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStorage } from '../../src/utils/userStorage';
import { 
  MapPin, 
  Star, 
  CheckCircle2, 
  ChefHat, 
  UtensilsCrossed,
  Plus, 
  ArrowRight, 
  ShoppingBag,
  Check,
  X
} from "lucide-react-native";
import { VERIFIED_PARTNER_CHEFS, PartnerChef, resolveImageSource } from "../../src/data/verifiedPartners";
import { catalogService } from "../../src/services/catalogService";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../src/context/CartContext";
import { useAuth } from "../../src/context/AuthContext";
import { liveService, LiveDish } from "../../src/services/liveService";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const AVAILABLE_LOCATIONS = [
  "Begur, Bengaluru",
  "HSR Layout, Bengaluru",
  "BTM Layout, Bengaluru",
  "Koramangala, Bengaluru",
  "Indiranagar, Bengaluru",
  "Electronic City, Bengaluru",
];

const HERO_BANNERS = [
  {
    id: "chefs",
    badge: "✦ CHEFS AT YOUR HOME",
    title: "Your next meal.\nExpertly prepared.",
    subtitle: "Book a verified private chef in your kitchen today.",
    btnText: "Explore chefs →",
    route: "/book-chef" as const,
    image: require("../../assets/mockup/1_chef_preparing_a_meal.webp"),
  },
  {
    id: "party",
    badge: "✦ CELEBRATIONS & EVENTS",
    title: "Hosting a party?\nWe cook the feast.",
    subtitle: "Custom multi-course menus for up to 50 guests.",
    btnText: "Plan party menu →",
    route: "/party-pack" as const,
    image: require("../../assets/mockup/4_party_pack.webp"),
  },
  {
    id: "home_cooks",
    badge: "✦ HOMEMADE SPECIALITIES",
    title: "Authentic food,\nfrom nearby kitchens.",
    subtitle: "Freshly prepared homemade dishes ready for pickup or delivery.",
    btnText: "Explore meals →",
    route: "/(tabs)/explore" as const,
    image: require("../../assets/mockup/3_home_cooks.webp"),
  },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { totalItems, totalPrice, items, addToCart } = useCart();
  const { session, profile, providerProfile, isLoading } = useAuth();
  
  const [popularFood, setPopularFood] = useState<LiveDish[]>([]);
  const [liveChefs, setLiveChefs] = useState<PartnerChef[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("Begur, Bengaluru");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  
  // Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);
  const touchStartX = useRef<number>(0);

  // Auto-scroll hero carousel across different services
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const isChef = profile?.role === 'chef' || profile?.role === 'home_cook' || (session?.user as any)?.user_metadata?.role === 'chef';

  useEffect(() => {
    if (isLoading) return;
    if (isChef) {
      const userId = session?.user?.id || profile?.id;
      if (providerProfile?.is_verified) {
        router.replace('/dashboard');
        return;
      }
      UserStorage.getAppStatus(userId).then((appStatus) => {
        if (appStatus === 'pending_review') {
          router.replace('/onboarding/review');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [session?.user?.id, isChef, providerProfile?.is_verified, isLoading]);

  if (isChef) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4C1D95" />
      </View>
    );
  }

  useFocusEffect(
    React.useCallback(() => {
      liveService.getLiveDishes().then(setPopularFood);
      catalogService.getLiveChefs().then(setLiveChefs);
    }, [])
  );

  const handleAddToCart = (food: any, e: any) => {
    e.stopPropagation();
    addToCart({
      id: food.id,
      name: food.dishName,
      price: food.price,
      quantity: 1,
      providerName: food.providerName,
      isVeg: food.isVeg
    });
  };

  const currentHero = HERO_BANNERS[heroIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 8) }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. IN-PAGE CLEAN HEADER (Location on Left, Big Logo on Extreme Right Edge) */}
        <View style={styles.inPageHeader}>
          <TouchableOpacity 
            style={styles.locationBtn} 
            activeOpacity={0.8}
            onPress={() => setLocationModalOpen(true)}
          >
            <Text style={styles.locationEyebrow}>YOUR LOCATION</Text>
            <Text style={styles.locationTitle}>{selectedLocation} ⌄</Text>
          </TouchableOpacity>

          <View style={styles.logoWrapper}>
            <Image 
              source={require("../../assets/logo.png")} 
              style={[
                styles.logo,
                { objectFit: "contain", objectPosition: "right center" } as any
              ]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 2. HERO AD BANNER (Swipable, Exact Same Size, Clear Image) */}
        <View style={styles.heroCarouselContainer}>
          <View 
            style={styles.heroSlideCard}
            onTouchStart={(e) => {
              touchStartX.current = e.nativeEvent.pageX;
            }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.nativeEvent.pageX;
              if (diff > 30) {
                // swiped left -> next
                setHeroIndex((prev) => (prev + 1) % HERO_BANNERS.length);
              } else if (diff < -30) {
                // swiped right -> prev
                setHeroIndex((prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
              }
            }}
          >
            <Image 
              source={currentHero.image} 
              style={styles.heroImg}
              resizeMode="cover"
            />
            {/* Real Smooth Linear Gradient Overlay */}
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#1E0B36" stopOpacity="1" />
                  <Stop offset="35%" stopColor="#1E0B36" stopOpacity="0.94" />
                  <Stop offset="58%" stopColor="#1E0B36" stopOpacity="0.55" />
                  <Stop offset="82%" stopColor="#1E0B36" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#1E0B36" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroGrad)" />
            </Svg>

            <View style={styles.heroContent}>
              <View style={styles.goldBadgeWrap}>
                <Text style={styles.goldBadgeText}>{currentHero.badge}</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>{currentHero.title}</Text>
              <Text style={styles.heroSub} numberOfLines={2}>{currentHero.subtitle}</Text>
              
              <TouchableOpacity 
                style={styles.heroCtaBtn}
                activeOpacity={0.88}
                onPress={() => router.push(currentHero.route as any)}
              >
                <Text style={styles.heroCtaBtnText}>{currentHero.btnText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Interactive Dots Pager */}
        <View style={styles.dotsRow} aria-hidden={true}>
          {HERO_BANNERS.map((_, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => setHeroIndex(i)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <View style={[styles.dot, heroIndex === i ? styles.dotActive : styles.dotInactive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. PARTNER CALLOUT STRIP (Placed BELOW the Ad Banner as requested!) */}
        <View style={styles.partnerStrip}>
          <View style={styles.partnerTextWrap}>
            <Text style={styles.partnerHeading}>Are you a Chef or Home Cook?</Text>
            <Text style={styles.partnerSub}>Offer your services on InstaCome.</Text>
          </View>
          <TouchableOpacity 
            style={styles.partnerBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "chef" } })}
          >
            <Text style={styles.partnerBtnText}>Join as partner ↗</Text>
          </TouchableOpacity>
        </View>

        {/* 4. "WHAT DO YOU NEED?" 2x2 CLEAN GRID WITH ATTRACTIVE BADGES */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionHeadingTitle}>What do you need?</Text>
            <Text style={styles.sectionHeadingSubtitle}>Explore InstaCome</Text>
          </View>

          <View style={styles.servicesGrid}>
            {/* ROW 1: Chef & Home Cooks */}
            <View style={styles.servicesRow}>
              {/* Tile 1: Chef */}
              <TouchableOpacity 
                style={styles.serviceCard} 
                activeOpacity={0.9}
                onPress={() => router.push("/book-chef")}
              >
                <View style={styles.cardPhotoWrapper}>
                  <Image 
                    source={require("../../assets/mockup/2_chef.webp")} 
                    style={styles.cardPhotoImg}
                    resizeMode="cover"
                  />
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>✦ AT HOME</Text>
                  </View>
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Private Chef</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>Professional cooking at your home kitchen.</Text>
                  <Text style={styles.cardActionLabel}>Book chef →</Text>
                </View>
              </TouchableOpacity>

              {/* Tile 2: Home Cooks */}
              <TouchableOpacity 
                style={styles.serviceCard} 
                activeOpacity={0.9}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <View style={styles.cardPhotoWrapper}>
                  <Image 
                    source={require("../../assets/mockup/3_home_cooks.webp")} 
                    style={styles.cardPhotoImg}
                    resizeMode="cover"
                  />
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>✦ FROM ₹99</Text>
                  </View>
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Home Cooks</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>Homemade meals from nearby kitchens.</Text>
                  <Text style={styles.cardActionLabel}>Explore kitchens →</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ROW 2: Party Pack & Chef Brand */}
            <View style={styles.servicesRow}>
              {/* Tile 3: Party Pack */}
              <TouchableOpacity 
                style={styles.serviceCard} 
                activeOpacity={0.9}
                onPress={() => router.push("/party-pack")}
              >
                <View style={styles.cardPhotoWrapper}>
                  <Image 
                    source={require("../../assets/mockup/4_party_pack.webp")} 
                    style={styles.cardPhotoImg}
                    resizeMode="cover"
                  />
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>✦ 10–50 GUESTS</Text>
                  </View>
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Party Pack</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>Chef-prepared menus for your gathering.</Text>
                  <Text style={styles.cardActionLabel}>Plan menu →</Text>
                </View>
              </TouchableOpacity>

              {/* Tile 4: Chef Brand */}
              <TouchableOpacity 
                style={styles.serviceCard} 
                activeOpacity={0.9}
                onPress={() => router.push("/chef-brand")}
              >
                <View style={styles.cardPhotoWrapper}>
                  <Image 
                    source={require("../../assets/mockup/5_chef_brand.webp")} 
                    style={styles.cardPhotoImg}
                    resizeMode="cover"
                  />
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>✦ VENTURES</Text>
                  </View>
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Chef Brand</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>Partner with a chef to build a food venture.</Text>
                  <Text style={styles.cardActionLabel}>Partner up →</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. OCCASION BANNER */}
        <TouchableOpacity 
          style={styles.occasionBanner}
          activeOpacity={0.9}
          onPress={() => router.push("/party-pack")}
        >
          <View style={styles.occasionLeft}>
            <Text style={styles.occasionEyebrow}>✦ FOR GATHERINGS & CELEBRATIONS</Text>
            <Text style={styles.occasionTitle}>Plan the food. Enjoy the party.</Text>
            <Text style={styles.occasionSub}>Special multi-course menus for up to 50 guests.</Text>
          </View>
          <View style={styles.occasionBtn}>
            <Text style={styles.occasionBtnText}>↗</Text>
          </View>
        </TouchableOpacity>

        {/* 6. VERIFIED PRIVATE CHEFS LIVE SECTION */}
        <View style={styles.liveSectionHeader}>
          <View>
            <Text style={styles.liveSectionTitle}>Verified Private Chefs</Text>
            <Text style={styles.liveSectionSub}>Professionals available near {selectedLocation.split(',')[0]}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/book-chef")}>
            <Text style={styles.liveSectionLink}>Book Chef</Text>
          </TouchableOpacity>
        </View>

        {liveChefs.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.horizontalScroll}
          >
            {liveChefs.map(chef => (
              <TouchableOpacity 
                key={chef.id} 
                style={styles.chefCard} 
                activeOpacity={0.88}
                onPress={() => router.push(`/book-chef/${chef.id}`)}
              >
                <View style={styles.chefImageWrapper}>
                  <Image source={resolveImageSource(chef.image)} style={styles.chefCardImage} />
                  <View style={styles.chefRatingBadge}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.chefRatingText}>{chef.rating}</Text>
                  </View>
                </View>

                <View style={styles.chefCardContent}>
                  <View style={styles.chefNameRow}>
                    <Text style={styles.chefCardName} numberOfLines={1}>{chef.name}</Text>
                    {chef.verified && (
                      <CheckCircle2 size={13} color="#16A34A" fill="#DCFCE7" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.chefCardCuisines} numberOfLines={1}>{chef.cuisines.slice(0, 2).join(", ")}</Text>
                  <Text style={styles.chefMetaText}>{chef.experienceYears} yrs exp • {chef.distanceKm} km</Text>

                  <View style={styles.chefStatusRow}>
                    <View style={styles.activeDot} />
                    <Text style={styles.availText}>Available today</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.liveEmptyBanner}>
            <View style={styles.liveEmptyIconCircle}>
              <ChefHat size={22} color="#4C1D95" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.liveEmptyTitle}>No Private Chefs Active in {selectedLocation.split(',')[0]}</Text>
              <Text style={styles.liveEmptySubtitle}>Live chefs become active for meal sessions daily.</Text>
              <TouchableOpacity 
                style={styles.liveEmptyCta} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "chef" } })}
              >
                <Text style={styles.liveEmptyCtaText}>Join as Partner Chef</Text>
                <ArrowRight size={13} color="#4C1D95" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 7. FRESH FROM HOME KITCHENS FOOD SECTION */}
        <View style={[styles.liveSectionHeader, { marginTop: 26 }]}>
          <View>
            <Text style={styles.liveSectionTitle}>Fresh From Home Kitchens</Text>
            <Text style={styles.liveSectionSub}>Authentic dishes cooked with love</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.liveSectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {popularFood.length > 0 ? (
          <View style={styles.foodGrid}>
            {popularFood.map(food => (
              <TouchableOpacity 
                key={food.id} 
                style={styles.foodCard} 
                activeOpacity={0.88}
                onPress={() => router.push(`/home-cook/${food.id}`)}
              >
                <View style={styles.foodImageContainer}>
                  <Image source={resolveImageSource(food.image)} style={styles.foodImage} />
                  
                  {/* Veg / Non-Veg Mark */}
                  <View style={[
                    styles.fssaiMark, 
                    { borderColor: food.isVeg ? '#16A34A' : '#DC2626' }
                  ]}>
                    <View style={[
                      styles.fssaiDot, 
                      { backgroundColor: food.isVeg ? '#16A34A' : '#DC2626' }
                    ]} />
                  </View>
                </View>

                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>{food.dishName}</Text>
                  <View style={styles.providerRow}>
                    <Text style={styles.providerName} numberOfLines={1}>{food.providerName}</Text>
                    <Text style={styles.ratingText}>★ {food.rating}</Text>
                  </View>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{food.price}</Text>
                    
                    <TouchableOpacity 
                      style={styles.addCartBtn}
                      activeOpacity={0.8}
                      onPress={(e) => handleAddToCart(food, e)}
                    >
                      <Plus size={12} color="#4C1D95" style={{ marginRight: 2 }} />
                      <Text style={styles.addCartBtnText}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.liveEmptyBanner}>
            <View style={styles.liveEmptyIconCircle}>
              <UtensilsCrossed size={22} color="#4C1D95" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.liveEmptyTitle}>No Home Kitchens Cooking Right Now</Text>
              <Text style={styles.liveEmptySubtitle}>Home cooks publish fresh slots daily for lunch and dinner.</Text>
              <TouchableOpacity 
                style={styles.liveEmptyCta} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "chef" } })}
              >
                <Text style={styles.liveEmptyCtaText}>Open Your Home Kitchen</Text>
                <ArrowRight size={13} color="#4C1D95" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 8. FOOTER WITH ENHANCED CONTRAST & COLOR */}
        <View style={styles.pageFooter}>
          <Text style={styles.pageFooterLeft}>InstaCome · Bengaluru</Text>
          <Text style={styles.pageFooterRight}>Chef services & homemade food</Text>
        </View>

      </ScrollView>

      {/* 9. FLOATING CART BAR */}
      {totalItems > 0 && (
        <View style={styles.cartBarContainer}>
          <TouchableOpacity 
            style={styles.cartBar} 
            activeOpacity={0.92}
            onPress={() => router.push("/cart")}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartIconWrapper}>
                <ShoppingBag size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cartBarItems}>{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</Text>
                <Text style={styles.cartBarProvider} numberOfLines={1}>{items[0]?.providerName}</Text>
              </View>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarPrice}>₹{totalPrice}</Text>
              <View style={styles.cartBarBtn}>
                <Text style={styles.cartBarBtnText}>View Cart</Text>
                <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 10. LOCATION PICKER MODAL */}
      <Modal
        visible={locationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalOpen(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setLocationModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>YOUR LOCATION</Text>
                <Text style={styles.modalTitle}>Choose your area</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setLocationModalOpen(false)}
              >
                <X size={18} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {AVAILABLE_LOCATIONS.map((loc) => {
                const isSelected = selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedLocation(loc);
                      setLocationModalOpen(false);
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <MapPin size={16} color={isSelected ? '#4C1D95' : '#7C3AED'} />
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                        {loc}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={18} color="#4C1D95" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  // 1. IN-PAGE CLEAN HEADER (Location on Left, Clean Balanced Logo on Right)
  inPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE9FE",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  logoWrapper: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  logo: {
    width: 68,
    height: 44,
  },
  locationBtn: {
    alignItems: "flex-start",
  },
  locationEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: "#7C3AED",
    marginBottom: 3,
    fontWeight: "800",
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E0B36",
  },

  // 2. SWIPABLE HERO AD BANNER (Exact same size 220px, swipable)
  heroCarouselContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#2E1065",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  heroSlideCard: {
    width: "100%",
    height: 220,
    backgroundColor: "#1E0B36",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
  },
  heroImg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "68%",
    height: "100%",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    padding: 22,
    maxWidth: "80%",
  },
  goldBadgeWrap: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  goldBadgeText: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: "#FBBF24",
    fontWeight: "900",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 28,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#E9D5FF",
    maxWidth: 185,
    marginBottom: 14,
  },
  heroCtaBtn: {
    backgroundColor: "#F59E0B",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  heroCtaBtnText: {
    color: "#1E0B36",
    fontSize: 10.5,
    fontWeight: "900",
  },

  // Dots Pager
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#4C1D95",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#DDD6FE",
  },

  // 3. PARTNER STRIP (Placed below hero ad banner)
  partnerStrip: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF5FF",
    borderLeftWidth: 3.5,
    borderLeftColor: "#4C1D95",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  partnerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  partnerHeading: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  partnerSub: {
    fontSize: 10,
    color: "#6B7280",
  },
  partnerBtn: {
    backgroundColor: "#4C1D95",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
  },
  partnerBtnText: {
    color: "#FDE68A",
    fontSize: 10.5,
    fontWeight: "700",
  },

  // 4. "WHAT DO YOU NEED?" 2x2 ROW-BASED GRID (Never goes horizontal off-screen!)
  servicesSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.6,
  },
  sectionHeadingSubtitle: {
    fontSize: 10,
    color: "#7C3AED",
    fontWeight: "700",
  },
  servicesGrid: {
    gap: 12,
  },
  servicesRow: {
    flexDirection: "row",
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    overflow: "hidden",
    shadowColor: "#4C1D95",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardPhotoWrapper: {
    width: "100%",
    height: 115,
    position: "relative",
    backgroundColor: "#FAF5FF",
  },
  cardPhotoImg: {
    width: "100%",
    height: "100%",
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(30, 11, 54, 0.85)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: "rgba(253, 230, 138, 0.5)",
  },
  cardBadgeText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  cardActionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4C1D95",
    marginTop: 6,
  },
  cardCopy: {
    minHeight: 82,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 10,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#6B7280",
  },

  // 5. OCCASION BANNER
  occasionBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  occasionLeft: {
    flex: 1,
  },
  occasionEyebrow: {
    fontSize: 8,
    letterSpacing: 1,
    color: "#B45309",
    fontWeight: "900",
    marginBottom: 4,
  },
  occasionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  occasionSub: {
    fontSize: 10.5,
    color: "#92400E",
  },
  occasionBtn: {
    backgroundColor: "#F59E0B",
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  occasionBtnText: {
    color: "#1E0B36",
    fontSize: 16,
    fontWeight: "900",
  },

  // 6. LIVE APP SECTIONS (Verified Chefs & Home Cooks)
  liveSectionHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 24,
    marginBottom: 12,
  },
  liveSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.4,
  },
  liveSectionSub: {
    fontSize: 11,
    color: "#7C3AED",
    marginTop: 2,
    fontWeight: "600",
  },
  liveSectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4C1D95",
  },

  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  chefCard: {
    width: 165,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    overflow: "hidden",
    marginRight: 12,
  },
  chefImageWrapper: {
    width: "100%",
    height: 115,
    position: "relative",
    backgroundColor: "#FAF5FF",
  },
  chefCardImage: {
    width: "100%",
    height: "100%",
  },
  chefRatingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(30, 11, 54, 0.8)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  chefRatingText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 3,
  },
  chefCardContent: {
    padding: 11,
    backgroundColor: "#FFFFFF",
  },
  chefNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  chefCardName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1E0B36",
    flex: 1,
  },
  chefCardCuisines: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  chefMetaText: {
    fontSize: 10.5,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  chefStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },
  availText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },

  // Food Grid
  foodGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  foodCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    overflow: "hidden",
    marginBottom: 12,
  },
  foodImageContainer: {
    width: "100%",
    height: 110,
    position: "relative",
    backgroundColor: "#FAF5FF",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  fssaiMark: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  fssaiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodInfo: {
    padding: 10,
  },
  foodName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E0B36",
    marginBottom: 2,
  },
  providerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  providerName: {
    fontSize: 10.5,
    color: "#6B7280",
    flex: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1E0B36",
  },
  addCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    borderWidth: 1.5,
    borderColor: "#4C1D95",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  addCartBtnText: {
    color: "#4C1D95",
    fontSize: 10.5,
    fontWeight: "800",
  },

  liveEmptyBanner: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    marginTop: 6,
  },
  liveEmptyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FAF5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  liveEmptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E0B36",
    marginBottom: 2,
  },
  liveEmptySubtitle: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
    marginBottom: 6,
  },
  liveEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  liveEmptyCtaText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4C1D95",
  },

  // 8. FOOTER WITH ENHANCED CONTRAST CONTAINER
  pageFooter: {
    marginHorizontal: 16,
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageFooterLeft: {
    fontSize: 10.5,
    color: "#4C1D95",
    fontWeight: "800",
  },
  pageFooterRight: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "500",
  },

  // Floating Cart Bar
  cartBarContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  cartBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E0B36",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3B0764",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cartBarItems: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cartBarProvider: {
    fontSize: 11,
    color: "#C4B5FD",
  },
  cartBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartBarPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FBBF24",
    marginRight: 10,
  },
  cartBarBtn: {
    backgroundColor: "#4C1D95",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  cartBarBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Location Picker Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(30, 11, 54, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    shadowColor: "#4C1D95",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 25,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E0B36",
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    gap: 8,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    backgroundColor: "#FAF5FF",
  },
  modalItemSelected: {
    borderColor: "#4C1D95",
    backgroundColor: "#EDE9FE",
  },
  modalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalItemText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1E0B36",
  },
  modalItemTextSelected: {
    color: "#4C1D95",
    fontWeight: "800",
  },
});
