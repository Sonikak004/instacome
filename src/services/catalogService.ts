import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PartnerChef, 
  PartnerDish, 
  resolveImageSource,
  VERIFIED_PARTNER_CHEFS,
  VERIFIED_HOME_DISHES
} from '../data/verifiedPartners';

const STORAGE_CUSTOM_DISHES = 'instacome_live_custom_dishes_v1';
const STORAGE_LOCAL_CHEFS = 'instacome_live_local_chefs_v1';

class CatalogService {
  /**
   * Returns live private chefs from Supabase and local live partner registrations.
   */
  async getLiveChefs(): Promise<PartnerChef[]> {
    try {
      // 1. Supabase verified chefs
      const { data: dbProviders } = await supabase
        .from('providers')
        .select('*')
        .eq('is_verified', true);

      const chefsFromDb: PartnerChef[] = (dbProviders || [])
        .filter(p => p.experience_years && p.experience_years > 0)
        .map(p => ({
          id: p.id,
          name: p.business_name,
          verified: true,
          rating: Number(p.rating) || 5.0,
          reviews: p.reviews_count || 1,
          experienceYears: p.experience_years || 2,
          cuisines: p.cuisines || ["Multi-Cuisine"],
          languages: ["English", "Hindi"],
          distanceKm: 1.2,
          availableToday: p.is_online ?? true,
          startingPrice: Number(p.starting_price) || 499,
          image: { uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=400&auto=format&fit=crop' },
          lat: 12.8860,
          lng: 77.6215
        }));

      // 2. Locally registered partner chefs
      const localChefRaw = await AsyncStorage.getItem(STORAGE_LOCAL_CHEFS);
      const localChefs: PartnerChef[] = localChefRaw ? JSON.parse(localChefRaw) : [];

      const ids = new Set(localChefs.map(c => c.id));
      const merged = [...localChefs, ...chefsFromDb.filter(c => !ids.has(c.id))];
      for (const m of merged) {
        ids.add(m.id);
      }
      return [...merged, ...VERIFIED_PARTNER_CHEFS.filter(c => !ids.has(c.id))];
    } catch {
      return VERIFIED_PARTNER_CHEFS;
    }
  }

  async getLiveChefById(id?: string): Promise<PartnerChef | null> {
    const all = await this.getLiveChefs();
    return all.find(c => c.id === id) || (all.length > 0 ? all[0] : null);
  }

  /**
   * Returns live fresh dishes:
   * Merges newly added kitchen dishes from the Partner Dashboard with Supabase menu items.
   */
  async getLiveDishes(): Promise<PartnerDish[]> {
    try {
      // 1. Check custom dishes added by live partner kitchens
      const customRaw = await AsyncStorage.getItem(STORAGE_CUSTOM_DISHES);
      const customDishes = customRaw ? JSON.parse(customRaw) : [];

      // 2. Fetch from Supabase menu_items if any
      const { data: dbItems } = await supabase
        .from('menu_items')
        .select('*, providers(business_name, rating)')
        .eq('is_active', true);

      const dbDishes: PartnerDish[] = (dbItems || []).map((d: any) => ({
        id: d.id,
        dishName: d.dish_name,
        providerName: d.providers?.business_name || "Home Kitchen",
        providerVerified: true,
        price: Number(d.price),
        distanceKm: 1.1,
        rating: 4.9,
        portionsLeft: d.portions_left || 4,
        isVeg: !!d.is_veg,
        image: d.image_url ? { uri: d.image_url } : { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' },
        readyTime: d.ready_time || "Ready Now",
        lat: 12.8835,
        lng: 77.6290
      }));

      // 3. Format custom dishes
      const formattedCustom: PartnerDish[] = customDishes.map((c: any) => ({
        id: c.id,
        dishName: c.dishName,
        providerName: c.providerName || "Verified Kitchen",
        providerVerified: true,
        price: c.price,
        distanceKm: 0.8,
        rating: 5.0,
        portionsLeft: c.portionsLeft || 5,
        isVeg: c.isVeg,
        image: c.image || { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' },
        readyTime: "Ready Now",
        lat: 12.8835,
        lng: 77.6290
      }));

      const ids = new Set(formattedCustom.map(c => c.id));
      const mergedDishes = [...formattedCustom, ...dbDishes.filter(d => !ids.has(d.id))];
      for (const m of mergedDishes) {
        ids.add(m.id);
      }
      return [...mergedDishes, ...VERIFIED_HOME_DISHES.filter(d => !ids.has(d.id))];
    } catch {
      return VERIFIED_HOME_DISHES;
    }
  }

  /**
   * Returns live home kitchens dynamically extracted from live dishes
   */
  async getLiveHomeKitchens() {
    const dishes = await this.getLiveDishes();
    const map = new Map<string, any>();

    for (const d of dishes) {
      if (!map.has(d.providerName)) {
        map.set(d.providerName, {
          id: 'kitchen-' + d.providerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: d.providerName,
          rating: d.rating,
          reviews: 8,
          distanceKm: d.distanceKm,
          cuisinesOrDish: d.dishName,
          priceText: `From ₹${d.price}`,
          isVeg: d.isVeg,
          image: d.image,
          verified: true,
          lat: d.lat || 12.8812,
          lng: d.lng || 77.6258,
          route: `/home-cook/${d.id}`
        });
      }
    }

    return Array.from(map.values());
  }
}

export const catalogService = new CatalogService();
export { resolveImageSource };
