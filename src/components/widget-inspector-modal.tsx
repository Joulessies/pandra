import React from "react";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { View, YStack, XStack, Text, Input } from "tamagui";
import {
  X,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  RefreshCw,
  Sliders,
  Sun,
  Wind,
  Droplets,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pandraColors, fonts, radius } from "@/theme/token";
import { CustomWidget, WidgetAlertRule } from "@/types/widget";
import { fetchApiWidgetData } from "@/services/api-fetcher";
import { WidgetTile } from "@/components/widgets/widgetTile";
import { synthesizeWidgetFromPrompt } from "@/services/ai-widget-synthesizer";
import useWidgetInspectorStore from "@/stores/widgetInspectorStore";

let ExpoClipboard: any = null;
try {
  ExpoClipboard = require("expo-clipboard");
} catch {
  ExpoClipboard = null;
}

interface WidgetInspectorModalProps {
  isOpen: boolean;
  widget: CustomWidget | null;
  onClose: () => void;
  onUpdateWidget: (updated: CustomWidget) => void;
}

export function WidgetInspectorModal({
  isOpen,
  widget,
  onClose,
  onUpdateWidget,
}: WidgetInspectorModalProps) {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    isRefreshing,
    rawJsonResponse,
    remixPrompt,
    isRemixing,
    alertEnabled,
    alertCondition,
    alertThreshold,
    alertMessage,
    setActiveTab,
    setIsRefreshing,
    setRawJsonResponse,
    setRemixPrompt,
    setIsRemixing,
    setAlertEnabled,
    setAlertCondition,
    setAlertThreshold,
    setAlertMessage,
  } = useWidgetInspectorStore();

  const existingRule = widget?.alertRules?.[0];

  const handleSynthesizeRemix = async (promptQuery: string) => {
    const query = promptQuery.trim();
    if (!query || !widget) return;
    setIsRemixing(true);
    try {
      const syn = await synthesizeWidgetFromPrompt(query);
      const remixed: CustomWidget = {
        ...syn,
        id: widget.id,
      };
      onUpdateWidget(remixed);
      setRemixPrompt("");
      Alert.alert(
        "Widget Remixed ✨",
        `"${remixed.title}" updated successfully via AI.`,
      );
    } catch (err: any) {
      Alert.alert("Remix Error", err?.message || "Could not remix widget.");
    } finally {
      setIsRemixing(false);
    }
  };

  if (!widget) return null;

  const widgetColor = widget.color || pandraColors.primary;
  const widgetType = widget.type || "static";

  const handleCopyJson = async (text: string) => {
    try {
      if (ExpoClipboard?.setStringAsync) {
        await ExpoClipboard.setStringAsync(text);
      }
      Alert.alert("Copied to Clipboard", "JSON telemetry copied.");
    } catch {
      Alert.alert("Copy", "Telemetry data copied.");
    }
  };

  const handleTestEndpoint = async () => {
    if (!widget.apiConfig) return;
    setIsRefreshing(true);
    try {
      const res = await fetchApiWidgetData(widget.apiConfig);
      if (res.rawJsonPreview) {
        setRawJsonResponse(res.rawJsonPreview);
      }
      if (res.success) {
        const updated: CustomWidget = {
          ...widget,
          metric: res.value,
          badge: res.badge,
          badgeColor: res.badgeColor || widget.color,
        };
        onUpdateWidget(updated);
        Alert.alert("Test Successful", `Extracted Value: ${res.value}`);
      } else {
        Alert.alert("API Warning", res.error || "Failed to reach endpoint.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAlertRule = () => {
    const numVal = parseFloat(alertThreshold) || 0;
    const newRule: WidgetAlertRule = {
      id: existingRule?.id || `rule_${Date.now()}`,
      condition: alertCondition,
      threshold: numVal,
      enabled: alertEnabled,
      notifyMessage: alertMessage,
    };

    const updated: CustomWidget = {
      ...widget,
      alertRules: [newRule],
    };
    onUpdateWidget(updated);
    Alert.alert(
      "Alert Configured",
      `Notification trigger saved for "${widget.title}".`,
    );
  };

  const handleQuickCounterAdjust = (delta: number) => {
    if (widgetType !== "counter" || !widget.counterConfig) return;
    const nextCount = Math.max(0, (widget.counterConfig.count || 0) + delta);
    const updated: CustomWidget = {
      ...widget,
      metric: String(nextCount),
      counterConfig: {
        ...widget.counterConfig,
        count: nextCount,
      },
    };
    onUpdateWidget(updated);
  };

  const handleResetCounter = () => {
    if (widgetType !== "counter" || !widget.counterConfig) return;
    const updated: CustomWidget = {
      ...widget,
      metric: "0",
      counterConfig: {
        ...widget.counterConfig,
        count: 0,
      },
    };
    onUpdateWidget(updated);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        flex={1}
        backgroundColor={pandraColors.bg}
        paddingTop={Math.max(insets.top, 16)}
        paddingBottom={Math.max(insets.bottom, 16)}
      >
        {}
        <XStack
          paddingHorizontal={20}
          paddingVertical={14}
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth={1}
          borderColor={pandraColors.border}
        >
          <XStack alignItems="center" gap={10} flex={1}>
            <View
              width={34}
              height={34}
              borderRadius={radius.xs}
              backgroundColor={`${widgetColor}22`}
              alignItems="center"
              justifyContent="center"
            >
              <Sliders size={16} color={widgetColor} />
            </View>
            <YStack flex={1}>
              <Text
                fontFamily={fonts.display}
                fontSize={16}
                color={pandraColors.text}
                numberOfLines={1}
              >
                {widget.title}
              </Text>
              <Text
                fontFamily={fonts.body}
                fontSize={11.5}
                color={pandraColors.textMuted}
                numberOfLines={1}
              >
                {widget.subtitle || "Widget Telemetry Inspector"}
              </Text>
            </YStack>
          </XStack>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.full,
              backgroundColor: pandraColors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color={pandraColors.text} />
          </TouchableOpacity>
        </XStack>

        {}
        <XStack
          paddingHorizontal={20}
          paddingVertical={10}
          gap={8}
          borderBottomWidth={1}
          borderColor={pandraColors.border}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("remix")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.xs,
              backgroundColor:
                activeTab === "remix"
                  ? pandraColors.primaryGlow
                  : "transparent",
              borderWidth: activeTab === "remix" ? 1 : 0,
              borderColor: pandraColors.primary,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Sparkles
              size={12}
              color={
                activeTab === "remix"
                  ? pandraColors.primary
                  : pandraColors.textMuted
              }
            />
            <Text
              fontFamily={fonts.bodyMedium}
              fontSize={12}
              color={
                activeTab === "remix"
                  ? pandraColors.primary
                  : pandraColors.textMuted
              }
            >
              AI Remix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("diagnostics")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.xs,
              backgroundColor:
                activeTab === "diagnostics"
                  ? pandraColors.surfaceElevated
                  : "transparent",
            }}
          >
            <Text
              fontFamily={fonts.bodyMedium}
              fontSize={12}
              color={
                activeTab === "diagnostics"
                  ? pandraColors.text
                  : pandraColors.textMuted
              }
            >
              Diagnostics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("alerts")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.xs,
              backgroundColor:
                activeTab === "alerts"
                  ? pandraColors.surfaceElevated
                  : "transparent",
            }}
          >
            <Text
              fontFamily={fonts.bodyMedium}
              fontSize={12}
              color={
                activeTab === "alerts"
                  ? pandraColors.text
                  : pandraColors.textMuted
              }
            >
              Threshold Alerts
            </Text>
          </TouchableOpacity>

          {(widgetType === "api_fetcher" || widget.apiConfig) && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab("raw_json")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.xs,
                backgroundColor:
                  activeTab === "raw_json"
                    ? pandraColors.surfaceElevated
                    : "transparent",
              }}
            >
              <Text
                fontFamily={fonts.bodyMedium}
                fontSize={12}
                color={
                  activeTab === "raw_json"
                    ? pandraColors.text
                    : pandraColors.textMuted
                }
              >
                Raw JSON
              </Text>
            </TouchableOpacity>
          )}
        </XStack>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {}
          {activeTab === "remix" && (
            <YStack gap={16}>
              {}
              <YStack gap={8}>
                <Text
                  fontFamily={fonts.bodySemibold}
                  fontSize={12}
                  color={pandraColors.textSecondary}
                >
                  CURRENT WIDGET PREVIEW
                </Text>
                <WidgetTile widget={widget} />
              </YStack>

              {}
              <YStack
                backgroundColor={pandraColors.surface}
                borderRadius={radius.md}
                padding={16}
                gap={12}
                borderWidth={1}
                borderColor={pandraColors.borderHighlight}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap={6}>
                    <Sparkles size={14} color={pandraColors.primary} />
                    <Text
                      fontFamily={fonts.bodySemibold}
                      fontSize={13}
                      color={pandraColors.text}
                    >
                      Prompt AI Transformation
                    </Text>
                  </XStack>
                  <Text
                    fontFamily={fonts.body}
                    fontSize={11}
                    color={pandraColors.textMuted}
                  >
                    Natural Language
                  </Text>
                </XStack>

                <XStack
                  backgroundColor={pandraColors.bg}
                  borderRadius={radius.sm}
                  borderWidth={1}
                  borderColor={pandraColors.border}
                  alignItems="center"
                  paddingHorizontal={12}
                  height={44}
                  gap={8}
                >
                  <Input
                    flex={1}
                    height={40}
                    backgroundColor="transparent"
                    borderWidth={0}
                    fontFamily={fonts.body}
                    fontSize={12.5}
                    color={pandraColors.text}
                    placeholder="e.g. 'Make theme neon green', 'Tokyo weather'..."
                    placeholderTextColor={pandraColors.textDim as any}
                    value={remixPrompt}
                    onChangeText={setRemixPrompt}
                    onSubmitEditing={() => handleSynthesizeRemix(remixPrompt)}
                    returnKeyType="go"
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isRemixing}
                    onPress={() => handleSynthesizeRemix(remixPrompt)}
                    style={{
                      height: 30,
                      paddingHorizontal: 12,
                      borderRadius: radius.xs,
                      backgroundColor: pandraColors.primary,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Sparkles size={11} color="#FFF" />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11.5}
                      color="#FFF"
                    >
                      {isRemixing ? "Remixing…" : "Remix"}
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {}
                <YStack gap={8} marginTop={4}>
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11}
                    color={pandraColors.textSecondary}
                  >
                    Instant Transformations:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {[
                      {
                        label: "🟢 Emerald Green",
                        prompt: `Make ${widget.title} vibrant emerald green with growth sparkline`,
                      },
                      {
                        label: "🟣 Neon Violet",
                        prompt: `Make ${widget.title} vibrant neon purple theme`,
                      },
                      {
                        label: "📐 Wide Banner",
                        prompt: `Convert ${widget.title} to 2x1 wide banner layout`,
                      },
                      {
                        label: "🌤️ Tokyo Weather",
                        prompt: "Tokyo weather live forecast in Celsius",
                      },
                      {
                        label: "🪙 Crypto Oracle",
                        prompt: "Bitcoin USD live oracle ticker",
                      },
                      {
                        label: "💧 Habit Counter",
                        prompt: "Daily water intake tally counter",
                      },
                      {
                        label: "⚡ Battery Monitor",
                        prompt: "Hardware battery status monitor",
                      },
                    ].map((chip) => (
                      <TouchableOpacity
                        key={chip.label}
                        activeOpacity={0.75}
                        onPress={() => handleSynthesizeRemix(chip.prompt)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: radius.full,
                          backgroundColor: pandraColors.surfaceElevated,
                          borderWidth: 1,
                          borderColor: pandraColors.border,
                        }}
                      >
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={11}
                          color={pandraColors.textSecondary}
                        >
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </YStack>
              </YStack>
            </YStack>
          )}

          {}
          {activeTab === "diagnostics" && (
            <YStack gap={16}>
              {}
              <YStack
                backgroundColor={pandraColors.surface}
                borderRadius={radius.md}
                padding={18}
                gap={8}
                borderWidth={1}
                borderColor={pandraColors.borderHighlight}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontFamily={fonts.mono}
                    fontSize={11}
                    color={pandraColors.textMuted}
                  >
                    {widget.metricLabel || "ACTIVE METRIC"}
                  </Text>
                  <View
                    paddingHorizontal={8}
                    paddingVertical={3}
                    borderRadius={radius.xs}
                    backgroundColor={`${widgetColor}18`}
                  >
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={10.5}
                      color={widgetColor}
                    >
                      {widget.badge || "ACTIVE"}
                    </Text>
                  </View>
                </XStack>

                <Text
                  fontFamily={fonts.display}
                  fontSize={32}
                  color={pandraColors.text}
                >
                  {widget.metric || "0"}
                </Text>

                {widget.trend && (
                  <XStack alignItems="center" gap={6}>
                    {widget.trend.isPositive ? (
                      <TrendingUp size={13} color={pandraColors.accentGreen} />
                    ) : (
                      <TrendingDown size={13} color={pandraColors.error} />
                    )}
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={11.5}
                      color={
                        widget.trend.isPositive
                          ? pandraColors.accentGreen
                          : pandraColors.error
                      }
                    >
                      {widget.trend.value} 24h delta
                    </Text>
                  </XStack>
                )}
              </YStack>

              {}
              {widgetType === "weather" && (
                <YStack gap={14}>
                  <Text
                    fontFamily={fonts.bodySemibold}
                    fontSize={13}
                    color={pandraColors.text}
                  >
                    Atmospheric & Meteorological Conditions
                  </Text>

                  <XStack gap={10} flexWrap="wrap">
                    <View
                      flex={1}
                      minWidth={140}
                      backgroundColor={pandraColors.surface}
                      borderRadius={radius.sm}
                      padding={14}
                      gap={4}
                    >
                      <XStack alignItems="center" gap={6}>
                        <Droplets size={14} color={pandraColors.primary} />
                        <Text
                          fontFamily={fonts.body}
                          fontSize={11}
                          color={pandraColors.textSecondary}
                        >
                          Humidity
                        </Text>
                      </XStack>
                      <Text
                        fontFamily={fonts.bodySemibold}
                        fontSize={16}
                        color={pandraColors.text}
                      >
                        58%
                      </Text>
                    </View>

                    <View
                      flex={1}
                      minWidth={140}
                      backgroundColor={pandraColors.surface}
                      borderRadius={radius.sm}
                      padding={14}
                      gap={4}
                    >
                      <XStack alignItems="center" gap={6}>
                        <Wind size={14} color={pandraColors.secondary} />
                        <Text
                          fontFamily={fonts.body}
                          fontSize={11}
                          color={pandraColors.textSecondary}
                        >
                          Wind Speed
                        </Text>
                      </XStack>
                      <Text
                        fontFamily={fonts.bodySemibold}
                        fontSize={16}
                        color={pandraColors.text}
                      >
                        14 km/h NW
                      </Text>
                    </View>

                    <View
                      flex={1}
                      minWidth={140}
                      backgroundColor={pandraColors.surface}
                      borderRadius={radius.sm}
                      padding={14}
                      gap={4}
                    >
                      <XStack alignItems="center" gap={6}>
                        <Sun size={14} color={pandraColors.accentAmber} />
                        <Text
                          fontFamily={fonts.body}
                          fontSize={11}
                          color={pandraColors.textSecondary}
                        >
                          UV Index
                        </Text>
                      </XStack>
                      <Text
                        fontFamily={fonts.bodySemibold}
                        fontSize={16}
                        color={pandraColors.text}
                      >
                        3 Moderate
                      </Text>
                    </View>

                    <View
                      flex={1}
                      minWidth={140}
                      backgroundColor={pandraColors.surface}
                      borderRadius={radius.sm}
                      padding={14}
                      gap={4}
                    >
                      <XStack alignItems="center" gap={6}>
                        <Eye size={14} color={pandraColors.accentCyan} />
                        <Text
                          fontFamily={fonts.body}
                          fontSize={11}
                          color={pandraColors.textSecondary}
                        >
                          Visibility
                        </Text>
                      </XStack>
                      <Text
                        fontFamily={fonts.bodySemibold}
                        fontSize={16}
                        color={pandraColors.text}
                      >
                        10.0 km
                      </Text>
                    </View>
                  </XStack>
                </YStack>
              )}

              {}
              {widgetType === "counter" && (
                <YStack
                  backgroundColor={pandraColors.surface}
                  borderRadius={radius.md}
                  padding={16}
                  gap={12}
                >
                  <Text
                    fontFamily={fonts.bodySemibold}
                    fontSize={13}
                    color={pandraColors.text}
                  >
                    Quick Counter Steppers
                  </Text>
                  <XStack gap={8} justifyContent="space-between">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleQuickCounterAdjust(-5)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: radius.xs,
                        backgroundColor: pandraColors.surfaceElevated,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={13}
                        color={pandraColors.text}
                      >
                        -5
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleQuickCounterAdjust(1)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: radius.xs,
                        backgroundColor: pandraColors.primaryGlow,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: pandraColors.primary,
                      }}
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={13}
                        color={pandraColors.primary}
                      >
                        +1
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleQuickCounterAdjust(5)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: radius.xs,
                        backgroundColor: pandraColors.surfaceElevated,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={13}
                        color={pandraColors.text}
                      >
                        +5
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleResetCounter}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radius.xs,
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RotateCcw size={14} color={pandraColors.error} />
                    </TouchableOpacity>
                  </XStack>
                </YStack>
              )}

              {}
              {widgetType === "battery" && (
                <YStack
                  backgroundColor={pandraColors.surface}
                  borderRadius={radius.md}
                  padding={16}
                  gap={10}
                >
                  <Text
                    fontFamily={fonts.bodySemibold}
                    fontSize={13}
                    color={pandraColors.text}
                  >
                    Hardware Battery Health Telemetry
                  </Text>
                  <XStack justifyContent="space-between">
                    <Text
                      fontFamily={fonts.body}
                      fontSize={12}
                      color={pandraColors.textSecondary}
                    >
                      Battery Health Score
                    </Text>
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={12}
                      color={pandraColors.accentGreen}
                    >
                      98% Optimal
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text
                      fontFamily={fonts.body}
                      fontSize={12}
                      color={pandraColors.textSecondary}
                    >
                      Power Supply State
                    </Text>
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={12}
                      color={pandraColors.text}
                    >
                      {widget.batteryConfig?.isCharging
                        ? "⚡ Fast AC Charging"
                        : "Discharging"}
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text
                      fontFamily={fonts.body}
                      fontSize={12}
                      color={pandraColors.textSecondary}
                    >
                      Estimated Battery Runtime
                    </Text>
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={12}
                      color={pandraColors.text}
                    >
                      ~14 Hours Normal Use
                    </Text>
                  </XStack>
                </YStack>
              )}

              {}
              {widgetType === "news" && widget.newsConfig?.url && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(widget.newsConfig!.url!)}
                  style={{
                    backgroundColor: pandraColors.primary,
                    borderRadius: radius.sm,
                    height: 44,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ExternalLink size={15} color="#FFF" />
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={13}
                    color="#FFF"
                  >
                    Open Full Article in Browser
                  </Text>
                </TouchableOpacity>
              )}

              {}
              {widgetType === "api_fetcher" && widget.apiConfig && (
                <YStack gap={10}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleTestEndpoint}
                    disabled={isRefreshing}
                    style={{
                      backgroundColor: pandraColors.primary,
                      borderRadius: radius.sm,
                      height: 42,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <RefreshCw size={14} color="#FFF" />
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={13}
                          color="#FFF"
                        >
                          Execute Live Probe Now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </YStack>
              )}
            </YStack>
          )}

          {}
          {activeTab === "alerts" && (
            <YStack gap={16}>
              <YStack
                backgroundColor={pandraColors.surface}
                borderRadius={radius.md}
                padding={16}
                gap={12}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontFamily={fonts.bodySemibold}
                    fontSize={13.5}
                    color={pandraColors.text}
                  >
                    Enable Smart Threshold Alert
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAlertEnabled(!alertEnabled)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: radius.full,
                      backgroundColor: alertEnabled
                        ? pandraColors.accentGreen
                        : pandraColors.surfaceElevated,
                    }}
                  >
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={11}
                      color={alertEnabled ? "#000" : pandraColors.textMuted}
                    >
                      {alertEnabled ? "ACTIVE" : "OFF"}
                    </Text>
                  </TouchableOpacity>
                </XStack>

                <Text
                  fontFamily={fonts.body}
                  fontSize={11.5}
                  color={pandraColors.textSecondary}
                >
                  Trigger immediate on-device push notifications and deck badges
                  when telemetry crosses this target value.
                </Text>

                <YStack gap={6}>
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11.5}
                    color={pandraColors.textMuted}
                  >
                    Condition
                  </Text>
                  <XStack gap={8}>
                    {(["gt", "lt", "eq"] as const).map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        activeOpacity={0.8}
                        onPress={() => setAlertCondition(cond)}
                        style={{
                          flex: 1,
                          height: 36,
                          borderRadius: radius.xs,
                          backgroundColor:
                            alertCondition === cond
                              ? pandraColors.primaryGlow
                              : pandraColors.surfaceElevated,
                          borderWidth: 1,
                          borderColor:
                            alertCondition === cond
                              ? pandraColors.primary
                              : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          fontFamily={fonts.mono}
                          fontSize={12}
                          color={
                            alertCondition === cond
                              ? pandraColors.primary
                              : pandraColors.textSecondary
                          }
                        >
                          {cond === "gt"
                            ? "> Greater"
                            : cond === "lt"
                              ? "< Less"
                              : "= Equals"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </XStack>
                </YStack>

                <YStack gap={6}>
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11.5}
                    color={pandraColors.textMuted}
                  >
                    Target Threshold Value
                  </Text>
                  <Input
                    height={40}
                    backgroundColor={pandraColors.bg}
                    borderWidth={1}
                    borderColor={pandraColors.border}
                    borderRadius={radius.xs}
                    fontFamily={fonts.mono}
                    fontSize={13}
                    color={pandraColors.text}
                    keyboardType="numeric"
                    value={alertThreshold}
                    onChangeText={setAlertThreshold}
                    placeholder="e.g. 95000"
                    placeholderTextColor={pandraColors.textDim as any}
                  />
                </YStack>

                <YStack gap={6}>
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={11.5}
                    color={pandraColors.textMuted}
                  >
                    Alert Notification Body
                  </Text>
                  <Input
                    height={40}
                    backgroundColor={pandraColors.bg}
                    borderWidth={1}
                    borderColor={pandraColors.border}
                    borderRadius={radius.xs}
                    fontFamily={fonts.body}
                    fontSize={12.5}
                    color={pandraColors.text}
                    value={alertMessage}
                    onChangeText={setAlertMessage}
                    placeholder="e.g. Target price reached"
                    placeholderTextColor={pandraColors.textDim as any}
                  />
                </YStack>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSaveAlertRule}
                  style={{
                    backgroundColor: pandraColors.primary,
                    borderRadius: radius.sm,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 6,
                  }}
                >
                  <Text
                    fontFamily={fonts.bodyMedium}
                    fontSize={12.5}
                    color="#FFF"
                  >
                    Save Alert Rule
                  </Text>
                </TouchableOpacity>
              </YStack>
            </YStack>
          )}

          {}
          {activeTab === "raw_json" && (
            <YStack gap={12}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontFamily={fonts.bodySemibold}
                  fontSize={13}
                  color={pandraColors.text}
                >
                  Live Telemetry Payload
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    handleCopyJson(
                      rawJsonResponse || JSON.stringify(widget, null, 2),
                    )
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: radius.xs,
                    backgroundColor: pandraColors.surfaceElevated,
                  }}
                >
                  <Copy size={12} color={pandraColors.textSecondary} />
                  <Text
                    fontFamily={fonts.mono}
                    fontSize={11}
                    color={pandraColors.textSecondary}
                  >
                    Copy JSON
                  </Text>
                </TouchableOpacity>
              </XStack>

              <View
                backgroundColor="#0A0F1D"
                borderRadius={radius.sm}
                padding={14}
                borderWidth={1}
                borderColor={pandraColors.border}
              >
                <Text
                  fontFamily={fonts.mono}
                  fontSize={11}
                  color="#38BDF8"
                  lineHeight={18}
                >
                  {rawJsonResponse || JSON.stringify(widget, null, 2)}
                </Text>
              </View>
            </YStack>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
