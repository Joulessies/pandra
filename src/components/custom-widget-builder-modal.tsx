import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { View, YStack, XStack, Text, Input } from 'tamagui';
import {
  X,
  Image as ImageIcon,
  Sun,
  Battery,
  Newspaper,
  FileText,
  Hash,
  Globe,
  Code,
  Server,
  Database,
  Activity,
  Zap,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import {
  CustomWidget,
  WidgetIconType,
  WidgetType,
  WidgetSize,
  WidgetCardStyle,
  SparklineStyle,
  WidgetTrend,
} from '@/types/widget';
import { WidgetTile } from '@/components/widgets/widgetTile';
import {
  PRESET_CITIES,
  fetchLiveWeatherData,
  fetchLiveNewsData,
  fetchLiveBatteryData,
} from '@/services/personal-widget-fetcher';
import { fetchApiWidgetData } from '@/services/api-fetcher';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let ExpoImagePicker: any = null;
try {
  ExpoImagePicker = require('expo-image-picker');
} catch {
  ExpoImagePicker = null;
}

interface CustomWidgetBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: CustomWidget) => void;
  editingWidget?: CustomWidget | null;
}

type BuilderCategory = 'photo' | 'weather' | 'battery' | 'news' | 'note' | 'counter' | 'api' | 'static';

const PRESET_WALLPAPERS = [
  { label: 'Cyber Tokyo', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80' },
  { label: 'Panda Minimal', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&auto=format&fit=crop&q=80' },
  { label: 'Neon Circuit', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' },
  { label: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
];

const COLOR_OPTIONS = [
  { label: 'Blue', hex: pandraColors.primary },
  { label: 'Orange', hex: pandraColors.secondary },
  { label: 'Green', hex: pandraColors.accentGreen },
  { label: 'Purple', hex: pandraColors.accentPurple },
  { label: 'Amber', hex: pandraColors.accentAmber },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Rose', hex: '#F43F5E' },
];

const ICON_OPTIONS: { type: WidgetIconType; label: string }[] = [
  { type: 'image', label: 'Photo' },
  { type: 'weather', label: 'Weather' },
  { type: 'battery', label: 'Battery' },
  { type: 'newspaper', label: 'News' },
  { type: 'file-text', label: 'Note' },
  { type: 'hash', label: 'Counter' },
  { type: 'code', label: 'Code' },
  { type: 'globe', label: 'Globe' },
  { type: 'server', label: 'Server' },
  { type: 'compute', label: 'Compute' },
  { type: 'database', label: 'DB' },
  { type: 'security', label: 'Shield' },
  { type: 'telemetry', label: 'Activity' },
  { type: 'zap', label: 'Zap' },
];

export function CustomWidgetBuilderModal({
  isOpen,
  onClose,
  onSave,
  editingWidget,
}: CustomWidgetBuilderModalProps) {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<BuilderCategory>('photo');

  // Common metadata
  const [title, setTitle] = useState('Personal Photo');
  const [subtitle, setSubtitle] = useState('My Inspiration');
  const [selectedColor, setSelectedColor] = useState<string>(pandraColors.primary);
  const [selectedIcon, setSelectedIcon] = useState<WidgetIconType>('image');
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('standard');
  const [cardStyle, setCardStyle] = useState<WidgetCardStyle>('solid');
  const [sparklinePattern, setSparklinePattern] = useState<SparklineStyle>('default');

  // Trend Delta
  const [hasTrend, setHasTrend] = useState(false);
  const [trendValue, setTrendValue] = useState('+14.2%');
  const [trendPositive, setTrendPositive] = useState(true);

  // Custom static metric
  const [customMetric, setCustomMetric] = useState('99.9%');
  const [customMetricLabel, setCustomMetricLabel] = useState('Availability');

  // Category specific state
  // 1. Photo
  const [photoUrl, setPhotoUrl] = useState(PRESET_WALLPAPERS[0].url);
  const [photoCaption, setPhotoCaption] = useState('Never stop building 🚀');

  // 2. Weather
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [weatherLiveTemp, setWeatherLiveTemp] = useState('22°C');
  const [weatherCondition, setWeatherCondition] = useState('Clear Sky');

  // 3. Battery
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(false);

  // 4. News
  const [newsSource, setNewsSource] = useState<'hackernews' | 'devto' | 'ai' | 'techcrunch'>('hackernews');
  const [newsHeadline, setNewsHeadline] = useState('Modern developer toolchains report 40% latency reduction');

  // 5. Note
  const [noteContent, setNoteContent] = useState('Refactor edge router before Monday release. Run full test matrix.');
  const [noteTag, setNoteTag] = useState('priority');

  // 6. Counter
  const [counterCount, setCounterCount] = useState(4);
  const [counterUnit, setCounterUnit] = useState('Deploys Today');

  // 7. API
  const [apiUrl, setApiUrl] = useState('https://api.github.com/repos/facebook/react');
  const [apiJsonPath, setApiJsonPath] = useState('stargazers_count');
  const [apiUnit, setApiUnit] = useState('★');
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(false);

  // Prepopulate if editing an existing widget
  useEffect(() => {
    if (editingWidget) {
      setTitle(editingWidget.title);
      setSubtitle(editingWidget.subtitle);
      setSelectedColor(editingWidget.color || pandraColors.primary);
      setSelectedIcon(editingWidget.iconType || 'zap');
      setSelectedSize(editingWidget.size || 'standard');
      setCardStyle(editingWidget.cardStyle || 'solid');
      setSparklinePattern(editingWidget.sparklinePattern || 'default');

      if (editingWidget.trend) {
        setHasTrend(true);
        setTrendValue(editingWidget.trend.value);
        setTrendPositive(editingWidget.trend.isPositive);
      } else {
        setHasTrend(false);
      }

      setCustomMetric(editingWidget.metric || '99.9%');
      setCustomMetricLabel(editingWidget.metricLabel || '');

      if (editingWidget.type === 'photo' && editingWidget.photoConfig) {
        setActiveCategory('photo');
        setPhotoUrl(editingWidget.photoConfig.imageUrl);
        setPhotoCaption(editingWidget.photoConfig.caption || '');
      } else if (editingWidget.type === 'weather' && editingWidget.weatherConfig) {
        setActiveCategory('weather');
        const cityMatch = PRESET_CITIES.find((c) => c.name === editingWidget.weatherConfig?.city) || {
          name: editingWidget.weatherConfig.city,
          lat: editingWidget.weatherConfig.latitude,
          lon: editingWidget.weatherConfig.longitude,
          country: '',
        };
        setSelectedCity(cityMatch);
        setWeatherLiveTemp(editingWidget.weatherConfig.temperature || '22°C');
        setWeatherCondition(editingWidget.weatherConfig.condition || 'Clear Sky');
        setTempUnit(editingWidget.weatherConfig.unit || 'celsius');
      } else if (editingWidget.type === 'battery' && editingWidget.batteryConfig) {
        setActiveCategory('battery');
        setBatteryLevel(editingWidget.batteryConfig.levelPercent ?? 88);
        setIsCharging(editingWidget.batteryConfig.isCharging ?? false);
      } else if (editingWidget.type === 'news' && editingWidget.newsConfig) {
        setActiveCategory('news');
        setNewsSource(editingWidget.newsConfig.source || 'hackernews');
        setNewsHeadline(editingWidget.newsConfig.headline || '');
      } else if (editingWidget.type === 'note' && editingWidget.noteConfig) {
        setActiveCategory('note');
        setNoteContent(editingWidget.noteConfig.text || '');
        setNoteTag(editingWidget.noteConfig.tag || '');
      } else if (editingWidget.type === 'counter' && editingWidget.counterConfig) {
        setActiveCategory('counter');
        setCounterCount(editingWidget.counterConfig.count || 0);
        setCounterUnit(editingWidget.counterConfig.unitLabel || 'Tally');
      } else if (editingWidget.type === 'api_fetcher' && editingWidget.apiConfig) {
        setActiveCategory('api');
        setApiUrl(editingWidget.apiConfig.endpointUrl || '');
        setApiJsonPath(editingWidget.apiConfig.jsonPath || '');
        setApiUnit(editingWidget.apiConfig.unit || '');
      } else {
        setActiveCategory('static');
      }
    } else {
      // Reset for creation
      setSelectedSize('standard');
      setCardStyle('solid');
      setSparklinePattern('default');
      setHasTrend(false);
    }
  }, [editingWidget, isOpen]);

  // Switch category presets
  const handleSelectCategory = (cat: BuilderCategory) => {
    setActiveCategory(cat);
    if (!editingWidget) {
      switch (cat) {
        case 'photo':
          setTitle('Inspiration');
          setSubtitle('Pinned photo');
          setSelectedColor(pandraColors.primary);
          setSelectedIcon('image');
          break;
        case 'weather':
          setTitle('Local Weather');
          setSubtitle(selectedCity.name);
          setSelectedColor(pandraColors.secondary);
          setSelectedIcon('weather');
          refreshWeather(selectedCity.lat, selectedCity.lon, selectedCity.name, tempUnit);
          break;
        case 'battery':
          setTitle('Device Power');
          setSubtitle('System battery');
          setSelectedColor(pandraColors.accentGreen);
          setSelectedIcon('battery');
          refreshBattery();
          break;
        case 'news':
          setTitle('Tech Feed');
          setSubtitle('Hacker News');
          setSelectedColor(pandraColors.accentPurple);
          setSelectedIcon('newspaper');
          refreshNews('hackernews');
          break;
        case 'note':
          setTitle('Quick Note');
          setSubtitle('Workspace sticky');
          setSelectedColor(pandraColors.accentAmber);
          setSelectedIcon('file-text');
          break;
        case 'counter':
          setTitle('Tally Tracker');
          setSubtitle('Daily count');
          setSelectedColor(pandraColors.primary);
          setSelectedIcon('hash');
          break;
        case 'api':
          setTitle('Custom API');
          setSubtitle('Live REST feed');
          setSelectedColor(pandraColors.primary);
          setSelectedIcon('globe');
          break;
        case 'static':
          setTitle('System Metric');
          setSubtitle('Cluster telemetry');
          setSelectedColor(pandraColors.primary);
          setSelectedIcon('telemetry');
          break;
      }
    }
  };

  const handlePickImage = async () => {
    try {
      if (!ExpoImagePicker) {
        try {
          ExpoImagePicker = require('expo-image-picker');
        } catch {
          ExpoImagePicker = null;
        }
      }

      if (!ExpoImagePicker?.launchImageLibraryAsync) {
        Alert.alert('Photo Picker', 'Please enter an image URL or choose a curated wallpaper preset below.');
        return;
      }

      const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow camera roll access to pick a photo for your widget.');
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[ImagePicker] Error picking photo:', err);
      Alert.alert('Photo Picker', 'Unable to open camera roll. You can paste an image URL directly.');
    }
  };

  const refreshWeather = async (lat: number, lon: number, cityName: string, unit: 'celsius' | 'fahrenheit') => {
    setIsLoading(true);
    const data = await fetchLiveWeatherData(lat, lon, cityName, unit);
    setWeatherLiveTemp(data.temperature || '22°C');
    setWeatherCondition(data.condition || 'Clear Sky');
    setIsLoading(false);
  };

  const refreshBattery = async () => {
    setIsLoading(true);
    const data = await fetchLiveBatteryData();
    setBatteryLevel(data.levelPercent ?? 88);
    setIsCharging(data.isCharging ?? false);
    setIsLoading(false);
  };

  const refreshNews = async (source: 'hackernews' | 'devto' | 'ai' | 'techcrunch') => {
    setIsLoading(true);
    const data = await fetchLiveNewsData(source);
    if (data.headline) setNewsHeadline(data.headline);
    setIsLoading(false);
  };

  const testApiEndpoint = async () => {
    if (!apiUrl.trim()) return;
    setIsLoading(true);
    const res = await fetchApiWidgetData({
      endpointUrl: apiUrl.trim(),
      jsonPath: apiJsonPath.trim(),
      pollIntervalSec: 60,
      unit: apiUnit.trim(),
    });
    setIsLoading(false);
    if (res.success) {
      setApiTestResult(res.value);
    } else {
      setApiTestResult('Error: Invalid response');
    }
  };

  const handleCreateOrSaveWidget = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please provide a widget title.');
      return;
    }

    const trendData: WidgetTrend | undefined = hasTrend && trendValue.trim()
      ? { value: trendValue.trim(), isPositive: trendPositive }
      : undefined;

    let widgetType: WidgetType = activeCategory === 'api' ? 'api_fetcher' : activeCategory === 'static' ? 'static' : activeCategory;

    let newWidget: CustomWidget = {
      id: editingWidget ? editingWidget.id : Date.now().toString(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: editingWidget?.badge || 'LIVE',
      badgeColor: selectedColor,
      metric: customMetric.trim() || 'Active',
      metricLabel: customMetricLabel.trim() || subtitle.trim(),
      color: selectedColor,
      iconType: selectedIcon,
      type: widgetType,
      size: selectedSize,
      cardStyle,
      sparklinePattern,
      trend: trendData,
    };

    if (activeCategory === 'photo') {
      newWidget.type = 'photo';
      newWidget.photoConfig = {
        imageUrl: photoUrl.trim(),
        caption: photoCaption.trim() || undefined,
      };
      newWidget.metric = '';
      newWidget.metricLabel = '';
      newWidget.badge = 'PHOTO';
    } else if (activeCategory === 'weather') {
      newWidget.type = 'weather';
      newWidget.weatherConfig = {
        city: selectedCity.name,
        latitude: selectedCity.lat,
        longitude: selectedCity.lon,
        temperature: weatherLiveTemp,
        condition: weatherCondition,
        unit: tempUnit,
        lastFetched: Date.now(),
      };
      newWidget.metric = weatherLiveTemp;
      newWidget.metricLabel = selectedCity.name;
      newWidget.badge = weatherCondition;
    } else if (activeCategory === 'battery') {
      newWidget.type = 'battery';
      newWidget.batteryConfig = {
        levelPercent: batteryLevel,
        isCharging,
        customLabel: isCharging ? 'Charging' : 'Battery',
      };
      newWidget.metric = `${batteryLevel}%`;
      newWidget.metricLabel = isCharging ? 'Charging AC' : 'Battery Power';
      newWidget.badge = isCharging ? '⚡ CHARGING' : `${batteryLevel}%`;
    } else if (activeCategory === 'news') {
      newWidget.type = 'news';
      newWidget.newsConfig = {
        source: newsSource,
        sourceLabel: newsSource === 'hackernews' ? 'Hacker News' : newsSource === 'devto' ? 'Dev.to' : 'Tech Radar',
        headline: newsHeadline,
        lastFetched: Date.now(),
      };
      newWidget.metric = '';
      newWidget.metricLabel = '';
      newWidget.badge = 'LIVE NEWS';
    } else if (activeCategory === 'note') {
      newWidget.type = 'note';
      newWidget.noteConfig = {
        text: noteContent.trim(),
        tag: noteTag.trim() || undefined,
      };
      newWidget.metric = '';
      newWidget.metricLabel = '';
      newWidget.badge = 'NOTE';
    } else if (activeCategory === 'counter') {
      newWidget.type = 'counter';
      newWidget.counterConfig = {
        count: counterCount,
        step: 1,
        unitLabel: counterUnit.trim() || 'Tally',
      };
      newWidget.metric = `${counterCount}`;
      newWidget.metricLabel = counterUnit.trim() || 'Tally';
      newWidget.badge = 'COUNTER';
    } else if (activeCategory === 'api') {
      newWidget.type = 'api_fetcher';
      newWidget.apiConfig = {
        endpointUrl: apiUrl.trim(),
        jsonPath: apiJsonPath.trim(),
        pollIntervalSec: 60,
        unit: apiUnit.trim(),
        lastFetched: Date.now(),
        lastStatus: 'success',
      };
      newWidget.metric = apiTestResult || customMetric || '200 OK';
      newWidget.metricLabel = apiUnit.trim() || customMetricLabel || 'API Metric';
      newWidget.badge = 'REST API';
    }

    onSave(newWidget);
    onClose();
  };

  const renderIcon = (type: WidgetIconType, color: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={15} color={color} />;
      case 'weather':
        return <Sun size={15} color={color} />;
      case 'battery':
        return <Battery size={15} color={color} />;
      case 'newspaper':
        return <Newspaper size={15} color={color} />;
      case 'file-text':
        return <FileText size={15} color={color} />;
      case 'hash':
        return <Hash size={15} color={color} />;
      case 'code':
        return <Code size={15} color={color} />;
      case 'globe':
        return <Globe size={15} color={color} />;
      case 'server':
        return <Server size={15} color={color} />;
      case 'compute':
        return <Zap size={15} color={color} />;
      case 'database':
        return <Database size={15} color={color} />;
      case 'telemetry':
        return <Activity size={15} color={color} />;
      default:
        return <Zap size={15} color={color} />;
    }
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  // Build preview object
  const previewWidget: CustomWidget = {
    id: 'preview',
    title: title || 'My Widget',
    subtitle: subtitle || 'Personalized',
    badge: 'PREVIEW',
    badgeColor: selectedColor,
    metric: activeCategory === 'weather' ? weatherLiveTemp : activeCategory === 'counter' ? `${counterCount}` : activeCategory === 'battery' ? `${batteryLevel}%` : customMetric,
    metricLabel: activeCategory === 'counter' ? counterUnit : (customMetricLabel || subtitle),
    color: selectedColor,
    iconType: selectedIcon,
    type: activeCategory === 'api' ? 'api_fetcher' : activeCategory,
    size: selectedSize,
    cardStyle,
    sparklinePattern,
    trend: hasTrend && trendValue ? { value: trendValue, isPositive: trendPositive } : undefined,
    photoConfig: activeCategory === 'photo' ? { imageUrl: photoUrl, caption: photoCaption } : undefined,
    weatherConfig: activeCategory === 'weather' ? { city: selectedCity.name, latitude: selectedCity.lat, longitude: selectedCity.lon, temperature: weatherLiveTemp, condition: weatherCondition, unit: tempUnit } : undefined,
    batteryConfig: activeCategory === 'battery' ? { levelPercent: batteryLevel, isCharging } : undefined,
    newsConfig: activeCategory === 'news' ? { source: newsSource, sourceLabel: 'Tech Feed', headline: newsHeadline } : undefined,
    noteConfig: activeCategory === 'note' ? { text: noteContent, tag: noteTag } : undefined,
    counterConfig: activeCategory === 'counter' ? { count: counterCount, unitLabel: counterUnit } : undefined,
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View flex={1} justifyContent="flex-end">
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />

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
                {editingWidget ? 'Edit widget' : 'Create widget'}
              </Text>
              <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                {editingWidget ? 'Modify layout, telemetry & appearance' : 'Personalize your deck with custom telemetry & media'}
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
            {/* Widget Category Selector Tabs */}
            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary} marginBottom={8}>
              Widget Type
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <XStack gap={6}>
                {(
                  [
                    { key: 'photo', label: 'Photo', icon: <ImageIcon size={14} color={activeCategory === 'photo' ? pandraColors.primary : pandraColors.textMuted} /> },
                    { key: 'weather', label: 'Weather', icon: <Sun size={14} color={activeCategory === 'weather' ? pandraColors.secondary : pandraColors.textMuted} /> },
                    { key: 'battery', label: 'Battery', icon: <Battery size={14} color={activeCategory === 'battery' ? pandraColors.accentGreen : pandraColors.textMuted} /> },
                    { key: 'news', label: 'News', icon: <Newspaper size={14} color={activeCategory === 'news' ? pandraColors.accentPurple : pandraColors.textMuted} /> },
                    { key: 'note', label: 'Note', icon: <FileText size={14} color={activeCategory === 'note' ? pandraColors.accentAmber : pandraColors.textMuted} /> },
                    { key: 'counter', label: 'Counter', icon: <Hash size={14} color={activeCategory === 'counter' ? pandraColors.primary : pandraColors.textMuted} /> },
                    { key: 'api', label: 'REST API', icon: <Globe size={14} color={activeCategory === 'api' ? pandraColors.primary : pandraColors.textMuted} /> },
                    { key: 'static', label: 'Metric', icon: <Activity size={14} color={activeCategory === 'static' ? pandraColors.primary : pandraColors.textMuted} /> },
                  ] as const
                ).map((cat) => {
                  const isSelected = activeCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCategory(cat.key)}
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
                        {cat.icon}
                        <Text
                          fontFamily={fonts.bodyMedium}
                          fontSize={11}
                          color={isSelected ? pandraColors.text : pandraColors.textSecondary}
                        >
                          {cat.label}
                        </Text>
                      </XStack>
                    </TouchableOpacity>
                  );
                })}
              </XStack>
            </ScrollView>

            {/* SIZING & LAYOUT SELECTOR */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                Widget Size & Span
              </Text>

              <XStack gap={10}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSize('standard')}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: radius.sm,
                    backgroundColor: selectedSize === 'standard' ? pandraColors.primaryGlow : pandraColors.bg,
                    borderWidth: 1,
                    borderColor: selectedSize === 'standard' ? pandraColors.primary : 'transparent',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Minimize2 size={16} color={selectedSize === 'standard' ? pandraColors.primary : pandraColors.textMuted} />
                  <Text fontFamily={fonts.bodyMedium} fontSize={11} color={selectedSize === 'standard' ? pandraColors.primary : pandraColors.textSecondary}>
                    1x1 Standard
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={9.5} color={pandraColors.textMuted}>
                    Half Width Grid
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedSize('wide')}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: radius.sm,
                    backgroundColor: selectedSize === 'wide' ? pandraColors.primaryGlow : pandraColors.bg,
                    borderWidth: 1,
                    borderColor: selectedSize === 'wide' ? pandraColors.primary : 'transparent',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Maximize2 size={16} color={selectedSize === 'wide' ? pandraColors.primary : pandraColors.textMuted} />
                  <Text fontFamily={fonts.bodyMedium} fontSize={11} color={selectedSize === 'wide' ? pandraColors.primary : pandraColors.textSecondary}>
                    2x1 Wide Banner
                  </Text>
                  <Text fontFamily={fonts.body} fontSize={9.5} color={pandraColors.textMuted}>
                    Full Deck Width
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>

            {/* Category-Specific Configuration Form */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                {activeCategory === 'photo' && 'Photo settings'}
                {activeCategory === 'weather' && 'Weather location'}
                {activeCategory === 'battery' && 'Battery telemetry'}
                {activeCategory === 'news' && 'News feed stream'}
                {activeCategory === 'note' && 'Sticky note details'}
                {activeCategory === 'counter' && 'Counter configuration'}
                {activeCategory === 'api' && 'REST API setup'}
                {activeCategory === 'static' && 'Metric parameters'}
              </Text>

              {/* 1. PHOTO CONFIG */}
              {activeCategory === 'photo' && (
                <YStack gap={10}>
                  {/* Pick from Camera Roll */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickImage}
                    style={{
                      height: 38,
                      borderRadius: radius.xs,
                      backgroundColor: pandraColors.primaryGlow,
                      borderWidth: 1,
                      borderColor: pandraColors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <ImageIcon size={14} color={pandraColors.primary} />
                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                      Choose from device photos
                    </Text>
                  </TouchableOpacity>

                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Or enter image URL
                    </Text>
                    <Input
                      height={38}
                      backgroundColor={pandraColors.bg}
                      borderWidth={0}
                      borderRadius={radius.xs}
                      color={pandraColors.text}
                      fontFamily={fonts.mono}
                      fontSize={11}
                      value={photoUrl}
                      onChangeText={setPhotoUrl}
                      autoCapitalize="none"
                    />
                  </YStack>

                  {/* Preset Wallpapers */}
                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Curated wallpapers
                    </Text>
                    <XStack gap={6} flexWrap="wrap">
                      {PRESET_WALLPAPERS.map((wp) => (
                        <TouchableOpacity
                          key={wp.label}
                          activeOpacity={0.8}
                          onPress={() => setPhotoUrl(wp.url)}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: radius.xs,
                            backgroundColor: photoUrl === wp.url ? pandraColors.primaryGlow : pandraColors.bg,
                            borderWidth: 1,
                            borderColor: photoUrl === wp.url ? pandraColors.primary : 'transparent',
                          }}
                        >
                          <Text fontFamily={fonts.bodyMedium} fontSize={10} color={photoUrl === wp.url ? pandraColors.primary : pandraColors.textSecondary}>
                            {wp.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </XStack>
                  </YStack>

                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Caption (optional)
                    </Text>
                    <Input
                      height={38}
                      backgroundColor={pandraColors.bg}
                      borderWidth={0}
                      borderRadius={radius.xs}
                      color={pandraColors.text}
                      fontFamily={fonts.body}
                      fontSize={12}
                      value={photoCaption}
                      onChangeText={setPhotoCaption}
                      placeholder="e.g. Focus on shipping"
                      placeholderTextColor={pandraColors.textDim as any}
                    />
                  </YStack>
                </YStack>
              )}

              {/* 2. WEATHER CONFIG */}
              {activeCategory === 'weather' && (
                <YStack gap={10}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    Choose city
                  </Text>
                  <XStack gap={6} flexWrap="wrap">
                    {PRESET_CITIES.map((c) => {
                      const isSelected = selectedCity.name === c.name;
                      return (
                        <TouchableOpacity
                          key={c.name}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedCity(c);
                            setSubtitle(c.name);
                            refreshWeather(c.lat, c.lon, c.name, tempUnit);
                          }}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: radius.xs,
                            backgroundColor: isSelected ? pandraColors.primaryGlow : pandraColors.bg,
                            borderWidth: 1,
                            borderColor: isSelected ? pandraColors.primary : 'transparent',
                          }}
                        >
                          <Text fontFamily={fonts.bodyMedium} fontSize={11} color={isSelected ? pandraColors.primary : pandraColors.textSecondary}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>

                  <XStack gap={8} marginTop={4}>
                    {(['celsius', 'fahrenheit'] as const).map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        activeOpacity={0.8}
                        onPress={() => {
                          setTempUnit(unit);
                          refreshWeather(selectedCity.lat, selectedCity.lon, selectedCity.name, unit);
                        }}
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: radius.xs,
                          backgroundColor: tempUnit === unit ? pandraColors.primary : pandraColors.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={tempUnit === unit ? '#FFF' : pandraColors.textSecondary}>
                          {unit === 'celsius' ? '°C Metric' : '°F Imperial'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </XStack>
                </YStack>
              )}

              {/* 3. BATTERY CONFIG */}
              {activeCategory === 'battery' && (
                <YStack gap={10}>
                  <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textSecondary}>
                    Monitors your device battery health and power charging state in real-time.
                  </Text>
                  <XStack gap={10}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsCharging(!isCharging)}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: radius.xs,
                        backgroundColor: isCharging ? 'rgba(16, 185, 129, 0.15)' : pandraColors.bg,
                        borderWidth: 1,
                        borderColor: isCharging ? pandraColors.accentGreen : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text fontFamily={fonts.bodyMedium} fontSize={11} color={isCharging ? pandraColors.accentGreen : pandraColors.textSecondary}>
                        {isCharging ? '⚡ Status: Charging' : 'Status: On Battery'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={refreshBattery}
                      style={{
                        paddingHorizontal: 12,
                        height: 36,
                        borderRadius: radius.xs,
                        backgroundColor: pandraColors.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <RefreshCw size={12} color={pandraColors.primary} />
                      <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                        Read Native
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </YStack>
              )}

              {/* 4. NEWS CONFIG */}
              {activeCategory === 'news' && (
                <YStack gap={10}>
                  <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                    Select news stream
                  </Text>
                  <XStack gap={6} flexWrap="wrap">
                    {(
                      [
                        { id: 'hackernews', label: 'Hacker News' },
                        { id: 'devto', label: 'DEV Community' },
                        { id: 'ai', label: 'AI Daily' },
                        { id: 'techcrunch', label: 'Tech Radar' },
                      ] as const
                    ).map((src) => (
                      <TouchableOpacity
                        key={src.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          setNewsSource(src.id);
                          setSubtitle(src.label);
                          refreshNews(src.id);
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: radius.xs,
                          backgroundColor: newsSource === src.id ? pandraColors.primaryGlow : pandraColors.bg,
                          borderWidth: 1,
                          borderColor: newsSource === src.id ? pandraColors.primary : 'transparent',
                        }}
                      >
                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={newsSource === src.id ? pandraColors.primary : pandraColors.textSecondary}>
                          {src.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </XStack>

                  <YStack gap={4} marginTop={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Headline preview
                    </Text>
                    <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.text} numberOfLines={2}>
                      {newsHeadline}
                    </Text>
                  </YStack>
                </YStack>
              )}

              {/* 5. NOTE CONFIG */}
              {activeCategory === 'note' && (
                <YStack gap={10}>
                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Note content
                    </Text>
                    <Input
                      height={54}
                      backgroundColor={pandraColors.bg}
                      borderWidth={0}
                      borderRadius={radius.xs}
                      color={pandraColors.text}
                      fontFamily={fonts.body}
                      fontSize={12}
                      value={noteContent}
                      onChangeText={setNoteContent}
                      multiline
                      placeholder="Write your note or priority..."
                      placeholderTextColor={pandraColors.textDim as any}
                    />
                  </YStack>

                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      Tag (optional)
                    </Text>
                    <Input
                      height={38}
                      backgroundColor={pandraColors.bg}
                      borderWidth={0}
                      borderRadius={radius.xs}
                      color={pandraColors.text}
                      fontFamily={fonts.mono}
                      fontSize={11}
                      value={noteTag}
                      onChangeText={setNoteTag}
                      placeholder="e.g. todo, release, ideas"
                      placeholderTextColor={pandraColors.textDim as any}
                    />
                  </YStack>
                </YStack>
              )}

              {/* 6. COUNTER CONFIG */}
              {activeCategory === 'counter' && (
                <YStack gap={10}>
                  <XStack gap={10}>
                    <YStack flex={1} gap={4}>
                      <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                        Starting count
                      </Text>
                      <Input
                        height={38}
                        backgroundColor={pandraColors.bg}
                        borderWidth={0}
                        borderRadius={radius.xs}
                        color={pandraColors.text}
                        fontFamily={fonts.display}
                        fontSize={14}
                        value={String(counterCount)}
                        onChangeText={(t) => setCounterCount(parseInt(t, 10) || 0)}
                        keyboardType="number-pad"
                      />
                    </YStack>

                    <YStack flex={2} gap={4}>
                      <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                        Unit label
                      </Text>
                      <Input
                        height={38}
                        backgroundColor={pandraColors.bg}
                        borderWidth={0}
                        borderRadius={radius.xs}
                        color={pandraColors.text}
                        fontFamily={fonts.body}
                        fontSize={12}
                        value={counterUnit}
                        onChangeText={setCounterUnit}
                        placeholder="e.g. Deploys, Coffees"
                        placeholderTextColor={pandraColors.textDim as any}
                      />
                    </YStack>
                  </XStack>
                </YStack>
              )}

              {/* 7. API CONFIG */}
              {activeCategory === 'api' && (
                <YStack gap={10}>
                  <YStack gap={4}>
                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                      REST endpoint URL
                    </Text>
                    <Input
                      height={38}
                      backgroundColor={pandraColors.bg}
                      borderWidth={0}
                      borderRadius={radius.xs}
                      color={pandraColors.text}
                      fontFamily={fonts.mono}
                      fontSize={11}
                      value={apiUrl}
                      onChangeText={setApiUrl}
                      autoCapitalize="none"
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
                        value={apiJsonPath}
                        onChangeText={setApiJsonPath}
                        autoCapitalize="none"
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
                        value={apiUnit}
                        onChangeText={setApiUnit}
                      />
                    </YStack>
                  </XStack>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={testApiEndpoint}
                    style={{
                      height: 36,
                      borderRadius: radius.xs,
                      backgroundColor: pandraColors.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={12} color={pandraColors.primary} />
                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                      Test Endpoint
                    </Text>
                  </TouchableOpacity>
                </YStack>
              )}

              {/* 8. STATIC METRIC CONFIG */}
              {activeCategory === 'static' && (
                <YStack gap={10}>
                  <XStack gap={10}>
                    <YStack flex={1} gap={4}>
                      <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                        Metric Value
                      </Text>
                      <Input
                        height={38}
                        backgroundColor={pandraColors.bg}
                        borderWidth={0}
                        borderRadius={radius.xs}
                        color={pandraColors.text}
                        fontFamily={fonts.display}
                        fontSize={14}
                        value={customMetric}
                        onChangeText={setCustomMetric}
                        placeholder="e.g. 99.9%"
                        placeholderTextColor={pandraColors.textDim as any}
                      />
                    </YStack>

                    <YStack flex={2} gap={4}>
                      <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                        Metric Label
                      </Text>
                      <Input
                        height={38}
                        backgroundColor={pandraColors.bg}
                        borderWidth={0}
                        borderRadius={radius.xs}
                        color={pandraColors.text}
                        fontFamily={fonts.body}
                        fontSize={12}
                        value={customMetricLabel}
                        onChangeText={setCustomMetricLabel}
                        placeholder="e.g. SYSTEM UPTIME"
                        placeholderTextColor={pandraColors.textDim as any}
                      />
                    </YStack>
                  </XStack>
                </YStack>
              )}
            </YStack>

            {/* PERFORMANCE TREND DELTA CONFIG */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                  Trend Delta Chip
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setHasTrend(!hasTrend)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radius.xs,
                    backgroundColor: hasTrend ? 'rgba(16, 185, 129, 0.15)' : pandraColors.bg,
                  }}
                >
                  <Text fontFamily={fonts.bodyMedium} fontSize={10} color={hasTrend ? pandraColors.accentGreen : pandraColors.textMuted}>
                    {hasTrend ? 'Enabled' : 'Disabled'}
                  </Text>
                </TouchableOpacity>
              </XStack>

              {hasTrend && (
                <XStack gap={10} alignItems="center">
                  <Input
                    flex={2}
                    height={38}
                    backgroundColor={pandraColors.bg}
                    borderWidth={0}
                    borderRadius={radius.xs}
                    color={pandraColors.text}
                    fontFamily={fonts.mono}
                    fontSize={12}
                    value={trendValue}
                    onChangeText={setTrendValue}
                    placeholder="+14.2%"
                    placeholderTextColor={pandraColors.textDim as any}
                  />

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setTrendPositive(!trendPositive)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: radius.xs,
                      backgroundColor: trendPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {trendPositive ? (
                      <>
                        <TrendingUp size={13} color={pandraColors.accentGreen} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                          Growth
                        </Text>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={13} color={pandraColors.error} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.error}>
                          Drop
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </XStack>
              )}
            </YStack>

            {/* General Appearance (Title, Subtitle, Color, Icon, Card Style, Sparklines) */}
            <YStack
              backgroundColor={pandraColors.surfaceElevated}
              borderRadius={radius.md}
              padding={14}
              gap={10}
              marginBottom={16}
            >
              <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                Appearance & Styling
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

              {/* Color Picker */}
              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  Accent color
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

              {/* Sparkline Selector */}
              <YStack gap={4}>
                <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                  Sparkline Pattern
                </Text>
                <XStack gap={6} flexWrap="wrap">
                  {(['default', 'growth', 'pulse', 'volatile', 'none'] as const).map((pat) => (
                    <TouchableOpacity
                      key={pat}
                      activeOpacity={0.8}
                      onPress={() => setSparklinePattern(pat)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: radius.xs,
                        backgroundColor: sparklinePattern === pat ? pandraColors.primaryGlow : pandraColors.bg,
                        borderWidth: 1,
                        borderColor: sparklinePattern === pat ? pandraColors.primary : 'transparent',
                      }}
                    >
                      <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={10.5}
                        color={sparklinePattern === pat ? pandraColors.primary : pandraColors.textSecondary}
                      >
                        {pat.charAt(0).toUpperCase() + pat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
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

            {/* Live Preview */}
            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary} marginBottom={8}>
              Live preview ({selectedSize === 'wide' ? '2x1 Banner' : '1x1 Square'})
            </Text>
            <View marginBottom={18}>
              <WidgetTile
                widget={previewWidget}
                icon={renderIcon(selectedIcon, selectedColor)}
                onCounterIncrement={() => setCounterCount(counterCount + 1)}
                onCounterDecrement={() => setCounterCount(Math.max(counterCount - 1, 0))}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateOrSaveWidget}
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
                {editingWidget ? 'Save changes' : 'Add to deck'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
