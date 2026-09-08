import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo/legacy";
import { useClerk } from "@clerk/expo";
import { YStack, XStack, Text, Input, View, Spinner } from "tamagui";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  KeyRound,
  RefreshCw,
} from "lucide-react-native";
import { pandraColors, fonts, radius } from "@/theme/token";
import { useForgotPasswordStore } from "@/stores";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();

  const {
    email,
    code,
    password,
    confirmPassword,
    passwordVisible,
    confirmPasswordVisible,
    successfulCreation,
    focusedField,
    loading,
    resendLoading,
    resendCooldown,
    infoMessage,
    error,
    setEmail,
    setCode,
    setPassword,
    setConfirmPassword,
    setPasswordVisible,
    setConfirmPasswordVisible,
    setSuccessfulCreation,
    setFocusedField,
    setLoading,
    setResendLoading,
    setResendCooldown,
    setInfoMessage,
    setError,
  } = useForgotPasswordStore();

  const clerkMinLength = (clerk as any)?.environment?.userSettings
    ?.passwordSettings?.min_length;
  const minPasswordLength =
    typeof clerkMinLength === "number" && clerkMinLength > 0
      ? clerkMinLength
      : 8;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isLengthValid = password.length >= minPasswordLength;
  const doPasswordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onRequestReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setError("");
    setInfoMessage("");

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Authentication service is initializing. Please try again.");
      return;
    }

    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: trimmedEmail,
      });
      setSuccessfulCreation(true);
      setResendCooldown(30);
      setInfoMessage(`Reset code sent to ${trimmedEmail}`);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Could not send reset code. Please check your email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn || resendLoading || resendCooldown > 0) return;

    setResendLoading(true);
    setError("");
    setInfoMessage("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setInfoMessage(`New reset code sent to ${email.trim()}`);
      setResendCooldown(30);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Could not resend code. Please try again.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const onResetPassword = async () => {
    const trimmedCode = code.trim();
    if (!isLoaded || !trimmedCode || !password) return;

    setError("");
    setInfoMessage("");

    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: trimmedCode,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/" as any);
      } else {
        setError("Password reset incomplete. Please try again.");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Password reset failed. Please check the code and password.";
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {}
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
            onPress={() =>
              successfulCreation ? setSuccessfulCreation(false) : router.back()
            }
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
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {}
          <YStack gap={6} marginTop={16} marginBottom={24}>
            <Text
              fontFamily={fonts.display}
              fontSize={26}
              color={pandraColors.text}
              letterSpacing={-0.6}
            >
              {successfulCreation ? "Reset password" : "Forgot password"}
            </Text>
            <Text
              fontFamily={fonts.body}
              fontSize={13.5}
              color={pandraColors.textSecondary}
              lineHeight={19}
            >
              {successfulCreation
                ? `Enter the 6-digit code sent to ${email} and choose a new password.`
                : "Enter your registered email to receive a password recovery code."}
            </Text>
          </YStack>

          {}
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

            {infoMessage ? (
              <XStack
                alignItems="center"
                gap={10}
                backgroundColor={pandraColors.successBg}
                borderWidth={1}
                borderColor="rgba(5, 150, 105, 0.3)"
                borderRadius={radius.md}
                padding={14}
              >
                <CheckCircle2 size={16} color={pandraColors.success} />
                <Text
                  flex={1}
                  fontFamily={fonts.bodyMedium}
                  fontSize={12.5}
                  color={pandraColors.success}
                  lineHeight={17}
                >
                  {infoMessage}
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
                    focusedField === "email" && styles.inputContainerFocused,
                  ]}
                >
                  <Mail
                    size={16}
                    color={
                      focusedField === "email"
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
                    onFocus={() => setFocusedField("email")}
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
                {}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  paddingHorizontal={4}
                  paddingVertical={2}
                >
                  <Text
                    fontFamily={fonts.mono}
                    fontSize={12}
                    color={pandraColors.textSecondary}
                  >
                    Sent to {email.trim()}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setSuccessfulCreation(false);
                      setError("");
                      setInfoMessage("");
                    }}
                  >
                    <Text
                      fontFamily={fonts.bodySemibold}
                      fontSize={12}
                      color={pandraColors.primary}
                    >
                      Change email
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {}
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
                      focusedField === "code" && styles.inputContainerFocused,
                    ]}
                  >
                    <KeyRound
                      size={16}
                      color={
                        focusedField === "code"
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
                      onFocus={() => setFocusedField("code")}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="number-pad"
                      autoFocus
                      maxLength={6}
                      returnKeyType="next"
                    />
                  </XStack>

                  {}
                  <XStack alignItems="center" gap={6} marginTop={2}>
                    <RefreshCw
                      size={13}
                      color={
                        resendCooldown > 0
                          ? pandraColors.textMuted
                          : pandraColors.primary
                      }
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={resendLoading || resendCooldown > 0}
                      onPress={handleResendCode}
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={12}
                        color={
                          resendCooldown > 0
                            ? pandraColors.textMuted
                            : pandraColors.primary
                        }
                      >
                        {resendLoading
                          ? "Sending..."
                          : resendCooldown > 0
                            ? `Resend code in ${resendCooldown}s`
                            : "Resend code"}
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                {}
                <YStack gap={6}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={12.5}
                      color={pandraColors.textSecondary}
                    >
                      New password
                    </Text>
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={11}
                      color={
                        isLengthValid
                          ? pandraColors.success
                          : pandraColors.textMuted
                      }
                    >
                      {password.length}/{minPasswordLength} chars
                    </Text>
                  </XStack>
                  <XStack
                    style={[
                      styles.inputContainer,
                      focusedField === "password" &&
                        styles.inputContainerFocused,
                    ]}
                  >
                    <Lock
                      size={16}
                      color={
                        focusedField === "password"
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
                      placeholder={`Minimum ${minPasswordLength} characters`}
                      placeholderTextColor={pandraColors.textDim as any}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!passwordVisible}
                      autoCapitalize="none"
                      returnKeyType="next"
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

                  {}
                  {password.length > 0 && (
                    <XStack alignItems="center" gap={6} marginTop={2}>
                      <CheckCircle2
                        size={13}
                        color={
                          isLengthValid
                            ? pandraColors.success
                            : pandraColors.textMuted
                        }
                      />
                      <Text
                        fontFamily={fonts.mono}
                        fontSize={11}
                        color={
                          isLengthValid
                            ? pandraColors.success
                            : pandraColors.textSecondary
                        }
                      >
                        {isLengthValid
                          ? `Password length met (${password.length}/${minPasswordLength})`
                          : `Must be at least ${minPasswordLength} characters (${password.length}/${minPasswordLength})`}
                      </Text>
                    </XStack>
                  )}
                </YStack>

                {}
                <YStack gap={6}>
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={12.5}
                    color={pandraColors.textSecondary}
                  >
                    Confirm new password
                  </Text>
                  <XStack
                    style={[
                      styles.inputContainer,
                      focusedField === "confirmPassword" &&
                        styles.inputContainerFocused,
                    ]}
                  >
                    <Lock
                      size={16}
                      color={
                        focusedField === "confirmPassword"
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
                      placeholder="Re-enter your new password"
                      placeholderTextColor={pandraColors.textDim as any}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!confirmPasswordVisible}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={onResetPassword}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{ padding: 6 }}
                      onPress={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                    >
                      {confirmPasswordVisible ? (
                        <Eye size={17} color={pandraColors.primary} />
                      ) : (
                        <EyeOff size={17} color={pandraColors.textDim} />
                      )}
                    </TouchableOpacity>
                  </XStack>

                  {}
                  {confirmPassword.length > 0 && (
                    <XStack alignItems="center" gap={6} marginTop={2}>
                      {doPasswordsMatch ? (
                        <>
                          <CheckCircle2
                            size={13}
                            color={pandraColors.success}
                          />
                          <Text
                            fontFamily={fonts.mono}
                            fontSize={11}
                            color={pandraColors.success}
                          >
                            Passwords match
                          </Text>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} color={pandraColors.error} />
                          <Text
                            fontFamily={fonts.mono}
                            fontSize={11}
                            color={pandraColors.error}
                          >
                            Passwords do not match
                          </Text>
                        </>
                      )}
                    </XStack>
                  )}
                </YStack>
              </>
            )}
          </YStack>

          {}
          <YStack gap={14} marginTop={32}>
            {!successfulCreation ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading || !isLoaded || !isEmailValid}
                onPress={onRequestReset}
                style={[
                  styles.primarySubmitButton,
                  (loading || !isLoaded || !isEmailValid) && { opacity: 0.4 },
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
                disabled={
                  loading ||
                  !isLoaded ||
                  !code.trim() ||
                  code.trim().length < 6 ||
                  !isLengthValid ||
                  !doPasswordsMatch
                }
                onPress={onResetPassword}
                style={[
                  styles.primarySubmitButton,
                  (loading ||
                    !isLoaded ||
                    !code.trim() ||
                    code.trim().length < 6 ||
                    !isLengthValid ||
                    !doPasswordsMatch) && { opacity: 0.4 },
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

            <XStack
              alignItems="center"
              justifyContent="center"
              gap={6}
              paddingVertical={4}
            >
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
                onPress={() => router.push("/(auth)/sign-in" as any)}
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
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    height: 50,
    backgroundColor: pandraColors.surface,
    borderWidth: 1,
    borderColor: pandraColors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  inputContainerFocused: {
    borderColor: pandraColors.primary,
    backgroundColor: pandraColors.surfaceElevated,
  },
  primarySubmitButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: pandraColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
