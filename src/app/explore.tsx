import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppAuth } from '@/providers/auth-provider';
import { YStack, XStack, Text, View, Input } from 'tamagui';
import {
    ArrowLeft,
    Sparkles,
    Layers,
    Sliders,
    TrendingUp,
    TrendingDown,
    Plus,
    Wand2,
    Compass,
    LayoutGrid,
    Globe,
    Code,
    Database,
    Radio,
    Sun,
    Battery,
    Newspaper,
    FileText,
    Hash,
    Image as ImageIcon,
    RefreshCw,
    Edit3,
    Check,
    Copy,
    Share2,
    LogOut,
    Zap,
    Smartphone,
} from 'lucide-react-native';
import { WidgetTile } from '@/components/widgets/widgetTile';
import { PaywallModal } from '@/components/paywall-modal';
import { CustomWidgetBuilderModal } from '@/components/custom-widget-builder-modal';
import { AiWidgetGeneratorModal } from '@/components/ai-widget-generator-modal';
import { HomeScreenWidgetModal } from '@/components/home-screen-widget-modal';
import { pandraColors, fonts, radius, shadows } from '@/theme/token';
import { useRevenueCat } from '@/hooks/use-revenue-cat';
import {
    CustomWidget,
    WidgetIconType,
    WidgetType,
    WidgetSize,
    WidgetCardStyle,
    SparklineStyle,
} from '@/types/widget';
import {
    addUserWidget,
    loadUserWidgets,
    saveUserWidgets,
    ONBOARDING_ROLES,
} from '@/services/widget-storage';
import { fetchApiWidgetData } from '@/services/api-fetcher';
import { fetchLiveWeatherData } from '@/services/personal-widget-fetcher';

let ExpoClipboard: any = null;
try {
    ExpoClipboard = require('expo-clipboard');
} catch {
    ExpoClipboard = null;
}

type StudioTab = 'workshop' | 'blueprints' | 'palette' | 'backup';

const COLOR_OPTIONS = [
    { name: 'Primary Blue', hex: '#3B82F6' },
    { name: 'Cyan Sky', hex: '#06B6D4' },
    { name: 'Emerald Green', hex: '#10B981' },
    { name: 'Amber Gold', hex: '#F59E0B' },
    { name: 'Purple Violet', hex: '#8B5CF6' },
    { name: 'Neon Rose', hex: '#EC4899' },
    { name: 'Ruby Red', hex: '#EF4444' },
    { name: 'Indigo Deep', hex: '#6366F1' },
    { name: 'Teal Mint', hex: '#14B8A6' },
    { name: 'Slate Silver', hex: '#94A3B8' },
];

const ENGINE_MODES: { type: WidgetType; label: string; icon: any }[] = [
    { type: 'static', label: 'Metric', icon: Sliders },
    { type: 'weather', label: 'Weather', icon: Sun },
    { type: 'battery', label: 'Battery', icon: Battery },
    { type: 'news', label: 'News', icon: Newspaper },
    { type: 'note', label: 'Note', icon: FileText },
    { type: 'counter', label: 'Counter', icon: Hash },
    { type: 'api_fetcher', label: 'REST API', icon: Globe },
    { type: 'photo', label: 'Photo', icon: ImageIcon },
];

const CARD_STYLES: { id: WidgetCardStyle; label: string }[] = [
    { id: 'glass', label: 'Glass' },
    { id: 'solid', label: 'Solid' },
    { id: 'gradient', label: 'Gradient' },
];

const SPARKLINE_PATTERNS: { id: SparklineStyle; label: string }[] = [
    { id: 'growth', label: 'Growth' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'volatile', label: 'Volatile' },
    { id: 'default', label: 'Standard' },
    { id: 'none', label: 'None' },
];

const PHOTO_PRESETS = [
    { name: 'Cyber Dark', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' },
    { name: 'Aurora Neon', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80' },
    { name: 'Monochrome Matrix', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80' },
];

export default function ExploreScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, clerkUser, logout } = useAppAuth();
    const { isPro, isAdmin, simulateUnlockPro, isTrialActive, trialDaysRemaining } = useRevenueCat();

    const [activeTab, setActiveTab] = useState<StudioTab>('workshop');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isHomeScreenModalOpen, setIsHomeScreenModalOpen] = useState(false);
    const [deckWidgets, setDeckWidgets] = useState<CustomWidget[]>([]);
    const [paywallContext, setPaywallContext] = useState('');

    useEffect(() => {
        loadUserWidgets(user?.id, clerkUser).then((ws) => {
            setDeckWidgets(ws || []);
        });
    }, [user?.id, clerkUser, isHomeScreenModalOpen]);

    // Interactive Workshop Core State
    const [engineType, setEngineType] = useState<WidgetType>('static');
    const [title, setTitle] = useState('Core Cluster Node');
    const [subtitle, setSubtitle] = useState('p99 Edge latency');
    const [metric, setMetric] = useState('14.2 ms');
    const [metricLabel, setMetricLabel] = useState('GLOBAL RESPONSE TIME');
    const [badge, setBadge] = useState('HEALTHY');
    const [selectedColor, setSelectedColor] = useState<string>(pandraColors.primary);
    const [customHexInput, setCustomHexInput] = useState<string>(pandraColors.primary);
    const [selectedIcon, setSelectedIcon] = useState<WidgetIconType>('telemetry');
    const [selectedSize, setSelectedSize] = useState<WidgetSize>('standard');
    const [cardStyle, setCardStyle] = useState<WidgetCardStyle>('glass');
    const [tone, setTone] = useState<'ink' | 'paper'>('ink');
    const [sparklinePattern, setSparklinePattern] = useState<SparklineStyle>('growth');
    const [trendType, setTrendType] = useState<'positive' | 'negative' | 'none'>('positive');
    const [trendValue, setTrendValue] = useState('+14.2%');

    // Engine-Specific Customization Sub-State
    const [counterCount, setCounterCount] = useState(42);
    const [counterStep, _setCounterStep] = useState(1);
    const [counterUnit, _setCounterUnit] = useState('Tasks');
    const [noteBody, setNoteBody] = useState('Deploy v2.4 API pipeline to production edge.');
    const [photoUrl, setPhotoUrl] = useState(PHOTO_PRESETS[0].url);
    const [weatherCity, setWeatherCity] = useState('Tokyo');
    const [weatherTemp, setWeatherTemp] = useState('22°C');
    const [weatherCondition, setWeatherCondition] = useState('Clear Sky');
    const [isWeatherFetching, setIsWeatherFetching] = useState(false);
    const [apiUrl, setApiUrl] = useState('https://api.github.com/repos/expo/expo');
    const [apiJsonPath, setApiJsonPath] = useState('stargazers_count');
    const [apiUnit, _setApiUnit] = useState('★');
    const [isApiTesting, setIsApiTesting] = useState(false);
    const [_apiTestSuccess, setApiTestSuccess] = useState<boolean | null>(null);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logout();
            router.replace('/(auth)/onboarding' as any);
        } catch (err) {
            console.error('Logout error:', err);
            router.replace('/(auth)/onboarding' as any);
        } finally {
            setLoggingOut(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            if (!ExpoClipboard) {
                try {
                    ExpoClipboard = require('expo-clipboard');
                } catch {
                    ExpoClipboard = null;
                }
            }
            if (ExpoClipboard?.setStringAsync) {
                await ExpoClipboard.setStringAsync(text);
            }
            setCopiedToken(label);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch {
            setCopiedToken(label);
        }
    };

    const handleExportDeck = async () => {
        try {
            const currentDeck = await loadUserWidgets(user?.id);
            const deckJson = JSON.stringify(currentDeck, null, 2);
            await Share.share({
                title: 'Pandra Deck Configuration',
                message: deckJson,
            });
        } catch (err: any) {
            Alert.alert('Export error', err.message || 'Could not export deck.');
        }
    };

    const handleImportDeck = async () => {
        try {
            if (!ExpoClipboard) {
                try {
                    ExpoClipboard = require('expo-clipboard');
                } catch {
                    ExpoClipboard = null;
                }
            }
            let pastedText = '';
            if (ExpoClipboard?.getStringAsync) {
                pastedText = await ExpoClipboard.getStringAsync();
            }
            if (!pastedText.trim()) {
                Alert.alert('Empty clipboard', 'Please copy a valid Pandra deck JSON to your clipboard first.');
                return;
            }

            const parsed = JSON.parse(pastedText);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].title) {
                await saveUserWidgets(parsed, user?.id);
                Alert.alert('Deck imported', `Successfully imported ${parsed.length} widgets to your deck.`, [
                    { text: 'View Deck', onPress: () => router.replace('/' as any) },
                ]);
            } else {
                Alert.alert('Invalid Format', 'The clipboard content is not a valid Pandra deck array.');
            }
        } catch {
            Alert.alert('Import error', 'Could not parse deck JSON from clipboard. Please ensure it is valid JSON.');
        }
    };

    const handleCustomHexChange = (text: string) => {
        setCustomHexInput(text);
        if (/^#[0-9A-F]{6}$/i.test(text.trim())) {
            setSelectedColor(text.trim());
        }
    };

    const handleTestFetchApi = async () => {
        if (!apiUrl.trim() || !apiJsonPath.trim()) {
            Alert.alert('Incomplete Endpoint', 'Please provide a valid REST endpoint URL and JSON key path.');
            return;
        }
        setIsApiTesting(true);
        setApiTestSuccess(null);
        try {
            const res = await fetchApiWidgetData({
                endpointUrl: apiUrl.trim(),
                jsonPath: apiJsonPath.trim(),
                pollIntervalSec: 60,
                unit: apiUnit.trim(),
            });
            if (res.success) {
                setMetric(res.value);
                setBadge(res.badge || 'ONLINE');
                setApiTestSuccess(true);
            } else {
                setApiTestSuccess(false);
                Alert.alert('API Fetch Error', res.error || 'Failed to extract JSON key from response.');
            }
        } catch (err: any) {
            setApiTestSuccess(false);
            Alert.alert('Network Error', err.message || 'Could not reach server.');
        } finally {
            setIsApiTesting(false);
        }
    };

    const handleFetchLiveWeatherCity = async () => {
        if (!weatherCity.trim()) return;
        setIsWeatherFetching(true);
        try {
            const data = await fetchLiveWeatherData(35.68, 139.76, weatherCity.trim(), 'celsius');
            if (data.temperature) setWeatherTemp(data.temperature);
            if (data.condition) setWeatherCondition(data.condition);
            setMetric(data.temperature || '24°C');
            setSubtitle(`${weatherCity} • ${data.condition || 'Clear'}`);
        } catch (err) {
            console.warn('Weather fetch error:', err);
        } finally {
            setIsWeatherFetching(false);
        }
    };

    // Construct live CustomWidget model
    const livePreviewWidget: CustomWidget = {
        id: 'studio_live_preview',
        title: title.trim() || 'Custom Tile',
        subtitle: subtitle.trim() || 'Live Subtitle',
        badge: badge.trim() || 'LIVE',
        badgeColor: selectedColor,
        metric:
            engineType === 'counter'
                ? String(counterCount)
                : engineType === 'weather'
                ? weatherTemp
                : metric.trim() || '99.9%',
        metricLabel:
            engineType === 'counter'
                ? counterUnit.toUpperCase()
                : metricLabel.trim() || 'METRIC VALUE',
        color: selectedColor,
        iconType: selectedIcon,
        type: engineType,
        size: selectedSize,
        cardStyle,
        tone,
        sparklinePattern,
        trend:
            trendType === 'none'
                ? undefined
                : {
                      value: trendValue.trim() || (trendType === 'positive' ? '+12%' : '-4%'),
                      isPositive: trendType === 'positive',
                  },
        photoConfig:
            engineType === 'photo'
                ? {
                      imageUrl: photoUrl,
                      caption: subtitle,
                  }
                : undefined,
        weatherConfig:
            engineType === 'weather'
                ? {
                      city: weatherCity,
                      latitude: 35.68,
                      longitude: 139.76,
                      temperature: weatherTemp,
                      condition: weatherCondition,
                  }
                : undefined,
        noteConfig:
            engineType === 'note'
                ? {
                      text: noteBody,
                      tag: 'Studio Note',
                  }
                : undefined,
        counterConfig:
            engineType === 'counter'
                ? {
                      count: counterCount,
                      step: counterStep,
                      unitLabel: counterUnit,
                  }
                : undefined,
        apiConfig:
            engineType === 'api_fetcher'
                ? {
                      endpointUrl: apiUrl,
                      jsonPath: apiJsonPath,
                      pollIntervalSec: 60,
                      unit: apiUnit,
                  }
                : undefined,
    };

    const handleDeployCustomWidget = async () => {
        const newWidget: CustomWidget = {
            ...livePreviewWidget,
            id: Date.now().toString(),
        };

        await addUserWidget(newWidget, user?.id, clerkUser);
        Alert.alert('Widget Deployed', `"${newWidget.title}" has been saved to your Command Deck.`, [
            { text: 'View Deck', onPress: () => router.replace('/' as any) },
            { text: 'Keep Designing', style: 'cancel' },
        ]);
    };

    const handleLoadBlueprintIntoWorkshop = (bpWidget: CustomWidget) => {
        setTitle(bpWidget.title);
        setSubtitle(bpWidget.subtitle);
        setMetric(bpWidget.metric || '100%');
        setMetricLabel(bpWidget.metricLabel || 'TELEMETRY');
        setBadge(bpWidget.badge || 'ACTIVE');
        setSelectedColor(bpWidget.color || pandraColors.primary);
        setCustomHexInput(bpWidget.color || pandraColors.primary);
        setSelectedIcon(bpWidget.iconType || 'telemetry');
        setSelectedSize(bpWidget.size || 'standard');
        setCardStyle(bpWidget.cardStyle || 'glass');
        setSparklinePattern(bpWidget.sparklinePattern || 'growth');
        setEngineType(bpWidget.type || 'static');
        if (bpWidget.trend) {
            setTrendType(bpWidget.trend.isPositive ? 'positive' : 'negative');
            setTrendValue(bpWidget.trend.value);
        } else {
            setTrendType('none');
        }
        setActiveTab('workshop');
        Alert.alert('Loaded into Workshop', `Loaded "${bpWidget.title}" for custom styling.`);
    };

    const handleDeployBlueprintDirectly = async (bpWidget: CustomWidget) => {
        const deployed: CustomWidget = {
            ...bpWidget,
            id: Date.now().toString(),
        };
        await addUserWidget(deployed, user?.id, clerkUser);
        Alert.alert('Blueprint Installed', `"${deployed.title}" has been added to your Command Deck.`, [
            { text: 'View Deck', onPress: () => router.replace('/' as any) },
            { text: 'Done', style: 'cancel' },
        ]);
    };

    const tokenList = [
        { label: 'primary', value: pandraColors.primary, color: pandraColors.primary },
        { label: 'secondary', value: pandraColors.secondary, color: pandraColors.secondary },
        { label: 'accentGreen', value: pandraColors.accentGreen, color: pandraColors.accentGreen },
        { label: 'accentPurple', value: pandraColors.accentPurple, color: pandraColors.accentPurple },
        { label: 'accentAmber', value: pandraColors.accentAmber, color: pandraColors.accentAmber },
        { label: 'accentCyan', value: pandraColors.accentCyan, color: pandraColors.accentCyan },
        { label: 'bg', value: pandraColors.bg, color: pandraColors.bg },
        { label: 'surface', value: pandraColors.surface, color: pandraColors.surface },
        { label: 'borderHighlight', value: pandraColors.borderHighlight, color: pandraColors.borderHighlight },
    ];

    const topPadding = Math.max(insets.top, 16) + 8;
    const bottomPadding = Math.max(insets.bottom, 12);

    return (
        <View flex={1} backgroundColor={pandraColors.bg}>
            <YStack flex={1} backgroundColor={pandraColors.bg}>
                {/* Header */}
                <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingTop={topPadding}
                    paddingBottom={12}
                    backgroundColor={pandraColors.bg}
                    zIndex={20}
                >
                    <XStack alignItems="center" gap={10}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: radius.sm,
                                backgroundColor: pandraColors.surfaceElevated,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={() => router.replace('/' as any)}
                        >
                            <ArrowLeft size={16} color={pandraColors.text} />
                        </TouchableOpacity>

                        <View
                            width={34}
                            height={34}
                            borderRadius={radius.sm}
                            backgroundColor={pandraColors.surfaceElevated}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Sliders size={16} color={pandraColors.primary} />
                        </View>

                        <YStack>
                            <Text fontFamily={fonts.bodySemibold} fontSize={16} color={pandraColors.text}>
                                Widget Studio
                            </Text>
                            <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                                Personal Widget Workshop
                            </Text>
                        </YStack>
                    </XStack>

                    <XStack alignItems="center" gap={8}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                setPaywallContext(
                                    isPro
                                        ? 'Pro active. Unlimited widgets & studio access.'
                                        : 'Unlock unlimited widgets & fast telemetry with Pandra Pro.'
                                );
                                setIsPaywallOpen(true);
                            }}
                            style={{
                                height: 30,
                                paddingHorizontal: 10,
                                borderRadius: radius.xs,
                                backgroundColor: isPro ? 'rgba(16, 185, 129, 0.08)' : pandraColors.surface,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {isAdmin ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Admin Pro
                                    </Text>
                                </>
                            ) : isTrialActive ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Pro ({trialDaysRemaining}d)
                                    </Text>
                                </>
                            ) : isPro ? (
                                <>
                                    <Zap size={12} color={pandraColors.accentGreen} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.accentGreen}>
                                        Pro
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={12} color={pandraColors.textMuted} />
                                    <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.textMuted}>
                                        Pro
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setIsHomeScreenModalOpen(true)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Smartphone size={14} color={pandraColors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleLogout}
                            disabled={loggingOut}
                            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loggingOut ? 0.5 : 1,
                            }}
                        >
                            <LogOut size={14} color={pandraColors.textMuted} />
                        </TouchableOpacity>
                    </XStack>
                </XStack>

                {/* Studio Tab Bar */}
                <XStack paddingHorizontal={20} paddingTop={6} paddingBottom={10} backgroundColor={pandraColors.bg}>
                    <XStack
                        flex={1}
                        backgroundColor={pandraColors.surface}
                        borderRadius={radius.full}
                        padding={3}
                        gap={2}
                    >
                        {(
                            [
                                { key: 'workshop', label: 'Workshop' },
                                { key: 'blueprints', label: 'Blueprints' },
                                { key: 'palette', label: 'Palette' },
                                { key: 'backup', label: 'Deck Sync' },
                            ] as const
                        ).map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    activeOpacity={0.7}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 7,
                                        borderRadius: radius.full,
                                        backgroundColor: isActive ? pandraColors.surfaceElevated : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onPress={() => setActiveTab(tab.key)}
                                >
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={11.5}
                                        color={isActive ? pandraColors.text : pandraColors.textMuted}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </XStack>
                </XStack>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 4 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* TAB 1: WORKSHOP (FULL CUSTOMIZATION WORKSPACE) */}
                    {activeTab === 'workshop' && (
                        <YStack gap={16}>
                            {/* Live Interactive Preview Canvas */}
                            <YStack gap={8}>
                                <XStack justifyContent="space-between" alignItems="center">
                                    <Text fontFamily={fonts.bodySemibold} fontSize={13} color={pandraColors.textSecondary}>
                                        LIVE INTERACTIVE CANVAS
                                    </Text>
                                    <View
                                        paddingHorizontal={8}
                                        paddingVertical={2}
                                        borderRadius={radius.xs}
                                        backgroundColor={pandraColors.surfaceElevated}
                                    >
                                        <Text fontFamily={fonts.mono} fontSize={10} color={selectedColor}>
                                            {selectedSize === 'wide' ? '2x1 Banner' : '1x1 Square'} • {engineType.toUpperCase()}
                                        </Text>
                                    </View>
                                </XStack>

                                <WidgetTile
                                    widget={livePreviewWidget}
                                    icon={
                                        selectedIcon === 'weather' ? <Sun size={15} color={selectedColor} /> :
                                        selectedIcon === 'battery' ? <Battery size={15} color={selectedColor} /> :
                                        selectedIcon === 'newspaper' ? <Newspaper size={15} color={selectedColor} /> :
                                        selectedIcon === 'file-text' ? <FileText size={15} color={selectedColor} /> :
                                        selectedIcon === 'hash' ? <Hash size={15} color={selectedColor} /> :
                                        selectedIcon === 'code' ? <Code size={15} color={selectedColor} /> :
                                        selectedIcon === 'api' ? <Globe size={15} color={selectedColor} /> :
                                        selectedIcon === 'server' ? <Radio size={15} color={selectedColor} /> :
                                        selectedIcon === 'database' ? <Database size={15} color={selectedColor} /> :
                                        <Zap size={15} color={selectedColor} />
                                    }
                                />
                            </YStack>

                            {/* AI Prompt Synthesizer Banner */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setIsAiModalOpen(true)}
                                style={{
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                    borderRadius: radius.md,
                                    padding: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: 1,
                                    borderColor: pandraColors.accentPurple,
                                }}
                            >
                                <XStack alignItems="center" gap={10} flex={1}>
                                    <View
                                        width={28}
                                        height={28}
                                        borderRadius={radius.xs}
                                        backgroundColor="rgba(139, 92, 246, 0.2)"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Sparkles size={14} color={pandraColors.accentPurple} />
                                    </View>
                                    <YStack flex={1}>
                                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.accentPurple}>
                                            AI Prompt Synthesizer
                                        </Text>
                                        <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textSecondary}>
                                            Generate real live widgets with natural language prompts
                                        </Text>
                                    </YStack>
                                </XStack>
                                <Plus size={14} color={pandraColors.accentPurple} />
                            </TouchableOpacity>

                            {/* Multi-Source Wizard Banner */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setIsBuilderModalOpen(true)}
                                style={{
                                    backgroundColor: pandraColors.primaryGlow,
                                    borderRadius: radius.md,
                                    padding: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: 1,
                                    borderColor: pandraColors.primary,
                                }}
                            >
                                <XStack alignItems="center" gap={10} flex={1}>
                                    <Wand2 size={16} color={pandraColors.primary} />
                                    <YStack flex={1}>
                                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.primary}>
                                            Guided Modal Wizard
                                        </Text>
                                        <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textSecondary}>
                                            Step-by-step assistant for Camera roll photos, API endpoints, or Open-Meteo
                                        </Text>
                                    </YStack>
                                </XStack>
                                <Plus size={14} color={pandraColors.primary} />
                            </TouchableOpacity>

                            {/* Engine Mode Switcher */}
                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={14}
                                gap={10}
                            >
                                <Text fontFamily={fonts.bodySemibold} fontSize={12.5} color={pandraColors.text}>
                                    1. Widget Engine & Category
                                </Text>
                                <XStack gap={6} flexWrap="wrap">
                                    {ENGINE_MODES.map((em) => {
                                        const isSel = engineType === em.type;
                                        const IconComp = em.icon;
                                        return (
                                            <TouchableOpacity
                                                key={em.type}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    setEngineType(em.type);
                                                    if (em.type === 'weather') setSelectedIcon('weather');
                                                    else if (em.type === 'battery') setSelectedIcon('battery');
                                                    else if (em.type === 'news') setSelectedIcon('newspaper');
                                                    else if (em.type === 'note') setSelectedIcon('file-text');
                                                    else if (em.type === 'counter') setSelectedIcon('hash');
                                                    else if (em.type === 'api_fetcher') setSelectedIcon('api');
                                                }}
                                                style={{
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 6,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: isSel ? pandraColors.surfaceElevated : pandraColors.bg,
                                                    borderWidth: 1,
                                                    borderColor: isSel ? selectedColor : 'transparent',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                }}
                                            >
                                                <IconComp size={12} color={isSel ? selectedColor : pandraColors.textMuted} />
                                                <Text fontFamily={fonts.bodyMedium} fontSize={11} color={isSel ? selectedColor : pandraColors.textSecondary}>
                                                    {em.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </XStack>
                            </YStack>

                            {/* Visual Aesthetics & Color Tuning */}
                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={14}
                                gap={12}
                            >
                                <Text fontFamily={fonts.bodySemibold} fontSize={12.5} color={pandraColors.text}>
                                    2. Color & Visual Aesthetics
                                </Text>

                                {/* Swatches */}
                                <YStack gap={6}>
                                    <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted}>
                                        Select Accent Hue
                                    </Text>
                                    <XStack gap={7} flexWrap="wrap">
                                        {COLOR_OPTIONS.map((c) => (
                                            <TouchableOpacity
                                                key={c.hex}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    setSelectedColor(c.hex);
                                                    setCustomHexInput(c.hex);
                                                }}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: c.hex,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 2,
                                                    borderColor: selectedColor.toLowerCase() === c.hex.toLowerCase() ? '#FFFFFF' : 'transparent',
                                                }}
                                            >
                                                {selectedColor.toLowerCase() === c.hex.toLowerCase() && <Check size={14} color="#FFFFFF" />}
                                            </TouchableOpacity>
                                        ))}
                                    </XStack>
                                </YStack>

                                {/* Custom Hex Input */}
                                <XStack alignItems="center" gap={8}>
                                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.textMuted}>
                                        HEX:
                                    </Text>
                                    <Input
                                        flex={1}
                                        height={36}
                                        backgroundColor={pandraColors.bg}
                                        borderWidth={0}
                                        borderRadius={radius.xs}
                                        paddingHorizontal={10}
                                        fontFamily={fonts.mono}
                                        fontSize={12}
                                        color={pandraColors.text}
                                        value={customHexInput}
                                        onChangeText={handleCustomHexChange}
                                        placeholder="#3B82F6"
                                        placeholderTextColor={pandraColors.textMuted as any}
                                    />
                                </XStack>

                                {/* Card Sizing & Tone */}
                                <XStack gap={8}>
                                    {/* Size */}
                                    <YStack flex={1} gap={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Grid Size
                                        </Text>
                                        <XStack gap={4}>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setSelectedSize('standard')}
                                                style={{
                                                    flex: 1,
                                                    height: 32,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: selectedSize === 'standard' ? pandraColors.surfaceElevated : pandraColors.bg,
                                                    borderWidth: 1,
                                                    borderColor: selectedSize === 'standard' ? selectedColor : 'transparent',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={selectedSize === 'standard' ? selectedColor : pandraColors.textSecondary}>
                                                    1x1 Square
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setSelectedSize('wide')}
                                                style={{
                                                    flex: 1,
                                                    height: 32,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: selectedSize === 'wide' ? pandraColors.surfaceElevated : pandraColors.bg,
                                                    borderWidth: 1,
                                                    borderColor: selectedSize === 'wide' ? selectedColor : 'transparent',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={selectedSize === 'wide' ? selectedColor : pandraColors.textSecondary}>
                                                    2x1 Banner
                                                </Text>
                                            </TouchableOpacity>
                                        </XStack>
                                    </YStack>

                                    {/* Tone */}
                                    <YStack flex={1} gap={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Card Theme Tone
                                        </Text>
                                        <XStack gap={4}>
                                            {(['ink', 'paper'] as const).map((t) => (
                                                <TouchableOpacity
                                                    key={t}
                                                    activeOpacity={0.8}
                                                    onPress={() => setTone(t)}
                                                    style={{
                                                        flex: 1,
                                                        height: 32,
                                                        borderRadius: radius.xs,
                                                        backgroundColor: tone === t ? pandraColors.surfaceElevated : pandraColors.bg,
                                                        borderWidth: 1,
                                                        borderColor: tone === t ? selectedColor : 'transparent',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={tone === t ? selectedColor : pandraColors.textSecondary}>
                                                        {t === 'ink' ? 'Dark' : 'Paper'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </XStack>
                                    </YStack>
                                </XStack>

                                {/* Card Style */}
                                <YStack gap={6}>
                                    <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted}>
                                        Card Style
                                    </Text>
                                    <XStack gap={6}>
                                        {CARD_STYLES.map((cs) => {
                                            const isSel = cardStyle === cs.id;
                                            return (
                                                <TouchableOpacity
                                                    key={cs.id}
                                                    activeOpacity={0.8}
                                                    onPress={() => setCardStyle(cs.id)}
                                                    style={{
                                                        flex: 1,
                                                        height: 32,
                                                        borderRadius: radius.xs,
                                                        backgroundColor: isSel ? pandraColors.surfaceElevated : pandraColors.bg,
                                                        borderWidth: 1,
                                                        borderColor: isSel ? selectedColor : 'transparent',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={isSel ? selectedColor : pandraColors.textSecondary}>
                                                        {cs.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </XStack>
                                </YStack>

                                {/* Sparkline & Trend */}
                                {engineType === 'static' && (
                                    <YStack gap={8}>
                                        <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted}>
                                            Sparkline Pattern
                                        </Text>
                                        <XStack gap={6} flexWrap="wrap">
                                            {SPARKLINE_PATTERNS.map((sp) => {
                                                const isSel = sparklinePattern === sp.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={sp.id}
                                                        activeOpacity={0.8}
                                                        onPress={() => setSparklinePattern(sp.id)}
                                                        style={{
                                                            paddingHorizontal: 10,
                                                            paddingVertical: 5,
                                                            borderRadius: radius.xs,
                                                            backgroundColor: isSel ? pandraColors.surfaceElevated : pandraColors.bg,
                                                            borderWidth: 1,
                                                            borderColor: isSel ? selectedColor : 'transparent',
                                                        }}
                                                    >
                                                        <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={isSel ? selectedColor : pandraColors.textSecondary}>
                                                            {sp.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </XStack>

                                        {/* Trend Delta */}
                                        <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted} marginTop={4}>
                                            Trend Delta Indicator
                                        </Text>
                                        <XStack gap={6}>
                                            {(['positive', 'negative', 'none'] as const).map((t) => (
                                                <TouchableOpacity
                                                    key={t}
                                                    activeOpacity={0.8}
                                                    onPress={() => setTrendType(t)}
                                                    style={{
                                                        flex: 1,
                                                        height: 32,
                                                        borderRadius: radius.xs,
                                                        backgroundColor: trendType === t ? pandraColors.surfaceElevated : pandraColors.bg,
                                                        borderWidth: 1,
                                                        borderColor: trendType === t ? (t === 'positive' ? pandraColors.accentGreen : t === 'negative' ? pandraColors.error : selectedColor) : 'transparent',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                        gap: 4,
                                                    }}
                                                >
                                                    {t === 'positive' && <TrendingUp size={11} color={pandraColors.accentGreen} />}
                                                    {t === 'negative' && <TrendingDown size={11} color={pandraColors.error} />}
                                                    <Text
                                                        fontFamily={fonts.bodyMedium}
                                                        fontSize={10}
                                                        color={trendType === t ? (t === 'positive' ? pandraColors.accentGreen : t === 'negative' ? pandraColors.error : selectedColor) : pandraColors.textSecondary}
                                                    >
                                                        {t === 'positive' ? 'Up Trend' : t === 'negative' ? 'Down' : 'None'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </XStack>
                                    </YStack>
                                )}
                            </YStack>

                            {/* Content & Copy Parameters */}
                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={14}
                                gap={12}
                            >
                                <Text fontFamily={fonts.bodySemibold} fontSize={12.5} color={pandraColors.text}>
                                    3. Content & Text Customization
                                </Text>

                                {/* Title & Subtitle */}
                                <YStack gap={4}>
                                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                        Widget Title
                                    </Text>
                                    <Input
                                        height={38}
                                        backgroundColor={pandraColors.bg}
                                        borderWidth={0}
                                        borderRadius={radius.xs}
                                        paddingHorizontal={10}
                                        fontFamily={fonts.body}
                                        fontSize={12}
                                        color={pandraColors.text}
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                </YStack>

                                <YStack gap={4}>
                                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                        Subtitle / Caption
                                    </Text>
                                    <Input
                                        height={38}
                                        backgroundColor={pandraColors.bg}
                                        borderWidth={0}
                                        borderRadius={radius.xs}
                                        paddingHorizontal={10}
                                        fontFamily={fonts.body}
                                        fontSize={12}
                                        color={pandraColors.text}
                                        value={subtitle}
                                        onChangeText={setSubtitle}
                                    />
                                </YStack>

                                {/* Metric & Badge */}
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
                                            paddingHorizontal={10}
                                            fontFamily={fonts.mono}
                                            fontSize={12}
                                            color={pandraColors.text}
                                            value={metric}
                                            onChangeText={setMetric}
                                        />
                                    </YStack>

                                    <YStack flex={1} gap={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Status Badge Text
                                        </Text>
                                        <Input
                                            height={38}
                                            backgroundColor={pandraColors.bg}
                                            borderWidth={0}
                                            borderRadius={radius.xs}
                                            paddingHorizontal={10}
                                            fontFamily={fonts.bodyMedium}
                                            fontSize={12}
                                            color={pandraColors.text}
                                            value={badge}
                                            onChangeText={setBadge}
                                        />
                                    </YStack>
                                </XStack>

                                <YStack gap={4}>
                                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                        Metric Sub-Label
                                    </Text>
                                    <Input
                                        height={38}
                                        backgroundColor={pandraColors.bg}
                                        borderWidth={0}
                                        borderRadius={radius.xs}
                                        paddingHorizontal={10}
                                        fontFamily={fonts.mono}
                                        fontSize={11}
                                        color={pandraColors.textSecondary}
                                        value={metricLabel}
                                        onChangeText={setMetricLabel}
                                    />
                                </YStack>

                                {/* Specific Engine Controls */}
                                {engineType === 'note' && (
                                    <YStack gap={4} marginTop={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Sticky Note Content
                                        </Text>
                                        <Input
                                            height={60}
                                            multiline
                                            backgroundColor={pandraColors.bg}
                                            borderWidth={0}
                                            borderRadius={radius.xs}
                                            padding={10}
                                            fontFamily={fonts.body}
                                            fontSize={12}
                                            color={pandraColors.text}
                                            value={noteBody}
                                            onChangeText={setNoteBody}
                                        />
                                    </YStack>
                                )}

                                {engineType === 'counter' && (
                                    <YStack gap={8} marginTop={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Counter Value & Stepper
                                        </Text>
                                        <XStack gap={8} alignItems="center">
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setCounterCount(Math.max(counterCount - counterStep, 0))}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: pandraColors.surfaceElevated,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text fontFamily={fonts.display} fontSize={16} color={pandraColors.text}>-</Text>
                                            </TouchableOpacity>

                                            <View
                                                flex={1}
                                                height={36}
                                                borderRadius={radius.xs}
                                                backgroundColor={pandraColors.bg}
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Text fontFamily={fonts.display} fontSize={16} color={selectedColor}>
                                                    {counterCount} {counterUnit}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setCounterCount(counterCount + counterStep)}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: pandraColors.surfaceElevated,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text fontFamily={fonts.display} fontSize={16} color={pandraColors.text}>+</Text>
                                            </TouchableOpacity>
                                        </XStack>
                                    </YStack>
                                )}

                                {engineType === 'photo' && (
                                    <YStack gap={6} marginTop={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            Wallpaper Preset
                                        </Text>
                                        <XStack gap={6}>
                                            {PHOTO_PRESETS.map((p, pi) => (
                                                <TouchableOpacity
                                                    key={pi}
                                                    activeOpacity={0.8}
                                                    onPress={() => setPhotoUrl(p.url)}
                                                    style={{
                                                        flex: 1,
                                                        paddingVertical: 6,
                                                        borderRadius: radius.xs,
                                                        backgroundColor: photoUrl === p.url ? pandraColors.surfaceElevated : pandraColors.bg,
                                                        borderWidth: 1,
                                                        borderColor: photoUrl === p.url ? selectedColor : 'transparent',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text fontFamily={fonts.bodyMedium} fontSize={10} color={photoUrl === p.url ? selectedColor : pandraColors.textSecondary}>
                                                        {p.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </XStack>
                                    </YStack>
                                )}

                                {engineType === 'weather' && (
                                    <YStack gap={6} marginTop={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            City Location
                                        </Text>
                                        <XStack gap={8}>
                                            <Input
                                                flex={1}
                                                height={36}
                                                backgroundColor={pandraColors.bg}
                                                borderWidth={0}
                                                borderRadius={radius.xs}
                                                paddingHorizontal={10}
                                                fontFamily={fonts.body}
                                                fontSize={12}
                                                color={pandraColors.text}
                                                value={weatherCity}
                                                onChangeText={setWeatherCity}
                                                placeholder="Tokyo, London, NYC..."
                                                placeholderTextColor={pandraColors.textMuted as any}
                                            />
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={handleFetchLiveWeatherCity}
                                                style={{
                                                    height: 36,
                                                    paddingHorizontal: 12,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: pandraColors.surfaceElevated,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                    gap: 4,
                                                }}
                                            >
                                                {isWeatherFetching ? (
                                                    <ActivityIndicator size="small" color={pandraColors.primary} />
                                                ) : (
                                                    <RefreshCw size={12} color={pandraColors.primary} />
                                                )}
                                                <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                                                    Sync
                                                </Text>
                                            </TouchableOpacity>
                                        </XStack>
                                    </YStack>
                                )}

                                {engineType === 'api_fetcher' && (
                                    <YStack gap={8} marginTop={4}>
                                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                            REST API Configuration
                                        </Text>
                                        <Input
                                            height={36}
                                            backgroundColor={pandraColors.bg}
                                            borderWidth={0}
                                            borderRadius={radius.xs}
                                            paddingHorizontal={10}
                                            fontFamily={fonts.mono}
                                            fontSize={11}
                                            color={pandraColors.text}
                                            value={apiUrl}
                                            onChangeText={setApiUrl}
                                            placeholder="https://api.example.com/v1/data"
                                            placeholderTextColor={pandraColors.textMuted as any}
                                        />
                                        <XStack gap={8}>
                                            <Input
                                                flex={1}
                                                height={36}
                                                backgroundColor={pandraColors.bg}
                                                borderWidth={0}
                                                borderRadius={radius.xs}
                                                paddingHorizontal={10}
                                                fontFamily={fonts.mono}
                                                fontSize={11}
                                                color={pandraColors.text}
                                                value={apiJsonPath}
                                                onChangeText={setApiJsonPath}
                                                placeholder="JSON key path (e.g. data.count)"
                                                placeholderTextColor={pandraColors.textMuted as any}
                                            />
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={handleTestFetchApi}
                                                disabled={isApiTesting}
                                                style={{
                                                    height: 36,
                                                    paddingHorizontal: 12,
                                                    borderRadius: radius.xs,
                                                    backgroundColor: pandraColors.surfaceElevated,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                    gap: 4,
                                                }}
                                            >
                                                {isApiTesting ? (
                                                    <ActivityIndicator size="small" color={pandraColors.primary} />
                                                ) : (
                                                    <RefreshCw size={12} color={pandraColors.primary} />
                                                )}
                                                <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.primary}>
                                                    Test Fetch
                                                </Text>
                                            </TouchableOpacity>
                                        </XStack>
                                    </YStack>
                                )}

                                {/* Deploy Button */}
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleDeployCustomWidget}
                                    style={{
                                        height: 46,
                                        borderRadius: radius.sm,
                                        backgroundColor: selectedColor,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 8,
                                        marginTop: 8,
                                    }}
                                >
                                    <Plus size={16} color="#FFFFFF" />
                                    <Text fontFamily={fonts.bodySemibold} fontSize={13.5} color="#FFFFFF">
                                        Deploy Widget to Command Deck
                                    </Text>
                                </TouchableOpacity>
                            </YStack>
                        </YStack>
                    )}

                    {/* TAB 2: BLUEPRINTS / STARTER KITS */}
                    {activeTab === 'blueprints' && (
                        <YStack gap={14}>
                            <Text fontFamily={fonts.bodySemibold} fontSize={14} color={pandraColors.text}>
                                Preset Starter Blueprints
                            </Text>
                            <Text fontFamily={fonts.body} fontSize={11.5} color={pandraColors.textSecondary}>
                                Deploy instant modular cards to your deck or tap &quot;Customize&quot; to load them into the Workshop.
                            </Text>

                            {Object.values(ONBOARDING_ROLES).map((role) => (
                                <YStack
                                    key={role.id}
                                    backgroundColor={pandraColors.surface}
                                    borderRadius={radius.md}
                                    padding={16}
                                    gap={10}
                                >
                                    <XStack justifyContent="space-between" alignItems="center">
                                        <XStack alignItems="center" gap={8}>
                                            <View
                                                width={28}
                                                height={28}
                                                borderRadius={radius.xs}
                                                backgroundColor={pandraColors.surfaceElevated}
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Layers size={14} color={role.color} />
                                            </View>
                                            <YStack>
                                                <Text fontFamily={fonts.bodySemibold} fontSize={13} color={pandraColors.text}>
                                                    {role.title}
                                                </Text>
                                                <Text fontFamily={fonts.body} fontSize={10.5} color={pandraColors.textMuted}>
                                                    {role.subtitle}
                                                </Text>
                                            </YStack>
                                        </XStack>
                                    </XStack>

                                    <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textSecondary}>
                                        {role.description}
                                    </Text>

                                    {/* Widgets in this blueprint */}
                                    <YStack gap={6} marginTop={4}>
                                        {role.widgets.map((w, wi) => (
                                            <XStack
                                                key={wi}
                                                backgroundColor={pandraColors.bg}
                                                borderRadius={radius.xs}
                                                padding={10}
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <YStack flex={1}>
                                                    <Text fontFamily={fonts.bodyMedium} fontSize={11.5} color={pandraColors.text}>
                                                        {w.title}
                                                    </Text>
                                                    <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                                        {w.metric || w.subtitle}
                                                    </Text>
                                                </YStack>

                                                <XStack gap={6}>
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => handleLoadBlueprintIntoWorkshop(w)}
                                                        style={{
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 5,
                                                            borderRadius: radius.xs,
                                                            backgroundColor: pandraColors.surfaceElevated,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <Edit3 size={11} color={pandraColors.textMuted} />
                                                        <Text fontFamily={fonts.bodyMedium} fontSize={10} color={pandraColors.textSecondary}>
                                                            Customize
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => handleDeployBlueprintDirectly(w)}
                                                        style={{
                                                            paddingHorizontal: 9,
                                                            paddingVertical: 5,
                                                            borderRadius: radius.xs,
                                                            backgroundColor: w.color || pandraColors.primary,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <Plus size={11} color="#FFFFFF" />
                                                        <Text fontFamily={fonts.bodyMedium} fontSize={10} color="#FFFFFF">
                                                            Add Tile
                                                        </Text>
                                                    </TouchableOpacity>
                                                </XStack>
                                            </XStack>
                                        ))}
                                    </YStack>
                                </YStack>
                            ))}
                        </YStack>
                    )}

                    {/* TAB 3: PALETTE */}
                    {activeTab === 'palette' && (
                        <YStack gap={14}>
                            <Text fontFamily={fonts.bodySemibold} fontSize={14} color={pandraColors.text}>
                                Design Token Palette
                            </Text>
                            <Text fontFamily={fonts.body} fontSize={11.5} color={pandraColors.textSecondary}>
                                Tap any color token to copy its exact hex code to your system clipboard.
                            </Text>

                            {tokenList.map((token, idx) => (
                                <XStack
                                    key={idx}
                                    backgroundColor={pandraColors.surface}
                                    borderRadius={radius.md}
                                    padding={12}
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <XStack alignItems="center" gap={12} flex={1}>
                                        <View
                                            width={28}
                                            height={28}
                                            borderRadius={radius.xs}
                                            backgroundColor={token.color}
                                        />
                                        <YStack flex={1}>
                                            <Text fontFamily={fonts.mono} fontSize={12} color={pandraColors.text}>
                                                {token.label}
                                            </Text>
                                            <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.textMuted}>
                                                {token.value}
                                            </Text>
                                        </YStack>
                                    </XStack>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={{ padding: 6 }}
                                        onPress={() => copyToClipboard(token.value, token.label)}
                                    >
                                        {copiedToken === token.label ? (
                                            <Check size={16} color={pandraColors.accentGreen} />
                                        ) : (
                                            <Copy size={16} color={pandraColors.textMuted} />
                                        )}
                                    </TouchableOpacity>
                                </XStack>
                            ))}
                        </YStack>
                    )}

                    {/* TAB 4: DECK SYNC & BACKUP */}
                    {activeTab === 'backup' && (
                        <YStack gap={14}>
                            <Text fontFamily={fonts.bodySemibold} fontSize={14} color={pandraColors.text}>
                                Deck Backup & Migration
                            </Text>

                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={16}
                                gap={12}
                            >
                                <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                                    Export your custom widgets to JSON or migrate a deck configuration from your clipboard.
                                </Text>

                                <XStack gap={10}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={handleExportDeck}
                                        style={{
                                            flex: 1,
                                            height: 38,
                                            borderRadius: radius.sm,
                                            backgroundColor: pandraColors.surfaceElevated,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 6,
                                        }}
                                    >
                                        <Share2 size={13} color={pandraColors.primary} />
                                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.primary}>
                                            Export Deck
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={handleImportDeck}
                                        style={{
                                            flex: 1,
                                            height: 38,
                                            borderRadius: radius.sm,
                                            backgroundColor: pandraColors.surfaceElevated,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 6,
                                        }}
                                    >
                                        <Copy size={13} color={pandraColors.textSecondary} />
                                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                                            Import JSON
                                        </Text>
                                    </TouchableOpacity>
                                </XStack>
                            </YStack>

                            {/* Account & Subscription Card */}
                            <Text fontFamily={fonts.bodySemibold} fontSize={14} color={pandraColors.text} marginTop={6}>
                                Account & Access
                            </Text>

                            <YStack
                                backgroundColor={pandraColors.surface}
                                borderRadius={radius.md}
                                padding={16}
                                gap={10}
                            >
                                {[
                                    { label: 'User ID', value: user?.id || 'Builder' },
                                    { label: 'Email', value: user?.email || 'builder@pandra.dev' },
                                    { label: 'Status', value: 'Online', color: pandraColors.accentGreen },
                                    {
                                        label: 'Privileges',
                                        value: isAdmin ? 'Admin Lifetime' : isTrialActive ? `Pro Trial (${trialDaysRemaining}d)` : isPro ? 'Pro Subscribed' : 'Free Tier',
                                        color: isPro ? pandraColors.accentGreen : pandraColors.textMuted,
                                    },
                                ].map((row, i) => (
                                    <XStack key={i} justifyContent="space-between">
                                        <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
                                            {row.label}
                                        </Text>
                                        <Text
                                            fontFamily={fonts.mono}
                                            fontSize={11}
                                            color={(row as any).color || pandraColors.text}
                                        >
                                            {row.value}
                                        </Text>
                                    </XStack>
                                ))}

                                <XStack gap={8} marginTop={6}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            setPaywallContext('Manage your subscription.');
                                            setIsPaywallOpen(true);
                                        }}
                                        style={{
                                            flex: 1,
                                            height: 38,
                                            borderRadius: radius.sm,
                                            backgroundColor: isPro ? pandraColors.surfaceElevated : pandraColors.primary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={isPro ? pandraColors.text : '#FFF'}>
                                            {isPro ? 'Manage Tier' : 'Upgrade to Pro'}
                                        </Text>
                                    </TouchableOpacity>

                                    {simulateUnlockPro && (
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => {
                                                simulateUnlockPro(!isPro);
                                                Alert.alert(
                                                    'Pro toggle',
                                                    !isPro ? 'Pro simulated.' : 'Pro disabled (testing).'
                                                );
                                            }}
                                            style={{
                                                paddingHorizontal: 12,
                                                height: 38,
                                                borderRadius: radius.sm,
                                                backgroundColor: pandraColors.surfaceElevated,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                                                Toggle
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </XStack>
                            </YStack>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleLogout}
                                disabled={loggingOut}
                                style={{
                                    height: 44,
                                    borderRadius: radius.md,
                                    backgroundColor: pandraColors.surfaceElevated,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    opacity: loggingOut ? 0.5 : 1,
                                    marginTop: 4,
                                }}
                            >
                                <LogOut size={14} color={pandraColors.textMuted} />
                                <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.textSecondary}>
                                    {loggingOut ? 'Signing out…' : 'Sign out'}
                                </Text>
                            </TouchableOpacity>
                        </YStack>
                    )}
                </ScrollView>

                {/* Bottom Dock */}
                <View
                    position="absolute"
                    bottom={bottomPadding + 6}
                    left={32}
                    right={32}
                    backgroundColor={pandraColors.surfaceGlass}
                    borderRadius={radius.full}
                    paddingVertical={6}
                    paddingHorizontal={16}
                    flexDirection="row"
                    justifyContent="space-around"
                    alignItems="center"
                    zIndex={20}
                    {...shadows.elevated}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            borderRadius: radius.full,
                        }}
                        onPress={() => router.replace('/' as any)}
                    >
                        <LayoutGrid size={14} color={pandraColors.textMuted} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textMuted}>
                            Deck
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            borderRadius: radius.full,
                            backgroundColor: pandraColors.surfaceElevated,
                        }}
                        onPress={() => {}}
                    >
                        <Compass size={14} color={pandraColors.text} />
                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.text}>
                            Studio
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Paywall Modal */}
                <PaywallModal
                    isOpen={isPaywallOpen}
                    onClose={() => setIsPaywallOpen(false)}
                    featureContext={paywallContext}
                />

                {/* Custom Widget Builder Modal */}
                <CustomWidgetBuilderModal
                    isOpen={isBuilderModalOpen}
                    onClose={() => setIsBuilderModalOpen(false)}
                    onSave={async (widget) => {
                        await addUserWidget(widget, user?.id);
                        Alert.alert('Widget Deployed', `"${widget.title}" has been saved to your deck.`);
                        router.push('/' as any);
                    }}
                />

                {/* AI Widget Generator Modal */}
                <AiWidgetGeneratorModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    onSave={async (widget) => {
                        await addUserWidget(widget, user?.id);
                        Alert.alert('Widget Deployed', `"${widget.title}" has been saved to your deck.`);
                        router.push('/' as any);
                    }}
                />

                {/* Native Home Screen Widgets Exporter & Preview Modal */}
                <HomeScreenWidgetModal
                    isOpen={isHomeScreenModalOpen}
                    onClose={() => setIsHomeScreenModalOpen(false)}
                    widgets={deckWidgets}
                />
            </YStack>
        </View>
    );
}
