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
import { useSignUp } from '@clerk/expo/legacy';
import { YStack, XStack, Text, Input, View, Spinner } from 'tamagui';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle, Mail, Lock, User, KeyRound } from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export default function SignUpScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isLoaded, signUp, setActive } = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [code, setCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | 'code' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        if (!isLoaded || !email.trim() || !password) return;

        setLoading(true);
        setError('');

        try {
            const result = await signUp.create({
                emailAddress: email.trim(),
                password: password,
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                router.replace('/' as any);
            } else {
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setPendingVerification(true);
            }
        } catch (err: any) {
            const message =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                'Sign up failed. Please check your inputs.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!isLoaded || !code.trim()) return;

        setLoading(true);
        setError('');

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: code.trim(),
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace('/' as any);
            } else {
                setError('Verification incomplete. Please check the code.');
            }
        } catch (err: any) {
            const message =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                'Verification failed. Please check the code.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const topPadding = Math.max(insets.top, 16) + 8;
    const bottomPadding = Math.max(insets.bottom, 16);

    const isPasswordValid = password.length >= 5;

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
                        onPress={() => (pendingVerification ? setPendingVerification(false) : router.back())}
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
                    <YStack gap={6} marginTop={16} marginBottom={20}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={26}
                            color={pandraColors.text}
                            letterSpacing={-0.6}
                        >
                            {pendingVerification ? 'Verify your email' : 'Join Pandra Deck'}
                        </Text>
                        <Text
                            fontFamily={fonts.body}
                            fontSize={13.5}
                            color={pandraColors.textSecondary}
                            lineHeight={19}
                        >
                            {pendingVerification
                                ? `We sent a 6-digit confirmation code to ${email}`
                                : 'Create your account to start building interactive dashboards.'}
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

                        {!pendingVerification ? (
                            <>
                                {/* Google Sign Up Button */}
                                <GoogleSignInButton
                                    label="Sign up with Google"
                                    onError={(msg) => setError(msg)}
                                />

                                {/* Divider */}
                                <XStack alignItems="center" gap={12} marginVertical={4}>
                                    <View flex={1} height={1} backgroundColor={pandraColors.border} />
                                    <Text fontFamily={fonts.mono} fontSize={10.5} color={pandraColors.textMuted} letterSpacing={0.8}>
                                        OR REGISTER WITH EMAIL
                                    </Text>
                                    <View flex={1} height={1} backgroundColor={pandraColors.border} />
                                </XStack>

                                {/* Name Fields */}
                                <XStack gap={12}>
                                    <YStack flex={1} gap={6}>
                                        <Text
                                            fontFamily={fonts.bodyMedium}
                                            fontSize={12.5}
                                            color={pandraColors.textSecondary}
                                        >
                                            First name
                                        </Text>
                                        <XStack
                                            style={[
                                                styles.inputContainer,
                                                focusedField === 'name' && styles.inputContainerFocused,
                                            ]}
                                        >
                                            <User
                                                size={15}
                                                color={
                                                    focusedField === 'name'
                                                        ? pandraColors.primary
                                                        : pandraColors.textMuted
                                                }
                                            />
                                            <Input
                                                flex={1}
                                                height="100%"
                                                backgroundColor="transparent"
                                                borderWidth={0}
                                                paddingHorizontal={8}
                                                fontFamily={fonts.body}
                                                fontSize={13.5}
                                                color={pandraColors.text}
                                                placeholder="Sarah"
                                                placeholderTextColor={pandraColors.textDim as any}
                                                value={firstName}
                                                onChangeText={setFirstName}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                autoCapitalize="words"
                                                returnKeyType="next"
                                            />
                                        </XStack>
                                    </YStack>

                                    <YStack flex={1} gap={6}>
                                        <Text
                                            fontFamily={fonts.bodyMedium}
                                            fontSize={12.5}
                                            color={pandraColors.textSecondary}
                                        >
                                            Last name
                                        </Text>
                                        <XStack
                                            style={[
                                                styles.inputContainer,
                                                focusedField === 'name' && styles.inputContainerFocused,
                                            ]}
                                        >
                                            <Input
                                                flex={1}
                                                height="100%"
                                                backgroundColor="transparent"
                                                borderWidth={0}
                                                paddingHorizontal={8}
                                                fontFamily={fonts.body}
                                                fontSize={13.5}
                                                color={pandraColors.text}
                                                placeholder="Connor"
                                                placeholderTextColor={pandraColors.textDim as any}
                                                value={lastName}
                                                onChangeText={setLastName}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                autoCapitalize="words"
                                                returnKeyType="next"
                                            />
                                        </XStack>
                                    </YStack>
                                </XStack>

                                {/* Email Field */}
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

                                {/* Password Field */}
                                <YStack gap={6}>
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                    >
                                        Create password
                                    </Text>
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
                                            placeholder="Minimum 5 characters"
                                            placeholderTextColor={pandraColors.textDim as any}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            secureTextEntry={!passwordVisible}
                                            autoCapitalize="none"
                                            returnKeyType="done"
                                            onSubmitEditing={handleSignUp}
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

                                    {/* Password Length Hint */}
                                    {password.length > 0 && (
                                        <XStack alignItems="center" gap={6} marginTop={2}>
                                            <CheckCircle2
                                                size={13}
                                                color={isPasswordValid ? pandraColors.accentGreen : pandraColors.textMuted}
                                            />
                                            <Text
                                                fontFamily={fonts.mono}
                                                fontSize={11}
                                                color={isPasswordValid ? pandraColors.accentGreen : pandraColors.textSecondary}
                                            >
                                                {isPasswordValid
                                                    ? 'Password length requirement met'
                                                    : `Must be at least 5 characters (${password.length}/5)`}
                                            </Text>
                                        </XStack>
                                    )}
                                </YStack>
                            </>
                        ) : (
                            /* Verification Code Input */
                            <YStack gap={10} alignItems="center" paddingVertical={12}>
                                <View
                                    width={48}
                                    height={48}
                                    borderRadius={24}
                                    backgroundColor={pandraColors.surfaceElevated}
                                    alignItems="center"
                                    justifyContent="center"
                                    marginBottom={4}
                                >
                                    <KeyRound size={22} color={pandraColors.primary} />
                                </View>

                                <Text
                                    fontFamily={fonts.bodyMedium}
                                    fontSize={13}
                                    color={pandraColors.textSecondary}
                                    textAlign="center"
                                >
                                    Enter 6-digit confirmation code
                                </Text>

                                <XStack
                                    style={[
                                        styles.inputContainer,
                                        styles.inputContainerFocused,
                                        { width: '100%', justifyContent: 'center' },
                                    ]}
                                >
                                    <Input
                                        flex={1}
                                        height="100%"
                                        backgroundColor="transparent"
                                        borderWidth={0}
                                        paddingHorizontal={14}
                                        fontFamily={fonts.mono}
                                        fontSize={24}
                                        letterSpacing={8}
                                        textAlign="center"
                                        color={pandraColors.text}
                                        placeholder="······"
                                        placeholderTextColor={pandraColors.textDim as any}
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                        autoFocus
                                        maxLength={6}
                                        returnKeyType="done"
                                        onSubmitEditing={handleVerify}
                                    />
                                </XStack>
                            </YStack>
                        )}
                    </YStack>

                    {/* Bottom Buttons & Login Navigation */}
                    <YStack gap={14} marginTop={28}>
                        {!pendingVerification ? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={loading || !isLoaded || !email.trim() || !password || !isPasswordValid}
                                onPress={handleSignUp}
                                style={[
                                    styles.primarySubmitButton,
                                    (loading || !isLoaded || !email.trim() || !password || !isPasswordValid) && {
                                        opacity: 0.4,
                                    },
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
                                            Create account
                                        </Text>
                                        <ArrowRight size={16} color="#0E1210" />
                                    </XStack>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={loading || !isLoaded || !code.trim() || code.trim().length < 6}
                                onPress={handleVerify}
                                style={[
                                    styles.primarySubmitButton,
                                    (loading || !isLoaded || !code.trim() || code.trim().length < 6) && {
                                        opacity: 0.4,
                                    },
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
                                            Verify & Continue
                                        </Text>
                                        <ArrowRight size={16} color="#0E1210" />
                                    </XStack>
                                )}
                            </TouchableOpacity>
                        )}

                        <XStack alignItems="center" justifyContent="center" gap={6} paddingVertical={4}>
                            <Text
                                fontFamily={fonts.body}
                                fontSize={13}
                                color={pandraColors.textSecondary}
                            >
                                Already have an account?
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => router.push('/(auth)/sign-in' as any)}
                            >
                                <Text
                                    fontFamily={fonts.bodySemibold}
                                    fontSize={13}
                                    color={pandraColors.primary}
                                >
                                    Log in
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
