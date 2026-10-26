import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  ChefHat, 
  UtensilsCrossed, 
  CheckCircle2, 
  User, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  MapPin, 
  Upload, 
  FileText, 
  Camera, 
  Info, 
  Calendar, 
  AlertCircle, 
  Edit3, 
  Plus, 
  X, 
  Check,
  ChevronDown,
  LogOut 
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUUID, isValidUUID, UserStorage } from '../../src/utils/userStorage';

const STORAGE_DRAFT_KEY = 'instacome_provider_onboarding_draft_v2';

interface DobDropdownProps {
  label: string;
  value: number | '';
  options: { label: string; value: number }[];
  placeholder: string;
  flex?: number;
  onChange: (val: number) => void;
}

const DobDropdown: React.FC<DobDropdownProps> = ({
  label,
  value,
  options,
  placeholder,
  flex = 1,
  onChange,
}) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'div',
      {
        style: {
          flex: flex,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: '10.5px',
            fontWeight: '800',
            color: '#64748B',
            marginBottom: '5px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          },
        },
        label
      ),
      React.createElement(
        'div',
        {
          style: {
            position: 'relative',
            width: '100%',
          },
        },
        React.createElement(
          'select',
          {
            value: value === '' ? '' : String(value),
            onChange: (e: any) => {
              const parsed = parseInt(e.target.value, 10);
              if (!isNaN(parsed)) onChange(parsed);
            },
            style: {
              width: '100%',
              height: '46px',
              padding: '0 26px 0 10px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '600',
              color: value !== '' ? '#0F172A' : '#94A3B8',
              outline: 'none',
              outlineStyle: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            },
            onFocus: (e: any) => {
              e.target.style.borderColor = '#4C1D95';
              e.target.style.backgroundColor = '#FFFFFF';
            },
            onBlur: (e: any) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.backgroundColor = '#F8FAFC';
            },
          },
          React.createElement('option', { value: '', disabled: true }, placeholder),
          options.map((opt) =>
            React.createElement(
              'option',
              {
                key: opt.value,
                value: String(opt.value),
                style: { color: '#0F172A', fontWeight: '500' },
              },
              opt.label
            )
          )
        ),
        // Dropdown Chevron Icon
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
          React.createElement(
            'svg',
            {
              width: '13',
              height: '13',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: '#64748B',
              strokeWidth: '2.5',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            React.createElement('path', { d: 'm6 9 6 6 6-6' })
          )
        )
      )
    );
  }

  // Fallback for native
  return (
    <View style={[styles.dobDropdownWrap, { flex }]}>
      <Text style={styles.dobDropdownLabel}>{label}</Text>
      <View style={styles.dobDropdownNativeBox}>
        <Text style={[styles.dobDropdownNativeVal, value === '' && styles.dobPickerPlaceholder]}>
          {value !== '' ? (options.find((o) => o.value === value)?.label || value) : placeholder}
        </Text>
        <ChevronDown size={14} color="#64748B" />
      </View>
    </View>
  );
};

export default function ProviderOnboardingWizard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, providerProfile, refreshProfile, signOut, isLoading } = useAuth();
  const params = useLocalSearchParams();

  // AUTH & ONBOARDING STATUS GUARD:
  // 1. Unauthenticated users must log in first (with chef pre-selected).
  // 2. Already verified chefs -> Dashboard.
  // 3. Already submitted applications -> Review screen.
  // 4. Only then (logged in & not onboarded) can the user access onboarding!
  useEffect(() => {
    if (isLoading) return;

    if (!session && !profile) {
      router.replace({ pathname: '/(auth)/login', params: { role: 'chef' } });
      return;
    }

    if (providerProfile?.is_verified) {
      router.replace('/dashboard');
      return;
    }

    const userId = session?.user?.id || profile?.id;
    if (userId) {
      UserStorage.getAppStatus(userId).then((appStatus) => {
        if (appStatus === 'pending_review') {
          router.replace('/onboarding/review');
        }
      });
    }
  }, [session, profile, providerProfile, isLoading]);

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out of your chef application?') : true;
      if (confirmed) {
        await signOut();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out of your chef application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  // Multi-step Wizard state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const s = parseInt(params.step as string, 10);
    return isNaN(s) ? 1 : Math.min(Math.max(s, 1), 5);
  });

  // STEP 1: Provider Type
  const [partnerType, setPartnerType] = useState<'chef' | 'home_cook'>(
    params.type === 'home_cook' ? 'home_cook' : 'chef'
  );

  // STEP 2: Basic Details (Both Roles)
  const [fullName, setFullName] = useState(() => {
    const raw = profile?.full_name?.trim();
    if (!raw || raw.toLowerCase() === 'instacome user' || raw.toLowerCase() === 'instacome member' || raw.toLowerCase() === 'chef partner') {
      return '';
    }
    return raw;
  });
  const [phone, setPhone] = useState(profile?.phone || '');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [dobDay, setDobDay] = useState<number | ''>(() => {
    if (dob) {
      const parts = dob.split('/');
      if (parts.length === 3) return parseInt(parts[0], 10) || '';
    }
    return '';
  });
  const [dobMonth, setDobMonth] = useState<number | ''>(() => {
    if (dob) {
      const parts = dob.split('/');
      if (parts.length === 3) return parseInt(parts[1], 10) || '';
    }
    return '';
  });
  const [dobYear, setDobYear] = useState<number | ''>(() => {
    if (dob) {
      const parts = dob.split('/');
      if (parts.length === 3) return parseInt(parts[2], 10) || '';
    }
    return '';
  });
  const [nativePlace, setNativePlace] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  // 18+ Boundary Reference based on today's exact date
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1 to 12
  const currentDay = today.getDate();
  const maxAllowedYear = currentYear - 18;

  // Available Years (18+ only as of today, e.g. 2008 down to 1950)
  const availableYears: number[] = [];
  for (let y = maxAllowedYear; y >= currentYear - 75; y--) {
    availableYears.push(y);
  }

  // Available Months (1 to currentMonth if boundary year selected, else 1-12)
  const availableMonths: number[] = [];
  const maxMonthForSelectedYear = (dobYear === maxAllowedYear) ? currentMonth : 12;
  for (let m = 1; m <= maxMonthForSelectedYear; m++) {
    availableMonths.push(m);
  }

  // Available Days (clamped by days in month & currentDay if boundary month/year selected)
  const daysInSelectedMonth = (dobYear && dobMonth)
    ? new Date(Number(dobYear), Number(dobMonth), 0).getDate()
    : (dobMonth ? new Date(2000, Number(dobMonth), 0).getDate() : 31);

  const maxDayForSelectedDate = (dobYear === maxAllowedYear && dobMonth === currentMonth)
    ? currentDay
    : daysInSelectedMonth;

  const availableDays: number[] = [];
  for (let d = 1; d <= maxDayForSelectedDate; d++) {
    availableDays.push(d);
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate age helper
  const calculateAge = (d: number, m: number, y: number) => {
    const birthDate = new Date(y, m - 1, d);
    let calculated = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculated--;
    }
    return calculated;
  };

  const handleDobChange = (newDay: number | '', newMonth: number | '', newYear: number | '') => {
    // If year is the boundary year (maxAllowedYear)
    if (newYear === maxAllowedYear) {
      if (newMonth !== '' && newMonth > currentMonth) {
        newMonth = currentMonth;
      }
      if (newMonth === currentMonth && newDay !== '' && newDay > currentDay) {
        newDay = currentDay;
      }
    }

    // If day exceeds days in month
    if (newMonth !== '' && newDay !== '') {
      const y = newYear !== '' ? newYear : 2000;
      const maxDays = new Date(y, newMonth, 0).getDate();
      if (newDay > maxDays) {
        newDay = maxDays;
      }
    }

    setDobDay(newDay);
    setDobMonth(newMonth);
    setDobYear(newYear);

    if (newDay !== '' && newMonth !== '' && newYear !== '') {
      const calculatedAge = calculateAge(newDay, newMonth, newYear);
      const formatted = `${String(newDay).padStart(2, '0')}/${String(newMonth).padStart(2, '0')}/${newYear}`;
      setDob(formatted);
      setAge(calculatedAge.toString());
    } else {
      setDob('');
      setAge('');
    }
  };

  // STEP 3: Cooking Profile
  // Professional Chef Fields
  const [chefExpYears, setChefExpYears] = useState('3-5 years');
  const [chefCuisines, setChefCuisines] = useState<string[]>(['North Indian', 'South Indian']);
  const [chefSpecialities, setChefSpecialities] = useState<string[]>(['Dum Biryani', 'Butter Chicken']);
  const [newChefSpeciality, setNewChefSpeciality] = useState('');
  const [chefDietPreferences, setChefDietPreferences] = useState<string[]>(['Vegetarian', 'Non-vegetarian']);
  const [openToPartyPack, setOpenToPartyPack] = useState(true);

  // Home Cook Fields
  const [kitchenName, setKitchenName] = useState('');
  const [homeCookExpYears, setHomeCookExpYears] = useState('4-7');
  const [homeCookCuisines, setHomeCookCuisines] = useState<string[]>(['South Indian', 'Homestyle Thali']);
  const [homeCookSpecialities, setHomeCookSpecialities] = useState<string[]>(['Fresh Idly & Sambar', 'Filter Coffee']);
  const [newHomeSpeciality, setNewHomeSpeciality] = useState('');
  const [homeDietCategories, setHomeDietCategories] = useState<string[]>(['Vegetarian', 'Vegan']);
  const [kitchenType, setKitchenType] = useState<'veg' | 'non_veg' | 'both'>('veg');
  const [dailyCapacity, setDailyCapacity] = useState('25 portions');
  const [mealTimes, setMealTimes] = useState<string[]>(['Lunch', 'Dinner']);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [fssaiExpiry, setFssaiExpiry] = useState('');
  const [fssaiCertDoc, setFssaiCertDoc] = useState<string | null>('FSSAI_Registration_2026.pdf');
  const [kitchenPhotos, setKitchenPhotos] = useState<string[]>(['Kitchen_Main_Counter.jpg']);

  // STEP 4: Location
  const [address, setAddress] = useState('Begur Main Road, Bengaluru');
  const [pincode, setPincode] = useState('560068');
  const [hasLocationPin, setHasLocationPin] = useState(true);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [pickupInstructions, setPickupInstructions] = useState('');

  // STEP 5: Consents
  const [consentVerification, setConsentVerification] = useState(true);
  const [consentTerms, setConsentTerms] = useState(true);

  const [loading, setLoading] = useState(false);

  // Load Saved Draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const userId = session?.user?.id || profile?.id;
        let draft = await UserStorage.getDraft(userId);
        if (!draft && !userId) {
          const saved = await AsyncStorage.getItem(STORAGE_DRAFT_KEY);
          if (saved) draft = JSON.parse(saved);
        }
        if (draft) {
          if (draft.partnerType) setPartnerType(draft.partnerType);
          if (draft.fullName) {
            const dName = draft.fullName.trim();
            if (dName && dName.toLowerCase() !== 'instacome user' && dName.toLowerCase() !== 'instacome member' && dName.toLowerCase() !== 'chef partner') {
              setFullName(dName);
            }
          }
          if (draft.phone) setPhone(draft.phone);
          if (draft.dob) {
            setDob(draft.dob);
            const parts = draft.dob.split('/');
            if (parts.length === 3) {
              const d = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              const y = parseInt(parts[2], 10);
              if (!isNaN(d)) setDobDay(d);
              if (!isNaN(m)) setDobMonth(m);
              if (!isNaN(y)) setDobYear(y);
            }
            if (draft.age) setAge(draft.age);
          } else if (draft.age) {
            setAge(draft.age);
          }
          if (draft.nativePlace) setNativePlace(draft.nativePlace);
          if (draft.languages) setLanguages(draft.languages);
          if (draft.profilePhotoUri) setProfilePhotoUri(draft.profilePhotoUri);

          // Chef
          if (draft.chefExpYears) setChefExpYears(draft.chefExpYears);
          if (draft.chefCuisines) setChefCuisines(draft.chefCuisines);
          if (draft.chefSpecialities) setChefSpecialities(draft.chefSpecialities);
          if (draft.chefDietPreferences) setChefDietPreferences(draft.chefDietPreferences);
          if (draft.openToPartyPack !== undefined) setOpenToPartyPack(draft.openToPartyPack);

          // Home cook
          if (draft.kitchenName) setKitchenName(draft.kitchenName);
          if (draft.homeCookExpYears) setHomeCookExpYears(draft.homeCookExpYears);
          if (draft.homeCookCuisines) setHomeCookCuisines(draft.homeCookCuisines);
          if (draft.homeCookSpecialities) setHomeCookSpecialities(draft.homeCookSpecialities);
          if (draft.homeDietCategories) setHomeDietCategories(draft.homeDietCategories);
          if (draft.kitchenType) setKitchenType(draft.kitchenType);
          if (draft.dailyCapacity) setDailyCapacity(draft.dailyCapacity);
          if (draft.mealTimes) setMealTimes(draft.mealTimes);
          if (draft.fssaiNumber) setFssaiNumber(draft.fssaiNumber);
          if (draft.fssaiExpiry) setFssaiExpiry(draft.fssaiExpiry);
          if (draft.fssaiCertDoc) setFssaiCertDoc(draft.fssaiCertDoc);
          if (draft.kitchenPhotos) setKitchenPhotos(draft.kitchenPhotos);

          // Location
          if (draft.address) setAddress(draft.address);
          if (draft.pincode) setPincode(draft.pincode);
          if (draft.hasLocationPin !== undefined) setHasLocationPin(draft.hasLocationPin);
          if (draft.serviceRadiusKm) setServiceRadiusKm(draft.serviceRadiusKm);
          if (draft.pickupAvailable !== undefined) setPickupAvailable(draft.pickupAvailable);
          if (draft.pickupInstructions) setPickupInstructions(draft.pickupInstructions);
        } else if (profile?.full_name) {
          const pName = profile.full_name.trim();
          if (pName && pName.toLowerCase() !== 'instacome user' && pName.toLowerCase() !== 'instacome member' && pName.toLowerCase() !== 'chef partner') {
            setFullName(pName);
          }
        }
      } catch (err) {
        console.warn('Failed to load onboarding draft:', err);
      }
    };
    loadDraft();
  }, [profile?.id, profile?.full_name]);

  // Auto-Save Draft on step change
  const autoSaveDraft = async () => {
    try {
      const draft = {
        partnerType,
        fullName,
        phone,
        dob,
        age,
        nativePlace,
        languages,
        profilePhotoUri,
        chefExpYears,
        chefCuisines,
        chefSpecialities,
        chefDietPreferences,
        openToPartyPack,
        kitchenName,
        homeCookExpYears,
        homeCookCuisines,
        homeCookSpecialities,
        homeDietCategories,
        kitchenType,
        dailyCapacity,
        mealTimes,
        fssaiNumber,
        fssaiExpiry,
        fssaiCertDoc,
        kitchenPhotos,
        address,
        pincode,
        hasLocationPin,
        serviceRadiusKm,
        pickupAvailable,
        pickupInstructions,
        lastUpdated: new Date().toISOString()
      };
      const userId = session?.user?.id || profile?.id;
      if (userId) {
        await UserStorage.setDraft(userId, draft);
      }
      await AsyncStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  };

  const handleNextStep = async () => {
    // Validation per step
    if (currentStep === 1) {
      // Step 1: Type selected
      await autoSaveDraft();
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Step 2: Basic details
      if (!fullName.trim()) {
        Alert.alert('Required Field', 'Please enter your full name.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!dob.trim() || !age) {
        Alert.alert('Required Field', 'Please enter your Date of Birth in DD/MM/YYYY format.');
        return;
      }
      const numAge = parseInt(age, 10);
      if (isNaN(numAge) || numAge < 18) {
        Alert.alert('Age Requirement', 'Applicants must be 18 years or older to partner with Instacome.');
        return;
      }
      if (!nativePlace.trim()) {
        Alert.alert('Required Field', 'Please enter your native town/city and state.');
        return;
      }
      if (languages.length === 0) {
        Alert.alert('Required Field', 'Please select at least one language you speak.');
        return;
      }
      await autoSaveDraft();
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      // Step 3: Cooking profile
      if (partnerType === 'chef') {
        if (chefCuisines.length === 0) {
          Alert.alert('Required Field', 'Please select at least one cuisine you cook.');
          return;
        }
        if (chefSpecialities.length === 0) {
          Alert.alert('Required Field', 'Please add at least one signature speciality dish.');
          return;
        }
        if (chefDietPreferences.length === 0) {
          Alert.alert('Required Field', 'Please select the dietary preferences you prepare.');
          return;
        }
      } else {
        // Home cook
        if (homeCookCuisines.length === 0) {
          Alert.alert('Required Field', 'Please select at least one cuisine offered.');
          return;
        }
        if (homeCookSpecialities.length === 0) {
          Alert.alert('Required Field', 'Please add at least one speciality dish.');
          return;
        }
      }
      await autoSaveDraft();
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      // Step 4: Location
      if (!address.trim()) {
        Alert.alert('Required Field', 'Please enter your complete address.');
        return;
      }
      if (!pincode.trim() || pincode.trim().length < 6) {
        Alert.alert('Required Field', 'Please enter a valid 6-digit postal pincode.');
        return;
      }
      await autoSaveDraft();
      setCurrentStep(5);
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      handleSignOut();
    }
  };

  // Helper for multi-select chips
  const toggleSelection = (list: string[], item: string, setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Add Speciality Tag
  const handleAddSpeciality = (isChef: boolean) => {
    if (isChef) {
      if (newChefSpeciality.trim() && !chefSpecialities.includes(newChefSpeciality.trim())) {
        setChefSpecialities([...chefSpecialities, newChefSpeciality.trim()]);
        setNewChefSpeciality('');
      }
    } else {
      if (newHomeSpeciality.trim() && !homeCookSpecialities.includes(newHomeSpeciality.trim())) {
        setHomeCookSpecialities([...homeCookSpecialities, newHomeSpeciality.trim()]);
        setNewHomeSpeciality('');
      }
    }
  };

  // SUBMIT APPLICATION (Final Step)
  const handleSubmitApplication = async () => {
    if (!consentVerification || !consentTerms) {
      Alert.alert('Consent Required', 'Please accept the verification consent and provider terms.');
      return;
    }

    setLoading(true);

    try {
      const userId = session?.user?.id || (profile?.id && isValidUUID(profile.id) ? profile.id : generateUUID());
      const providerBusinessName = partnerType === 'chef' 
        ? fullName.trim() 
        : (kitchenName.trim() || `${fullName.trim()}'s Kitchen`);

      // 1. Update Profile Role
      try {
        const { error: profError } = await supabase.from('profiles').upsert({
          id: userId,
          role: partnerType,
          full_name: fullName.trim(),
          phone: phone.trim(),
        }, { onConflict: 'id' });
        if (profError) {
          console.warn('Profile Supabase upsert result:', profError.message);
        }
      } catch (err) {
        console.warn('Profile upsert fallback:', err);
      }

      // 2. Prepare Provider Record with STRICT PENDING REVIEW status
      const providerRecord = {
        id: userId,
        business_name: providerBusinessName,
        description: partnerType === 'chef'
          ? `${chefExpYears} yrs exp. Speciality: ${chefSpecialities.join(', ')}`
          : `Fresh homemade meals. Speciality: ${homeCookSpecialities.join(', ')}. Capacity: ${dailyCapacity}`,
        cuisines: partnerType === 'chef' ? chefCuisines : homeCookCuisines,
        starting_price: partnerType === 'chef' ? 499 : 149,
        experience_years: partnerType === 'chef' ? (parseInt(chefExpYears) || 3) : (parseInt(homeCookExpYears) || 4),
        service_radius_km: serviceRadiusKm,
        address: `${address.trim()}, Pincode: ${pincode.trim()}`,
        is_verified: false, // NOT verified until admin approves!
        is_online: false,   // Strictly offline until approved!
      };

      try {
        const { error: provError } = await supabase.from('providers').upsert(providerRecord, { onConflict: 'id' });
        if (provError) {
          console.warn('Provider Supabase upsert result:', provError.message);
        }
      } catch (err) {
        console.warn('Provider upsert fallback:', err);
      }

      // 3. Persist Full Application Metadata in Local Cache for Dashboard & Review
      const applicationPayload = {
        userId,
        partnerType,
        providerBusinessName,
        status: 'pending_review',
        is_verified: false,
        is_online: false,
        submittedAt: new Date().toISOString(),
        fullName: fullName.trim(),
        email: session?.user?.email || undefined,
        phone: phone.trim(),
        age,
        nativePlace,
        languages,
        profilePhotoUri: profilePhotoUri || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=300',
        chefData: partnerType === 'chef' ? {
          experienceYears: chefExpYears,
          cuisines: chefCuisines,
          specialities: chefSpecialities,
          dietPreferences: chefDietPreferences,
          openToPartyPack
        } : null,
        homeCookData: partnerType === 'home_cook' ? {
          kitchenName: kitchenName.trim(),
          experienceYears: homeCookExpYears,
          cuisines: homeCookCuisines,
          specialities: homeCookSpecialities,
          dietCategories: homeDietCategories,
          kitchenType,
          dailyCapacity,
          mealTimes,
          fssaiNumber,
          fssaiExpiry,
          fssaiCertDoc,
          kitchenPhotos
        } : null,
        location: {
          address,
          pincode,
          serviceRadiusKm: partnerType === 'chef' ? serviceRadiusKm : undefined,
          pickupAvailable: partnerType === 'home_cook' ? pickupAvailable : undefined,
          pickupInstructions: partnerType === 'home_cook' ? pickupInstructions : undefined,
        }
      };

      // Save scoped to this specific user ID
      await UserStorage.setSubmittedApplication(userId, applicationPayload);
      await UserStorage.setAppStatus(userId, 'pending_review');
      await UserStorage.clearDraft(userId);
      await AsyncStorage.setItem('onboarded_as_chef', partnerType);

      await refreshProfile();

      // Show immediate confirmation message requested by user, then route to review status
      Alert.alert(
        'Application Submitted! 📋',
        'Our team will review your details and contact you for verification. You’ll be notified once your application is approved.',
        [
          {
            text: 'View Review Status',
            onPress: () => router.replace('/onboarding/review')
          }
        ]
      );
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Notice', 'Application details recorded! Moving to verification status...');
      router.replace('/onboarding/review');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Choose Provider Type',
    'Basic Details',
    partnerType === 'chef' ? 'Culinary Profile' : 'Kitchen & Cooking Profile',
    partnerType === 'chef' ? 'Service Location' : 'Kitchen Location & Pickup',
    'Review & Submit'
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* TOP HEADER: Instacome Logo on Left, Step in Center, Log Out on Right (No Back Button at Top) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLogoWrap}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.stepCounterText}>Step {currentStep} of 5</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{stepTitles[currentStep - 1]}</Text>
        </View>

        <TouchableOpacity 
          onPress={handleSignOut}
          style={styles.headerLogoutBtn}
          activeOpacity={0.8}
        >
          <LogOut size={13} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.headerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* 5-STEP PROGRESS BAR */}
      <View style={styles.progressBarContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View 
            key={s} 
            style={[
              styles.progressSegment, 
              s <= currentStep ? styles.progressSegmentActive : styles.progressSegmentInactive
            ]} 
          />
        ))}
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          currentStep === 1 && styles.scrollContentStep1
        ]} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ========================================================
            STEP 1: CHOOSE OPERATOR TYPE (Single Screen - Fills Page, No Scroll)
            ======================================================== */}
        {currentStep === 1 && (
          <View style={styles.step1Container}>
            <View style={styles.step1Header}>
              <Text style={styles.heroTitleCompact}>Choose Operator Type</Text>
              <Text style={styles.heroSubCompact}>
                How would you like to join and cook on Instacome?
              </Text>
            </View>

            <View style={styles.operatorCardsContainer}>
              {/* Card 1: Professional Chef with Edge-to-Edge AI Photo */}
              <TouchableOpacity
                style={[
                  styles.operatorCard,
                  partnerType === 'chef' ? styles.operatorCardActiveChef : styles.operatorCardInactive
                ]}
                activeOpacity={0.88}
                onPress={() => setPartnerType('chef')}
              >
                {/* AI-Generated Photo filling the card edge-to-edge */}
                <Image 
                  source={require('../../assets/images/chef_cooking_home.jpg')}
                  style={styles.operatorCardCoverImg}
                  resizeMode="cover"
                />

                {/* Role Details Mentioned Next To It */}
                <View style={[
                  styles.operatorTextWrap,
                  partnerType === 'chef' && styles.operatorTextWrapActiveChef
                ]}>
                  <View style={styles.operatorTitleRow}>
                    <Text style={styles.operatorTitle}>Professional Chef</Text>
                    <View style={[styles.radioCircle, partnerType === 'chef' && styles.radioCircleActive]}>
                      {partnerType === 'chef' && <View style={styles.radioDot} />}
                    </View>
                  </View>

                  <Text style={styles.operatorQuote}>
                    Visit customers’ homes and cook fresh private meals & parties.
                  </Text>

                  <View style={styles.operatorPillsRow}>
                    <View style={styles.operatorPill}>
                      <ChefHat size={11} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={styles.operatorPillText}>In-Home Dining</Text>
                    </View>
                    <View style={styles.operatorPill}>
                      <Sparkles size={11} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={styles.operatorPillText}>Party Packs (Up to 50)</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 2: Home Cook with Edge-to-Edge AI Photo */}
              <TouchableOpacity
                style={[
                  styles.operatorCard,
                  partnerType === 'home_cook' ? styles.operatorCardActiveHome : styles.operatorCardInactive
                ]}
                activeOpacity={0.88}
                onPress={() => setPartnerType('home_cook')}
              >
                {/* AI-Generated Photo filling the card edge-to-edge */}
                <Image 
                  source={require('../../assets/images/home_cook_prepared_food.jpg')}
                  style={styles.operatorCardCoverImg}
                  resizeMode="cover"
                />

                {/* Role Details Mentioned Next To It */}
                <View style={[
                  styles.operatorTextWrap,
                  partnerType === 'home_cook' && styles.operatorTextWrapActiveHome
                ]}>
                  <View style={styles.operatorTitleRow}>
                    <Text style={styles.operatorTitle}>Home Cook</Text>
                    <View style={[styles.radioCircle, partnerType === 'home_cook' && styles.radioCircleActiveHome]}>
                      {partnerType === 'home_cook' && <View style={[styles.radioDot, { backgroundColor: '#C026D3' }]} />}
                    </View>
                  </View>

                  <Text style={styles.operatorQuote}>
                    Prepare food in your kitchen and sell portions to nearby customers.
                  </Text>

                  <View style={styles.operatorPillsRow}>
                    <View style={[styles.operatorPill, { backgroundColor: '#FDF4FF', borderColor: '#F5D0FE' }]}>
                      <UtensilsCrossed size={11} color="#C026D3" style={{ marginRight: 4 }} />
                      <Text style={[styles.operatorPillText, { color: '#86198F' }]}>Home Kitchen</Text>
                    </View>
                    <View style={[styles.operatorPill, { backgroundColor: '#FDF4FF', borderColor: '#F5D0FE' }]}>
                      <Clock size={11} color="#C026D3" style={{ marginRight: 4 }} />
                      <Text style={[styles.operatorPillText, { color: '#86198F' }]}>Pickup & Delivery</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================
            STEP 2: BASIC DETAILS (Both Roles)
            ======================================================== */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Tell us about yourself</Text>
            <Text style={styles.heroSub}>
              These details are verified for customer safety and used on your partner badge.
            </Text>

            {/* Profile Photo Uploader */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                <Image 
                  source={{ 
                    uri: profilePhotoUri || (partnerType === 'chef' 
                      ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=240&auto=format&fit=crop'
                      : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=240&auto=format&fit=crop')
                  }}
                  style={styles.avatarImg}
                />
                <TouchableOpacity 
                  style={styles.avatarCameraBtn}
                  onPress={() => {
                    setProfilePhotoUri('https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=300');
                    Alert.alert('Photo Updated', 'Profile photo successfully selected.');
                  }}
                >
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.fieldLabel}>Profile Photo <Text style={styles.reqStar}>*</Text></Text>
                <Text style={styles.fieldSub}>Clear, friendly portrait for customer verification.</Text>
                <TouchableOpacity 
                  style={styles.uploadSmallBtn}
                  onPress={() => {
                    setProfilePhotoUri('https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=300');
                    Alert.alert('Upload Photo', 'Photo selected from gallery.');
                  }}
                >
                  <Upload size={14} color="#4C1D95" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadSmallBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Full Name <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.inputWrap}>
                <User size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full legal name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.fieldNote}>Legal name for partner verification and customer invoices.</Text>
            </View>

            {/* Mobile Number (No Verify Button) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Mobile Number <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.phoneInput]}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <Text style={styles.fieldNote}>Used for order alerts and booking coordination.</Text>
            </View>

            {/* Date of Birth Picker (Simple on-page picker: Date, Month 1-12, Year 18+ only) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Date of Birth (DOB) <Text style={styles.reqStar}>*</Text></Text>
                {age ? (
                  <View style={styles.ageBadgeValid}>
                    <Text style={styles.ageBadgeTextValid}>
                      Age: {age} yrs ✓
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* 3 Simple Inline Dropdowns: Date | Month (1-12) | Year (18+ Only) */}
              <View style={styles.dobPickersRow}>
                <DobDropdown
                  label="Date"
                  placeholder="Day"
                  value={dobDay}
                  options={availableDays.map((d) => ({
                    label: String(d).padStart(2, '0'),
                    value: d,
                  }))}
                  flex={1}
                  onChange={(d) => handleDobChange(d, dobMonth, dobYear)}
                />

                <DobDropdown
                  label="Month (1-12)"
                  placeholder="Month"
                  value={dobMonth}
                  options={availableMonths.map((m) => ({
                    label: `${m} - ${monthNames[m - 1]}`,
                    value: m,
                  }))}
                  flex={1.25}
                  onChange={(m) => handleDobChange(dobDay, m, dobYear)}
                />

                <DobDropdown
                  label="Year (18+)"
                  placeholder="Year"
                  value={dobYear}
                  options={availableYears.map((y) => ({
                    label: String(y),
                    value: y,
                  }))}
                  flex={1.1}
                  onChange={(y) => handleDobChange(dobDay, dobMonth, y)}
                />
              </View>

              {dob ? (
                <Text style={styles.fieldNote}>
                  Selected DOB: {dob} ({age} years old as of today).
                </Text>
              ) : null}
            </View>

            {/* Native Place */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Native Place <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.inputWrap}>
                <MapPin size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={nativePlace}
                  onChangeText={setNativePlace}
                  placeholder="e.g. Udupi, Karnataka or Lucknow, UP"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.fieldNote}>Town / City and State.</Text>
            </View>

            {/* Languages Spoken */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Languages Spoken (Multi-select) <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsContainer}>
                {[
                  'English',
                  'Hindi',
                  'Kannada',
                  'Tamil',
                  'Telugu',
                  'Malayalam',
                  'Marathi',
                  'Bengali',
                  'Other'
                ].map((lang) => {
                  const selected = languages.includes(lang);
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={[styles.chip, selected && styles.chipActive]}
                      onPress={() => toggleSelection(languages, lang, setLanguages)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {selected ? '✓ ' : ''}{lang}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            STEP 3: COOKING PROFILE (Chef vs Home Cook)
            ======================================================== */}
        {currentStep === 3 && partnerType === 'chef' && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Professional Chef Profile</Text>
            <Text style={styles.heroSub}>
              Select your experience, cuisines, and signature dishes.
            </Text>

            {/* How many years of experience */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>How many years of experience? <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.segmentedRow}>
                {['1-2 years', '3-5 years', '6-9 years', '10+ years'].map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[styles.segmentBtn, chefExpYears === exp && styles.segmentBtnActive]}
                    onPress={() => setChefExpYears(exp)}
                  >
                    <Text style={[styles.segmentText, chefExpYears === exp && styles.segmentTextActive]}>
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cuisines You Cook */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Cuisines You Cook <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsContainer}>
                {['South Indian', 'North Indian', 'Chinese', 'Continental', 'Mughlai', 'Italian', 'Other'].map((c) => {
                  const selected = chefCuisines.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, selected && styles.chipActiveChef]}
                      onPress={() => toggleSelection(chefCuisines, c, setChefCuisines)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActiveChef]}>
                        {selected ? '✓ ' : ''}{c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Speciality Dishes */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Speciality Dishes <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                  placeholder="e.g. Mutton Dum Biryani, Pasta Carbonara"
                  value={newChefSpeciality}
                  onChangeText={setNewChefSpeciality}
                  onSubmitEditing={() => handleAddSpeciality(true)}
                />
                <TouchableOpacity 
                  style={styles.addTagBtn} 
                  onPress={() => handleAddSpeciality(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagWrapList}>
                {chefSpecialities.map((item) => (
                  <View key={item} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{item}</Text>
                    <TouchableOpacity 
                      onPress={() => setChefSpecialities(chefSpecialities.filter(x => x !== item))}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Food Preferences You Can Prepare */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Food Preferences You Can Prepare <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsContainer}>
                {['Vegetarian', 'Non-vegetarian', 'Vegan', 'Jain', 'Other'].map((pref) => {
                  const selected = chefDietPreferences.includes(pref);
                  return (
                    <TouchableOpacity
                      key={pref}
                      style={[styles.chip, selected && styles.chipActiveChef]}
                      onPress={() => toggleSelection(chefDietPreferences, pref, setChefDietPreferences)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActiveChef]}>
                        {selected ? '✓ ' : ''}{pref}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Open to Party Pack Bookings? */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Open to Party Pack bookings? <Text style={styles.reqStar}>*</Text></Text>
              
              <View style={styles.partyPackNotice}>
                <Sparkles size={18} color="#B45309" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.partyPackNoticeText}>
                  Party Packs involve cooking for celebrations and gatherings of up to 50 guests at the customer venue using customer-provided ingredients. Highly rewarded bookings.
                </Text>
              </View>

              <View style={styles.twoChoiceRow}>
                <TouchableOpacity
                  style={[styles.choiceBtn, openToPartyPack && styles.choiceBtnActive]}
                  onPress={() => setOpenToPartyPack(true)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.choiceRadioDot, openToPartyPack && styles.choiceRadioDotActive]}>
                    {openToPartyPack && <View style={styles.choiceRadioInner} />}
                  </View>
                  <Text style={[styles.choiceBtnText, openToPartyPack && styles.choiceBtnTextActive]}>
                    Yes, I am open to Party Packs 🎉
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceBtn, !openToPartyPack && styles.choiceBtnActive]}
                  onPress={() => setOpenToPartyPack(false)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.choiceRadioDot, !openToPartyPack && styles.choiceRadioDotActive]}>
                    {!openToPartyPack && <View style={styles.choiceRadioInner} />}
                  </View>
                  <Text style={[styles.choiceBtnText, !openToPartyPack && styles.choiceBtnTextActive]}>
                    No, only regular private bookings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* STEP 3 (HOME COOK VARIANT) */}
        {currentStep === 3 && partnerType === 'home_cook' && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Home Kitchen Profile</Text>
            <Text style={styles.heroSub}>
              Share your kitchen setup, capacity, and cooking schedule.
            </Text>

            {/* Note banner */}
            <View style={styles.infoBanner}>
              <Info size={18} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.infoBannerText}>
                You do not need to create your full menu right now! You can add live dishes, photos, prices, and daily portions after approval.
              </Text>
            </View>

            {/* Kitchen Name (Optional) */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Kitchen / Brand Name</Text>
                <Text style={styles.optionalTag}>Optional</Text>
              </View>
              <View style={styles.inputWrap}>
                <UtensilsCrossed size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={kitchenName}
                  onChangeText={setKitchenName}
                  placeholder="e.g. Annapurna's Authentic Flavours"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Years of Cooking Experience */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Years of Cooking Experience <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.segmentedRow}>
                {['1-3 yrs', '4-7 yrs', '8-12 yrs', '15+ yrs'].map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[styles.segmentBtn, homeCookExpYears === exp && styles.segmentBtnActiveHome]}
                    onPress={() => setHomeCookExpYears(exp)}
                  >
                    <Text style={[styles.segmentText, homeCookExpYears === exp && styles.segmentTextActiveHome]}>
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cuisines Offered */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Cuisines Offered <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsContainer}>
                {['South Indian', 'North Indian', 'Homestyle Thali', 'Snacks & Tiffin', 'Bengali', 'Maharashtrian', 'Other'].map((c) => {
                  const selected = homeCookCuisines.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, selected && styles.chipActiveHome]}
                      onPress={() => toggleSelection(homeCookCuisines, c, setHomeCookCuisines)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActiveHome]}>
                        {selected ? '✓ ' : ''}{c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Speciality Dishes */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Speciality Dishes <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                  placeholder="e.g. Fresh Idly, Sambar Vada, Roti Curries"
                  value={newHomeSpeciality}
                  onChangeText={setNewHomeSpeciality}
                  onSubmitEditing={() => handleAddSpeciality(false)}
                />
                <TouchableOpacity 
                  style={[styles.addTagBtn, { backgroundColor: '#C026D3' }]} 
                  onPress={() => handleAddSpeciality(false)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagWrapList}>
                {homeCookSpecialities.map((item) => (
                  <View key={item} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{item}</Text>
                    <TouchableOpacity 
                      onPress={() => setHomeCookSpecialities(homeCookSpecialities.filter(x => x !== item))}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Kitchen Type (Pure Veg, Non-Veg, Both) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Kitchen Type <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.kitchenTypeRow}>
                {[
                  { key: 'veg', title: 'Pure Veg', badge: '100% Veg', color: '#16A34A', bg: '#DCFCE7', icon: '🟢' },
                  { key: 'non_veg', title: 'Non-Veg', badge: 'Non-Veg', color: '#DC2626', bg: '#FEE2E2', icon: '🔴' },
                  { key: 'both', title: 'Both', badge: 'Veg + Non', color: '#D97706', bg: '#FEF3C7', icon: '🟡' },
                ].map((t) => {
                  const active = kitchenType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.kitchenTypeCard,
                        active && styles.kitchenTypeCardActive
                      ]}
                      onPress={() => setKitchenType(t.key as any)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.kitchenTypeBadge, { backgroundColor: t.bg }]}>
                        <Text style={[styles.kitchenTypeBadgeText, { color: t.color }]}>
                          {t.icon} {t.title}
                        </Text>
                      </View>
                      <Text style={[styles.kitchenTypeSub, active && styles.kitchenTypeSubActive]}>
                        {t.badge}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Approximate Daily Capacity */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Approximate Daily Capacity <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.segmentedRow}>
                {['10 meals', '25 meals', '50 meals', '75+ meals'].map((cap) => (
                  <TouchableOpacity
                    key={cap}
                    style={[styles.segmentBtn, dailyCapacity.startsWith(cap.split(' ')[0]) && styles.segmentBtnActiveHome]}
                    onPress={() => setDailyCapacity(cap)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, dailyCapacity.startsWith(cap.split(' ')[0]) && styles.segmentTextActiveHome]}>
                      {cap}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Usual Cooking Days & Meal Times */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Usual Cooking Days & Meal Times <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsContainer}>
                {['Breakfast (7-10 AM)', 'Lunch (12-3 PM)', 'Snacks (4-7 PM)', 'Dinner (7-10 PM)'].map((time) => {
                  const selected = mealTimes.includes(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.chip, selected && styles.chipActiveHome]}
                      onPress={() => toggleSelection(mealTimes, time, setMealTimes)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActiveHome]}>
                        {selected ? '✓ ' : ''}{time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* FSSAI Notice - Can be added post-onboarding */}
            <View style={styles.fssaiPostNotice}>
              <ShieldCheck size={20} color="#0284C7" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fssaiPostNoticeTitle}>FSSAI Registration</Text>
                <Text style={styles.fssaiPostNoticeText}>
                  FSSAI registration number and certificate can be added from your kitchen settings once onboarded.
                </Text>
              </View>
            </View>

            {/* Kitchen Photos */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Kitchen Photos <Text style={styles.reqStar}>*</Text></Text>
              <Text style={styles.fieldSub}>Upload 1–3 photos of your cooking counter and hygiene setup.</Text>
              <View style={styles.kitchenPhotoRow}>
                {kitchenPhotos.map((photo, idx) => (
                  <View key={idx} style={styles.kitchenPhotoBox}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=240' }}
                      style={styles.kitchenPhotoImg}
                    />
                    <Text style={styles.kitchenPhotoLabel}>Counter {idx + 1}</Text>
                  </View>
                ))}
                <TouchableOpacity 
                  style={styles.addPhotoBox}
                  onPress={() => {
                    setKitchenPhotos([...kitchenPhotos, `Kitchen_Prep_${kitchenPhotos.length + 1}.jpg`]);
                    Alert.alert('Photo Added', 'Kitchen photo attached.');
                  }}
                >
                  <Camera size={20} color="#64748B" />
                  <Text style={styles.addPhotoText}>+ Add Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            STEP 4: LOCATION (Chef vs Home Cook)
            ======================================================== */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroTitle}>
              {partnerType === 'chef' ? 'Where do you provide chef services?' : 'Kitchen Location & Delivery'}
            </Text>
            <Text style={styles.heroSub}>
              {partnerType === 'chef' 
                ? 'Customers within your travel radius will be able to book you.'
                : 'Used for nearby customer discovery and delivery coverage.'}
            </Text>

            {/* Address & Pincode */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {partnerType === 'chef' ? 'Current Address' : 'Kitchen Address'} <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={[styles.inputWrap, { marginBottom: 10 }]}>
                <MapPin size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Door/Flat No, Apartment, Street name, Locality"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <Text style={styles.fieldLabel}>Pincode <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="560068"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            {/* Location Pin On Map */}
            <View style={styles.fieldBlock}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Location Map Pin <Text style={styles.reqStar}>*</Text></Text>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={13} color="#16A34A" />
                  <Text style={styles.verifiedBadgeText}>PIN LOCATED</Text>
                </View>
              </View>

              <View style={styles.mapCard}>
                <View style={styles.mapVisualHeader}>
                  <MapPin size={24} color="#4C1D95" />
                  <Text style={styles.mapCoordsText}>Lat: 12.8797, Lng: 77.6245</Text>
                </View>
                <Text style={styles.mapLocName}>Begur, Bengaluru, Karnataka</Text>
                <TouchableOpacity 
                  style={styles.mapRelocateBtn}
                  onPress={() => Alert.alert('GPS Location', 'Location updated to your current coordinates: Begur, Bengaluru (12.8797, 77.6245).')}
                >
                  <MapPin size={14} color="#4C1D95" style={{ marginRight: 6 }} />
                  <Text style={styles.mapRelocateBtnText}>Use Current GPS Location</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chef: Service Radius */}
            {partnerType === 'chef' && (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Service Radius (Distance willing to travel) <Text style={styles.reqStar}>*</Text></Text>
                <View style={styles.segmentedRow}>
                  {[5, 10, 15, 20, 25].map((km) => (
                    <TouchableOpacity
                      key={km}
                      style={[styles.segmentBtn, serviceRadiusKm === km && styles.segmentBtnActive]}
                      onPress={() => setServiceRadiusKm(km)}
                    >
                      <Text style={[styles.segmentText, serviceRadiusKm === km && styles.segmentTextActive]}>
                        {km} km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldNote}>You will receive customer booking requests within this radius.</Text>
              </View>
            )}

            {/* Home Cook: Pickup Availability & Instructions */}
            {partnerType === 'home_cook' && (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Pickup Availability <Text style={styles.reqStar}>*</Text></Text>
                  <View style={styles.twoChoiceRow}>
                    <TouchableOpacity
                      style={[styles.choiceBtn, pickupAvailable && styles.choiceBtnActiveHome]}
                      onPress={() => setPickupAvailable(true)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.choiceRadioDot, pickupAvailable && styles.choiceRadioDotActiveHome]}>
                        {pickupAvailable && <View style={styles.choiceRadioInnerHome} />}
                      </View>
                      <Text style={[styles.choiceBtnText, pickupAvailable && styles.choiceBtnTextActiveHome]}>
                        Yes, customers can collect from kitchen 🛍️
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.choiceBtn, !pickupAvailable && styles.choiceBtnActiveHome]}
                      onPress={() => setPickupAvailable(false)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.choiceRadioDot, !pickupAvailable && styles.choiceRadioDotActiveHome]}>
                        {!pickupAvailable && <View style={styles.choiceRadioInnerHome} />}
                      </View>
                      <Text style={[styles.choiceBtnText, !pickupAvailable && styles.choiceBtnTextActiveHome]}>
                        No, third-party doorstep delivery only 🛵
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {pickupAvailable && (
                  <View style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>Pickup Instructions</Text>
                      <Text style={styles.optionalTag}>Optional</Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="e.g. Ring bell at Flat 302, 3rd Floor. Call upon arrival."
                      placeholderTextColor="#94A3B8"
                      value={pickupInstructions}
                      onChangeText={setPickupInstructions}
                    />
                  </View>
                )}

                <View style={styles.infoBanner}>
                  <Info size={16} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={styles.infoBannerText}>
                    Home Cook discovery and delivery coverage automatically uses your kitchen coordinates and delivery availability.
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ========================================================
            STEP 5: REVIEW AND SUBMIT
            ======================================================== */}
        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Review Your Application</Text>
            <Text style={styles.heroSub}>
              Confirm your submitted information before sending it to the verification desk.
            </Text>

            {/* Summary Card 1: Provider Type */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {partnerType === 'chef' ? <ChefHat size={18} color="#9333EA" /> : <UtensilsCrossed size={18} color="#C026D3" />}
                  <Text style={styles.summaryTitle}>1. Partner Category</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(1)} style={styles.editBtn}>
                  <Edit3 size={14} color="#4C1D95" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryValueText}>
                {partnerType === 'chef' ? 'Professional Chef (Home Visits)' : 'Home Cook (Neighborhood Kitchen)'}
              </Text>
            </View>

            {/* Summary Card 2: Basic Details */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <User size={18} color="#4C1D95" />
                  <Text style={styles.summaryTitle}>2. Basic Details</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(2)} style={styles.editBtn}>
                  <Edit3 size={14} color="#4C1D95" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Full Name:</Text>
                <Text style={styles.summaryVal}>{fullName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mobile Phone:</Text>
                <Text style={styles.summaryVal}>+91 {phone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>DOB / Age:</Text>
                <Text style={styles.summaryVal}>{dob ? `${dob} (${age} yrs)` : `${age} yrs`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Native Place:</Text>
                <Text style={styles.summaryVal}>{nativePlace}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Languages:</Text>
                <Text style={styles.summaryVal}>{languages.join(', ')}</Text>
              </View>
            </View>

            {/* Summary Card 3: Cooking Profile */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={18} color="#4C1D95" />
                  <Text style={styles.summaryTitle}>3. Cooking Profile</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(3)} style={styles.editBtn}>
                  <Edit3 size={14} color="#4C1D95" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {partnerType === 'chef' ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Experience:</Text>
                    <Text style={styles.summaryVal}>{chefExpYears}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cuisines:</Text>
                    <Text style={styles.summaryVal}>{chefCuisines.join(', ')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Specialities:</Text>
                    <Text style={styles.summaryVal}>{chefSpecialities.join(', ')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Dietary:</Text>
                    <Text style={styles.summaryVal}>{chefDietPreferences.join(', ')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Party Packs:</Text>
                    <Text style={styles.summaryVal}>{openToPartyPack ? 'Yes (Up to 50 guests)' : 'No'}</Text>
                  </View>
                </>
              ) : (
                <>
                  {kitchenName ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Kitchen Name:</Text>
                      <Text style={styles.summaryVal}>{kitchenName}</Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Experience:</Text>
                    <Text style={styles.summaryVal}>{homeCookExpYears}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cuisines:</Text>
                    <Text style={styles.summaryVal}>{homeCookCuisines.join(', ')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Kitchen Type:</Text>
                    <Text style={styles.summaryVal}>
                      {kitchenType === 'veg' ? 'Pure Veg 🟢' : kitchenType === 'non_veg' ? 'Non-Veg 🔴' : 'Both (Veg & Non) 🟡'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Daily Capacity:</Text>
                    <Text style={styles.summaryVal}>{dailyCapacity}</Text>
                  </View>
                  {fssaiNumber ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>FSSAI Licence:</Text>
                      <Text style={styles.summaryVal}>{fssaiNumber} (Exp: {fssaiExpiry})</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            {/* Summary Card 4: Location */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin size={18} color="#4C1D95" />
                  <Text style={styles.summaryTitle}>4. Location Details</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(4)} style={styles.editBtn}>
                  <Edit3 size={14} color="#4C1D95" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address:</Text>
                <Text style={styles.summaryVal}>{address}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pincode:</Text>
                <Text style={styles.summaryVal}>{pincode}</Text>
              </View>
              {partnerType === 'chef' ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Travel Radius:</Text>
                  <Text style={styles.summaryVal}>{serviceRadiusKm} km</Text>
                </View>
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Customer Pickup:</Text>
                  <Text style={styles.summaryVal}>{pickupAvailable ? 'Enabled' : 'Disabled (Delivery only)'}</Text>
                </View>
              )}
            </View>

            {/* Mandatory Consents */}
            <View style={styles.consentsBox}>
              <TouchableOpacity 
                style={styles.consentItem}
                onPress={() => setConsentVerification(!consentVerification)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, consentVerification && styles.checkboxActive]}>
                  {consentVerification && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.consentText}>
                  I consent to Instacome verifying the submitted profile and registration details.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consentItem}
                onPress={() => setConsentTerms(!consentTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, consentTerms && styles.checkboxActive]}>
                  {consentTerms && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.consentText}>
                  I accept the Instacome Provider Terms of Service, Food Hygiene Protocols, and Partner Code of Conduct.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verification Process Notice */}
            <View style={styles.verificationExplainerCard}>
              <ShieldCheck size={20} color="#4C1D95" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifCardTitle}>Verification Process</Text>
                <Text style={styles.verifCardText}>
                  {partnerType === 'chef'
                    ? '• Identity verification through secure process\n• Partner onboarding orientation call'
                    : '• Kitchen setup and hygiene review\n• Partner onboarding orientation call'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* DOCKED BOTTOM ACTION BAR (Square Styling, Cohesive Across All Steps) */}
      <View style={[styles.bottomBarDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {currentStep === 1 ? (
          <TouchableOpacity 
            style={styles.primaryBtnSquare} 
            onPress={handleNextStep}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              Continue as {partnerType === 'chef' ? 'Professional Chef' : 'Home Cook'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomNavRow}>
            <TouchableOpacity 
              style={styles.bottomBackBtnSquare} 
              onPress={handlePrevStep}
              activeOpacity={0.85}
            >
              <Text style={styles.bottomBackBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.bottomNextBtnSquare,
                currentStep === 5 && styles.bottomSubmitBtn
              ]} 
              onPress={currentStep === 5 ? handleSubmitApplication : handleNextStep}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {currentStep === 5 ? 'Submit Application 📋' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLogoWrap: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerLogo: {
    width: 38,
    height: 38,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerBackBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  headerBackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C1D95',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLogoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  draftBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },

  // 5-Segment Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#4C1D95',
  },
  progressSegmentInactive: {
    backgroundColor: '#E2E8F0',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  scrollContentStep1: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  step1Container: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 2,
  },
  step1Header: {
    marginBottom: 8,
  },
  heroTitleCompact: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSubCompact: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Operator Type Selection Cards with AI Photography (Fills available page height)
  operatorCardsContainer: {
    flex: 1,
    gap: 12,
    marginVertical: 4,
  },
  operatorCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 155,
  },
  operatorCardInactive: {
    borderColor: '#E2E8F0',
  },
  operatorCardActiveChef: {
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  operatorCardActiveHome: {
    borderColor: '#C026D3',
    shadowColor: '#C026D3',
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  operatorCardCoverImg: {
    width: '38%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  operatorTextWrap: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 13,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  operatorTextWrapActiveChef: {
    backgroundColor: '#FAF5FF',
  },
  operatorTextWrapActiveHome: {
    backgroundColor: '#FDF4FF',
  },
  operatorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  operatorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  operatorQuote: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginVertical: 4,
  },
  operatorPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  operatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  operatorPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
  },

  stepContainer: {
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },

  // Step 1: Type Cards
  typeSelectionList: {
    gap: 16,
  },
  typeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  typeCardInactive: {
    borderColor: '#E2E8F0',
  },
  typeCardActiveChef: {
    borderColor: '#9333EA',
    backgroundColor: '#FAF5FF',
  },
  typeCardActiveHome: {
    borderColor: '#C026D3',
    backgroundColor: '#FDF4FF',
  },
  typeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  typeBulletList: {
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  typeBulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBulletText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  cardRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: '#9333EA',
  },
  radioCircleActiveHome: {
    borderColor: '#C026D3',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9333EA',
  },
  radioLabel: {
    fontSize: 13,
    color: '#64748B',
  },

  // Avatar Uploader
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4C1D95',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  uploadSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C1D95',
  },

  // Form Fields
  fieldBlock: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  reqStar: {
    color: '#DC2626',
  },
  optionalTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fieldSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  fieldNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
    paddingTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  // Age & DOB Badges
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  ageBadgeValid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  ageBadgeInvalid: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ageBadgeTextValid: {
    color: '#15803D',
  },
  ageBadgeTextInvalid: {
    color: '#B91C1C',
  },

  // Date of Birth 3-Picker Row (Date | Month 1-12 | Year 18+)
  dobPickersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobDropdownWrap: {
    flex: 1,
  },
  dobDropdownLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dobDropdownNativeBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  dobDropdownNativeVal: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  dobPickerPlaceholder: {
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Phone
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBox: {
    backgroundColor: '#F1F5F9',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  otpBtn: {
    backgroundColor: '#4C1D95',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  otpVerificationBox: {
    marginTop: 10,
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  otpPromptText: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '600',
    marginBottom: 8,
  },
  otpActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpTextInput: {
    width: 90,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C084FC',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpSubmitBtn: {
    flex: 1,
    backgroundColor: '#9333EA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Multi-select Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#A855F7',
  },
  chipActiveChef: {
    backgroundColor: '#FAF5FF',
    borderColor: '#9333EA',
  },
  chipActiveHome: {
    backgroundColor: '#FDF4FF',
    borderColor: '#C026D3',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#6B21A8',
    fontWeight: '700',
  },
  chipTextActiveChef: {
    color: '#9333EA',
    fontWeight: '700',
  },
  chipTextActiveHome: {
    color: '#C026D3',
    fontWeight: '700',
  },

  // Segmented Row
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#9333EA',
  },
  segmentBtnActiveHome: {
    backgroundColor: '#FDF4FF',
    borderColor: '#C026D3',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#9333EA',
    fontWeight: '800',
  },
  segmentTextActiveHome: {
    color: '#C026D3',
    fontWeight: '800',
  },

  // Kitchen Type Selector (Pure Veg, Non-Veg, Both)
  kitchenTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kitchenTypeCard: {
    flex: 1,
    height: 72,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  kitchenTypeCardActive: {
    backgroundColor: '#FDF4FF',
    borderColor: '#C026D3',
  },
  kitchenTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  kitchenTypeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  kitchenTypeSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  kitchenTypeSubActive: {
    color: '#A21CAF',
    fontWeight: '700',
  },

  // FSSAI Post-Onboarding Notice
  fssaiPostNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  fssaiPostNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  fssaiPostNoticeText: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 17,
  },

  // Tag Input & Chips
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addTagBtn: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tagWrapList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Document Upload Card
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Party Pack Notice
  partyPackNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  partyPackNoticeText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    flex: 1,
  },
  twoChoiceRow: {
    gap: 8,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 48,
  },
  choiceBtnActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#9333EA',
  },
  choiceBtnActiveHome: {
    backgroundColor: '#FDF4FF',
    borderColor: '#C026D3',
  },
  choiceRadioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceRadioDotActive: {
    borderColor: '#9333EA',
  },
  choiceRadioDotActiveHome: {
    borderColor: '#C026D3',
  },
  choiceRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9333EA',
  },
  choiceRadioInnerHome: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C026D3',
  },
  choiceBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  choiceBtnTextActive: {
    color: '#9333EA',
    fontWeight: '800',
  },
  choiceBtnTextActiveHome: {
    color: '#C026D3',
    fontWeight: '800',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    alignItems: 'center',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
    flex: 1,
  },

  // Kitchen Photos
  kitchenPhotoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  kitchenPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  kitchenPhotoImg: {
    width: '100%',
    height: '100%',
  },
  kitchenPhotoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    fontSize: 9,
    textAlign: 'center',
    paddingVertical: 2,
  },
  addPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 4,
  },

  // Map Card
  mapCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  mapVisualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mapCoordsText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapLocName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  mapRelocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4C1D95',
  },
  mapRelocateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },

  // Summary Review Cards (Step 5)
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C1D95',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Consents & Terms
  consentsBox: {
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  consentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    flex: 1,
  },

  // Verification Roadmap
  verificationExplainerCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  verifCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4C1D95',
    marginBottom: 4,
  },
  verifCardText: {
    fontSize: 11,
    color: '#6B21A8',
    lineHeight: 16,
  },

  // Docked Bottom Action Bar (Square Styling & Full Width Coverage)
  bottomBarDock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnSquare: {
    backgroundColor: '#4C1D95',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomBackBtnSquare: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBackBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomNextBtnSquare: {
    flex: 2,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomSubmitBtn: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  primaryBtn: {
    backgroundColor: '#4C1D95',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
