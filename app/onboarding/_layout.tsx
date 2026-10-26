import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home-cook" />
      <Stack.Screen name="chef" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
