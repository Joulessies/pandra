import React from 'react';
import { Modal, TouchableOpacity, ScrollView } from 'react-native';
import { View, YStack, XStack, Text } from 'tamagui';
import {
  Sparkles,
  Zap,
  Maximize2,
  ChevronUp,
  ArrowRight,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FirstLaunchModalProps {
  isOpen: boolean;
  userName: string;
  userRoleTitle?: string;
  trialDaysRemaining?: number;
  onGetStarted: () => void;
}

export function FirstLaunchModal({
  isOpen,
  userName,
  userRoleTitle = 'Fullstack Builder',
  trialDaysRemaining = 7,
  onGetStarted,
}: FirstLaunchModalProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View flex={1} backgroundColor="rgba(0, 0, 0, 0.75)" justifyContent="flex-end">
        <View
          backgroundColor={pandraColors.surface}
          borderTopLeftRadius={radius.xl}
          borderTopRightRadius={radius.xl}
          paddingTop={16}
          paddingBottom={bottomPadding + 8}
          paddingHorizontal={24}
          maxHeight="90%"
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Mascot & Header */}
            <XStack alignItems="center" gap={14} marginBottom={14}>
              <YStack flex={1}>
                <Text fontFamily={fonts.display} fontSize={18} color={pandraColors.text}>
                  Welcome, {userName || 'Builder'}!
                </Text>
                <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                  Your personal command deck has been calibrated for {userRoleTitle}.
                </Text>
              </YStack>
            </XStack>

            {/* Complimentary 7-Day Pro Explorer Card */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={8}
              marginBottom={16}
              borderWidth={1}
              borderColor="rgba(16, 185, 129, 0.25)"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap={6}>
                  <Zap size={15} color={pandraColors.accentGreen} />
                  <Text fontFamily={fonts.bodySemibold} fontSize={13} color={pandraColors.text}>
                    7-Day Pro Explorer Pass Active
                  </Text>
                </XStack>
                <View
                  paddingHorizontal={7}
                  paddingVertical={2}
                  borderRadius={radius.xs}
                  backgroundColor="rgba(16, 185, 129, 0.12)"
                >
                  <Text fontFamily={fonts.bodyMedium} fontSize={10} color={pandraColors.accentGreen}>
                    {trialDaysRemaining}d Left
                  </Text>
                </View>
              </XStack>

              <Text fontFamily={fonts.body} fontSize={11.5} color={pandraColors.textSecondary} lineHeight={16}>
                Enjoy full access to unlimited custom widgets, 10s fast telemetry polling, and the AI prompt compiler during your first week.
              </Text>
            </YStack>

            {/* Quick Micro-Tour Tips */}
            <Text fontFamily={fonts.bodySemibold} fontSize={13} color={pandraColors.text} marginBottom={10}>
              Quick Deck Controls
            </Text>

            <YStack gap={10} marginBottom={20}>
              {/* Tip 1 */}
              <XStack
                backgroundColor={pandraColors.bg}
                borderRadius={radius.sm}
                padding={12}
                alignItems="center"
                gap={12}
              >
                <View
                  width={32}
                  height={32}
                  borderRadius={radius.xs}
                  backgroundColor={pandraColors.surfaceElevated}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Maximize2 size={15} color={pandraColors.primary} />
                </View>
                <YStack flex={1}>
                  <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                    Tap to Resize & Customize
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted} lineHeight={14}>
                    Toggle any widget between 1x1 Square and 2x1 Wide Banner or edit colors & telemetry.
                  </Text>
                </YStack>
              </XStack>

              {/* Tip 2 */}
              <XStack
                backgroundColor={pandraColors.bg}
                borderRadius={radius.sm}
                padding={12}
                alignItems="center"
                gap={12}
              >
                <View
                  width={32}
                  height={32}
                  borderRadius={radius.xs}
                  backgroundColor={pandraColors.surfaceElevated}
                  alignItems="center"
                  justifyContent="center"
                >
                  <ChevronUp size={15} color={pandraColors.secondary} />
                </View>
                <YStack flex={1}>
                  <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                    Reorder Deck Priority
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted} lineHeight={14}>
                    Move critical oracles and live status cards to the top of your screen.
                  </Text>
                </YStack>
              </XStack>

              {/* Tip 3 */}
              <XStack
                backgroundColor={pandraColors.bg}
                borderRadius={radius.sm}
                padding={12}
                alignItems="center"
                gap={12}
              >
                <View
                  width={32}
                  height={32}
                  borderRadius={radius.xs}
                  backgroundColor={pandraColors.surfaceElevated}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Sparkles size={15} color={pandraColors.accentPurple} />
                </View>
                <YStack flex={1}>
                  <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                    AI Prompt Compiler
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted} lineHeight={14}>
                    {"Type 'Weather in Tokyo', 'Track github repo', or crypto symbols to synthesize widgets instantly."}
                  </Text>
                </YStack>
              </XStack>
            </YStack>

            {/* Launch CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onGetStarted}
              style={{
                backgroundColor: pandraColors.primary,
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Text fontFamily={fonts.bodySemibold} fontSize={14} color="#FFF">
                Open Command Deck
              </Text>
              <ArrowRight size={15} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
