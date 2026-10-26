import React from 'react';
import { Redirect } from 'expo-router';

export default function HomeCookOnboardingRedirect() {
  return <Redirect href="/onboarding?type=home_cook" />;
}
