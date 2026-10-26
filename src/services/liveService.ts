import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VERIFIED_PARTNER_CHEFS, VERIFIED_HOME_DISHES, resolveImageSource, PartnerChef } from '../data/verifiedPartners';

export interface LiveOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  providerName: string;
  isVeg: boolean;
}

export interface LiveOrder {
  id: string;
  customerId: string;
  providerId: string;
  providerName: string;
  status: 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  items: LiveOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  estimatedDeliveryMins: number;
}

export interface LiveChefBooking {
  id: string;
  customerId: string;
  customerName: string;
  chefId: string;
  chefName: string;
  chefImage: any;
  status: 'requested' | 'accepted' | 'completed' | 'cancelled';
  members: string;
  diet: string;
  cuisines: string[];
  timing: string;
  instructions?: string;
  eventAddress: string;
  totalAmount: number;
  createdAt: string;
  etaMins: number;
}

export interface LiveDish {
  id: string;
  providerId: string;
  providerName: string;
  dishName: string;
  price: number;
  isVeg: boolean;
  image: any;
  rating: number;
  distanceKm: number;
  portionsLeft: number;
  isActive: boolean;
}

const STORAGE_ORDERS_KEY = 'instacome_live_orders_v1';
const STORAGE_BOOKINGS_KEY = 'instacome_live_bookings_v1';
const STORAGE_DISHES_KEY = 'instacome_live_custom_dishes_v1';

class LiveService {
  // -------------------------------------------------------------
  // 1. ORDERS
  // -------------------------------------------------------------
  async placeOrder(orderData: {
    customerId: string;
    customerName: string;
    providerId: string;
    providerName: string;
    items: LiveOrderItem[];
    totalAmount: number;
    deliveryAddress: string;
  }): Promise<LiveOrder> {
    const newOrder: LiveOrder = {
      id: 'ord-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      customerId: orderData.customerId,
      providerId: orderData.providerId,
      providerName: orderData.providerName,
      status: 'preparing',
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      deliveryAddress: orderData.deliveryAddress,
      createdAt: new Date().toISOString(),
      estimatedDeliveryMins: 30,
    };

    // 1. Try to sync with Supabase
    try {
      await supabase.from('orders').insert([{
        id: newOrder.id,
        customer_id: orderData.customerId,
        provider_id: orderData.providerId,
        status: 'preparing',
        total_amount: orderData.totalAmount,
        delivery_address: orderData.deliveryAddress,
      }]);
    } catch (e) {
      console.log('Supabase order insert note:', e);
    }

    // 2. Persist in live storage
    try {
      const existing = await this.getStoredOrders();
      const updated = [newOrder, ...existing];
      await AsyncStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage error for live order:', e);
    }

    return newOrder;
  }

  async getCustomerOrders(customerId?: string): Promise<LiveOrder[]> {
    const stored = await this.getStoredOrders();
    
    // Also try to query Supabase orders if online
    if (customerId) {
      try {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (dbOrders && dbOrders.length > 0) {
          // Merge Supabase orders with stored orders (avoiding duplicates)
          const merged = [...stored];
          for (const dbO of dbOrders) {
            if (!merged.some(m => m.id === dbO.id)) {
              merged.push({
                id: dbO.id,
                customerId: dbO.customer_id,
                providerId: dbO.provider_id,
                providerName: 'Home Kitchen',
                status: dbO.status || 'preparing',
                items: [],
                totalAmount: Number(dbO.total_amount),
                deliveryAddress: dbO.delivery_address || 'Begur, Bengaluru',
                createdAt: dbO.created_at,
                estimatedDeliveryMins: 25,
              });
            }
          }
          return merged;
        }
      } catch (e) {
        // Fallback to stored
      }
    }

    return stored;
  }

  private async getStoredOrders(): Promise<LiveOrder[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ORDERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // 2. CHEF BOOKINGS
  // -------------------------------------------------------------
  async bookChef(bookingData: {
    customerId: string;
    customerName: string;
    chefId: string;
    chefName: string;
    chefImage: any;
    members: string;
    diet: string;
    cuisines: string[];
    timing: string;
    instructions?: string;
    eventAddress: string;
    totalAmount: number;
  }): Promise<LiveChefBooking> {
    const newBooking: LiveChefBooking = {
      id: 'bk-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      customerId: bookingData.customerId,
      customerName: bookingData.customerName,
      chefId: bookingData.chefId,
      chefName: bookingData.chefName,
      chefImage: bookingData.chefImage,
      status: 'accepted',
      members: bookingData.members,
      diet: bookingData.diet,
      cuisines: bookingData.cuisines,
      timing: bookingData.timing,
      instructions: bookingData.instructions,
      eventAddress: bookingData.eventAddress,
      totalAmount: bookingData.totalAmount,
      createdAt: new Date().toISOString(),
      etaMins: 28,
    };

    // 1. Try Supabase
    try {
      await supabase.from('chef_bookings').insert([{
        id: newBooking.id,
        customer_id: bookingData.customerId,
        chef_id: bookingData.chefId,
        status: 'accepted',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '19:30:00',
        event_address: bookingData.eventAddress,
        guest_count: parseInt(bookingData.members, 10) || 4,
        total_amount: bookingData.totalAmount,
      }]);
    } catch (e) {
      console.log('Supabase booking note:', e);
    }

    // 2. Persist in storage
    try {
      const existing = await this.getStoredBookings();
      const updated = [newBooking, ...existing];
      await AsyncStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage error for booking:', e);
    }

    return newBooking;
  }

  async getCustomerChefBookings(customerId?: string): Promise<LiveChefBooking[]> {
    return await this.getStoredBookings();
  }

  async getChefBookingsForDashboard(): Promise<LiveChefBooking[]> {
    const stored = await this.getStoredBookings();
    return stored;
  }

  async updateBookingStatus(bookingId: string, status: 'accepted' | 'completed' | 'cancelled'): Promise<void> {
    try {
      const stored = await this.getStoredBookings();
      const updated = stored.map(b => b.id === bookingId ? { ...b, status } : b);
      await AsyncStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Update booking status error:', e);
    }
  }

  private async getStoredBookings(): Promise<LiveChefBooking[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_BOOKINGS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // 3. DISHES & MENU ITEMS
  // -------------------------------------------------------------
  async getLiveDishes(): Promise<LiveDish[]> {
    try {
      // 1. Check custom dishes added by providers
      const customRaw = await AsyncStorage.getItem(STORAGE_DISHES_KEY);
      const customDishes: LiveDish[] = customRaw ? JSON.parse(customRaw) : [];

      // 2. Try Supabase menu_items if any
      const { data: dbItems } = await supabase
        .from('menu_items')
        .select('*, providers(business_name, rating)')
        .eq('is_active', true);

      const defaultVerified: LiveDish[] = VERIFIED_HOME_DISHES.map(v => ({
        id: v.id,
        providerId: 'provider-' + v.id,
        providerName: v.providerName,
        dishName: v.dishName,
        price: v.price,
        isVeg: v.isVeg,
        image: v.image,
        rating: v.rating,
        distanceKm: v.distanceKm,
        portionsLeft: v.portionsLeft,
        isActive: true,
      }));

      const fromDb: LiveDish[] = (dbItems && dbItems.length > 0) ? dbItems.map(d => ({
        id: d.id,
        providerId: d.provider_id,
        providerName: d.providers?.business_name || 'Home Kitchen',
        dishName: d.dish_name,
        price: Number(d.price),
        isVeg: !!d.is_veg,
        image: d.image_url ? { uri: d.image_url } : { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' },
        rating: 5.0,
        distanceKm: 1.2,
        portionsLeft: d.portions_left || 5,
        isActive: true,
      })) : [];

      const ids = new Set(customDishes.map(c => c.id));
      const merged = [...customDishes, ...fromDb.filter(f => !ids.has(f.id))];
      for (const m of merged) {
        ids.add(m.id);
      }
      return [...merged, ...defaultVerified.filter(v => !ids.has(v.id))];
    } catch {
      return VERIFIED_HOME_DISHES.map(v => ({
        id: v.id,
        providerId: 'provider-' + v.id,
        providerName: v.providerName,
        dishName: v.dishName,
        price: v.price,
        isVeg: v.isVeg,
        image: v.image,
        rating: v.rating,
        distanceKm: v.distanceKm,
        portionsLeft: v.portionsLeft,
        isActive: true,
      }));
    }
  }

  async addCustomDish(dish: {
    providerId: string;
    providerName: string;
    dishName: string;
    price: number;
    portions: number;
    isVeg: boolean;
  }): Promise<LiveDish> {
    const newDish: LiveDish = {
      id: 'dish-' + Date.now().toString(36),
      providerId: dish.providerId,
      providerName: dish.providerName,
      dishName: dish.dishName,
      price: dish.price,
      isVeg: dish.isVeg,
      image: { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' },
      rating: 5.0,
      distanceKm: 0.8,
      portionsLeft: dish.portions,
      isActive: true,
    };

    // 1. Try Supabase
    try {
      await supabase.from('menu_items').insert([{
        id: newDish.id,
        provider_id: dish.providerId,
        dish_name: dish.dishName,
        price: dish.price,
        portions_left: dish.portions,
        is_veg: dish.isVeg,
        is_active: true,
      }]);
    } catch (e) {
      console.log('Supabase menu item note:', e);
    }

    // 2. Persist in custom dishes
    try {
      const customRaw = await AsyncStorage.getItem(STORAGE_DISHES_KEY);
      const existing: LiveDish[] = customRaw ? JSON.parse(customRaw) : [];
      await AsyncStorage.setItem(STORAGE_DISHES_KEY, JSON.stringify([newDish, ...existing]));
    } catch (e) {
      console.error('Add custom dish storage error:', e);
    }

    return newDish;
  }

  async getCustomDishesForProvider(providerId?: string): Promise<LiveDish[]> {
    try {
      const customRaw = await AsyncStorage.getItem(STORAGE_DISHES_KEY);
      if (!customRaw) return [];
      const all: LiveDish[] = JSON.parse(customRaw);
      if (providerId) {
        return all.filter(d => d.providerId === providerId);
      }
      return all;
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // 4. CHEFS
  // -------------------------------------------------------------
  async getLiveChefs(): Promise<PartnerChef[]> {
    try {
      const { data: dbProviders } = await supabase
        .from('providers')
        .select('*')
        .eq('is_verified', true);

      if (dbProviders && dbProviders.length > 0) {
        return dbProviders
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
            distanceKm: 1.5,
            availableToday: p.is_online ?? true,
            startingPrice: Number(p.starting_price) || 499,
            image: { uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=400&auto=format&fit=crop' },
            lat: 12.8860,
            lng: 77.6215
          }));
      }

      const localChefRaw = await AsyncStorage.getItem('instacome_live_local_chefs_v1');
      const localChefs = localChefRaw ? JSON.parse(localChefRaw) : [];
      return localChefs;
    } catch {
      return [];
    }
  }

  async getChefById(id: string): Promise<PartnerChef | null> {
    const chefs = await this.getLiveChefs();
    return chefs.find(c => c.id === id) || null;
  }
}

export const liveService = new LiveService();
