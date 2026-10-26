import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { List, Map as MapIcon, Star, Plus, UtensilsCrossed } from "lucide-react-native";
import { resolveImageSource } from "../../src/data/verifiedPartners";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../src/context/CartContext";
import { liveService, LiveDish } from "../../src/services/liveService";
import NearbyChefsMap from "../../src/components/NearbyChefsMap";

export default function Explore() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<"list" | "map">(params.view === 'map' ? 'map' : 'list');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [foodItems, setFoodItems] = useState<LiveDish[]>([]);
  
  useFocusEffect(
    useCallback(() => {
      liveService.getLiveDishes().then(setFoodItems);
    }, [])
  );

  const filters = ["All", "Pure Veg", "Non-Veg", "Biryani", "Thali", "Starters"];

  const filteredFood = foodItems.filter(food => {
    if (activeFilter === "Pure Veg") return food.isVeg;
    if (activeFilter === "Non-Veg") return !food.isVeg;
    if (activeFilter === "Biryani") return food.dishName.toLowerCase().includes("biryani");
    if (activeFilter === "Thali") return food.dishName.toLowerCase().includes("meals") || food.dishName.toLowerCase().includes("thali");
    if (activeFilter === "Starters") return food.dishName.toLowerCase().includes("kebab") || food.dishName.toLowerCase().includes("tikka");
    return true;
  });

  const handleAdd = (food: any) => {
    addToCart({
      id: food.id,
      name: food.dishName,
      price: food.price,
      quantity: 1,
      providerName: food.providerName,
      isVeg: food.isVeg
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.subtitle}>Verified Home Kitchens in Begur</Text>
          </View>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <List size={14} color={viewMode === 'list' ? '#0F172A' : '#64748B'} />
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.7}
            >
              <MapIcon size={14} color={viewMode === 'map' ? '#0F172A' : '#64748B'} />
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'list' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((f) => {
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                  onPress={() => setActiveFilter(f)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* CONTENT */}
      {viewMode === 'list' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredFood.length > 0 ? (
            <View style={styles.foodGrid}>
              {filteredFood.map((food) => (
                <TouchableOpacity 
                  key={food.id} 
                  style={styles.foodCard} 
                  activeOpacity={0.85}
                  onPress={() => router.push(`/home-cook/${food.id}`)}
                >
                  <View style={styles.foodImageContainer}>
                    <Image source={resolveImageSource(food.image)} style={styles.foodImage} />
                    {/* Official FSSAI Indian Veg / Non-Veg Indicator */}
                    <View style={styles.fssaiBadge}>
                      <View style={[styles.fssaiSquare, food.isVeg ? styles.vegSquare : styles.nonVegSquare]}>
                        <View style={[styles.fssaiDot, food.isVeg ? styles.vegDot : styles.nonVegDot]} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>{food.dishName}</Text>
                    <Text style={styles.providerName} numberOfLines={1}>by {food.providerName}</Text>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.ratingRow}>
                        <Star size={11} color="#0F172A" fill="#0F172A" />
                        <Text style={styles.ratingText}>{food.rating}</Text>
                      </View>
                      <Text style={styles.distanceText}>{food.distanceKm} km</Text>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{food.price}</Text>
                      <TouchableOpacity 
                        style={styles.addBtn}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAdd(food);
                        }}
                      >
                        <Text style={styles.addBtnText}>ADD</Text>
                        <Plus size={11} color="#5F259F" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.exploreEmptyContainer}>
              <View style={styles.exploreEmptyIconCircle}>
                <UtensilsCrossed size={36} color="#94A3B8" />
              </View>
              <Text style={styles.exploreEmptyTitle}>No Live Kitchen Dishes Right Now</Text>
              <Text style={styles.exploreEmptySub}>
                Verified home kitchens prepare food in limited fresh batches for lunch & dinner. Check back during meal prep hours.
              </Text>
              <TouchableOpacity 
                style={styles.exploreEmptyBtn}
                onPress={() => router.push("/onboarding?type=home_cook")}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreEmptyBtnText}>Cook & Sell from Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <NearbyChefsMap />
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  filterBadgeActive: {
    borderColor: "#0F172A",
    backgroundColor: "#0F172A",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  foodCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  foodImageContainer: {
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: 124,
    backgroundColor: "#F1F5F9",
  },
  fssaiBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFFFFF",
    padding: 4,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fssaiSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
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
  foodInfo: {
    padding: 10,
  },
  foodName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  providerName: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  distanceText: {
    fontSize: 11,
    color: "#64748B",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5F259F",
  },
  exploreEmptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
    marginHorizontal: 4,
  },
  exploreEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  exploreEmptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  exploreEmptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  exploreEmptyBtn: {
    backgroundColor: "#5F259F",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreEmptyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
