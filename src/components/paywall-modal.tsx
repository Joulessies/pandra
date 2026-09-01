import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { View, YStack, XStack, Text, Input } from 'tamagui';
import {
  X,
  Zap,
  Check,
  ShieldCheck,
  Layers,
  Cpu,
  Gift,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { useRevenueCat } from '@/hooks/use-revenue-cat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureContext?: string;
}

export function PaywallModal({ isOpen, onClose, featureContext }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const {
    isPro,
    isAdmin,
    offerings,
    purchasePackage,
    restorePurchases,
    simulateUnlockPro,
  } = useRevenueCat();

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Extract RevenueCat packages if available
  const currentOffering = offerings?.current;
  const annualPackage = currentOffering?.annual || currentOffering?.availablePackages.find((p) => p.packageType === 'ANNUAL');
  const monthlyPackage = currentOffering?.monthly || currentOffering?.availablePackages.find((p) => p.packageType === 'MONTHLY');

  const annualPriceString = annualPackage?.product?.priceString || '$39.99 / yr';
  const monthlyPriceString = monthlyPackage?.product?.priceString || '$4.99 / mo';

  const handlePurchase = async () => {
    try {
      setIsProcessingPurchase(true);
      const pkgToBuy = selectedPlan === 'annual' ? annualPackage : monthlyPackage;

      if (pkgToBuy) {
        const success = await purchasePackage(pkgToBuy);
        if (success) {
          Alert.alert('Welcome to Pandra Pro', 'Your subscription is now active.', [
            { text: 'Continue', onPress: onClose },
          ]);
        }
      } else {
        // Fallback simulated purchase for sandbox/hackathon preview
        simulateUnlockPro?.(true);
        Alert.alert(
          'Pro unlocked',
          'Test mode: Pro features are now active for this session.',
          [{ text: 'Continue', onPress: onClose }]
        );
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await restorePurchases();
      if (isPro) {
        onClose();
      }
    } catch (err) {
      console.error('Restore error:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRedeemPromo = () => {
    if (!promoCode.trim()) {
      Alert.alert('Enter code', 'Please enter a valid promo or invite code.');
      return;
    }

    setIsRedeeming(true);
    setTimeout(() => {
      setIsRedeeming(false);
      simulateUnlockPro?.(true);
      Alert.alert(
        'Code applied',
        `Pro access granted via "${promoCode.toUpperCase()}".`,
        [{ text: 'Continue', onPress: onClose }]
      );
      setPromoCode('');
    }, 600);
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View flex={1} justifyContent="flex-end">
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={onClose}
        />

        <View
          backgroundColor={pandraColors.surface}
          borderTopLeftRadius={radius.xl}
          borderTopRightRadius={radius.xl}
          maxHeight="90%"
          paddingTop={12}
          paddingBottom={bottomPadding}
          paddingHorizontal={20}
        >
          {/* Drag Handle */}
          <View
            width={36}
            height={4}
            borderRadius={2}
            backgroundColor={pandraColors.textDim}
            alignSelf="center"
            marginBottom={16}
          />

          {/* Close Button */}
          <XStack justifyContent="flex-end" marginBottom={4}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: pandraColors.surfaceElevated,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} color={pandraColors.textMuted} />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <YStack alignItems="center" marginBottom={20}>
              <Text
                fontFamily={fonts.display}
                fontSize={20}
                color={pandraColors.text}
                textAlign="center"
              >
                Pandra Pro
              </Text>

              <Text
                fontFamily={fonts.body}
                fontSize={13}
                color={pandraColors.textSecondary}
                textAlign="center"
                marginTop={6}
                paddingHorizontal={16}
              >
                {featureContext || 'Unlimited widgets, AI compiler, and cloud sync for your telemetry deck.'}
              </Text>
            </YStack>

            {/* Features */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={16}
              gap={14}
              marginBottom={20}
            >
              {[
                {
                  icon: <Layers size={15} color={pandraColors.primary} />,
                  title: 'Unlimited widgets',
                  desc: 'Build beyond the 4-tile free limit',
                },
                {
                  icon: <Cpu size={15} color={pandraColors.accentPurple} />,
                  title: 'AI widget compiler',
                  desc: 'Create widgets from natural language prompts',
                },
                {
                  icon: <ShieldCheck size={15} color={pandraColors.accentGreen} />,
                  title: 'Encrypted cloud sync',
                  desc: 'Automatic backups across your devices',
                },
              ].map((feature, i) => (
                <XStack key={i} alignItems="center" gap={12}>
                  <View
                    width={30}
                    height={30}
                    borderRadius={radius.xs}
                    backgroundColor={pandraColors.bg}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {feature.icon}
                  </View>
                  <YStack flex={1}>
                    <Text fontFamily={fonts.bodyMedium} fontSize={13} color={pandraColors.text}>
                      {feature.title}
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                      {feature.desc}
                    </Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>

            {/* Plan Selector or Admin Banner */}
            {isAdmin ? (
              <YStack
                backgroundColor={pandraColors.surfaceElevated}
                borderRadius={radius.md}
                padding={16}
                gap={10}
                alignItems="center"
                marginBottom={16}
              >
                <XStack alignItems="center" gap={8}>
                  <Zap size={18} color={pandraColors.accentGreen} />
                  <Text fontFamily={fonts.bodySemibold} fontSize={15} color={pandraColors.text}>
                    Admin VIP Pro Active
                  </Text>
                </XStack>
                <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary} textAlign="center">
                  You have full unrestricted access to all unlimited custom tiles, live weather, telemetry, and AI compilers.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onClose}
                  style={{
                    backgroundColor: pandraColors.primary,
                    borderRadius: radius.sm,
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    marginTop: 4,
                  }}
                >
                  <Text fontFamily={fonts.bodySemibold} fontSize={13} color="#FFF">
                    Close
                  </Text>
                </TouchableOpacity>
              </YStack>
            ) : (
              <>
                <Text
                  fontFamily={fonts.bodyMedium}
                  fontSize={12}
                  color={pandraColors.textSecondary}
                  marginBottom={8}
                >
                  Choose a plan
                </Text>

                <XStack gap={10} marginBottom={18}>
                  {/* Annual */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan('annual')}
                    style={{
                      flex: 1,
                      backgroundColor: selectedPlan === 'annual'
                        ? pandraColors.surfaceElevated
                        : pandraColors.bg,
                      borderWidth: 1.5,
                      borderColor: selectedPlan === 'annual'
                        ? pandraColors.primary
                        : pandraColors.border,
                      borderRadius: radius.md,
                      padding: 14,
                      position: 'relative',
                    }}
                  >
                    <View
                      position="absolute"
                      top={-9}
                      right={10}
                      backgroundColor={pandraColors.accentGreen}
                      paddingHorizontal={7}
                      paddingVertical={2}
                      borderRadius={radius.xs}
                    >
                      <Text fontFamily={fonts.bodyMedium} fontSize={9} color="#000">
                        Save 33%
                      </Text>
                    </View>

                    <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
                      <Text fontFamily={fonts.bodyMedium} fontSize={13} color={pandraColors.text}>
                        Annual
                      </Text>
                      <View
                        width={18}
                        height={18}
                        borderRadius={9}
                        borderWidth={1.5}
                        borderColor={selectedPlan === 'annual' ? pandraColors.primary : pandraColors.textDim}
                        backgroundColor={selectedPlan === 'annual' ? pandraColors.primary : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {selectedPlan === 'annual' && <Check size={11} color="#000" />}
                      </View>
                    </XStack>

                    <Text fontFamily={fonts.display} fontSize={16} color={pandraColors.text}>
                      {annualPriceString}
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.accentGreen} marginTop={4}>
                      7-day free trial
                    </Text>
                  </TouchableOpacity>

                  {/* Monthly */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan('monthly')}
                    style={{
                      flex: 1,
                      backgroundColor: selectedPlan === 'monthly'
                        ? pandraColors.surfaceElevated
                        : pandraColors.bg,
                      borderWidth: 1.5,
                      borderColor: selectedPlan === 'monthly'
                        ? pandraColors.primary
                        : pandraColors.border,
                      borderRadius: radius.md,
                      padding: 14,
                    }}
                  >
                    <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
                      <Text fontFamily={fonts.bodyMedium} fontSize={13} color={pandraColors.text}>
                        Monthly
                      </Text>
                      <View
                        width={18}
                        height={18}
                        borderRadius={9}
                        borderWidth={1.5}
                        borderColor={selectedPlan === 'monthly' ? pandraColors.primary : pandraColors.textDim}
                        backgroundColor={selectedPlan === 'monthly' ? pandraColors.primary : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {selectedPlan === 'monthly' && <Check size={11} color="#000" />}
                      </View>
                    </XStack>

                    <Text fontFamily={fonts.display} fontSize={16} color={pandraColors.text}>
                      {monthlyPriceString}
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted} marginTop={4}>
                      Cancel anytime
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {/* CTA Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handlePurchase}
                  disabled={isProcessingPurchase}
                  style={{
                    backgroundColor: pandraColors.primary,
                    borderRadius: radius.md,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    opacity: isProcessingPurchase ? 0.7 : 1,
                    marginBottom: 16,
                  }}
                >
                  {isProcessingPurchase ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text fontFamily={fonts.bodySemibold} fontSize={14} color="#FFF">
                      {selectedPlan === 'annual' ? 'Start free trial' : 'Subscribe now'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Promo Code */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.sm}
              padding={12}
              marginBottom={14}
            >
              <XStack alignItems="center" gap={6} marginBottom={8}>
                <Gift size={13} color={pandraColors.textMuted} />
                <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.textSecondary}>
                  Promo code
                </Text>
              </XStack>

              <XStack gap={8}>
                <Input
                  flex={1}
                  height={36}
                  backgroundColor={pandraColors.bg}
                  borderWidth={0}
                  borderRadius={radius.xs}
                  color={pandraColors.text}
                  fontFamily={fonts.mono}
                  fontSize={12}
                  placeholder="Enter code"
                  placeholderTextColor={pandraColors.textDim as any}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleRedeemPromo}
                  disabled={isRedeeming}
                  style={{
                    backgroundColor: pandraColors.surfaceHover,
                    borderRadius: radius.xs,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color={pandraColors.primary} />
                  ) : (
                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                      Apply
                    </Text>
                  )}
                </TouchableOpacity>
              </XStack>
            </YStack>

            {/* Footer Links */}
            <XStack justifyContent="center" alignItems="center" gap={16} marginBottom={8}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRestore}
                disabled={isRestoring}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.primary}>
                  {isRestoring ? 'Restoring…' : 'Restore purchases'}
                </Text>
              </TouchableOpacity>

              <Text color={pandraColors.textDim}>·</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://revenuecat.com/terms')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                  Terms & Privacy
                </Text>
              </TouchableOpacity>
            </XStack>

            <Text
              fontFamily={fonts.body}
              fontSize={10}
              color={pandraColors.textDim}
              textAlign="center"
              paddingHorizontal={16}
            >
              Subscription automatically renews unless auto-renew is cancelled at least 24 hours before the end of the trial or current billing period. Manage anytime in Google Play Store.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
