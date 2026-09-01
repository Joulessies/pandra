import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { XStack, Text } from 'tamagui';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/expo';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '@/theme/token';
import { useRouter } from 'expo-router';

// Warm up WebBrowser for OAuth sessions
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  label?: string;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  style?: any;
}

export function GoogleLogoIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Red */}
      <Path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      {/* Blue */}
      <Path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      {/* Yellow */}
      <Path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
      />
      {/* Green */}
      <Path
        fill="#34A853"
        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.4 7.5 23.5 12 23.5z"
      />
    </Svg>
  );
}

export function GoogleSignInButton({
  label = 'Sign in with Google',
  onSuccess,
  onError,
  style,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  
  // Use Clerk's official OAuth hook
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Use standard redirect URL for Expo Router
      const redirectUrl = Linking.createURL('/', { scheme: 'pandra' });

      const { createdSessionId, setActive, signIn, signUp } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/' as any);
        }
      } else if (signIn?.createdSessionId && setActive) {
        await setActive({ session: signIn.createdSessionId });
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/' as any);
        }
      } else if (signUp?.createdSessionId && setActive) {
        await setActive({ session: signUp.createdSessionId });
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/' as any);
        }
      }
    } catch (err: any) {
      console.warn('[Clerk GoogleAuth] OAuth Error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Google authentication failed.';

      // Ignore standard user cancellations
      const isDismissed =
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('dismiss') ||
        msg.toLowerCase().includes('closed');

      if (!isDismissed && onError) {
        onError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={loading}
      style={[styles.clerkGoogleButton, style]}
    >
      <XStack alignItems="center" justifyContent="center" gap={10}>
        {loading ? (
          <ActivityIndicator size="small" color="#F3EFE9" />
        ) : (
          <GoogleLogoIcon size={18} />
        )}
        <Text
          fontFamily={fonts.bodyMedium}
          fontSize={14}
          color="#F3EFE9"
          letterSpacing={-0.2}
        >
          {loading ? 'Connecting to Google…' : label}
        </Text>
      </XStack>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clerkGoogleButton: {
    height: 50,
    width: '100%',
    borderRadius: 25,
    backgroundColor: '#18201C',
    borderWidth: 1,
    borderColor: '#2D3A33',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
