import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddressScreen from './src/screens/AddressScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import PaymentScreen from './src/screens/PaymentScreen';

import RolePickerScreen from './src/screens/RolePickerScreen';
import ProviderSetupScreen from './src/screens/ProviderSetupScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import ProviderHomeScreen from './src/screens/ProviderHomeScreen';
import ProviderTrackingScreen from './src/screens/ProviderTrackingScreen';
import ProviderChefArrivalScreen from './src/screens/ProviderChefArrivalScreen';
import ProviderLaundryScreen from './src/screens/ProviderLaundryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="RolePicker"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fffaf7' } 
          }}
        >
          {/* Shared Auth */}
          <Stack.Screen name="RolePicker" component={RolePickerScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          
          {/* Customer Flows */}
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Address" component={AddressScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />

          {/* Provider Flows */}
          <Stack.Screen name="ProviderSetup" component={ProviderSetupScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
          <Stack.Screen name="ProviderTracking" component={ProviderTrackingScreen} />
          <Stack.Screen name="ProviderChefArrival" component={ProviderChefArrivalScreen} />
          <Stack.Screen name="ProviderLaundry" component={ProviderLaundryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
