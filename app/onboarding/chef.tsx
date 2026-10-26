import React from 'react';
import { Redirect } from 'expo-router';

export default function ChefOnboardingRedirect() {
  return <Redirect href="/onboarding?type=chef" />;
}
