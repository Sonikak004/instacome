import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { generateUUID, isValidUUID, UserStorage } from '../utils/userStorage';

export interface Profile {
  id: string;
  role: 'customer' | 'home_cook' | 'chef' | 'admin';
  full_name: string;
  avatar_url?: string;
  phone?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  providerProfile: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAs: (
    role: 'customer' | 'chef' | 'home_cook', 
    details?: { name?: string; email?: string; isNewSignup?: boolean; id?: string }
  ) => Promise<void>;
  switchRole: (newRole: 'customer' | 'chef' | 'home_cook') => Promise<void>;
}

const STORAGE_ACTIVE_SESSION = 'instacome_active_session_v2';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerProfile, setProviderProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check Supabase Auth
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          setSession(sbSession);
          setUser(sbSession.user);
          await fetchProfile(sbSession.user.id);
          return;
        }

        // 2. Fallback to local session
        const rawLocal = await AsyncStorage.getItem(STORAGE_ACTIVE_SESSION);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (parsed?.session && parsed?.profile) {
            setSession(parsed.session);
            setUser(parsed.user);
            setProfile(parsed.profile);
            setProviderProfile(parsed.providerProfile || null);
          }
        }
      } catch (e) {
        console.warn("Auth initialization error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchProfile(newSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const pendingRole = await AsyncStorage.getItem('pending_signup_role');
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      let currentRole: 'customer' | 'chef' | 'home_cook' = (data?.role || pendingRole || 'customer') as any;

      if (data) {
        if (data.role === 'chef' || data.role === 'home_cook') {
          currentRole = data.role as any;
          await AsyncStorage.removeItem('pending_signup_role');
        } else if (pendingRole && pendingRole !== data.role) {
          await supabase.from('profiles').update({ role: pendingRole }).eq('id', userId);
          currentRole = pendingRole as any;
          await AsyncStorage.removeItem('pending_signup_role');
        }
        setProfile({ ...data, role: currentRole });
      } else {
        const newProfile: Profile = {
          id: userId,
          role: currentRole,
          full_name: user?.user_metadata?.full_name || ''
        };
        await supabase.from('profiles').upsert(newProfile);
        setProfile(newProfile);
      }

      // Check if provider record exists in database
      if (currentRole === 'chef' || currentRole === 'home_cook') {
        let provData: any = null;
        if (isValidUUID(userId)) {
          const { data } = await supabase
            .from('providers')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          provData = data;
        }
        
        setProviderProfile(provData || null);
        await AsyncStorage.removeItem('pending_signup_role');
      } else {
        setProviderProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * One-Tap Instant Role Login
   * Completely bypasses Supabase free tier email rate limits and creates a verified session.
   */
  const loginAs = async (
    role: 'customer' | 'chef' | 'home_cook',
    details?: { name?: string; email?: string; isNewSignup?: boolean; id?: string }
  ) => {
    setIsLoading(true);
    // Guarantees a valid RFC4122 v4 UUID so Postgres uuid primary keys never fail with 22P02
    const userId = details?.id && isValidUUID(details.id) ? details.id : generateUUID();
      
    const email = details?.email || (
      role === 'customer' 
        ? 'customer@instacome.app' 
        : role === 'chef' 
        ? 'chef.partner@instacome.app' 
        : 'homecook.partner@instacome.app'
    );
    
    const fullName = details?.name || (
      role === 'customer' 
        ? 'Rohan Mehta' 
        : role === 'chef' 
        ? 'Chef Partner' 
        : "Annapurna's Kitchen"
    );

    const mockUser: any = {
      id: userId,
      email: email,
      user_metadata: { full_name: fullName, role },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession: any = {
      access_token: 'local_token_' + userId,
      refresh_token: 'local_refresh_' + userId,
      expires_in: 3600000,
      token_type: 'bearer',
      user: mockUser,
    };

    const newProfile: Profile = {
      id: userId,
      role: role,
      full_name: fullName,
      phone: '+91 98765 43210',
    };

    // For brand-new chef signups, do NOT assume verified or onboarded yet!
    const providerData = (role !== 'customer' && !details?.isNewSignup) ? {
      id: userId,
      business_name: fullName,
      experience_years: role === 'chef' ? 4 : 2,
      starting_price: role === 'chef' ? 599 : 199,
      is_verified: true,
      is_online: true,
      rating: 4.9,
    } : null;

    // Persist session
    await AsyncStorage.setItem(STORAGE_ACTIVE_SESSION, JSON.stringify({
      session: mockSession,
      user: mockUser,
      profile: newProfile,
      providerProfile: providerData,
    }));

    if ((role === 'chef' || role === 'home_cook') && !details?.isNewSignup) {
      await AsyncStorage.setItem('onboarded_as_chef', role);
    } else {
      await AsyncStorage.removeItem('onboarded_as_chef');
    }

    // Best-effort sync to Supabase
    try {
      await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
      if (providerData) {
        await supabase.from('providers').upsert(providerData, { onConflict: 'id' });
      }
    } catch {}

    setSession(mockSession);
    setUser(mockUser);
    setProfile(newProfile);
    setProviderProfile(providerData);
    setIsLoading(false);
  };

  /**
   * Instantly switch role on the fly
   */
  const switchRole = async (newRole: 'customer' | 'chef' | 'home_cook') => {
    if (!profile) return;
    const updatedProfile: Profile = {
      ...profile,
      role: newRole,
    };

    const providerData = newRole !== 'customer' ? {
      id: profile.id,
      business_name: profile.full_name || (newRole === 'chef' ? 'Chef Partner' : 'Home Kitchen Partner'),
      experience_years: newRole === 'chef' ? 4 : 2,
      starting_price: newRole === 'chef' ? 599 : 199,
      is_verified: true,
      is_online: true,
      rating: 4.9,
    } : null;

    setProfile(updatedProfile);
    setProviderProfile(providerData);

    // Save locally
    const raw = await AsyncStorage.getItem(STORAGE_ACTIVE_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.profile = updatedProfile;
      parsed.providerProfile = providerData;
      await AsyncStorage.setItem(STORAGE_ACTIVE_SESSION, JSON.stringify(parsed));
    }

    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
      if (providerData) {
        await supabase.from('providers').upsert(providerData, { onConflict: 'id' });
      }
    } catch {}
  };

  const signOut = async () => {
    setProfile(null);
    setProviderProfile(null);
    setSession(null);
    setUser(null);
    await UserStorage.clearSessionData();
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        providerProfile,
        isLoading,
        signOut,
        refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
        loginAs,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
