import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { View, YStack, XStack, Text, Input } from 'tamagui';
import {
  X,
  Zap,
  Globe,
  Code,
  Server,
  Database,
  Activity,
  RefreshCw,
  Check,
  Radio,
  Sliders,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import { CustomWidget, WidgetIconType } from '@/types/widget';
import {
  API_PRESET_TEMPLATES,
  ApiTemplatePreset,
  fetchApiWidgetData,
  ApiFetchResult,
} from '@/services/api-fetcher';
import { WidgetTile } from '@/components/widgets/widgetTile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ApiWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
}

const COLOR_OPTIONS = [
  { label: 'Blue', hex: pandraColors.primary },
  { label: 'Orange', hex: pandraColors.secondary },
  { label: 'Green', hex: pandraColors.accentGreen },
  { label: 'Purple', hex: pandraColors.accentPurple },
  { label: 'Amber', hex: pandraColors.accentAmber },
];

const ICON_OPTIONS: { type: WidgetIconType; label: string }[] = [
  { type: 'code', label: 'Code' },
  { type: 'globe', label: 'Globe' },
  { type: 'api', label: 'API' },
  { type: 'server', label: 'Server' },
  { type: 'database', label: 'Data' },
  { type: 'telemetry', label: 'Wave' },
  { type: 'compute', label: 'Compute' },
  { type: 'zap', label: 'Zap' },
];

export function ApiWidgetModal({ isOpen, onClose, onSave }: ApiWidgetModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<ApiTemplatePreset | null>(API_PRESET_TEMPLATES[0]);

  // Configuration form state
  const [title, setTitle] = useState(API_PRESET_TEMPLATES[0].defaultTitle);
  const [subtitle, setSubtitle] = useState(API_PRESET_TEMPLATES[0].defaultSubtitle);
  const [endpointUrl, setEndpointUrl] = useState(API_PRESET_TEMPLATES[0].endpointUrl);
  const [jsonPath, setJsonPath] = useState(API_PRESET_TEMPLATES[0].jsonPath);
  const [metricLabel, setMetricLabel] = useState(API_PRESET_TEMPLATES[0].metricLabel);
  const [unit, setUnit] = useState(API_PRESET_TEMPLATES[0].unit);
  const [selectedColor, setSelectedColor] = useState(API_PRESET_TEMPLATES[0].color);
  const [selectedIcon, setSelectedIcon] = useState<WidgetIconType>(API_PRESET_TEMPLATES[0].iconType);

  // Live testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiFetchResult | null>(null);

  const handleSelectPreset = (preset: ApiTemplatePreset) => {
    setSelectedTemplate(preset);
    setTitle(preset.defaultTitle);
    setSubtitle(preset.defaultSubtitle);
    setEndpointUrl(preset.endpointUrl);
    setJsonPath(preset.jsonPath);
    setMetricLabel(preset.metricLabel);
    setUnit(preset.unit);
    setSelectedColor(preset.color);
    setSelectedIcon(preset.iconType);
    setTestResult(null);
  };

  const handleSelectCustom = () => {
    setSelectedTemplate(null);
    setTitle('Custom API');
    setSubtitle('Live REST feed');
    setEndpointUrl('https://api.github.com/repos/facebook/react');
    setJsonPath('stargazers_count');
    setMetricLabel('Metric');
    setUnit('');
    setSelectedColor(pandraColors.primary);
    setSelectedIcon('globe');
    setTestResult(null);
  };

  const handleTestEndpoint = async () => {
    if (!endpointUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a valid API endpoint.');
      return;
    }

    setIsTesting(true);
    const result = await fetchApiWidgetData({
      endpointUrl: endpointUrl.trim(),
      jsonPath: jsonPath.trim(),
      pollIntervalSec: 60,
      unit: unit.trim(),
    });
    setIsTesting(false);
    setTestResult(result);
  };

  const handleMountWidget = () => {
    if (!title.trim() || !endpointUrl.trim()) {
      Alert.alert('Missing info', 'Please provide a title and API endpoint.');
      return;
    }

    const currentMetric = testResult?.success ? testResult.value : '0.00';
    const currentBadge = testResult?.badge || 'LIVE';

    const newWidget: CustomWidget = {
      id: Date.now().toString(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: currentBadge,
      badgeColor: selectedColor,
      metric: currentMetric,
      metricLabel: metricLabel.trim() || 'Live metric',
      color: selectedColor,
      iconType: selectedIcon,
      type: 'api_fetcher',
      apiConfig: {
        endpointUrl: endpointUrl.trim(),
        jsonPath: jsonPath.trim(),
        pollIntervalSec: 60,
        unit: unit.trim(),
        lastFetched: Date.now(),
        lastStatus: testResult?.success ? 'success' : 'idle',
      },
    };

    onSave(newWidget);
    onClose();
  };

  const renderIcon = (type: WidgetIconType, color: string) => {
    switch (type) {
      case 'code':
        return <Code size={16} color={color} />;
      case 'globe':
        return <Globe size={16} color={color} />;
      case 'server':
        return <Server size={16} color={color} />;
      case 'database':
        return <Database size={16} color={color} />;
      case 'telemetry':
        return <Activity size={16} color={color} />;
      case 'compute':
        return <Zap size={16} color={color} />;
      default:
        return <Radio size={16} color={color} />;
    }
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
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
          maxHeight="92%"
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
            marginBottom={14}
          />

          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
            <YStack>
              <Text fontFamily={fonts.bodySemibold} fontSize={16} color={pandraColors.text}>
                API widget
              </Text>
              <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                Connect to a REST endpoint
              </Text>
            </YStack>

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
            {/* Template Selector */}
            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary} marginBottom={8}>
              Template
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <XStack gap={6}>
                {API_PRESET_TEMPLATES.map((preset) => {
                  const isSelected = selectedTemplate?.id === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectPreset(preset)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.sm,
                        backgroundColor: isSelected ? pandraColors.surfaceElevated : pandraColors.bg,
                        borderWidth: 1,
                        borderColor: isSelected ? pandraColors.border : 'transparent',
                      }}
                    >
                      <XStack alignItems="center" gap={6}>
                        {renderIcon(preset.iconType, isSelected ? preset.color : pandraColors.textMuted)}
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={11}
                          color={isSelected ? pandraColors.text : pandraColors.textSecondary}
                        >
                          {preset.name}
                        </Text>
                      </XStack>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSelectCustom}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radius.sm,
                    backgroundColor: selectedTemplate === null ? pandraColors.surfaceElevated : pandraColors.bg,
                    borderWidth: 1,
                    borderColor: selectedTemplate === null ? pandraColors.border : 'transparent',
                  }}
                >
                  <XStack alignItems="center" gap={6}>
                    <Sliders size={14} color={selectedTemplate === null ? pandraColors.primary : pandraColors.textMuted} />
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11}
                      color={selectedTemplate === null ? pandraColors.text : pandraColors.textSecondary}
                    >
                      Custom
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </XStack>
            </ScrollView>

            {/* Endpoint Configuration */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                Endpoint
              </Text>

              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  API URL (GET)
                </Text>
                <Input
                  height={38}
                  backgroundColor={pandraColors.bg}
                  borderWidth={0}
                  borderRadius={radius.xs}
                  color={pandraColors.text}
                  fontFamily={fonts.mono}
                  fontSize={11}
                  value={endpointUrl}
                  onChangeText={setEndpointUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </YStack>

              <XStack gap={10}>
                <YStack flex={2} gap={4}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    JSON path
                  </Text>
                  <Input
                    height={38}
                    backgroundColor={pandraColors.bg}
                    borderWidth={0}
                    borderRadius={radius.xs}
                    color={pandraColors.text}
                    fontFamily={fonts.mono}
                    fontSize={11}
                    placeholder="e.g. stargazers_count"
                    placeholderTextColor={pandraColors.textDim as any}
                    value={jsonPath}
                    onChangeText={setJsonPath}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </YStack>

                <YStack flex={1} gap={4}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    Unit
                  </Text>
                  <Input
                    height={38}
                    backgroundColor={pandraColors.bg}
                    borderWidth={0}
                    borderRadius={radius.xs}
                    color={pandraColors.text}
                    fontFamily={fonts.mono}
                    fontSize={11}
                    placeholder="★ / USD"
                    placeholderTextColor={pandraColors.textDim as any}
                    value={unit}
                    onChangeText={setUnit}
                  />
                </YStack>
              </XStack>

              {/* Test Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleTestEndpoint}
                disabled={isTesting}
                style={{
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: pandraColors.bg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={pandraColors.primary} />
                ) : (
                  <>
                    <RefreshCw size={13} color={pandraColors.primary} />
                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                      Test endpoint
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Test Result */}
              {testResult && (
                <YStack
                  backgroundColor={pandraColors.bg}
                  borderRadius={radius.xs}
                  padding={10}
                  gap={4}
                  marginTop={4}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontFamily={fonts.bodyMedium}
                      fontSize={11}
                      color={testResult.success ? pandraColors.accentGreen : pandraColors.error}
                    >
                      {testResult.success ? 'Success' : 'Error'}
                    </Text>
                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.text}>
                      {testResult.value}
                    </Text>
                  </XStack>
                  {testResult.error && (
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.error}>
                      {testResult.error}
                    </Text>
                  )}
                </YStack>
              )}
            </YStack>

            {/* Tile Appearance */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                Appearance
              </Text>

              <XStack gap={10}>
                <YStack flex={1} gap={4}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    Title
                  </Text>
                  <Input
                    height={38}
                    backgroundColor={pandraColors.bg}
                    borderWidth={0}
                    borderRadius={radius.xs}
                    color={pandraColors.text}
                    fontFamily={fonts.body}
                    fontSize={12}
                    value={title}
                    onChangeText={setTitle}
                  />
                </YStack>

                <YStack flex={1} gap={4}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    Subtitle
                  </Text>
                  <Input
                    height={38}
                    backgroundColor={pandraColors.bg}
                    borderWidth={0}
                    borderRadius={radius.xs}
                    color={pandraColors.text}
                    fontFamily={fonts.body}
                    fontSize={12}
                    value={subtitle}
                    onChangeText={setSubtitle}
                  />
                </YStack>
              </XStack>

              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  Metric label
                </Text>
                <Input
                  height={38}
                  backgroundColor={pandraColors.bg}
                  borderWidth={0}
                  borderRadius={radius.xs}
                  color={pandraColors.text}
                  fontFamily={fonts.body}
                  fontSize={12}
                  value={metricLabel}
                  onChangeText={setMetricLabel}
                />
              </YStack>

              {/* Color Picker */}
              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  Color
                </Text>
                <XStack gap={8}>
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = selectedColor === c.hex;
                    return (
                      <TouchableOpacity
                        key={c.hex}
                        activeOpacity={0.8}
                        onPress={() => setSelectedColor(c.hex)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: c.hex,
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <Check size={13} color="#000" />}
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>

              {/* Icon Picker */}
              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  Icon
                </Text>
                <XStack gap={6} flexWrap="wrap">
                  {ICON_OPTIONS.map((item) => {
                    const isSelected = selectedIcon === item.type;
                    return (
                      <TouchableOpacity
                        key={item.type}
                        activeOpacity={0.8}
                        onPress={() => setSelectedIcon(item.type)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: radius.xs,
                          backgroundColor: isSelected ? pandraColors.bg : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderIcon(item.type, isSelected ? selectedColor : pandraColors.textMuted)}
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>
            </YStack>

            {/* Preview */}
            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary} marginBottom={8}>
              Preview
            </Text>
            <View marginBottom={18}>
              <WidgetTile
                title={title || 'API Widget'}
                subtitle={subtitle || 'Live feed'}
                badge={testResult?.badge || 'LIVE'}
                badgeColor={selectedColor}
                icon={renderIcon(selectedIcon, selectedColor)}
                accentColor={selectedColor}
                showSparkline={true}
                sparklineColor={selectedColor}
              >
                <YStack marginTop={8} gap={4}>
                  <Text fontFamily={fonts.display} fontSize={22} color={pandraColors.text}>
                    {testResult?.success ? testResult.value : '—'}
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    {metricLabel || 'Live metric'}
                  </Text>
                </YStack>
              </WidgetTile>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleMountWidget}
              style={{
                backgroundColor: pandraColors.primary,
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Text fontFamily={fonts.bodySemibold} fontSize={14} color="#FFF">
                Add to deck
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
