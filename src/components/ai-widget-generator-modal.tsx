import React, { useEffect, useCallback } from "react";
import { create } from "zustand";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { View, YStack, XStack, Text, Input } from "tamagui";
import {
  X,
  Sparkles,
  Wand2,
  Check,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react-native";
import { pandraColors, fonts, radius } from "@/theme/token";
import { CustomWidget, WidgetSize } from "@/types/widget";
import { WidgetTile } from "@/components/widgets/widgetTile";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { synthesizeWidgetFromPrompt } from "@/services/ai-widget-synthesizer";

interface AiWidgetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
  initialPrompt?: string;
}

const EXAMPLE_PROMPTS = [
  {
    label: "Tokyo Weather",
    prompt: "Live Tokyo weather in Celsius with clear skies forecast",
  },
  {
    label: "Water Tracker",
    prompt: "Daily water intake tally counter with +1 glass step",
  },
  {
    label: "Device Battery",
    prompt: "Real-time battery monitor with fast charging indicator",
  },
  { label: "Hacker News", prompt: "Top tech news feed from Hacker News" },
  { label: "GitHub Stars", prompt: "Live GitHub stars stream for expo/expo" },
  {
    label: "Bitcoin Oracle",
    prompt: "Bitcoin spot price index in USD with live feed",
  },
  {
    label: "Sprint Note",
    prompt: "Sticky note for Monday sprint plan and release goals",
  },
  {
    label: "Cyber Photo",
    prompt: "Cyberpunk Tokyo night street photography card",
  },
];

interface AiWidgetGeneratorState {
  prompt: string;
  isGenerating: boolean;
  generatedWidget: CustomWidget | null;
  selectedSize: WidgetSize;
  setPrompt: (prompt: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGeneratedWidget: (generatedWidget: CustomWidget | null) => void;
  setSelectedSize: (selectedSize: WidgetSize) => void;
}

const useAiWidgetGeneratorStore = create<AiWidgetGeneratorState>((set) => ({
  prompt: "",
  isGenerating: false,
  generatedWidget: null,
  selectedSize: "standard",
  setPrompt: (prompt) => set({ prompt }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGeneratedWidget: (generatedWidget) => set({ generatedWidget }),
  setSelectedSize: (selectedSize) => set({ selectedSize }),
}));

export function AiWidgetGeneratorModal({
  isOpen,
  onClose,
  onSave,
  initialPrompt,
}: AiWidgetGeneratorModalProps) {
  const insets = useSafeAreaInsets();
  const {
    prompt,
    isGenerating,
    generatedWidget,
    selectedSize,
    setPrompt,
    setIsGenerating,
    setGeneratedWidget,
    setSelectedSize,
  } = useAiWidgetGeneratorStore();

  const handleSynthesizePrompt = useCallback(
    async (overridePrompt?: string) => {
      const query = (overridePrompt || prompt).trim();
      if (!query) {
        Alert.alert(
          "Empty Prompt",
          "Please enter a description for your widget.",
        );
        return;
      }

      setIsGenerating(true);
      try {
        const synthesized = await synthesizeWidgetFromPrompt(query);
        setSelectedSize(synthesized.size || "standard");
        setGeneratedWidget(synthesized);
      } catch (err: any) {
        console.error("AI synthesis error:", err);
        Alert.alert(
          "Synthesis Error",
          err.message || "Could not parse widget prompt.",
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, setGeneratedWidget, setIsGenerating, setSelectedSize],
  );

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt && initialPrompt.trim()) {
        setPrompt(initialPrompt);
        handleSynthesizePrompt(initialPrompt);
      }
    } else {
      setGeneratedWidget(null);
    }
  }, [
    isOpen,
    initialPrompt,
    handleSynthesizePrompt,
    setGeneratedWidget,
    setPrompt,
  ]);

  const handleSaveToDeck = () => {
    if (!generatedWidget) return;
    const finalWidget: CustomWidget = {
      ...generatedWidget,
      id: Date.now().toString(),
      size: selectedSize,
    };
    onSave(finalWidget);
    onClose();
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        flex={1}
        justifyContent="flex-end"
        backgroundColor="rgba(0, 0, 0, 0.75)"
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={onClose}
        />

        <View
          backgroundColor={pandraColors.surface}
          borderTopLeftRadius={radius.xl}
          borderTopRightRadius={radius.xl}
          maxHeight="92%"
          paddingTop={12}
          paddingBottom={bottomPadding}
          paddingHorizontal={20}
        >
          {}
          <View
            width={36}
            height={4}
            borderRadius={2}
            backgroundColor={pandraColors.textDim}
            alignSelf="center"
            marginBottom={14}
          />

          {}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom={14}
          >
            <XStack alignItems="center" gap={8}>
              <View
                width={32}
                height={32}
                borderRadius={radius.sm}
                backgroundColor={pandraColors.primaryGlow}
                alignItems="center"
                justifyContent="center"
              >
                <Sparkles size={16} color={pandraColors.primary} />
              </View>
              <YStack>
                <Text
                  fontFamily={fonts.bodySemibold}
                  fontSize={16}
                  color={pandraColors.text}
                >
                  AI Widget Creator
                </Text>
                <Text
                  fontFamily={fonts.body}
                  fontSize={11}
                  color={pandraColors.textMuted}
                >
                  Describe any widget in natural language
                </Text>
              </YStack>
            </XStack>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: pandraColors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} color={pandraColors.textMuted} />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {}
            <YStack gap={8} marginBottom={14}>
              <XStack
                backgroundColor={pandraColors.bg}
                borderRadius={radius.md}
                borderWidth={1}
                borderColor={pandraColors.border}
                paddingHorizontal={12}
                paddingVertical={4}
                alignItems="center"
              >
                <Input
                  flex={1}
                  height={46}
                  borderWidth={0}
                  backgroundColor="transparent"
                  fontFamily={fonts.body}
                  fontSize={13}
                  color={pandraColors.text}
                  placeholder="e.g. Tokyo weather in Celsius, water counter, battery monitor..."
                  placeholderTextColor={pandraColors.textMuted as any}
                  value={prompt}
                  onChangeText={setPrompt}
                  returnKeyType="go"
                  onSubmitEditing={() => handleSynthesizePrompt()}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSynthesizePrompt()}
                  disabled={isGenerating || !prompt.trim()}
                  style={{
                    paddingHorizontal: 14,
                    height: 36,
                    borderRadius: radius.xs,
                    backgroundColor:
                      isGenerating || !prompt.trim()
                        ? pandraColors.surfaceElevated
                        : pandraColors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Wand2
                        size={13}
                        color={
                          prompt.trim() ? "#FFFFFF" : pandraColors.textMuted
                        }
                      />
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={12}
                        color={
                          prompt.trim() ? "#FFFFFF" : pandraColors.textMuted
                        }
                      >
                        Generate
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </XStack>

              {}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap={6} paddingVertical={2}>
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      onPress={() => {
                        setPrompt(ex.prompt);
                        handleSynthesizePrompt(ex.prompt);
                      }}
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
                        fontSize={10.5}
                        color={pandraColors.textSecondary}
                      >
                        {ex.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </ScrollView>
            </YStack>

            {}
            {generatedWidget && (
              <YStack
                backgroundColor={pandraColors.surfaceElevated}
                borderRadius={radius.md}
                padding={14}
                gap={12}
                marginBottom={16}
                borderWidth={1}
                borderColor={generatedWidget.color || pandraColors.primary}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap={6}>
                    <Check size={14} color={pandraColors.accentGreen} />
                    <Text
                      fontFamily={fonts.bodySemibold}
                      fontSize={12}
                      color={pandraColors.accentGreen}
                    >
                      REAL WIDGET GENERATED
                    </Text>
                  </XStack>

                  <View
                    paddingHorizontal={8}
                    paddingVertical={2}
                    borderRadius={radius.xs}
                    backgroundColor={pandraColors.bg}
                  >
                    <Text
                      fontFamily={fonts.mono}
                      fontSize={10}
                      color={generatedWidget.color}
                    >
                      {generatedWidget.type.toUpperCase()}
                    </Text>
                  </View>
                </XStack>

                {}
                <WidgetTile
                  widget={{
                    ...generatedWidget,
                    size: selectedSize,
                  }}
                  onCounterIncrement={() => {
                    if (generatedWidget.counterConfig) {
                      setGeneratedWidget({
                        ...generatedWidget,
                        counterConfig: {
                          ...generatedWidget.counterConfig,
                          count:
                            generatedWidget.counterConfig.count +
                            (generatedWidget.counterConfig.step || 1),
                        },
                      });
                    }
                  }}
                  onCounterDecrement={() => {
                    if (generatedWidget.counterConfig) {
                      setGeneratedWidget({
                        ...generatedWidget,
                        counterConfig: {
                          ...generatedWidget.counterConfig,
                          count: Math.max(
                            generatedWidget.counterConfig.count -
                              (generatedWidget.counterConfig.step || 1),
                            0,
                          ),
                        },
                      });
                    }
                  }}
                />

                {}
                <XStack gap={8} marginTop={4}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedSize("standard")}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: radius.xs,
                      backgroundColor:
                        selectedSize === "standard"
                          ? pandraColors.bg
                          : "transparent",
                      borderWidth: 1,
                      borderColor:
                        selectedSize === "standard"
                          ? pandraColors.primary
                          : pandraColors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    <Minimize2
                      size={12}
                      color={
                        selectedSize === "standard"
                          ? pandraColors.primary
                          : pandraColors.textMuted
                      }
                    />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={10.5}
                      color={
                        selectedSize === "standard"
                          ? pandraColors.primary
                          : pandraColors.textSecondary
                      }
                    >
                      1x1 Square
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedSize("wide")}
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: radius.xs,
                      backgroundColor:
                        selectedSize === "wide"
                          ? pandraColors.bg
                          : "transparent",
                      borderWidth: 1,
                      borderColor:
                        selectedSize === "wide"
                          ? pandraColors.primary
                          : pandraColors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 4,
                    }}
                  >
                    <Maximize2
                      size={12}
                      color={
                        selectedSize === "wide"
                          ? pandraColors.primary
                          : pandraColors.textMuted
                      }
                    />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={10.5}
                      color={
                        selectedSize === "wide"
                          ? pandraColors.primary
                          : pandraColors.textSecondary
                      }
                    >
                      2x1 Banner
                    </Text>
                  </TouchableOpacity>
                </XStack>

                {}
                <XStack gap={10} marginTop={4}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleSaveToDeck}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: radius.sm,
                      backgroundColor:
                        generatedWidget.color || pandraColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text
                      fontFamily={fonts.bodySemibold}
                      fontSize={13}
                      color="#FFFFFF"
                    >
                      Deploy to Dashboard
                    </Text>
                  </TouchableOpacity>
                </XStack>
              </YStack>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
