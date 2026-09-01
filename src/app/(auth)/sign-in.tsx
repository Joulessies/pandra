import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/expo/legacy';
import { YStack, XStack, Text, Input, View, Spinner } from 'tamagui';
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { ADMIN_CREDENTIALS } from '@/services/widget-storage';
import { useAppAuth } from '@/providers/auth-provider';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function SignInScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isLoaded, signIn, setActive } = useSignIn();
    const { loginAsAdmin } = useAppAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignIn = async (overrideEmail?: string, overridePass?: string) => {
        const targetEmail = overrideEmail || email;
        const targetPass = overridePass || password;

        if (!targetEmail || !targetPass) return;

        setLoading(true);
        setError('');

        // If logging in as Admin, activate persistent admin session immediately
        if (
            targetEmail.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() ||
            (targetEmail.toLowerCase().startsWith('admin@') && targetPass === ADMIN_CREDENTIALS.password)
        ) {
            await loginAsAdmin();
            router.replace('/' as any);
            setLoading(false);
            return;
        }

        try {
            if (isLoaded && signIn) {
                const result = await signIn.create({
                    identifier: targetEmail.trim(),
                    password: targetPass,
                });

                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    router.replace('/' as any);
                    return;
                }
            }
        } catch (err: any) {
            const message =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                'Sign in failed. Please check your credentials.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const topPadding = Math.max(insets.top, 16) + 8;
    const bottomPadding = Math.max(insets.bottom, 16);

    return (
        <View flex={1} backgroundColor={pandraColors.bg}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Top Bar */}
                <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingTop={topPadding}
                    paddingBottom={12}
                    backgroundColor={pandraColors.bg}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={18} color={pandraColors.text} />
                    </TouchableOpacity>
                    <XStack alignItems="center" gap={8}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={16}
                            color={pandraColors.text}
                            letterSpacing={-0.3}
                        >
                            Pandra
                        </Text>
                    </XStack>
                    <View width={36} />
                </XStack>

                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingBottom: bottomPadding + 20,
                        flexGrow: 1,
                        justifyContent: 'space-between',
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Main Header */}
                    <YStack gap={6} marginTop={16} marginBottom={24}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={26}
                            color={pandraColors.text}
                            letterSpacing={-0.6}
                        >
                            Welcome back
                        </Text>
                        <Text
                            fontFamily={fonts.body}
                            fontSize={13.5}
                            color={pandraColors.textSecondary}
                            lineHeight={19}
                        >
                            Sign in to access your customized dashboard and live telemetry deck.
                        </Text>
                    </YStack>

                    {/* Form Area */}
                    <YStack gap={16}>
                        {error ? (
                            <XStack
                                alignItems="center"
                                gap={10}
                                backgroundColor={pandraColors.errorBg}
                                borderWidth={1}
                                borderColor="rgba(239, 68, 68, 0.3)"
                                borderRadius={radius.md}
                                padding={14}
                            >
                                <AlertCircle size={16} color={pandraColors.error} />
                                <Text
                                    flex={1}
                                    fontFamily={fonts.bodyMedium}
                                    fontSize={12.5}
                                    color={pandraColors.error}
                                    lineHeight={17}
                                >
                                    {error}
                                </Text>
                            </XStack>
                        ) : null}

                        {/* Google Authentication Button */}
                        <GoogleSignInButton
                            label="Sign in with Google"
                            onError={(msg) => setError(msg)}
                        />

                        {/* Elegant Divider */}
                        <XStack alignItems="center" gap={12} marginVertical={4}>
                            <View flex={1} height={1} backgroundColor={pandraColors.border} />
                            <Text fontFamily={fonts.mono} fontSize={10.5} color={pandraColors.textMuted} letterSpacing={0.8}>
                                OR WITH EMAIL
                            </Text>
                            <View flex={1} height={1} backgroundColor={pandraColors.border} />
                        </XStack>

                        {/* Email Input Field */}
                        <YStack gap={6}>
                            <Text
                                fontFamily={fonts.bodyMedium}
                                fontSize={12.5}
                                color={pandraColors.textSecondary}
                            >
                                Email address
                            </Text>
                            <XStack
                                style={[
                                    styles.inputContainer,
                                    focusedField === 'email' && styles.inputContainerFocused,
                                ]}
                            >
                                <Mail
                                    size={16}
                                    color={
                                        focusedField === 'email'
                                            ? pandraColors.primary
                                            : pandraColors.textMuted
                                    }
                                />
                                <Input
                                    flex={1}
                                    height="100%"
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    paddingHorizontal={10}
                                    fontFamily={fonts.body}
                                    fontSize={14}
                                    color={pandraColors.text}
                                    placeholder="builder@pandra.dev"
                                    placeholderTextColor={pandraColors.textDim as any}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                />
                            </XStack>
                        </YStack>

                        {/* Password Input Field */}
                        <YStack gap={6}>
                            <XStack justifyContent="space-between" alignItems="center">
                                <Text
                                    fontFamily={fonts.bodyMedium}
                                    fontSize={12.5}
                                    color={pandraColors.textSecondary}
                                >
                                    Password
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    onPress={() => router.push('/(auth)/forgot-password' as any)}
                                >
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={12}
                                        color={pandraColors.primary}
                                    >
                                        Forgot?
                                    </Text>
                                </TouchableOpacity>
                            </XStack>

                            <XStack
                                style={[
                                    styles.inputContainer,
                                    focusedField === 'password' && styles.inputContainerFocused,
                                ]}
                            >
                                <Lock
                                    size={16}
                                    color={
                                        focusedField === 'password'
                                            ? pandraColors.primary
                                            : pandraColors.textMuted
                                    }
                                />
                                <Input
                                    flex={1}
                                    height="100%"
                                    backgroundColor="transparent"
                                    borderWidth={0}
                                    paddingHorizontal={10}
                                    fontFamily={fonts.body}
                                    fontSize={14}
                                    color={pandraColors.text}
                                    placeholder="Enter your password"
                                    placeholderTextColor={pandraColors.textDim as any}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry={!passwordVisible}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={() => handleSignIn()}
                                />
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ padding: 6 }}
                                    onPress={() => setPasswordVisible(!passwordVisible)}
                                >
                                    {passwordVisible ? (
                                        <Eye size={17} color={pandraColors.primary} />
                                    ) : (
                                        <EyeOff size={17} color={pandraColors.textDim} />
                                    )}
                                </TouchableOpacity>
                            </XStack>
                        </YStack>
                    </YStack>

                    {/* Bottom Submission & Sign-up Navigation */}
                    <YStack gap={14} marginTop={32}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={loading || !email.trim() || !password}
                            onPress={() => handleSignIn()}
                            style={[
                                styles.primarySubmitButton,
                                (loading || !email.trim() || !password) && { opacity: 0.4 },
                            ]}
                        >
                            {loading ? (
                                <Spinner color="#0E1210" />
                            ) : (
                                <XStack alignItems="center" gap={8}>
                                    <Text
                                        fontFamily={fonts.bodySemibold}
                                        fontSize={14}
                                        color="#0E1210"
                                    >
                                        Sign in to Deck
                                    </Text>
                                    <ArrowRight size={16} color="#0E1210" />
                                </XStack>
                            )}
                        </TouchableOpacity>

                        <XStack alignItems="center" justifyContent="center" gap={6} paddingVertical={4}>
                            <Text
                                fontFamily={fonts.body}
                                fontSize={13}
                                color={pandraColors.textSecondary}
                            >
                                {"Don't have an account?"}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => router.push('/(auth)/sign-up' as any)}
                            >
                                <Text
                                    fontFamily={fonts.bodySemibold}
                                    fontSize={13}
                                    color={pandraColors.primary}
                                >
                                    Create account
                                </Text>
                            </TouchableOpacity>
                        </XStack>
                    </YStack>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        backgroundColor: pandraColors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputContainer: {
        height: 50,
        backgroundColor: pandraColors.surface,
        borderWidth: 1,
        borderColor: pandraColors.border,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    inputContainerFocused: {
        borderColor: pandraColors.primary,
        backgroundColor: pandraColors.surfaceElevated,
    },
    primarySubmitButton: {
        height: 50,
        borderRadius: radius.md,
        backgroundColor: pandraColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});