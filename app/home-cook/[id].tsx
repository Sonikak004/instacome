import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform } from "react-native";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Star, MapPin } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../../src/context/CartContext";
import { resolveImageSource } from "../../src/data/verifiedPartners";
import { liveService, LiveDish } from "../../src/services/liveService";

export default function HomeCookProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState<LiveDish[]>([]);
  
  useEffect(() => {
    liveService.getLiveDishes().then(setMenuItems);
  }, []);

  const handleAdd = (food: any) => {
    addToCart({
      id: food.id,
      name: food.dishName,
      price: food.price,
      quantity: 1,
      providerName: food.providerName,
      isVeg: food.isVeg
    });
    router.push("/cart");
  };

  const currentDish = menuItems.find(m => m.id === id) || (menuItems.length > 0 ? menuItems[0] : null);
  const providerName = currentDish?.providerName || "Home Kitchen";

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/explore'))} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{providerName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.coverImageContainer}>
          <Image 
            source={currentDish?.image ? resolveImageSource(currentDish.image) : { uri: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop" }} 
            style={styles.coverImage} 
          />
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitial}>{providerName.charAt(0)}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.providerName}>{providerName}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.metaText}>{currentDish?.rating || 4.9} rating</Text>
            </View>
            <View style={styles.metaBadge}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.metaText}>{currentDish?.distanceKm || 1.1} km away</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Authentic home-cooked meals prepared with care and fresh ingredients daily in Begur.
          </Text>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Today's Menu</Text>
          
          {menuItems.length > 0 ? (
            menuItems.map(item => (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemInfo}>
                  <View style={[styles.fssaiSquare, item.isVeg ? styles.vegSquare : styles.nonVegSquare]}>
                    <View style={[styles.fssaiDot, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
                  </View>
                  <Text style={styles.dishName}>{item.dishName}</Text>
                  <Text style={styles.dishPrice}>₹{item.price}</Text>
                  <Text style={styles.dishDesc} numberOfLines={2}>
                    Freshly prepared {item.dishName} made with authentic ingredients.
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Image 
                    source={resolveImageSource(item.image)} 
                    style={styles.dishImage} 
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#64748B", fontSize: 13 }}>No active menu items right now.</Text>
            </View>
          )}
        </View>

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  backBtn: {
    padding: 4,
  },
  content: {
    backgroundColor: "#FAFAFA",
    flexGrow: 1,
  },
  coverImageContainer: {
    position: "relative",
    marginBottom: 40,
  },
  coverImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E7EB",
  },
  profileBadge: {
    position: "absolute",
    bottom: -30,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FAFAFA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#5F259F",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  providerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  fssaiSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
    marginBottom: 6,
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
  dishName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  dishDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  menuItemRight: {
    alignItems: "center",
  },
  dishImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginBottom: -16,
  },
  addBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#5F259F",
  }
});
