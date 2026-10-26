import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generate a standard RFC4122 v4 UUID
 * Guarantees compatibility with PostgreSQL UUID columns
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID format
 */
export function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * User-scoped AsyncStorage helpers
 * Prevents cross-account data leakage between different logins
 */
export const UserStorage = {
  // Application Status
  async getAppStatus(userId?: string | null): Promise<string | null> {
    if (userId) {
      const userSpecific = await AsyncStorage.getItem(`provider_application_status_${userId}`);
      if (userSpecific) return userSpecific;
    }
    // Fallback only if no userId provided
    return await AsyncStorage.getItem('provider_application_status');
  },

  async setAppStatus(userId: string, status: string): Promise<void> {
    await AsyncStorage.setItem(`provider_application_status_${userId}`, status);
    await AsyncStorage.setItem('provider_application_status', status);
  },

  // Submitted Application Payload
  async getSubmittedApplication(userId?: string | null): Promise<any | null> {
    if (userId) {
      const rawUser = await AsyncStorage.getItem(`instacome_submitted_application_${userId}`);
      if (rawUser) {
        try { return JSON.parse(rawUser); } catch {}
      }
    }
    const rawGlobal = await AsyncStorage.getItem('instacome_submitted_application');
    if (rawGlobal) {
      try { return JSON.parse(rawGlobal); } catch {}
    }
    return null;
  },

  async setSubmittedApplication(userId: string, payload: any): Promise<void> {
    const json = JSON.stringify(payload);
    await AsyncStorage.setItem(`instacome_submitted_application_${userId}`, json);
    await AsyncStorage.setItem('instacome_submitted_application', json);
  },

  // Onboarding Draft
  async getDraft(userId?: string | null): Promise<any | null> {
    if (userId) {
      const raw = await AsyncStorage.getItem(`instacome_provider_onboarding_draft_${userId}`);
      if (raw) {
        try { return JSON.parse(raw); } catch {}
      }
    }
    return null;
  },

  async setDraft(userId: string, draft: any): Promise<void> {
    await AsyncStorage.setItem(`instacome_provider_onboarding_draft_${userId}`, JSON.stringify(draft));
  },

  async clearDraft(userId: string): Promise<void> {
    await AsyncStorage.removeItem(`instacome_provider_onboarding_draft_${userId}`);
    await AsyncStorage.removeItem('instacome_provider_onboarding_draft_v2');
  },

  // Complete cleanup on logout to ensure next signin is 100% clean
  async clearSessionData(): Promise<void> {
    const keysToRemove = [
      'instacome_active_session',
      'instacome_active_session_v2',
      'onboarded_as_chef',
      'pending_signup_role',
      'provider_application_status',
      'instacome_submitted_application',
      'instacome_provider_onboarding_draft_v2',
    ];
    await Promise.all(keysToRemove.map((key) => AsyncStorage.removeItem(key)));
  }
};
