import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

const MOBILE_VIEWPORT_MAX = 500;

function hasOAuthCallbackInUrl(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const { search, hash } = window.location;
  return (
    search.includes('code=') ||
    search.includes('error=') ||
    hash.includes('access_token=') ||
    hash.includes('error=')
  );
}
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

const WEB_NOTCH_PAD = 50;
const WEB_BOTTOM_PAD = 24;
const webMockPhoneInsets: Metrics = {
  frame: { x: 0, y: 0, width: 362, height: 816 },
  insets: { top: WEB_NOTCH_PAD, left: 0, right: 0, bottom: WEB_BOTTOM_PAD },
};
import { useFonts } from 'expo-font';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useAuthStore } from '@/src/stores/authStore';
import { useChildProfilesStore } from '@/src/stores/childProfilesStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useAuthSession } from '@/src/hooks/useAuthSession';

export const unstable_settings = {
  initialRouteName: 'splash',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useAuthSession();

  const router = useRouter();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const mql = window.matchMedia?.('(display-mode: standalone)');
    if (!mql) return;
    setIsStandalone(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  const useMobileViewport =
    Platform.OS === 'web' && (isStandalone || width <= MOBILE_VIEWPORT_MAX);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasProfiles = useChildProfilesStore((s) => s.profiles.length > 0);
  const hasSeenWelcome = useOnboardingStore((s) => s.hasSeenWelcome);
  const onboardingHydrated = useOnboardingStore((s) => s.hydrated);
  const bootShownRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || bootShownRef.current) return;
    bootShownRef.current = true;
    if (hasOAuthCallbackInUrl()) return;
    const segs = segments as unknown as string[];
    if (segs[0] !== 'splash') router.replace('/splash');
  }, [mounted, router, segments]);

  useEffect(() => {
    if (!mounted) return;

    const segs = segments as unknown as string[];
    const first = segs[0] ?? '';

    if (first === 'splash' || first === 'welcome' || first === 'language' || first === 'phone-home' || first === 'privacy' || first === 'terms') return;

    if (isLoading || !onboardingHydrated) return;

    const inAuth = first === '(auth)';
    const inOnboarding = segs[1] === 'onboarding';
    const onResetScreen = segs[1] === 'reset-password';

    if (!isAuthenticated) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (inAuth && !onResetScreen) {
      router.replace(hasProfiles ? '/(main)' : '/(main)/onboarding/name');
      return;
    }

    if (!hasProfiles && !inOnboarding && first !== '(parent)') {
      router.replace('/(main)/onboarding/name');
    }
  }, [
    mounted,
    isAuthenticated,
    hasProfiles,
    isLoading,
    onboardingHydrated,
    segments,
    router,
  ]);

  if (!fontsLoaded) return null;

  const useDesktopFrame = Platform.OS === 'web' && !useMobileViewport;

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={useDesktopFrame ? webMockPhoneInsets : undefined}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="language" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="phone-home" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="terms" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (useDesktopFrame) {
    return (
      <View style={styles.webStage}>
        <View style={styles.phoneFrame}>
          <View style={styles.notch} />
          <View style={styles.phoneScreen}>{content}</View>
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webStage: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1B3A',
    padding: 32,
  },
  phoneFrame: {
    width: 390,
    height: 844,
    maxWidth: '100%' as unknown as number,
    backgroundColor: '#0a0a0a',
    borderRadius: 48,
    padding: 14,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 30,
  },
  notch: {
    position: 'absolute',
    top: 18,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 32,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    zIndex: 30,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
  },
});
