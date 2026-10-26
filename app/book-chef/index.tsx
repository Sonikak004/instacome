import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Platform 
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  ChefHat, 
  Check, 
  Star, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  UtensilsCrossed
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogService } from "../../src/services/catalogService";
import { PartnerChef, resolveImageSource } from "../../src/data/verifiedPartners";
import { useAuth } from "../../src/context/AuthContext";
import { liveService } from "../../src/services/liveService";

export default function BookChef() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const params = useLocalSearchParams<{ type?: string }>();

  // Chef Service Choice: 'home_chef' vs 'private_chef'
  const [chefType, setChefType] = useState<"home_chef" | "private_chef">(
    params.type === 'private' || params.type === 'private_chef' ? 'private_chef' : 'home_chef'
  );

  // Booking Form State
  const [members, setMembers] = useState<string>("3 - 4 People");
  const [diet, setDiet] = useState<"veg" | "non_veg" | "both">("non_veg");
  const [cuisines, setCuisines] = useState<string[]>(
    params.type === 'private' || params.type === 'private_chef' 
      ? ["Biryani & Starters", "Continental & Italian"] 
      : ["North Indian Homestyle"]
  );
  const [mealTiming, setMealTiming] = useState<"now" | "dinner" | "lunch">("now");
  const [instructions, setInstructions] = useState<string>("");

  // Flow State: 'FORM' | 'MATCHING' | 'ASSIGNED'
  const [bookingState, setBookingState] = useState<"FORM" | "MATCHING" | "ASSIGNED">("FORM");
  const [countdown, setCountdown] = useState<number>(30);
  const [matchStatus, setMatchStatus] = useState<string>("Connecting with nearby chefs in Begur...");
  const [liveChefs, setLiveChefs] = useState<PartnerChef[]>([]);

  useEffect(() => {
    catalogService.getLiveChefs().then(setLiveChefs);
  }, []);

  // Assigned Chef from live queue
  const assignedChef = liveChefs.length > 0 ? liveChefs[0] : null;

  const baseFare = chefType === "home_chef" ? 299 : 599;

  const memberOptions = ["1 - 2 People", "3 - 4 People", "5 - 6 People", "7+ Event"];

  const homeChefCuisines = [
    { id: "North Indian Homestyle", label: "North Indian Homestyle", desc: "Phulka, Dal Tadka, Seasonal Sabzi & Rice" },
    { id: "South Indian Homestyle", label: "South Indian Homestyle", desc: "Sambar, Rasam, Curd Rice, Poriyal & Chapati" },
    { id: "Healthy & Diet", label: "Healthy & Diet Meals", desc: "Low oil, steamed meals, high-protein khichdi" },
    { id: "Homestyle Non-Veg", label: "Homestyle Non-Veg", desc: "Home-style chicken or egg curry & rice/roti" },
    { id: "Regional Thali", label: "Regional Indian Thali", desc: "Gujarati, Bengali, or Maharashtrian homestyle" },
  ];

  const privateChefCuisines = [
    { id: "Biryani & Starters", label: "Biryani & Starters", desc: "Dum Biryani, Kebabs, Tandoori Starters" },
    { id: "Continental & Italian", label: "Continental & Italian", desc: "Artisan Pasta, Baked Dishes, Gourmet Salads" },
    { id: "Mughlai & Royal Feast", label: "Mughlai & Royal Feast", desc: "Rich Gravies, Naan, Royal Pulao & Curries" },
    { id: "Pan-Asian & Indo-Chinese", label: "Pan-Asian & Indo-Chinese", desc: "Dim Sums, Hakka Noodles, Stir-Fried Gravies" },
    { id: "Celebration Multi-Course", label: "Celebration Multi-Course", desc: "Bespoke multi-course dinner & presentation" },
  ];

  const currentCuisines = chefType === "home_chef" ? homeChefCuisines : privateChefCuisines;

  const handleSelectChefType = (type: "home_chef" | "private_chef") => {
    setChefType(type);
    if (type === "home_chef") {
      setCuisines(["North Indian Homestyle"]);
    } else {
      setCuisines(["Biryani & Starters", "Continental & Italian"]);
    }
  };

  const toggleCuisine = (cId: string) => {
    if (cuisines.includes(cId)) {
      if (cuisines.length > 1) {
        setCuisines(cuisines.filter(c => c !== cId));
      }
    } else {
      setCuisines([...cuisines, cId]);
    }
  };

  const handleAssignChef = async () => {
    setBookingState("ASSIGNED");
    if (session) {
      try {
        await liveService.bookChef({
          customerId: session.user.id,
          customerName: profile?.full_name || session.user.email?.split('@')[0] || "Customer",
          chefId: assignedChef ? assignedChef.id : `on-demand-${chefType}`,
          chefName: assignedChef ? assignedChef.name : (chefType === "home_chef" ? "Verified Home Chef" : "Executive Private Chef"),
          chefImage: assignedChef ? assignedChef.image : { uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=400&auto=format&fit=crop' },
          members,
          diet: diet === "veg" ? "Pure Veg" : diet === "non_veg" ? "Non-Veg" : "Veg & Non-Veg",
          cuisines,
          timing: mealTiming === "now" ? "Immediate (30-45 mins)" : mealTiming === "dinner" ? "Tonight (7:30 - 9:00 PM)" : "Lunch (12:30 - 2:00 PM)",
          instructions,
          eventAddress: "Begur Main Road, Bengaluru",
          totalAmount: assignedChef ? assignedChef.startingPrice : baseFare,
        });
      } catch (e) {
        console.error("Live chef booking error:", e);
      }
    }
  };

  const handleStartBooking = () => {
    if (!session) {
      Alert.alert(
        "Sign In Required",
        `Please log in to request and book a verified ${chefType === "home_chef" ? "home chef" : "private chef"}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/(auth)/login") }
        ]
      );
      return;
    }
    setBookingState("MATCHING");
    setCountdown(12);
    setMatchStatus(`Scanning verified ${chefType === "home_chef" ? "home chefs" : "private chefs"} in Begur...`);
  };

  useEffect(() => {
    let timer: any;
    if (bookingState === "MATCHING") {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAssignChef();
            return 0;
          }
          if (prev === 10) setMatchStatus("Checking availability for " + members + "...");
          if (prev === 6) setMatchStatus(assignedChef ? `${assignedChef.name} reviewing your meal request...` : "Contacting verified private chefs in Begur...");
          if (prev === 3) {
            clearInterval(timer);
            handleAssignChef();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [bookingState, members, session]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity 
          onPress={() => {
            if (bookingState !== "FORM") {
              setBookingState("FORM");
            } else {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }
          }} 
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {bookingState === "FORM" 
              ? (chefType === "home_chef" ? "Book Home Chef" : "Book Private Chef")
              : bookingState === "MATCHING" 
                ? "Finding Chef..." 
                : (chefType === "home_chef" ? "Home Chef Confirmed" : "Private Chef Confirmed")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {bookingState === "FORM"
              ? (chefType === "home_chef" ? "Homestyle Cooking at Your Kitchen" : "Gourmet Culinary Experience")
              : "Begur, Bengaluru"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* 1. BOOKING REQUEST FORM */}
      {bookingState === "FORM" && (
        <>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* VALUE PROPOSITION STRIP */}
            <View style={styles.valueStrip}>
              <View style={styles.valueItem}>
                <ShieldCheck size={16} color="#5F259F" />
                <Text style={styles.valueText}>Verified Partners</Text>
              </View>
              <View style={styles.valueDot} />
              <View style={styles.valueItem}>
                <Clock size={16} color="#5F259F" />
                <Text style={styles.valueText}>Arrives in 30-45 Mins</Text>
              </View>
              <View style={styles.valueDot} />
              <View style={styles.valueItem}>
                <Sparkles size={16} color="#5F259F" />
                <Text style={styles.valueText}>Kitchen Cleaned</Text>
              </View>
            </View>

            {/* STEP 1: CHOOSE CHEF SERVICE */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Select Chef Service</Text>
                <Text style={styles.sectionHelper}>Choose experience type</Text>
              </View>

              <View style={styles.chefTypeContainer}>
                {/* 1. Home Chef */}
                <TouchableOpacity
                  style={[styles.chefTypeCard, chefType === "home_chef" && styles.chefTypeCardActive]}
                  onPress={() => handleSelectChefType("home_chef")}
                  activeOpacity={0.88}
                >
                  <View style={styles.chefTypeTop}>
                    <View style={[styles.chefTypeIconBox, chefType === "home_chef" && styles.chefTypeIconBoxActive]}>
                      <UtensilsCrossed size={20} color={chefType === "home_chef" ? "#5F259F" : "#64748B"} />
                    </View>
                    <View style={styles.chefTypeBadge}>
                      <Text style={styles.chefTypeBadgeText}>DAILY MEALS</Text>
                    </View>
                  </View>

                  <Text style={[styles.chefTypeTitle, chefType === "home_chef" && styles.chefTypeTitleActive]}>
                    Home Chef
                  </Text>
                  <Text style={styles.chefTypeSub}>
                    Wholesome daily meals. Phulka, dal tadka, seasonal sabzi, curd rice & regional cooking.
                  </Text>

                  <View style={styles.chefTypeFooter}>
                    <View>
                      <Text style={styles.chefTypePriceLabel}>SESSION FARE</Text>
                      <Text style={styles.chefTypePrice}>₹299 <Text style={styles.chefTypePriceSub}>base</Text></Text>
                    </View>
                    <View style={[styles.radioCircle, chefType === "home_chef" && styles.radioCircleActive]}>
                      {chefType === "home_chef" && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 2. Private Chef */}
                <TouchableOpacity
                  style={[styles.chefTypeCard, chefType === "private_chef" && styles.chefTypeCardActive]}
                  onPress={() => handleSelectChefType("private_chef")}
                  activeOpacity={0.88}
                >
                  <View style={styles.chefTypeTop}>
                    <View style={[styles.chefTypeIconBox, chefType === "private_chef" && styles.chefTypeIconBoxActive]}>
                      <ChefHat size={20} color={chefType === "private_chef" ? "#5F259F" : "#64748B"} />
                    </View>
                    <View style={[styles.chefTypeBadge, { backgroundColor: "#FEF3C7" }]}>
                      <Text style={[styles.chefTypeBadgeText, { color: "#B45309" }]}>GOURMET & PARTY</Text>
                    </View>
                  </View>

                  <Text style={[styles.chefTypeTitle, chefType === "private_chef" && styles.chefTypeTitleActive]}>
                    Private Chef
                  </Text>
                  <Text style={styles.chefTypeSub}>
                    5-star culinary master for parties, celebrations, gourmet multi-course & exquisite plating.
                  </Text>

                  <View style={styles.chefTypeFooter}>
                    <View>
                      <Text style={styles.chefTypePriceLabel}>SESSION FARE</Text>
                      <Text style={styles.chefTypePrice}>₹599 <Text style={styles.chefTypePriceSub}>base</Text></Text>
                    </View>
                    <View style={[styles.radioCircle, chefType === "private_chef" && styles.radioCircleActive]}>
                      {chefType === "private_chef" && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* STEP 2: PARTY SIZE */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Number of Guests</Text>
                <Text style={styles.sectionHelper}>Select group size</Text>
              </View>
              <View style={styles.pillRow}>
                {memberOptions.map(opt => {
                  const isSelected = members === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => setMembers(opt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 2: DIETARY PREFERENCE */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Dietary Preference</Text>
              </View>
              <View style={styles.dietRow}>
                {/* Pure Veg */}
                <TouchableOpacity
                  style={[styles.dietCard, diet === "veg" && styles.dietCardActive]}
                  onPress={() => setDiet("veg")}
                  activeOpacity={0.7}
                >
                  <View style={styles.fssaiVegBox}>
                    <View style={styles.fssaiVegDot} />
                  </View>
                  <Text style={[styles.dietCardTitle, diet === "veg" && styles.dietCardTitleActive]}>
                    Pure Veg
                  </Text>
                  <Text style={styles.dietCardDesc}>100% vegetarian</Text>
                </TouchableOpacity>

                {/* Non-Veg */}
                <TouchableOpacity
                  style={[styles.dietCard, diet === "non_veg" && styles.dietCardActive]}
                  onPress={() => setDiet("non_veg")}
                  activeOpacity={0.7}
                >
                  <View style={styles.fssaiNonVegBox}>
                    <View style={styles.fssaiNonVegDot} />
                  </View>
                  <Text style={[styles.dietCardTitle, diet === "non_veg" && styles.dietCardTitleActive]}>
                    Non-Veg
                  </Text>
                  <Text style={styles.dietCardDesc}>Chicken & meat</Text>
                </TouchableOpacity>

                {/* Veg & Non-Veg */}
                <TouchableOpacity
                  style={[styles.dietCard, diet === "both" && styles.dietCardActive]}
                  onPress={() => setDiet("both")}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
                    <View style={styles.fssaiVegBox}>
                      <View style={styles.fssaiVegDot} />
                    </View>
                    <View style={styles.fssaiNonVegBox}>
                      <View style={styles.fssaiNonVegDot} />
                    </View>
                  </View>
                  <Text style={[styles.dietCardTitle, diet === "both" && styles.dietCardTitleActive]}>
                    Both
                  </Text>
                  <Text style={styles.dietCardDesc}>Mixed menu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STEP 4: CUISINES */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Select Cuisines</Text>
                <Text style={styles.sectionHelper}>Multiple allowed</Text>
              </View>
              <View style={styles.cuisineContainer}>
                {currentCuisines.map(c => {
                  const isSelected = cuisines.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cuisineItem, isSelected && styles.cuisineItemActive]}
                      onPress={() => toggleCuisine(c.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <View style={styles.cuisineTextGroup}>
                        <Text style={[styles.cuisineName, isSelected && styles.cuisineNameActive]}>
                          {c.label}
                        </Text>
                        <Text style={styles.cuisineDesc}>{c.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 5: TIME WINDOW */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Chef Arrival Window</Text>
              </View>
              <View style={styles.timingRow}>
                <TouchableOpacity
                  style={[styles.timingCard, mealTiming === "now" && styles.timingCardActive]}
                  onPress={() => setMealTiming("now")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timingTitle, mealTiming === "now" && styles.timingTitleActive]}>
                    Immediate
                  </Text>
                  <Text style={styles.timingSub}>Arrives in 30–45 mins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timingCard, mealTiming === "dinner" && styles.timingCardActive]}
                  onPress={() => setMealTiming("dinner")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timingTitle, mealTiming === "dinner" && styles.timingTitleActive]}>
                    Tonight
                  </Text>
                  <Text style={styles.timingSub}>7:30 PM – 9:00 PM</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timingCard, mealTiming === "lunch" && styles.timingCardActive]}
                  onPress={() => setMealTiming("lunch")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timingTitle, mealTiming === "lunch" && styles.timingTitleActive]}>
                    Lunch
                  </Text>
                  <Text style={styles.timingSub}>12:30 PM – 2:00 PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STEP 6: NOTES */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cooking Preferences (Optional)</Text>
              <TextInput
                style={styles.instructionInput}
                placeholder="e.g. Less oil, medium spicy, kids friendly..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={instructions}
                onChangeText={setInstructions}
              />
            </View>

            {/* ADDRESS SUMMARY */}
            <View style={styles.addressBar}>
              <MapPin size={16} color="#0F172A" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.addressLabel}>SERVICE LOCATION</Text>
                <Text style={styles.addressValue} numberOfLines={1}>Begur Main Road, Bengaluru</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* STICKY BOTTOM ACTION BAR */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.bottomPriceCol}>
              <Text style={styles.bottomPriceLabel}>ESTIMATED FARE</Text>
              <Text style={styles.bottomPriceVal}>₹{baseFare} <Text style={styles.bottomPriceSub}>base</Text></Text>
            </View>
            <TouchableOpacity 
              style={styles.submitBtn} 
              activeOpacity={0.85} 
              onPress={handleStartBooking}
            >
              <Text style={styles.submitBtnText}>
                {chefType === "home_chef" ? "Request Home Chef" : "Request Private Chef"}
              </Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 2. MATCHING STATE */}
      {bookingState === "MATCHING" && (
        <View style={styles.matchingContainer}>
          <View style={styles.matchingCard}>
            <View style={styles.radarWrapper}>
              <View style={styles.radarRing} />
              <View style={styles.radarCenter}>
                {chefType === "home_chef" ? (
                  <UtensilsCrossed size={32} color="#FFFFFF" />
                ) : (
                  <ChefHat size={32} color="#FFFFFF" />
                )}
              </View>
            </View>

            <Text style={styles.matchingTitle}>
              {chefType === "home_chef" ? "Finding Your Home Chef" : "Finding Your Private Chef"}
            </Text>
            <Text style={styles.matchingSub}>{matchStatus}</Text>

            <View style={styles.timerBadge}>
              <Clock size={14} color="#5F259F" style={{ marginRight: 6 }} />
              <Text style={styles.timerNumber}>00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
            </View>
          </View>

          {/* REQUEST SUMMARY */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryHeader}>REQUEST SUMMARY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chef Service</Text>
              <Text style={styles.summaryVal}>
                {chefType === "home_chef" ? "Home Chef (Homestyle)" : "Private Chef (Gourmet)"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests</Text>
              <Text style={styles.summaryVal}>{members}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Preference</Text>
              <Text style={styles.summaryVal}>{diet === "veg" ? "Pure Veg" : diet === "non_veg" ? "Non-Veg" : "Both"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cuisines</Text>
              <Text style={styles.summaryVal} numberOfLines={1}>{cuisines.join(", ")}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryVal}>Begur, Bengaluru</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => setBookingState("FORM")}
          >
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. ASSIGNED STATE */}
      {bookingState === "ASSIGNED" && (
        <ScrollView contentContainerStyle={styles.assignedContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.assignedSuccessPill}>
            <ShieldCheck size={16} color="#16A34A" />
            <Text style={styles.assignedSuccessPillText}>
              {assignedChef 
                ? (chefType === "home_chef" ? "Home Chef Assigned & En Route" : "Private Chef Assigned & En Route")
                : (chefType === "home_chef" ? "Home Chef Request Queued" : "Private Chef Request Queued")}
            </Text>
          </View>

          <Text style={styles.assignedHeadline}>
            {assignedChef 
              ? (chefType === "home_chef" ? "Your Personal Home Cook is On the Way" : "Your 5-Star Private Chef is On the Way")
              : (chefType === "home_chef" ? "Home Chef Booking Dispatched" : "Private Chef Booking Dispatched")}
          </Text>
          <Text style={styles.assignedSubheadline}>
            {assignedChef 
              ? `${assignedChef.name} has accepted and is arriving at your kitchen in 28 mins.`
              : `Your request has been broadcasted to verified ${chefType === "home_chef" ? "home cooks" : "private chefs"} in Begur.`}
          </Text>

          {/* CHEF CARD */}
          {assignedChef ? (
            <View style={styles.assignedChefCard}>
              <Image source={resolveImageSource(assignedChef.image)} style={styles.assignedChefImage} />
              <View style={styles.assignedChefBody}>
                <View style={styles.assignedChefRow}>
                  <View>
                    <Text style={styles.assignedChefName}>{assignedChef.name}</Text>
                    <Text style={styles.assignedChefExp}>{assignedChef.experienceYears}+ years experience</Text>
                  </View>
                  <View style={styles.assignedRatingPill}>
                    <Star size={12} color="#0F172A" fill="#0F172A" />
                    <Text style={styles.assignedRatingText}>{assignedChef.rating}</Text>
                  </View>
                </View>

                <View style={styles.assignedCuisineRow}>
                  {assignedChef.cuisines.slice(0, 2).map((c, i) => (
                    <View key={i} style={styles.assignedCuisinePill}>
                      <Text style={styles.assignedCuisinePillText}>{c}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.etaBar}>
                  <Clock size={15} color="#0F172A" />
                  <Text style={styles.etaBarText}>Estimated Arrival: ~28 minutes</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.assignedChefCard, { padding: 20, alignItems: 'center' }]}>
              {chefType === "home_chef" ? (
                <UtensilsCrossed size={36} color="#5F259F" />
              ) : (
                <ChefHat size={36} color="#5F259F" />
              )}
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 10 }}>
                {chefType === "home_chef" ? "Live Home Chef Dispatch Active" : "Live Private Chef Dispatch Active"}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                {chefType === "home_chef"
                  ? "Your request has been broadcasted to verified local home cooks. A cook will accept and arrive with kitchen utensils."
                  : "Your on-demand booking has been broadcasted. A verified private chef will accept and arrive at your location."}
              </Text>
            </View>
          )}

          {/* ACTIONS */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.contactBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert("Calling Dispatch...", assignedChef ? `Connecting you to ${assignedChef.name}` : "Connecting to Chef Dispatch Support")}
            >
              <Phone size={16} color="#0F172A" />
              <Text style={styles.contactBtnText}>Call Chef</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert("Chat", assignedChef ? `Starting chat with ${assignedChef.name}` : "Connecting to Chef Dispatch Support")}
            >
              <MessageSquare size={16} color="#0F172A" />
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* URBAN COMPANY STYLE DETAILS CARD */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Booking Summary</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Service Tier</Text>
              <Text style={styles.detailsValue}>{chefType === "home_chef" ? "Home Chef (Homestyle)" : "Private Chef (Gourmet)"}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Guests</Text>
              <Text style={styles.detailsValue}>{members}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Preference</Text>
              <Text style={styles.detailsValue}>{diet === "veg" ? "Pure Veg" : diet === "non_veg" ? "Non-Veg" : "Veg & Non-Veg"}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Cuisines</Text>
              <Text style={styles.detailsValue}>{cuisines.join(", ")}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Kitchen Sanitization</Text>
              <Text style={[styles.detailsValue, { color: "#16A34A" }]}>Included</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Total Base Fare</Text>
              <Text style={[styles.detailsValue, { fontWeight: "700", color: "#0F172A" }]}>₹{baseFare}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.ordersNavBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/orders")}
          >
            <Text style={styles.ordersNavBtnText}>Track in Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.homeReturnBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.homeReturnBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  valueStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  valueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  sectionHelper: {
    fontSize: 12,
    color: "#64748B",
  },
  chefTypeContainer: {
    gap: 12,
  },
  chefTypeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chefTypeCardActive: {
    borderColor: "#5F259F",
    backgroundColor: "#FAF5FF",
    shadowColor: "#5F259F",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  chefTypeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chefTypeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  chefTypeIconBoxActive: {
    backgroundColor: "#EDE9FE",
  },
  chefTypeBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chefTypeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5F259F",
    letterSpacing: 0.3,
  },
  chefTypeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  chefTypeTitleActive: {
    color: "#5F259F",
  },
  chefTypeSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 17,
  },
  chefTypeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  chefTypePriceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.2,
  },
  chefTypePrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1,
  },
  chefTypePriceSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioCircleActive: {
    borderColor: "#5F259F",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5F259F",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  dietRow: {
    flexDirection: "row",
    gap: 10,
  },
  dietCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  dietCardActive: {
    borderColor: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  fssaiVegBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 3,
  },
  fssaiVegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#16A34A",
  },
  fssaiNonVegBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 3,
  },
  fssaiNonVegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#DC2626",
  },
  dietCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  dietCardTitleActive: {
    color: "#0F172A",
  },
  dietCardDesc: {
    fontSize: 11,
    color: "#64748B",
  },
  cuisineContainer: {
    gap: 8,
  },
  cuisineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
  },
  cuisineItemActive: {
    borderColor: "#5F259F",
    backgroundColor: "#FAF5FF",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: "#5F259F",
    borderColor: "#5F259F",
  },
  cuisineTextGroup: {
    flex: 1,
  },
  cuisineName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  cuisineNameActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  cuisineDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timingRow: {
    flexDirection: "row",
    gap: 8,
  },
  timingCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
  },
  timingCardActive: {
    borderColor: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  timingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 2,
  },
  timingTitleActive: {
    color: "#0F172A",
  },
  timingSub: {
    fontSize: 11,
    color: "#64748B",
  },
  instructionInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 70,
    marginTop: 6,
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomPriceCol: {
    justifyContent: "center",
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  bottomPriceVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  bottomPriceSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  submitBtn: {
    backgroundColor: "#5F259F",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  matchingContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  matchingCard: {
    alignItems: "center",
    marginBottom: 28,
  },
  radarWrapper: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  radarRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  radarCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  matchingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  matchingSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5F259F",
    fontVariant: ["tabular-nums"],
  },
  summaryContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  assignedContainer: {
    padding: 20,
    alignItems: "center",
  },
  assignedSuccessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  assignedSuccessPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  assignedHeadline: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  assignedSubheadline: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  assignedChefCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 14,
  },
  assignedChefImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  assignedChefBody: {
    padding: 16,
  },
  assignedChefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  assignedChefName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  assignedChefExp: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  assignedRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignedRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  assignedCuisineRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  assignedCuisinePill: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignedCuisinePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  etaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 8,
  },
  etaBarText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailsCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  detailsValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "65%",
    textAlign: "right",
  },
  ordersNavBtn: {
    backgroundColor: "#5F259F",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  ordersNavBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  homeReturnBtn: {
    paddingVertical: 10,
  },
  homeReturnBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
});
