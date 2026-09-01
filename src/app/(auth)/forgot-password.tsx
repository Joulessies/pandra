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
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Mail, Lock, KeyRound } from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isLoaded, signIn, setActive } = useSignIn();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'code' | 'password' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Send reset code
    const onRequestReset = async () => {
        if (!isLoaded || !email.trim()) return;

        setLoading(true);
        setError('');

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email.trim(),
            });
            setSuccessfulCreation(true);
        } catch (err: any) {
            const message =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                'Could not send reset code. Please check your email.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code & set new password
    const onResetPassword = async () => {
        if (!isLoaded || !code.trim() || !password) return;

        setLoading(true);
        setError('');

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: code.trim(),
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                router.replace('/' as any);
            } else {
                setError('Password reset incomplete. Please try again.');
            }
        } catch (err: any) {
            const message =
                err?.errors?.[0]?.longMessage ||
                err?.errors?.[0]?.message ||
                'Password reset failed. Please check the code and password.';
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
                        onPress={() => (successfulCreation ? setSuccessfulCreation(false) : router.back())}
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
                    {/* Header */}
                    <YStack gap={6} marginTop={16} marginBottom={24}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={26}
                            color={pandraColors.text}
                            letterSpacing={-0.6}
                        >
                            {successfulCreation ? 'Reset password' : 'Forgot password'}
                        </Text>
                        <Text
                            fontFamily={fonts.body}
                            fontSize={13.5}
                            color={pandraColors.textSecondary}
                            lineHeight={19}
                        >
                            {successfulCreation
                                ? `Enter the 6-digit code sent to ${email} and choose a new password.`
                                : 'Enter your registered email to receive a password recovery code.'}
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

                        {!successfulCreation ? (
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
                                        returnKeyType="done"
                                        onSubmitEditing={onRequestReset}
                                    />
                                </XStack>
                            </YStack>
                        ) : (
                            <>
                                {/* Verification Code Field */}
                                <YStack gap={6}>
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                    >
                                        Verification code
                                    </Text>
                                    <XStack
                                        style={[
                                            styles.inputContainer,
                                            focusedField === 'code' && styles.inputContainerFocused,
                                        ]}
                                    >
                                        <KeyRound
                                            size={16}
                                            color={
                                                focusedField === 'code'
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
                                            fontFamily={fonts.mono}
                                            fontSize={16}
                                            color={pandraColors.text}
                                            placeholder="6-digit code"
                                            placeholderTextColor={pandraColors.textDim as any}
                                            value={code}
                                            onChangeText={setCode}
                                            onFocus={() => setFocusedField('code')}
                                            onBlur={() => setFocusedField(null)}
                                            keyboardType="number-pad"
                                            autoFocus
                                            returnKeyType="next"
                                        />
                                    </XStack>
                                </YStack>

                                {/* New Password Field */}
                                <YStack gap={6}>
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                    >
                                        New password
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
                                            placeholder="Enter your new password"
                                            placeholderTextColor={pandraColors.textDim as any}
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            secureTextEntry={!passwordVisible}
                                            autoCapitalize="none"
                                            returnKeyType="done"
                                            onSubmitEditing={onResetPassword}
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
                            </>
                        )}
                    </YStack>

                    {/* Bottom Submit & Navigation */}
                    <YStack gap={14} marginTop={32}>
                        {!successfulCreation ? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={loading || !email.trim()}
                                onPress={onRequestReset}
                                style={[
                                    styles.primarySubmitButton,
                                    (loading || !email.trim()) && { opacity: 0.4 },
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
                                            Send recovery code
                                        </Text>
                                        <ArrowRight size={16} color="#0E1210" />
                                    </XStack>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={loading || !code.trim() || !password}
                                onPress={onResetPassword}
                                style={[
                                    styles.primarySubmitButton,
                                    (loading || !code.trim() || !password) && { opacity: 0.4 },
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
                                            Update password & sign in
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
                                Remember your password?
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
