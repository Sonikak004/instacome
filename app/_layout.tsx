import { Stack } from "expo-router";
import { View, Platform, StyleSheet } from "react-native";
import { CartProvider } from "../src/context/CartContext";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <View style={styles.root}>
          <View style={styles.appContainer}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="cart" options={{ presentation: "modal" }} />
              <Stack.Screen name="home-cook/[id]" />
              <Stack.Screen name="book-chef/index" />
              <Stack.Screen name="book-chef/[id]" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="dashboard" />
            </Stack>
          </View>
        </View>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: "100%",
    backgroundColor: Platform.OS === "web" ? "#E5E7EB" : "#FFFFFF",
    alignItems: Platform.OS === "web" ? "center" : undefined,
  },
  appContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 430 : "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
});
