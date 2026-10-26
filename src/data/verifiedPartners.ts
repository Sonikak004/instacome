export const resolveImageSource = (img: any) => {
  if (!img) return { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' };
  if (typeof img === 'string') return { uri: img };
  return img;
};

export interface PartnerChef {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  experienceYears: number;
  cuisines: string[];
  languages: string[];
  distanceKm: number;
  availableToday: boolean;
  startingPrice: number;
  image: any;
  lat: number;
  lng: number;
}

export interface PartnerDish {
  id: string;
  dishName: string;
  providerName: string;
  providerVerified: boolean;
  price: number;
  distanceKm: number;
  rating: number;
  portionsLeft: number;
  isVeg: boolean;
  image: any;
  readyTime: string;
  lat: number;
  lng: number;
}

// -------------------------------------------------------------
// VERIFIED PRIVATE CHEFS (Realistic dummy chefs for instant testing)
// -------------------------------------------------------------
export const VERIFIED_PARTNER_CHEFS: PartnerChef[] = [
  {
    id: 'chef-arun',
    name: 'Chef Arun Kumar',
    verified: true,
    rating: 4.9,
    reviews: 142,
    experienceYears: 8,
    cuisines: ['North Indian', 'Tandoor & Kebabs', 'Mughlai', 'Continental'],
    languages: ['English', 'Hindi', 'Punjabi'],
    distanceKm: 1.2,
    availableToday: true,
    startingPrice: 599,
    image: require('../../assets/images/chef_arun.jpg'),
    lat: 12.8872,
    lng: 77.6234
  },
  {
    id: 'chef-shalini',
    name: 'Chef Shalini Rao',
    verified: true,
    rating: 4.95,
    reviews: 118,
    experienceYears: 6,
    cuisines: ['South Indian', 'Coastal Seafood', 'Italian Pastas', 'Salads'],
    languages: ['English', 'Kannada', 'Hindi'],
    distanceKm: 1.8,
    availableToday: true,
    startingPrice: 649,
    image: require('../../assets/images/chef_shalini.jpg'),
    lat: 12.8915,
    lng: 77.6295
  },
  {
    id: 'chef-farhan',
    name: 'Chef Farhan Akhtar',
    verified: true,
    rating: 4.88,
    reviews: 164,
    experienceYears: 10,
    cuisines: ['Hyderabadi Dum Biryani', 'Awadhi Dastarkhwan', 'Galouti Kebabs', 'Mughlai'],
    languages: ['English', 'Urdu', 'Hindi'],
    distanceKm: 2.3,
    availableToday: true,
    startingPrice: 699,
    image: require('../../assets/images/chef_farhan.jpg'),
    lat: 12.8805,
    lng: 77.6180
  },
  {
    id: 'chef-meenakshi',
    name: 'Chef Meenakshi Iyer',
    verified: true,
    rating: 4.92,
    reviews: 94,
    experienceYears: 7,
    cuisines: ['Chettinad', 'Kerala Sadhya', 'Tamil Brahmin Feasts', 'Sattvic'],
    languages: ['English', 'Tamil', 'Malayalam'],
    distanceKm: 2.9,
    availableToday: true,
    startingPrice: 549,
    image: { uri: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=600&auto=format&fit=crop' },
    lat: 12.8840,
    lng: 77.6320
  },
  {
    id: 'chef-rajesh',
    name: 'Chef Rajesh Verma',
    verified: true,
    rating: 4.85,
    reviews: 83,
    experienceYears: 5,
    cuisines: ['Rajasthani Dal Baati', 'Gourmet Street Food', 'Party Platters'],
    languages: ['English', 'Hindi', 'Marwari'],
    distanceKm: 3.4,
    availableToday: true,
    startingPrice: 499,
    image: { uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=600&auto=format&fit=crop' },
    lat: 12.8770,
    lng: 77.6250
  }
];

// -------------------------------------------------------------
// VERIFIED HOME DISHES & KITCHENS (Delicious neighbourhood home cooks)
// -------------------------------------------------------------
export const VERIFIED_HOME_DISHES: PartnerDish[] = [
  {
    id: 'dish-paneer',
    dishName: 'Paneer Butter Masala & 3 Phulkas',
    providerName: "Dadi's Desi Rasoi",
    providerVerified: true,
    price: 189,
    distanceKm: 0.8,
    rating: 4.9,
    portionsLeft: 6,
    isVeg: true,
    image: require('../../assets/images/paneer_butter_masala.jpg'),
    readyTime: '15-20 mins',
    lat: 12.8850,
    lng: 77.6250
  },
  {
    id: 'dish-biryani',
    dishName: 'Dum Ka Chicken Biryani (Serves 1-2)',
    providerName: 'Al-Madina Home Kitchen',
    providerVerified: true,
    price: 249,
    distanceKm: 1.2,
    rating: 4.95,
    portionsLeft: 4,
    isVeg: false,
    image: require('../../assets/images/chicken_biryani.jpg'),
    readyTime: '20-25 mins',
    lat: 12.8820,
    lng: 77.6210
  },
  {
    id: 'dish-thali',
    dishName: 'South Indian Deluxe Veg Meals',
    providerName: 'Annapurna Homestyle Meals',
    providerVerified: true,
    price: 169,
    distanceKm: 0.6,
    rating: 4.89,
    portionsLeft: 8,
    isVeg: true,
    image: require('../../assets/images/veg_meals.jpg'),
    readyTime: '10-15 mins',
    lat: 12.8885,
    lng: 77.6270
  },
  {
    id: 'dish-kebab',
    dishName: 'Char-Grilled Chicken Seekh Kebabs (6 pcs)',
    providerName: 'Kababish Home Tandoor',
    providerVerified: true,
    price: 219,
    distanceKm: 1.5,
    rating: 4.86,
    portionsLeft: 5,
    isVeg: false,
    image: require('../../assets/images/chicken_kebab.jpg'),
    readyTime: '25-30 mins',
    lat: 12.8795,
    lng: 77.6240
  },
  {
    id: 'dish-dal-makhani',
    dishName: 'Slow-Cooked Dal Makhani & Jeera Rice',
    providerName: 'Maa Ki Rasoi',
    providerVerified: true,
    price: 179,
    distanceKm: 1.1,
    rating: 4.92,
    portionsLeft: 7,
    isVeg: true,
    image: { uri: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop' },
    readyTime: '15 mins',
    lat: 12.8830,
    lng: 77.6300
  },
  {
    id: 'dish-kerala-chicken',
    dishName: 'Kerala Chicken Roast & 2 Malabar Parottas',
    providerName: 'Malabar Homestyle Kitchen',
    providerVerified: true,
    price: 229,
    distanceKm: 1.8,
    rating: 4.91,
    portionsLeft: 5,
    isVeg: false,
    image: { uri: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop' },
    readyTime: '20 mins',
    lat: 12.8760,
    lng: 77.6190
  }
];
