import React, { useEffect } from 'react';
import { View, Platform, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { tokenCache } from '@/services/token-cache';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '@/tamagui.config';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { pandraColors } from '@/theme/token';
import { RevenueCatProvider } from '@/providers/revenue-cat-provider';
import { AppAuthProvider, useAppAuth } from '@/providers/auth-provider';
import { registerPandraWidgetHandler } from '@/widgets/android-widget-task-handler';

LogBox.ignoreLogs([
  'Clerk: Clerk has been loaded with development keys',
  '[RevenueCat] Using a Test Store API key',
  'Called logOut but the current user is anonymous',
  'Development instances have strict usage limits',
]);

if (Platform.OS === 'android') {
  try {
    registerPandraWidgetHandler();
  } catch (err) {
    console.warn('[Widgets] Android widget handler registration skipped:', err);
  }
}

SplashScreen.preventAutoHideAsync();

const CLERK_DEFAULT_KEY = 'pk_test_ZGVhci1wdW1hLTY3ODAuY2xlcmsuYWNjb3VudHMuZGV2JA';
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || CLERK_DEFAULT_KEY;

interface ErrorBoundaryState {
  hasError: boolean;
}

class SafeAppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Pandra] Caught fatal startup error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: pandraColors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <AnimatedSplashOverlay />
        </View>
      );
    }
    return this.props.children;
  }
}

function InitialLayout() {
  const { isLoaded, isAuthenticated } = useAppAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoaded, segments, router]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: pandraColors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedSplashOverlay />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: pandraColors.bg,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);
    return () => clearTimeout(safetyTimer);
  }, [loaded, error]);

  if (!loaded && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: pandraColors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedSplashOverlay />
      </View>
    );
  }

  return (
    <SafeAppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: pandraColors.bg }}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <AppAuthProvider>
            <RevenueCatProvider>
              <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
                <Theme name="light">
                  <InitialLayout />
                </Theme>
              </TamaguiProvider>
            </RevenueCatProvider>
          </AppAuthProvider>
        </ClerkProvider>
      </GestureHandlerRootView>
    </SafeAppErrorBoundary>
  );
}
