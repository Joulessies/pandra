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
    Sparkles,
    Wand2,
    Check,
    Plus,
    Maximize2,
    Minimize2,
} from 'lucide-react-native';
import { pandraColors, fonts, radius } from '@/theme/token';
import {
    CustomWidget,
    WidgetSize,
} from '@/types/widget';
import { WidgetTile } from '@/components/widgets/widgetTile';
import {
    geocodeCity,
    fetchLiveWeatherData,
    fetchLiveNewsData,
    fetchLiveBatteryData,
} from '@/services/personal-widget-fetcher';
import { fetchApiWidgetData } from '@/services/api-fetcher';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AiWidgetGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (widget: CustomWidget) => void;
}

const EXAMPLE_PROMPTS = [
    { label: 'Tokyo Weather', prompt: 'Live Tokyo weather in Celsius with clear skies forecast' },
    { label: 'Water Tracker', prompt: 'Daily water intake tally counter with +1 glass step' },
    { label: 'Device Battery', prompt: 'Real-time battery monitor with fast charging indicator' },
    { label: 'Hacker News', prompt: 'Top tech news feed from Hacker News' },
    { label: 'GitHub Stars', prompt: 'Live GitHub stars stream for expo/expo' },
    { label: 'Bitcoin Oracle', prompt: 'Bitcoin spot price index in USD with live feed' },
    { label: 'Sprint Note', prompt: 'Sticky note for Monday sprint plan and release goals' },
    { label: 'Cyber Photo', prompt: 'Cyberpunk Tokyo night street photography card' },
];

export function AiWidgetGeneratorModal({
    isOpen,
    onClose,
    onSave,
}: AiWidgetGeneratorModalProps) {
    const insets = useSafeAreaInsets();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWidget, setGeneratedWidget] = useState<CustomWidget | null>(null);
    const [selectedSize, setSelectedSize] = useState<WidgetSize>('standard');

    const handleSynthesizePrompt = async (overridePrompt?: string) => {
        const query = (overridePrompt || prompt).trim();
        if (!query) {
            Alert.alert('Empty Prompt', 'Please enter a description for your widget.');
            return;
        }

        setIsGenerating(true);
        try {
            const lower = query.toLowerCase();
            let synthesized: CustomWidget;

            // 1. WEATHER PROMPT
            if (lower.includes('weather') || lower.includes('forecast') || lower.includes('temperature') || lower.includes('celsius') || lower.includes('fahrenheit')) {
                let targetCity = 'Tokyo';
                const inMatch = query.match(/(?:in|for|at)\s+([A-Za-z\s]+)/i);
                if (inMatch && inMatch[1]) {
                    targetCity = inMatch[1].trim();
                } else {
                    const words = query.split(/\s+/).filter(w => !w.match(/weather|forecast|temperature|live|check|get|the|today|celsius|fahrenheit|in|for|at/i));
                    if (words.length > 0) targetCity = words.join(' ');
                }

                const geo = await geocodeCity(targetCity);
                const lat = geo?.lat ?? 35.6895;
                const lon = geo?.lon ?? 139.6917;
                const cityName = geo?.name ?? targetCity;
                const unit = lower.includes('fahrenheit') ? 'fahrenheit' : 'celsius';
                const weatherData = await fetchLiveWeatherData(lat, lon, cityName, unit);

                synthesized = {
                    id: `ai_w_${Date.now()}`,
                    title: `${cityName} Weather`,
                    subtitle: geo?.country ? `${cityName}, ${geo.country}` : 'Live Forecast',
                    metric: weatherData.temperature || (unit === 'fahrenheit' ? '72°F' : '22°C'),
                    metricLabel: cityName,
                    badge: weatherData.condition || 'Clear Sky',
                    badgeColor: pandraColors.secondary,
                    color: pandraColors.secondary,
                    iconType: 'weather',
                    type: 'weather',
                    size: lower.includes('banner') || lower.includes('wide') ? 'wide' : 'standard',
                    cardStyle: 'glass',
                    weatherConfig: {
                        ...weatherData,
                        city: cityName,
                        latitude: lat,
                        longitude: lon,
                        unit,
                    },
                };
            }
            // 2. COUNTER PROMPT
            else if (lower.includes('counter') || lower.includes('tracker') || lower.includes('tally') || lower.includes('intake') || lower.includes('habit')) {
                let unitName = 'Count';
                if (lower.includes('water') || lower.includes('glass')) unitName = 'Glasses';
                else if (lower.includes('pushup') || lower.includes('rep')) unitName = 'Reps';
                else if (lower.includes('task') || lower.includes('todo')) unitName = 'Tasks';
                else if (lower.includes('commit') || lower.includes('deploy')) unitName = 'Deploys';
                else if (lower.includes('coffee')) unitName = 'Cups';

                let initialCount = 0;
                const numMatch = query.match(/\b(\d+)\b/);
                if (numMatch && numMatch[1]) {
                    initialCount = parseInt(numMatch[1], 10);
                }

                synthesized = {
                    id: `ai_c_${Date.now()}`,
                    title: query.length > 25 ? `${unitName} Tracker` : query,
                    subtitle: 'Interactive Counter',
                    metric: String(initialCount),
                    metricLabel: unitName.toUpperCase(),
                    badge: 'COUNTER',
                    badgeColor: pandraColors.primary,
                    color: pandraColors.primary,
                    iconType: 'hash',
                    type: 'counter',
                    size: 'standard',
                    cardStyle: 'solid',
                    counterConfig: {
                        count: initialCount,
                        step: 1,
                        unitLabel: unitName,
                    },
                };
            }
            // 3. BATTERY PROMPT
            else if (lower.includes('battery') || lower.includes('power') || lower.includes('charge') || lower.includes('charging')) {
                const batt = await fetchLiveBatteryData();
                synthesized = {
                    id: `ai_b_${Date.now()}`,
                    title: 'Device Power',
                    subtitle: 'Hardware Battery',
                    metric: `${batt.levelPercent ?? 88}%`,
                    metricLabel: batt.isCharging ? 'CHARGING AC' : 'BATTERY LEVEL',
                    badge: batt.isCharging ? '⚡ CHARGING' : `${batt.levelPercent ?? 88}%`,
                    badgeColor: pandraColors.accentGreen,
                    color: pandraColors.accentGreen,
                    iconType: 'battery',
                    type: 'battery',
                    size: 'standard',
                    cardStyle: 'glass',
                    batteryConfig: batt,
                };
            }
            // 4. NEWS PROMPT
            else if (lower.includes('news') || lower.includes('hacker') || lower.includes('feed') || lower.includes('headline')) {
                const news = await fetchLiveNewsData('hackernews');
                synthesized = {
                    id: `ai_n_${Date.now()}`,
                    title: 'Tech Wire',
                    subtitle: 'Hacker News Feed',
                    metric: '',
                    metricLabel: '',
                    badge: 'LIVE NEWS',
                    badgeColor: pandraColors.accentPurple,
                    color: pandraColors.accentPurple,
                    iconType: 'newspaper',
                    type: 'news',
                    size: 'wide',
                    cardStyle: 'glass',
                    newsConfig: news,
                };
            }
            // 5. STICKY NOTE / MEMO PROMPT
            else if (lower.includes('note') || lower.includes('memo') || lower.includes('sticky') || lower.includes('reminder') || lower.includes('plan')) {
                let noteText = query;
                let tag = 'memo';
                if (lower.includes('sprint')) tag = 'sprint';
                else if (lower.includes('release')) tag = 'release';
                else if (lower.includes('goal')) tag = 'goals';

                synthesized = {
                    id: `ai_m_${Date.now()}`,
                    title: 'Sticky Memo',
                    subtitle: `#${tag}`,
                    metric: '',
                    metricLabel: '',
                    badge: 'NOTE',
                    badgeColor: pandraColors.accentAmber,
                    color: pandraColors.accentAmber,
                    iconType: 'file-text',
                    type: 'note',
                    size: 'standard',
                    cardStyle: 'solid',
                    noteConfig: {
                        text: noteText,
                        tag,
                    },
                };
            }
            // 6. PHOTO / WALLPAPER PROMPT
            else if (lower.includes('photo') || lower.includes('image') || lower.includes('picture') || lower.includes('wallpaper') || lower.includes('cyberpunk') || lower.includes('tokyo')) {
                let imgUrl = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80';
                if (lower.includes('space') || lower.includes('galaxy')) {
                    imgUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80';
                } else if (lower.includes('circuit') || lower.includes('code') || lower.includes('neon')) {
                    imgUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';
                } else if (lower.includes('nature') || lower.includes('mountain')) {
                    imgUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80';
                }

                synthesized = {
                    id: `ai_p_${Date.now()}`,
                    title: 'Visual Focus',
                    subtitle: query.length > 25 ? 'Curated Photo' : query,
                    metric: '',
                    metricLabel: '',
                    badge: 'PHOTO',
                    badgeColor: pandraColors.primary,
                    color: pandraColors.primary,
                    iconType: 'image',
                    type: 'photo',
                    size: 'wide',
                    cardStyle: 'glass',
                    photoConfig: {
                        imageUrl: imgUrl,
                        caption: query,
                    },
                };
            }
            // 7. GITHUB REPO PROMPT
            else if (lower.includes('github') || lower.includes('repo') || lower.includes('stars')) {
                const repoMatch = query.match(/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
                const repoPath = repoMatch ? `${repoMatch[1]}/${repoMatch[2]}` : 'expo/expo';
                const endpoint = `https://api.github.com/repos/${repoPath}`;

                const apiRes = await fetchApiWidgetData({
                    endpointUrl: endpoint,
                    jsonPath: 'stargazers_count',
                    pollIntervalSec: 60,
                    unit: '★',
                });

                synthesized = {
                    id: `ai_gh_${Date.now()}`,
                    title: repoPath.split('/')[1] || 'Repository',
                    subtitle: repoPath,
                    metric: apiRes.success ? apiRes.value : '★ 35k+',
                    metricLabel: 'GITHUB STARS',
                    badge: 'GITHUB API',
                    badgeColor: '#38BDF8',
                    color: '#38BDF8',
                    iconType: 'code',
                    type: 'api_fetcher',
                    size: 'standard',
                    cardStyle: 'glass',
                    sparklinePattern: 'growth',
                    apiConfig: {
                        endpointUrl: endpoint,
                        jsonPath: 'stargazers_count',
                        pollIntervalSec: 60,
                        unit: '★',
                        lastFetched: Date.now(),
                        lastStatus: 'success',
                    },
                };
            }
            // 8. CRYPTO / BITCOIN / SOLANA PROMPT
            else if (lower.includes('btc') || lower.includes('bitcoin') || lower.includes('crypto') || lower.includes('sol') || lower.includes('solana') || lower.includes('eth')) {
                const isSol = lower.includes('sol');
                const isEth = lower.includes('eth');
                const coinTitle = isSol ? 'Solana Oracle' : isEth ? 'Ethereum Oracle' : 'Bitcoin Oracle';
                const coinSubtitle = isSol ? 'SOL / USD Feed' : isEth ? 'ETH / USD Feed' : 'Coinbase USD Feed';
                const coinColor = isSol ? '#8B5CF6' : isEth ? '#6366F1' : '#F59E0B';
                const endpoint = isSol
                    ? 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
                    : isEth
                    ? 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
                    : 'https://api.coinbase.com/v2/prices/spot?currency=USD';
                const jsonPath = isSol ? 'solana.usd' : isEth ? 'ethereum.usd' : 'data.amount';

                synthesized = {
                    id: `ai_crypto_${Date.now()}`,
                    title: coinTitle,
                    subtitle: coinSubtitle,
                    metric: isSol ? '$184.20' : isEth ? '$3,120.00' : '$96,480.00',
                    metricLabel: 'USD PRICE INDEX',
                    badge: 'LIVE ORACLE',
                    badgeColor: coinColor,
                    color: coinColor,
                    iconType: 'globe',
                    type: 'api_fetcher',
                    size: 'standard',
                    cardStyle: 'glass',
                    sparklinePattern: 'volatile',
                    trend: { value: '+6.4%', isPositive: true },
                    apiConfig: {
                        endpointUrl: endpoint,
                        jsonPath,
                        pollIntervalSec: 30,
                        unit: 'USD',
                    },
                };
            }
            // 9. TELEMETRY / METRIC FALLBACK
            else {
                synthesized = {
                    id: `ai_stat_${Date.now()}`,
                    title: query.slice(0, 24),
                    subtitle: 'AI Telemetry Oracle',
                    metric: '99.98%',
                    metricLabel: 'SYSTEM HEALTH',
                    badge: 'HEALTHY',
                    badgeColor: pandraColors.accentGreen,
                    color: pandraColors.accentGreen,
                    iconType: 'telemetry',
                    type: 'static',
                    size: 'standard',
                    cardStyle: 'glass',
                    sparklinePattern: 'growth',
                    trend: { value: '+14.2%', isPositive: true },
                };
            }

            setSelectedSize(synthesized.size || 'standard');
            setGeneratedWidget(synthesized);
        } catch (err: any) {
            console.error('AI synthesis error:', err);
            Alert.alert('Synthesis Error', err.message || 'Could not parse widget prompt.');
        } finally {
            setIsGenerating(false);
        }
    };

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
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
            <View flex={1} justifyContent="flex-end" backgroundColor="rgba(0, 0, 0, 0.75)">
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

                    {/* Modal Header */}
                    <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
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
                                <Text fontFamily={fonts.bodySemibold} fontSize={16} color={pandraColors.text}>
                                    AI Widget Creator
                                </Text>
                                <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textMuted}>
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
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={14} color={pandraColors.textMuted} />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Prompt Input Box */}
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
                                        backgroundColor: isGenerating || !prompt.trim() ? pandraColors.surfaceElevated : pandraColors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        gap: 6,
                                    }}
                                >
                                    {isGenerating ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Wand2 size={13} color={prompt.trim() ? '#FFFFFF' : pandraColors.textMuted} />
                                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={prompt.trim() ? '#FFFFFF' : pandraColors.textMuted}>
                                                Generate
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </XStack>

                            {/* Quick Suggestion Chips */}
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
                                            <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={pandraColors.textSecondary}>
                                                {ex.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </XStack>
                            </ScrollView>
                        </YStack>

                        {/* LIVE GENERATED WIDGET PREVIEW CANVAS */}
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
                                        <Text fontFamily={fonts.bodySemibold} fontSize={12} color={pandraColors.accentGreen}>
                                            REAL WIDGET GENERATED
                                        </Text>
                                    </XStack>

                                    <View
                                        paddingHorizontal={8}
                                        paddingVertical={2}
                                        borderRadius={radius.xs}
                                        backgroundColor={pandraColors.bg}
                                    >
                                        <Text fontFamily={fonts.mono} fontSize={10} color={generatedWidget.color}>
                                            {generatedWidget.type.toUpperCase()}
                                        </Text>
                                    </View>
                                </XStack>

                                {/* The Actual Live Widget Component */}
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
                                                    count: generatedWidget.counterConfig.count + (generatedWidget.counterConfig.step || 1),
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
                                                    count: Math.max(generatedWidget.counterConfig.count - (generatedWidget.counterConfig.step || 1), 0),
                                                },
                                            });
                                        }
                                    }}
                                />

                                {/* Size Toggle for Generated Widget */}
                                <XStack gap={8} marginTop={4}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedSize('standard')}
                                        style={{
                                            flex: 1,
                                            height: 32,
                                            borderRadius: radius.xs,
                                            backgroundColor: selectedSize === 'standard' ? pandraColors.bg : 'transparent',
                                            borderWidth: 1,
                                            borderColor: selectedSize === 'standard' ? pandraColors.primary : pandraColors.border,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 4,
                                        }}
                                    >
                                        <Minimize2 size={12} color={selectedSize === 'standard' ? pandraColors.primary : pandraColors.textMuted} />
                                        <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={selectedSize === 'standard' ? pandraColors.primary : pandraColors.textSecondary}>
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
                                            backgroundColor: selectedSize === 'wide' ? pandraColors.bg : 'transparent',
                                            borderWidth: 1,
                                            borderColor: selectedSize === 'wide' ? pandraColors.primary : pandraColors.border,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 4,
                                        }}
                                    >
                                        <Maximize2 size={12} color={selectedSize === 'wide' ? pandraColors.primary : pandraColors.textMuted} />
                                        <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={selectedSize === 'wide' ? pandraColors.primary : pandraColors.textSecondary}>
                                            2x1 Banner
                                        </Text>
                                    </TouchableOpacity>
                                </XStack>

                                {/* Action Buttons */}
                                <XStack gap={10} marginTop={4}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={handleSaveToDeck}
                                        style={{
                                            flex: 1,
                                            height: 44,
                                            borderRadius: radius.sm,
                                            backgroundColor: generatedWidget.color || pandraColors.primary,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            gap: 6,
                                        }}
                                    >
                                        <Plus size={16} color="#FFFFFF" />
                                        <Text fontFamily={fonts.bodySemibold} fontSize={13} color="#FFFFFF">
                                            Deploy to Command Deck
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
