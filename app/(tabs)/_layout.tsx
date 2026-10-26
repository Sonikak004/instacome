import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Home, Compass, ReceiptText, User } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserStorage } from "../../src/utils/userStorage";

function CustomTabBar({ state, descriptors, navigation, insets }: any) {
  // Ensure generous bottom clearance so text is NEVER clipped by screen/viewport edge
  const safeBottom = Math.max(insets?.bottom || 0, Platform.OS === "ios" ? 26 : 14);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: safeBottom }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? "#4C1D95" : "#6B7280";

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color, size: 22 })
                : null}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color },
                isFocused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              {typeof label === "string" ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session, profile, providerProfile, isLoading } = useAuth();
  const router = useRouter();

  const isChef = profile?.role === 'chef' || profile?.role === 'home_cook' || (session?.user as any)?.user_metadata?.role === 'chef';

  useEffect(() => {
    if (isLoading) return;
    if (session && isChef) {
      UserStorage.getAppStatus(session.user.id).then((appStatus) => {
        if (providerProfile?.is_verified && appStatus !== 'pending_review') {
          router.replace('/dashboard');
        } else if (providerProfile || appStatus === 'pending_review') {
          router.replace('/onboarding/review');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [session, isChef, providerProfile?.is_verified, isLoading]);

  // NEVER show customer home or profile pages to a chef!
  if (isChef) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5F259F" />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarLabel: "Explore",
          tabBarIcon: ({ color }) => <Compass color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <ReceiptText color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  tabLabelFocused: {
    fontWeight: "700",
  },
});
