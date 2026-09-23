import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { View, YStack, XStack, Text } from 'tamagui';
import {
  X,
  Smartphone,
  Check,
  RefreshCw,
  ChevronRight,
  Globe,
  CheckCircle2,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { CustomWidget } from '@/types/widget';
import {
  NativeWidgetSlot,
  NativeWidgetSlotsState,
  getNativeWidgetSlotAssignments,
  syncDeckToNativeWidgets,
  pinWidgetToHomeScreen,
} from '@/services/native-widget-bridge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HomeScreenWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: CustomWidget[];
}

export function HomeScreenWidgetModal({
  isOpen,
  onClose,
  widgets,
}: HomeScreenWidgetModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedSlot, setSelectedSlot] = useState<NativeWidgetSlot>('slot_small');
  const [slotAssignments, setSlotAssignments] = useState<NativeWidgetSlotsState>({
    slot_small: null,
    slot_medium: null,
    slot_accessory: null,
    lastSyncedAt: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>(
    Platform.OS === 'android' ? 'android' : 'ios'
  );

  useEffect(() => {
    if (isOpen) {
      loadState();
    }
  }, [isOpen, widgets]);

  async function loadState() {
    const slots = await getNativeWidgetSlotAssignments();
    setSlotAssignments(slots);
  }

  async function handleAssignWidgetToSlot(slot: NativeWidgetSlot, widgetId: string) {
    const updated = {
      ...slotAssignments,
      [slot]: widgetId,
    };
    setSlotAssignments(updated);
    setIsSyncing(true);
    const res = await syncDeckToNativeWidgets(widgets, updated);
    setIsSyncing(false);
    if (res.success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
      loadState();
    }
  }

  async function handleForceSync() {
    setIsSyncing(true);
    const res = await syncDeckToNativeWidgets(widgets, slotAssignments);
    setIsSyncing(false);
    if (res.success) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
      loadState();
      Alert.alert(
        'Widgets Synced!',
        'Your latest telemetry metrics have been exported to the phone’s native widget storage.'
      );
    }
  }

  async function handlePinToHomeScreen() {
    setIsPinning(true);
    await syncDeckToNativeWidgets(widgets, slotAssignments);
    const targetName =
      selectedSlot === 'slot_small' ? 'PandraSmallWidget' : 'PandraWideWidget';
    const success = await pinWidgetToHomeScreen(targetName);
    setIsPinning(false);
    if (success) {
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 2500);
      Alert.alert(
        'Widget Added!',
        'Your widget has been pinned to your home screen with live metrics.'
      );
    } else {
      Alert.alert(
        'Widget Ready to Place',
        'Your widget data is synced! You can touch & hold any empty area on your phone home screen, tap Widgets, find Pandra, and drag it to your screen.'
      );
    }
  }

  const currentAssignedWidgetId = slotAssignments[selectedSlot];
  const assignedWidget =
    widgets.find((w) => w.id === currentAssignedWidgetId) ||
    (selectedSlot === 'slot_medium'
      ? widgets.find((w) => w.size === 'wide') || widgets[0]
      : widgets[0]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          { }
          <View style={styles.handleBar} />

          { }
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal={20}
            marginBottom={14}
          >
            <XStack alignItems="center" gap={10}>
              <View
                width={36}
                height={36}
                borderRadius={radius.sm}
                backgroundColor={pandraColors.surfaceElevated}
                alignItems="center"
                justifyContent="center"
              >
                <Smartphone size={18} color={pandraColors.primary} />
              </View>
              <YStack>
                <Text
                  fontFamily={fonts.display}
                  fontSize={18}
                  color={pandraColors.text}
                  letterSpacing={-0.3}
                >
                  Home Screen Widgets
                </Text>
                <Text
                  fontFamily={fonts.body}
                  fontSize={11.5}
                  color={pandraColors.textMuted}
                >
                  iOS WidgetKit & Android AppWidgets
                </Text>
              </YStack>
            </XStack>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={18} color={pandraColors.textSecondary} />
            </TouchableOpacity>
          </XStack>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          >
            { }
            <YStack gap={8} marginBottom={18}>
              <Text
                fontFamily={fonts.mono}
                fontSize={10.5}
                color={pandraColors.textMuted}
                letterSpacing={0.8}
              >
                SELECT NATIVE WIDGET SLOT
              </Text>
              <XStack gap={8}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSlot('slot_small')}
                  style={[
                    styles.slotTab,
                    selectedSlot === 'slot_small' && styles.slotTabActive,
                  ]}
                >
                  <Text
                    fontFamily={
                      selectedSlot === 'slot_small'
                        ? fonts.bodyMedium
                        : fonts.body
                    }
                    fontSize={12.5}
                    color={
                      selectedSlot === 'slot_small'
                        ? pandraColors.text
                        : pandraColors.textMuted
                    }
                  >
                    Small (2×2)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSlot('slot_medium')}
                  style={[
                    styles.slotTab,
                    selectedSlot === 'slot_medium' && styles.slotTabActive,
                  ]}
                >
                  <Text
                    fontFamily={
                      selectedSlot === 'slot_medium'
                        ? fonts.bodyMedium
                        : fonts.body
                    }
                    fontSize={12.5}
                    color={
                      selectedSlot === 'slot_medium'
                        ? pandraColors.text
                        : pandraColors.textMuted
                    }
                  >
                    Medium (4×2)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSlot('slot_accessory')}
                  style={[
                    styles.slotTab,
                    selectedSlot === 'slot_accessory' && styles.slotTabActive,
                  ]}
                >
                  <Text
                    fontFamily={
                      selectedSlot === 'slot_accessory'
                        ? fonts.bodyMedium
                        : fonts.body
                    }
                    fontSize={12.5}
                    color={
                      selectedSlot === 'slot_accessory'
                        ? pandraColors.text
                        : pandraColors.textMuted
                    }
                  >
                    Lock Screen
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>

            { }
            <YStack
              backgroundColor="#080C0A"
              borderRadius={radius.lg}
              padding={18}
              borderWidth={1}
              borderColor={pandraColors.border}
              alignItems="center"
              marginBottom={20}
              gap={12}
            >
              <XStack
                justifyContent="space-between"
                width="100%"
                alignItems="center"
              >
                <XStack alignItems="center" gap={6}>
                  <View
                    width={6}
                    height={6}
                    borderRadius={3}
                    backgroundColor={pandraColors.accentGreen}
                  />
                  <Text
                    fontFamily={fonts.mono}
                    fontSize={10}
                    color={pandraColors.textMuted}
                    letterSpacing={0.6}
                  >
                    NATIVE HOME SCREEN PREVIEW
                  </Text>
                </XStack>
                <Text
                  fontFamily={fonts.mono}
                  fontSize={10}
                  color={pandraColors.textDim}
                >
                  {selectedSlot === 'slot_small'
                    ? '158 × 158 dp'
                    : selectedSlot === 'slot_medium'
                    ? '338 × 158 dp'
                    : 'Inline Accessory'}
                </Text>
              </XStack>

              {/* Preview Canvas */}
              {selectedSlot === 'slot_small' && (
                <View style={styles.nativeSmallTile}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <View
                      paddingHorizontal={7}
                      paddingVertical={2.5}
                      borderRadius={7}
                      backgroundColor="#25372C"
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={9}
                        color={assignedWidget?.badgeColor || pandraColors.primaryLight}
                      >
                        {assignedWidget?.badge || 'LIVE'}
                      </Text>
                    </View>
                    <XStack alignItems="center" gap={4}>
                      <View width={4} height={4} borderRadius={2} backgroundColor="#34D399" />
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={9.5}
                        color={pandraColors.textDim}
                      >
                        Pandra
                      </Text>
                    </XStack>
                  </XStack>

                  <YStack gap={1}>
                    <Text
                      fontFamily={fonts.display}
                      fontSize={25}
                      color="#FAF8F5"
                      letterSpacing={-0.5}
                      numberOfLines={1}
                    >
                      {assignedWidget?.metric || '--'}
                    </Text>
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={8.5}
                      color={pandraColors.primaryLight}
                      letterSpacing={0.5}
                    >
                      {(assignedWidget?.metricLabel || 'PANDRA TELEMETRY').toUpperCase()}
                    </Text>
                  </YStack>

                  <YStack>
                    <Text
                      fontFamily={fonts.bodySemibold}
                      fontSize={11.5}
                      color="#FAF8F5"
                      numberOfLines={1}
                    >
                      {assignedWidget?.title || 'Overview'}
                    </Text>
                    <Text
                      fontFamily={fonts.body}
                      fontSize={9.5}
                      color={pandraColors.textSecondary}
                      numberOfLines={1}
                    >
                      {assignedWidget?.subtitle || 'Live Feed'}
                    </Text>
                  </YStack>
                </View>
              )}

              {selectedSlot === 'slot_medium' && (
                <View style={styles.nativeMediumTile}>
                  <XStack justifyContent="space-between" alignItems="center" flex={1}>
                    {/* Left Column */}
                    <YStack justifyContent="space-between" height="100%" flex={1} marginRight={12}>
                      <XStack alignItems="center" gap={5}>
                        <View
                          width={5}
                          height={5}
                          borderRadius={2.5}
                          backgroundColor="#34D399"
                        />
                        <Text
                          fontFamily={fonts.mono}
                          fontSize={8.5}
                          color={pandraColors.primaryLight}
                          letterSpacing={0.5}
                          numberOfLines={1}
                        >
                          {(assignedWidget?.metricLabel || 'PANDRA TELEMETRY').toUpperCase()}
                        </Text>
                      </XStack>

                      <Text
                        fontFamily={fonts.display}
                        fontSize={27}
                        color="#FAF8F5"
                        letterSpacing={-0.5}
                        numberOfLines={1}
                      >
                        {assignedWidget?.metric || '--'}
                      </Text>

                      <YStack>
                        <Text
                          fontFamily={fonts.bodySemibold}
                          fontSize={12.5}
                          color="#FAF8F5"
                          numberOfLines={1}
                        >
                          {assignedWidget?.title || 'Telemetry Stream'}
                        </Text>
                        <Text
                          fontFamily={fonts.body}
                          fontSize={10.5}
                          color="#C8D7CE"
                          numberOfLines={1}
                        >
                          {assignedWidget?.subtitle || 'Live Feed'}
                        </Text>
                      </YStack>
                    </YStack>

                    {/* Right Column: Elevated Telemetry Panel */}
                    <YStack
                      width={122}
                      height="100%"
                      backgroundColor="#1F2C24"
                      borderRadius={14}
                      paddingVertical={8}
                      paddingHorizontal={9}
                      justifyContent="space-between"
                      alignItems="center"
                      borderWidth={1}
                      borderColor="#2A3C31"
                    >
                      <View
                        paddingHorizontal={8}
                        paddingVertical={2.5}
                        borderRadius={7}
                        backgroundColor="#25372C"
                        width="100%"
                        alignItems="center"
                      >
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={9}
                          color={assignedWidget?.badgeColor || pandraColors.primaryLight}
                          numberOfLines={1}
                        >
                          {assignedWidget?.badge || 'LIVE'}
                        </Text>
                      </View>

                      {/* Sparkline Bars */}
                      <XStack alignItems="flex-end" justifyContent="center" height={20} gap={3.5}>
                        <View width={3.5} height={9} borderRadius={2} backgroundColor={pandraColors.primary} />
                        <View width={3.5} height={15} borderRadius={2} backgroundColor="#34D399" />
                        <View width={3.5} height={11} borderRadius={2} backgroundColor={pandraColors.primaryLight} />
                        <View width={3.5} height={20} borderRadius={2} backgroundColor={assignedWidget?.badgeColor || '#34D399'} />
                        <View width={3.5} height={16} borderRadius={2} backgroundColor="#34D399" />
                        <View width={3.5} height={12} borderRadius={2} backgroundColor={pandraColors.primary} />
                      </XStack>

                      <XStack alignItems="center" gap={4}>
                        <View width={4} height={4} borderRadius={2} backgroundColor="#34D399" />
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={8.5}
                          color={pandraColors.textDim}
                        >
                          Pandra Studio
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>
                </View>
              )}

              {selectedSlot === 'slot_accessory' && (
                <View style={styles.nativeAccessoryTile}>
                  <XStack alignItems="center" gap={8}>
                    <Globe size={13} color={pandraColors.textSecondary} />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11.5}
                      color="#FAF8F5"
                    >
                      {assignedWidget?.title || 'Metric'}:{' '}
                      <Text color={pandraColors.primaryLight} fontFamily={fonts.display}>
                        {assignedWidget?.metric || '--'}
                      </Text>
                    </Text>
                  </XStack>
                </View>
              )}

              { }
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleForceSync}
                disabled={isSyncing}
                style={[
                  styles.syncButton,
                  syncSuccess && { backgroundColor: pandraColors.accentGreen },
                ]}
              >
                <XStack alignItems="center" gap={8}>
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#0E1210" />
                  ) : syncSuccess ? (
                    <CheckCircle2 size={16} color="#0E1210" />
                  ) : (
                    <RefreshCw size={15} color="#0E1210" />
                  )}
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={13}
                    color="#0E1210"
                  >
                    {isSyncing
                      ? 'Syncing to Storage…'
                      : syncSuccess
                      ? 'Synced to Home Screen!'
                      : 'Sync Selected Widget to Slot'}
                  </Text>
                </XStack>
              </TouchableOpacity>

              {Platform.OS === 'android' && selectedSlot !== 'slot_accessory' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePinToHomeScreen}
                  disabled={isPinning}
                  style={[
                    styles.pinButton,
                    pinSuccess && {
                      backgroundColor: pandraColors.accentGreen,
                      borderColor: pandraColors.accentGreen,
                    },
                  ]}
                >
                  <XStack alignItems="center" gap={8}>
                    {isPinning ? (
                      <ActivityIndicator size="small" color="#FAF8F5" />
                    ) : pinSuccess ? (
                      <CheckCircle2 size={16} color="#0E1210" />
                    ) : (
                      <Smartphone
                        size={15}
                        color={pinSuccess ? '#0E1210' : pandraColors.primaryLight}
                      />
                    )}
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={13}
                      color={pinSuccess ? '#0E1210' : '#FAF8F5'}
                    >
                      {isPinning
                        ? 'Pinning to Home Screen…'
                        : pinSuccess
                        ? 'Pinned to Home Screen!'
                        : selectedSlot === 'slot_small'
                        ? 'Pin Small Widget (2×2) to Home'
                        : 'Pin Wide Widget (4×2) to Home'}
                    </Text>
                  </XStack>
                </TouchableOpacity>
              )}
            </YStack>

            { }
            <YStack gap={10} marginBottom={20}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontFamily={fonts.mono}
                  fontSize={10.5}
                  color={pandraColors.textMuted}
                  letterSpacing={0.8}
                >
                  ASSIGN WIDGET FROM YOUR DECK
                </Text>
                <Text
                  fontFamily={fonts.body}
                  fontSize={11}
                  color={pandraColors.textDim}
                >
                  {widgets.length} available
                </Text>
              </XStack>

              {widgets.length === 0 ? (
                <View
                  backgroundColor={pandraColors.surfaceElevated}
                  padding={16}
                  borderRadius={radius.md}
                  alignItems="center"
                >
                  <Text
                    fontFamily={fonts.body}
                    fontSize={12.5}
                    color={pandraColors.textSecondary}
                  >
                    No widgets found on your deck. Create a widget first to assign it here!
                  </Text>
                </View>
              ) : (
                <YStack gap={6}>
                  {widgets.map((w) => {
                    const isAssigned = currentAssignedWidgetId === w.id;
                    return (
                      <TouchableOpacity
                        key={w.id}
                        activeOpacity={0.7}
                        onPress={() => handleAssignWidgetToSlot(selectedSlot, w.id)}
                        style={[
                          styles.widgetChoiceCard,
                          isAssigned && styles.widgetChoiceCardActive,
                        ]}
                      >
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                          width="100%"
                        >
                          <XStack alignItems="center" gap={10} flex={1}>
                            <View
                              width={28}
                              height={28}
                              borderRadius={radius.xs}
                              backgroundColor={pandraColors.surfaceElevated}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Globe size={14} color={w.color || pandraColors.primary} />
                            </View>
                            <YStack flex={1}>
                              <Text
                                fontFamily={fonts.bodyMedium}
                                fontSize={13}
                                color={pandraColors.text}
                                numberOfLines={1}
                              >
                                {w.title}
                              </Text>
                              <Text
                                fontFamily={fonts.mono}
                                fontSize={10.5}
                                color={pandraColors.textMuted}
                              >
                                {w.metric || '--'} {w.metricLabel ? `· ${w.metricLabel}` : ''}
                              </Text>
                            </YStack>
                          </XStack>

                          {isAssigned ? (
                            <View
                              width={22}
                              height={22}
                              borderRadius={11}
                              backgroundColor={pandraColors.primary}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Check size={13} color="#0E1210" />
                            </View>
                          ) : (
                            <ChevronRight size={16} color={pandraColors.textDim} />
                          )}
                        </XStack>
                      </TouchableOpacity>
                    );
                  })}
                </YStack>
              )}
            </YStack>

            { }
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.lg}
              padding={16}
              gap={12}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontFamily={fonts.mono}
                  fontSize={10.5}
                  color={pandraColors.textMuted}
                  letterSpacing={0.8}
                >
                  HOW TO ADD TO PHONE
                </Text>
                <XStack gap={6}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setActivePlatformTab('ios')}
                    style={[
                      styles.platformTab,
                      activePlatformTab === 'ios' && styles.platformTabActive,
                    ]}
                  >
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11}
                      color={
                        activePlatformTab === 'ios'
                          ? pandraColors.text
                          : pandraColors.textMuted
                      }
                    >
                      iPhone (iOS)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setActivePlatformTab('android')}
                    style={[
                      styles.platformTab,
                      activePlatformTab === 'android' && styles.platformTabActive,
                    ]}
                  >
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11}
                      color={
                        activePlatformTab === 'android'
                          ? pandraColors.text
                          : pandraColors.textMuted
                      }
                    >
                      Android
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </XStack>

              {activePlatformTab === 'ios' ? (
                <YStack gap={8}>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      1.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Go to your iPhone Home Screen and touch & hold any empty area until apps jiggle.
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      2.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Tap the <Text fontFamily={fonts.bodySemibold} color={pandraColors.text}>+</Text> button in the top left corner.
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      3.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Search for <Text fontFamily={fonts.bodySemibold} color={pandraColors.text}>Pandra</Text> and choose your widget size (Small or Medium).
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      4.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Tap <Text fontFamily={fonts.bodySemibold} color={pandraColors.text}>Add Widget</Text> to place it on your home screen.
                    </Text>
                  </XStack>
                </YStack>
              ) : (
                <YStack gap={8}>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      1.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      On your Android Home Screen, touch and hold an empty space.
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      2.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Tap <Text fontFamily={fonts.bodySemibold} color={pandraColors.text}>Widgets</Text> from the pop-up menu.
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      3.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Scroll down to <Text fontFamily={fonts.bodySemibold} color={pandraColors.text}>Pandra</Text> and pick Standard or Wide.
                    </Text>
                  </XStack>
                  <XStack gap={8} alignItems="flex-start">
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
                      4.
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                      Drag the widget onto your desired screen location.
                    </Text>
                  </XStack>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: pandraColors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: pandraColors.borderHighlight,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: pandraColors.textDim,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: pandraColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: pandraColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotTabActive: {
    backgroundColor: pandraColors.surface,
    borderColor: pandraColors.primary,
  },
  nativeSmallTile: {
    width: 154,
    height: 154,
    borderRadius: 22,
    backgroundColor: '#0F1512',
    padding: 13,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A3C31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nativeMediumTile: {
    width: '100%',
    height: 136,
    borderRadius: 22,
    backgroundColor: '#0F1512',
    paddingVertical: 11,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A3C31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nativeAccessoryTile: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: pandraColors.surfaceElevated,
    borderWidth: 1,
    borderColor: pandraColors.borderHighlight,
  },
  syncButton: {
    height: 42,
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: pandraColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pinButton: {
    height: 42,
    width: '100%',
    borderRadius: radius.sm,
    backgroundColor: '#1F2C24',
    borderWidth: 1,
    borderColor: '#2A3C31',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  widgetChoiceCard: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: pandraColors.surface,
    borderWidth: 1,
    borderColor: pandraColors.border,
  },
  widgetChoiceCardActive: {
    borderColor: pandraColors.primary,
    backgroundColor: pandraColors.surfaceElevated,
  },
  platformTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    backgroundColor: pandraColors.surface,
  },
  platformTabActive: {
    backgroundColor: pandraColors.primary,
  },
});
