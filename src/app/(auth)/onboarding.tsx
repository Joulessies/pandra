import React, { useEffect, useState } from 'react';
import {
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, XStack, Text, View } from 'tamagui';
import {
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Zap,
    Code,
    Check,
    RefreshCw,
    CheckCircle2,
    CloudSun,
    TrendingUp,
    Droplets,
    BatteryCharging,
    Wand2,
    Activity,
    Rocket,
    Cpu,
    Move,
} from 'lucide-react-native';
import { WidgetTile, SparklinePattern } from '@/components/widgets/widgetTile';
import { PaywallModal } from '@/components/paywall-modal';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { pandraColors, fonts, radius } from '@/theme/token';
import {
    ONBOARDING_ROLES,
    RolePreset,
    saveOnboardingRolePreference,
} from '@/services/widget-storage';
import { CustomWidget } from '@/types/widget';
import { useOnboardingStore } from '@/stores';

const PILL_SPRING = {
    damping: 18,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
};

interface PromptPreset {
    id: string;
    chipLabel: string;
    prompt: string;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    metric: string;
    metricLabel: string;
    accentColor: string;
    iconType: 'weather' | 'crypto' | 'counter' | 'battery';
    sparklinePattern: SparklinePattern;
    type: 'static' | 'api_fetcher' | 'counter';
}

const PROMPT_PRESETS: PromptPreset[] = [
    {
        id: 'water',
        chipLabel: '💧 Water Stepper',
        prompt: 'Daily water hydration tracker with quick + / - cup stepper',
        title: 'Water Tracker',
        subtitle: 'Daily Hydration Target',
        badge: 'OPTIMAL',
        badgeColor: pandraColors.accentGreen,
        metric: '6/8 Cups',
        metricLabel: 'INTERACTIVE COUNTER',
        accentColor: pandraColors.accentGreen,
        iconType: 'counter',
        sparklinePattern: 'growth',
        type: 'counter',
    },
    {
        id: 'btc',
        chipLabel: '🪙 Bitcoin Oracle',
        prompt: 'Live Bitcoin spot price feed with 24h delta from Coinbase',
        title: 'Bitcoin Oracle',
        subtitle: 'Coinbase Spot Feed',
        badge: '+5.4% 24H',
        badgeColor: pandraColors.accentAmber,
        metric: '$94,250',
        metricLabel: 'CRYPTO SPOT FEED',
        accentColor: pandraColors.accentAmber,
        iconType: 'crypto',
        sparklinePattern: 'volatile',
        type: 'api_fetcher',
    },
    {
        id: 'tokyo',
        chipLabel: '🌤️ Tokyo Radar',
        prompt: 'Tokyo weather forecast with live rain radar and humidity',
        title: 'Tokyo Weather',
        subtitle: 'Live Precipitation Radar',
        badge: '22°C CLEAR',
        badgeColor: pandraColors.accentCyan,
        metric: '64% HUMIDITY',
        metricLabel: 'AI WEATHER ENGINE',
        accentColor: pandraColors.accentCyan,
        iconType: 'weather',
        sparklinePattern: 'pulse',
        type: 'static',
    },
    {
        id: 'battery',
        chipLabel: '⚡ Battery Reserve',
        prompt: 'Device hardware battery telemetry with fast charging detection',
        title: 'Device Battery',
        subtitle: 'Hardware Power Telemetry',
        badge: 'FAST CHARGE',
        badgeColor: pandraColors.accentPurple,
        metric: '98% CHARGING',
        metricLabel: 'POWER RESERVE',
        accentColor: pandraColors.accentPurple,
        iconType: 'battery',
        sparklinePattern: 'pulse',
        type: 'static',
    },
];

function PillDot({
    isActive,
    color,
    onPress,
}: {
    isActive: boolean;
    color: string;
    onPress: () => void;
}) {
    const width = useSharedValue(isActive ? 28 : 8);

    useEffect(() => {
        width.value = withSpring(isActive ? 28 : 8, PILL_SPRING);
    }, [isActive, width]);

    const style = useAnimatedStyle(() => ({
        width: width.value,
        height: 5,
        borderRadius: 3,
        backgroundColor: isActive ? color : pandraColors.borderHighlight,
    }));

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Animated.View style={style} />
        </TouchableOpacity>
    );
}

function PersonaIcon({ roleId, color, size = 17 }: { roleId: string; color: string; size?: number }) {
    if (roleId === 'productivity') return <Rocket size={size} color={color} />;
    if (roleId === 'crypto') return <TrendingUp size={size} color={color} />;
    if (roleId === 'ambient') return <CloudSun size={size} color={color} />;
    if (roleId === 'developer') return <Code size={size} color={color} />;
    return <Activity size={size} color={color} />;
}

const PERSONA_EMOJI: Record<string, string> = {
    productivity: '🚀',
    crypto: '🪙',
    ambient: '🌤️',
    developer: '💻',
};

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const {
        currentStep, selectedRole, highlightedTile, isPaywallOpen,
        selectedPresetId, promptText, isSynthesizing, apiFetching, liveBtcPrice,
        setCurrentStep, setSelectedRole, setHighlightedTile, setPaywallOpen,
        setSelectedPresetId, setPromptText, setIsSynthesizing, setApiFetching,
        setLiveBtcPrice,
    } = useOnboardingStore();
    const [waterCups, setWaterCups] = useState<number>(6);

    const float0 = useSharedValue(0);
    const float1 = useSharedValue(0);
    const float2 = useSharedValue(0);
    const float3 = useSharedValue(0);

    const tileScale0 = useSharedValue(1);
    const tileScale1 = useSharedValue(1);
    const tileScale2 = useSharedValue(1);
    const tileScale3 = useSharedValue(1);

    const morphScale = useSharedValue(1);
    const scanBeamOffset = useSharedValue(-200);

    const personaScales = {
        productivity: useSharedValue(1),
        crypto: useSharedValue(1),
        ambient: useSharedValue(1),
        developer: useSharedValue(1),
    } as Record<string, ReturnType<typeof useSharedValue<number>>>;

    useEffect(() => {
        float0.value = withRepeat(
            withSequence(withTiming(-5, { duration: 2200 }), withTiming(5, { duration: 2200 })),
            -1,
            true
        );
        float1.value = withRepeat(
            withSequence(withTiming(6, { duration: 2600 }), withTiming(-6, { duration: 2600 })),
            -1,
            true
        );
        float2.value = withRepeat(
            withSequence(withTiming(5, { duration: 2400 }), withTiming(-5, { duration: 2400 })),
            -1,
            true
        );
        float3.value = withRepeat(
            withSequence(withTiming(-6, { duration: 2800 }), withTiming(6, { duration: 2800 })),
            -1,
            true
        );
    }, [float0, float1, float2, float3]);

    const animatedStyleTile0 = useAnimatedStyle(() => ({
        transform: [{ translateY: float0.value }, { scale: tileScale0.value }],
    }));
    const animatedStyleTile1 = useAnimatedStyle(() => ({
        transform: [{ translateY: float1.value }, { scale: tileScale1.value }],
    }));
    const animatedStyleTile2 = useAnimatedStyle(() => ({
        transform: [{ translateY: float2.value }, { scale: tileScale2.value }],
    }));
    const animatedStyleTile3 = useAnimatedStyle(() => ({
        transform: [{ translateY: float3.value }, { scale: tileScale3.value }],
    }));

    const animatedMorphStyle = useAnimatedStyle(() => ({
        transform: [{ scale: morphScale.value }],
    }));
    const animatedScanBeamStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: scanBeamOffset.value }],
    }));

    const cardSize = Math.max(160, Math.min((width - 48 - 12) / 2, 175));
    const topPadding = Math.max(insets.top, 16) + 4;
    const bottomPadding = Math.max(insets.bottom, 16) + 6;

    const gradientColors =
        currentStep === 0
            ? (['rgba(8, 145, 178, 0.16)', 'rgba(5, 150, 105, 0.08)', 'transparent'] as [string, string, string])
            : currentStep === 1
            ? (['rgba(124, 58, 237, 0.16)', 'rgba(8, 145, 178, 0.08)', 'transparent'] as [string, string, string])
            : (['rgba(217, 119, 6, 0.16)', 'rgba(122, 145, 130, 0.08)', 'transparent'] as [string, string, string]);

    const handleTapTile = (index: number) => {
        setHighlightedTile(index);
        const targets = [tileScale0, tileScale1, tileScale2, tileScale3];
        const target = targets[index];
        if (target) {
            target.value = withSequence(
                withSpring(1.05, { damping: 10, stiffness: 200 }),
                withSpring(1.0, { damping: 14, stiffness: 150 })
            );
        }
    };

    const handleSelectPreset = (preset: PromptPreset) => {
        setSelectedPresetId(preset.id);
        setPromptText(preset.prompt);
        triggerAiMorph();
    };

    const triggerAiMorph = () => {
        setIsSynthesizing(true);
        morphScale.value = withSequence(
            withSpring(0.94, { damping: 12, stiffness: 180 }),
            withSpring(1.0, { damping: 12, stiffness: 140 })
        );
        scanBeamOffset.value = -180;
        scanBeamOffset.value = withTiming(380, { duration: 550 });
        setTimeout(() => setIsSynthesizing(false), 550);
    };

    const handleSimulateApiFetch = async () => {
        if (apiFetching) return;
        setApiFetching(true);
        triggerAiMorph();
        try {
            const res = await fetch('https:
            if (res.ok) {
                const data = await res.json();
                const num = parseFloat(data.data.amount);
                setLiveBtcPrice(`$${num.toLocaleString()}`);
            }
        } catch {
            setLiveBtcPrice('$94,250');
        } finally {
            setApiFetching(false);
        }
    };

    const handleSelectRole = async (roleId: string) => {
        setSelectedRole(roleId);

        const sv = personaScales[roleId];
        if (sv) {
            sv.value = withSequence(
                withSpring(1.04, { damping: 10, stiffness: 220 }),
                withSpring(1.0, { damping: 14, stiffness: 160 })
            );
        }

        try {
            await saveOnboardingRolePreference(roleId);
        } catch (err) {
            console.warn('[Onboarding] Failed to save role preference:', err);
        }
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        } else {
            saveOnboardingRolePreference(selectedRole).catch(() => {});
            router.push('/(auth)/sign-up' as any);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleSkip = () => {
        saveOnboardingRolePreference(selectedRole).catch(() => {});
        router.push('/(auth)/sign-up' as any);
    };

    const activeRoleConfig: RolePreset = ONBOARDING_ROLES[selectedRole] || ONBOARDING_ROLES.productivity;
    const currentPreset = PROMPT_PRESETS.find((p) => p.id === selectedPresetId) || PROMPT_PRESETS[0];

    return (
        <View flex={1} backgroundColor={pandraColors.bg}>
            { }
            <View
                position="absolute"
                top={0}
                left={0}
                right={0}
                height={420}
                pointerEvents="none"
                overflow="hidden"
            >
                <LinearGradient
                    colors={gradientColors}
                    style={{ flex: 1 }}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>

            <YStack
                flex={1}
                paddingHorizontal={20}
                paddingTop={topPadding}
                paddingBottom={bottomPadding}
                justifyContent="space-between"
            >
                { }
                <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
                    <XStack alignItems="center" gap={8}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={17}
                            color={pandraColors.text}
                            letterSpacing={-0.3}
                        >
                            Pandra
                        </Text>
                        <View
                            paddingHorizontal={7}
                            paddingVertical={2}
                            borderRadius={radius.xs}
                            backgroundColor="rgba(16, 185, 129, 0.12)"
                            borderWidth={1}
                            borderColor="rgba(16, 185, 129, 0.3)"
                            flexDirection="row"
                            alignItems="center"
                            gap={4}
                        >
                            <Sparkles size={9} color={pandraColors.accentGreen} />
                            <Text fontFamily={fonts.mono} fontSize={9.5} color={pandraColors.accentGreen} fontWeight="700">
                                AI MAKER
                            </Text>
                        </View>
                    </XStack>

                    { }
                    <View
                        paddingHorizontal={10}
                        paddingVertical={3}
                        borderRadius={radius.full}
                        backgroundColor={pandraColors.surfaceElevated}
                        borderWidth={1}
                        borderColor={pandraColors.border}
                    >
                        <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.textSecondary} fontWeight="600">
                            {currentStep + 1} / 3
                        </Text>
                    </View>

                    <XStack alignItems="center" gap={10}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setPaywallOpen(true)}
                            style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surfaceElevated,
                                borderWidth: 1,
                                borderColor: pandraColors.borderHighlight,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Zap size={11} color={pandraColors.accentAmber} />
                            <Text fontFamily={fonts.bodyMedium} fontSize={10.5} color={pandraColors.text}>
                                Pro
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                            onPress={handleSkip}
                        >
                            <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textMuted}>
                                Skip
                            </Text>
                        </TouchableOpacity>
                    </XStack>
                </XStack>

                { }
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 6 }}
                    keyboardShouldPersistTaps="handled"
                >
                    { }
                    { }
                    { }
                    {currentStep === 0 && (
                        <Animated.View entering={FadeIn.duration(320)} style={{ flex: 1, justifyContent: 'center' }}>
                            <YStack alignItems="center" gap={5} marginBottom={14}>
                                <Animated.View entering={FadeInDown.delay(60).duration(340)}>
                                    <View
                                        paddingHorizontal={11}
                                        paddingVertical={3.5}
                                        borderRadius={radius.full}
                                        backgroundColor="rgba(8, 145, 178, 0.10)"
                                        borderWidth={1}
                                        borderColor="rgba(8, 145, 178, 0.25)"
                                        flexDirection="row"
                                        alignItems="center"
                                        gap={6}
                                    >
                                        <Sparkles size={11} color={pandraColors.accentCyan} />
                                        <Text fontFamily={fonts.mono} fontSize={10.5} fontWeight="600" color={pandraColors.accentCyan}>
                                            ✨ AI-Powered Widget Engine
                                        </Text>
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(120).duration(340)}>
                                    <Text
                                        fontFamily={fonts.display}
                                        fontSize={23}
                                        color={pandraColors.text}
                                        textAlign="center"
                                        letterSpacing={-0.5}
                                    >
                                        Create Widgets with AI
                                    </Text>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(180).duration(340)}>
                                    <Text
                                        fontFamily={fonts.body}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                        textAlign="center"
                                        lineHeight={17.5}
                                        paddingHorizontal={10}
                                    >
                                        Prompt, personalize, and pin live dynamic widgets directly to your mobile deck.
                                    </Text>
                                </Animated.View>
                            </YStack>

                            { }
                            <YStack alignItems="center" justifyContent="center" gap={12}>
                                { }
                                <XStack gap={10}>
                                    <Animated.View
                                        entering={FadeInDown.delay(220).springify()}
                                        style={[{ width: cardSize, height: 165 }, animatedStyleTile0]}
                                    >
                                        <TouchableOpacity activeOpacity={0.92} onPress={() => handleTapTile(0)} style={{ flex: 1 }}>
                                            <WidgetTile
                                                title="Tokyo Weather"
                                                subtitle="Live Radar"
                                                badge="22°C"
                                                badgeColor={pandraColors.accentGreen}
                                                icon={<CloudSun size={15} color={pandraColors.accentGreen} />}
                                                showSparkline
                                                sparklineColor={pandraColors.accentGreen}
                                                sparklinePattern="growth"
                                                highlighted={highlightedTile === 0}
                                                isLive
                                                metric="CLEAR"
                                                metricLabel="AI WEATHER ENGINE"
                                                accentColor={pandraColors.accentGreen}
                                                flex={1}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>

                                    <Animated.View
                                        entering={FadeInDown.delay(280).springify()}
                                        style={[{ width: cardSize, height: 165 }, animatedStyleTile1]}
                                    >
                                        <TouchableOpacity activeOpacity={0.92} onPress={() => handleTapTile(1)} style={{ flex: 1 }}>
                                            <WidgetTile
                                                title="Bitcoin Oracle"
                                                subtitle="Coinbase USD"
                                                badge="+4.2%"
                                                badgeColor={pandraColors.accentAmber}
                                                icon={<TrendingUp size={15} color={pandraColors.accentAmber} />}
                                                showSparkline
                                                sparklineColor={pandraColors.accentAmber}
                                                sparklinePattern="volatile"
                                                highlighted={highlightedTile === 1}
                                                isLive
                                                metric="$94,250"
                                                metricLabel="CRYPTO ORACLE"
                                                accentColor={pandraColors.accentAmber}
                                                flex={1}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>
                                </XStack>

                                { }
                                <XStack gap={10}>
                                    <Animated.View
                                        entering={FadeInDown.delay(340).springify()}
                                        style={[{ width: cardSize, height: 165 }, animatedStyleTile2]}
                                    >
                                        <TouchableOpacity activeOpacity={0.92} onPress={() => handleTapTile(2)} style={{ flex: 1 }}>
                                            <WidgetTile
                                                title="Water Tracker"
                                                subtitle="Daily Hydration"
                                                badge="OPTIMAL"
                                                badgeColor={pandraColors.secondary}
                                                icon={<Droplets size={15} color={pandraColors.secondary} />}
                                                showSparkline
                                                sparklineColor={pandraColors.secondary}
                                                sparklinePattern="default"
                                                highlighted={highlightedTile === 2}
                                                metric="6/8 Cups"
                                                metricLabel="HABIT COUNTER"
                                                accentColor={pandraColors.secondary}
                                                flex={1}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>

                                    <Animated.View
                                        entering={FadeInDown.delay(400).springify()}
                                        style={[{ width: cardSize, height: 165 }, animatedStyleTile3]}
                                    >
                                        <TouchableOpacity activeOpacity={0.92} onPress={() => handleTapTile(3)} style={{ flex: 1 }}>
                                            <WidgetTile
                                                title="Device Battery"
                                                subtitle="Hardware Telemetry"
                                                badge="98%"
                                                badgeColor={pandraColors.accentPurple}
                                                icon={<BatteryCharging size={15} color={pandraColors.accentPurple} />}
                                                showSparkline
                                                sparklineColor={pandraColors.accentPurple}
                                                sparklinePattern="pulse"
                                                highlighted={highlightedTile === 3}
                                                metric="CHARGING"
                                                metricLabel="BATTERY HEALTH"
                                                accentColor={pandraColors.accentPurple}
                                                flex={1}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>
                                </XStack>
                            </YStack>

                            <Animated.View entering={FadeInDown.delay(460).duration(320)}>
                                <XStack alignItems="center" justifyContent="center" gap={6} marginTop={14}>
                                    <Move size={11} color={pandraColors.primary} />
                                    <Text fontFamily={fonts.mono} fontSize={10.5} color={pandraColors.textMuted} textAlign="center">
                                        Tap to preview • 📱 Pin to Android & iOS Home Screen
                                    </Text>
                                </XStack>
                            </Animated.View>
                        </Animated.View>
                    )}

                    { }
                    { }
                    { }
                    {currentStep === 1 && (
                        <Animated.View entering={FadeIn.duration(320)} style={{ flex: 1, justifyContent: 'center' }}>
                            <YStack alignItems="center" gap={5} marginBottom={12}>
                                <Animated.View entering={FadeInDown.delay(60).duration(340)}>
                                    <View
                                        paddingHorizontal={11}
                                        paddingVertical={3.5}
                                        borderRadius={radius.full}
                                        backgroundColor={pandraColors.primaryGlow}
                                        borderWidth={1}
                                        borderColor={pandraColors.borderGlow}
                                        flexDirection="row"
                                        alignItems="center"
                                        gap={6}
                                    >
                                        <Wand2 size={11} color={pandraColors.primary} />
                                        <Text fontFamily={fonts.mono} fontSize={10.5} fontWeight="600" color={pandraColors.primary}>
                                            Zero-Code AI Synthesis
                                        </Text>
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(120).duration(340)}>
                                    <Text
                                        fontFamily={fonts.display}
                                        fontSize={23}
                                        color={pandraColors.text}
                                        textAlign="center"
                                        letterSpacing={-0.5}
                                    >
                                        Describe It. AI Ships It.
                                    </Text>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(180).duration(340)}>
                                    <Text
                                        fontFamily={fonts.body}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                        textAlign="center"
                                        lineHeight={17.5}
                                        paddingHorizontal={10}
                                    >
                                        Tap an inspiration prompt below to watch the widget assemble in real time:
                                    </Text>
                                </Animated.View>
                            </YStack>

                            { }
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingHorizontal: 2, marginBottom: 12 }}
                            >
                                {PROMPT_PRESETS.map((preset) => {
                                    const isSelected = selectedPresetId === preset.id;
                                    return (
                                        <TouchableOpacity
                                            key={preset.id}
                                            activeOpacity={0.8}
                                            onPress={() => handleSelectPreset(preset)}
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: radius.full,
                                                backgroundColor: isSelected
                                                    ? preset.accentColor + '20'
                                                    : pandraColors.surfaceElevated,
                                                borderWidth: 1.2,
                                                borderColor: isSelected ? preset.accentColor : pandraColors.border,
                                            }}
                                        >
                                            <Text
                                                fontFamily={fonts.bodyMedium}
                                                fontSize={11.5}
                                                color={isSelected ? preset.accentColor : pandraColors.textSecondary}
                                                fontWeight={isSelected ? '600' : '400'}
                                            >
                                                {preset.chipLabel}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            { }
                            <YStack
                                backgroundColor={pandraColors.surfaceElevated}
                                borderRadius={radius.lg}
                                borderWidth={1}
                                borderColor={pandraColors.borderHighlight}
                                padding={12}
                                gap={8}
                                marginBottom={14}
                                position="relative"
                                overflow="hidden"
                            >
                                { }
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        { position: 'absolute', top: 0, bottom: 0, width: 120, zIndex: 10 },
                                        animatedScanBeamStyle,
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['transparent', 'rgba(122, 145, 130, 0.35)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </Animated.View>

                                { }
                                <XStack justifyContent="space-between" alignItems="center">
                                    <XStack alignItems="center" gap={6}>
                                        <Sparkles size={12} color={currentPreset.accentColor} />
                                        <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.textMuted} fontWeight="600">
                                            NATURAL LANGUAGE PROMPT
                                        </Text>
                                    </XStack>
                                    <View
                                        paddingHorizontal={6}
                                        paddingVertical={2}
                                        borderRadius={radius.xs}
                                        backgroundColor={
                                            isSynthesizing
                                                ? 'rgba(124, 58, 237, 0.15)'
                                                : 'rgba(5, 150, 105, 0.12)'
                                        }
                                    >
                                        <Text
                                            fontFamily={fonts.mono}
                                            fontSize={9.5}
                                            color={isSynthesizing ? pandraColors.accentPurple : pandraColors.accentGreen}
                                            fontWeight="700"
                                        >
                                            {isSynthesizing ? 'SYNTHESIZING…' : 'COMPILED'}
                                        </Text>
                                    </View>
                                </XStack>

                                { }
                                <View
                                    backgroundColor={pandraColors.bgCanvas}
                                    borderRadius={radius.sm}
                                    borderWidth={1}
                                    borderColor={pandraColors.border}
                                    paddingHorizontal={10}
                                    paddingVertical={8}
                                >
                                    <Text fontFamily={fonts.body} fontSize={12} color={pandraColors.text} lineHeight={16}>
                                        &ldquo;{promptText}&rdquo;
                                    </Text>
                                </View>

                                { }
                                <XStack gap={8}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={triggerAiMorph}
                                        style={{
                                            flex: 1,
                                            height: 36,
                                            borderRadius: radius.sm,
                                            backgroundColor: currentPreset.accentColor + '15',
                                            borderWidth: 1,
                                            borderColor: currentPreset.accentColor,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Sparkles size={12} color={currentPreset.accentColor} />
                                        <Text fontFamily={fonts.bodySemibold} fontSize={11.5} color={currentPreset.accentColor}>
                                            Resynthesize
                                        </Text>
                                    </TouchableOpacity>

                                    {currentPreset.id === 'btc' && (
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={handleSimulateApiFetch}
                                            style={{
                                                flex: 1,
                                                height: 36,
                                                borderRadius: radius.sm,
                                                backgroundColor: pandraColors.primaryGlow,
                                                borderWidth: 1,
                                                borderColor: pandraColors.primary,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {apiFetching ? (
                                                <ActivityIndicator size="small" color={pandraColors.primary} />
                                            ) : (
                                                <RefreshCw size={12} color={pandraColors.primary} />
                                            )}
                                            <Text fontFamily={fonts.bodySemibold} fontSize={11.5} color={pandraColors.primary}>
                                                {apiFetching ? 'Fetching…' : 'Live Query'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </XStack>
                            </YStack>

                            { }
                            <YStack alignItems="center">
                                <Animated.View style={[{ width: '100%', maxWidth: 300 }, animatedMorphStyle]}>
                                    {currentPreset.id === 'water' ? (
                                        <WidgetTile
                                            title="Water Tracker"
                                            subtitle="Daily Hydration Target"
                                            badge="OPTIMAL"
                                            badgeColor={pandraColors.accentGreen}
                                            icon={<Droplets size={16} color={pandraColors.accentGreen} />}
                                            highlighted
                                            accentColor={pandraColors.accentGreen}
                                            widget={{
                                                id: 'water_preview',
                                                title: 'Water Tracker',
                                                subtitle: 'Daily Hydration Target',
                                                badge: 'OPTIMAL',
                                                badgeColor: pandraColors.accentGreen,
                                                metric: `${waterCups}/8 Cups`,
                                                metricLabel: 'INTERACTIVE COUNTER',
                                                type: 'counter',
                                                color: pandraColors.accentGreen,
                                                iconType: 'telemetry',
                                                counterConfig: {
                                                    count: waterCups,
                                                    unitLabel: 'Cups completed',
                                                },
                                            } as CustomWidget}
                                            onCounterIncrement={() => setWaterCups((prev) => Math.min(prev + 1, 16))}
                                            onCounterDecrement={() => setWaterCups((prev) => Math.max(prev - 1, 0))}
                                        />
                                    ) : currentPreset.id === 'btc' ? (
                                        <WidgetTile
                                            title="Bitcoin Oracle"
                                            subtitle="Coinbase USD Feed"
                                            badge={apiFetching ? 'FETCHING…' : '+5.4% 24H'}
                                            badgeColor={pandraColors.accentAmber}
                                            icon={<TrendingUp size={16} color={pandraColors.accentAmber} />}
                                            showSparkline
                                            sparklineColor={pandraColors.accentAmber}
                                            sparklinePattern="volatile"
                                            highlighted
                                            isLive
                                            metric={liveBtcPrice}
                                            metricLabel="CRYPTO SPOT ORACLE"
                                            accentColor={pandraColors.accentAmber}
                                        />
                                    ) : currentPreset.id === 'tokyo' ? (
                                        <WidgetTile
                                            title="Tokyo Weather"
                                            subtitle="Precipitation Radar"
                                            badge="22°C CLEAR"
                                            badgeColor={pandraColors.accentCyan}
                                            icon={<CloudSun size={16} color={pandraColors.accentCyan} />}
                                            showSparkline
                                            sparklineColor={pandraColors.accentCyan}
                                            sparklinePattern="pulse"
                                            highlighted
                                            isLive
                                            metric="64% HUMIDITY"
                                            metricLabel="AI WEATHER ENGINE"
                                            accentColor={pandraColors.accentCyan}
                                        />
                                    ) : (
                                        <WidgetTile
                                            title="Device Battery"
                                            subtitle="Hardware Telemetry"
                                            badge="FAST CHARGE"
                                            badgeColor={pandraColors.accentPurple}
                                            icon={<BatteryCharging size={16} color={pandraColors.accentPurple} />}
                                            showSparkline
                                            sparklineColor={pandraColors.accentPurple}
                                            sparklinePattern="pulse"
                                            highlighted
                                            metric="98% POWER"
                                            metricLabel="BATTERY HEALTH"
                                            accentColor={pandraColors.accentPurple}
                                        />
                                    )}
                                </Animated.View>

                                <XStack alignItems="center" gap={5} marginTop={10}>
                                    <Sparkles size={11} color={pandraColors.primary} />
                                    <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.textMuted}>
                                        Synthesized in 0.38s via Pandra Neural Engine
                                    </Text>
                                </XStack>
                            </YStack>
                        </Animated.View>
                    )}

                    { }
                    { }
                    { }
                    {currentStep === 2 && (
                        <Animated.View entering={FadeIn.duration(320)} style={{ flex: 1, justifyContent: 'center' }}>
                            <YStack alignItems="center" gap={5} marginBottom={12}>
                                <Animated.View entering={FadeInDown.delay(60).duration(340)}>
                                    <View
                                        paddingHorizontal={11}
                                        paddingVertical={3.5}
                                        borderRadius={radius.full}
                                        backgroundColor="rgba(16, 185, 129, 0.10)"
                                        borderWidth={1}
                                        borderColor="rgba(16, 185, 129, 0.25)"
                                        flexDirection="row"
                                        alignItems="center"
                                        gap={6}
                                    >
                                        <Cpu size={11} color={pandraColors.accentGreen} />
                                        <Text fontFamily={fonts.mono} fontSize={10.5} fontWeight="600" color={pandraColors.accentGreen}>
                                            Instant Workspace Seeding
                                        </Text>
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(120).duration(340)}>
                                    <Text
                                        fontFamily={fonts.display}
                                        fontSize={23}
                                        color={pandraColors.text}
                                        textAlign="center"
                                        letterSpacing={-0.5}
                                    >
                                        Choose Your AI Widget Persona
                                    </Text>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(180).duration(340)}>
                                    <Text
                                        fontFamily={fonts.body}
                                        fontSize={12.5}
                                        color={pandraColors.textSecondary}
                                        textAlign="center"
                                        lineHeight={17.5}
                                    >
                                        Pick your starting vibe. Prompt and create unlimited custom widgets anytime.
                                    </Text>
                                </Animated.View>
                            </YStack>

                            { }
                            <YStack gap={8} marginBottom={12}>
                                {Object.values(ONBOARDING_ROLES).map((role, index) => {
                                    const isSelected = selectedRole === role.id;
                                    const emoji = PERSONA_EMOJI[role.id] ?? '✦';
                                    const sv = personaScales[role.id];

                                    const cardAnimStyle = useAnimatedStyle(() => ({
                                        transform: [{ scale: sv ? sv.value : 1 }],
                                    }));

                                    return (
                                        <Animated.View
                                            key={role.id}
                                            entering={FadeInDown.delay(220 + index * 70).springify()}
                                            style={cardAnimStyle}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.85}
                                                onPress={() => handleSelectRole(role.id)}
                                                style={{
                                                    padding: 10,
                                                    borderRadius: radius.md,
                                                    backgroundColor: isSelected
                                                        ? pandraColors.surfaceElevated
                                                        : pandraColors.surface,
                                                    borderWidth: 1.5,
                                                    borderColor: isSelected ? role.color : pandraColors.border,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    
                                                    ...(isSelected && {
                                                        shadowColor: role.color,
                                                        shadowOffset: { width: 0, height: 0 },
                                                        shadowOpacity: 0.3,
                                                        shadowRadius: 8,
                                                        elevation: 4,
                                                    }),
                                                }}
                                            >
                                                <XStack alignItems="center" gap={10} flex={1}>
                                                    { }
                                                    <View
                                                        width={36}
                                                        height={36}
                                                        borderRadius={radius.sm}
                                                        backgroundColor={role.color + '22'}
                                                        borderWidth={1}
                                                        borderColor={isSelected ? role.color : role.color + '55'}
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <PersonaIcon roleId={role.id} color={role.color} />
                                                    </View>

                                                    { }
                                                    <YStack flex={1}>
                                                        <XStack alignItems="center" gap={6}>
                                                            <Text fontFamily={fonts.bodySemibold} fontSize={13.5} color={pandraColors.text}>
                                                                {emoji} {role.title}
                                                            </Text>
                                                            <View
                                                                paddingHorizontal={5.5}
                                                                paddingVertical={1.5}
                                                                borderRadius={radius.xs}
                                                                backgroundColor={role.color + '18'}
                                                            >
                                                                <Text fontFamily={fonts.mono} fontSize={9} fontWeight="700" color={role.color}>
                                                                    {role.badge}
                                                                </Text>
                                                            </View>
                                                        </XStack>
                                                        <Text
                                                            fontFamily={fonts.body}
                                                            fontSize={11}
                                                            color={pandraColors.textSecondary}
                                                            numberOfLines={1}
                                                        >
                                                            {role.subtitle}
                                                        </Text>
                                                    </YStack>
                                                </XStack>

                                                { }
                                                <View
                                                    width={22}
                                                    height={22}
                                                    borderRadius={11}
                                                    borderWidth={1.5}
                                                    borderColor={isSelected ? role.color : pandraColors.borderHighlight}
                                                    backgroundColor={isSelected ? role.color : 'transparent'}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                                                </View>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </YStack>

                            { }
                            <Animated.View entering={FadeInDown.delay(520).duration(320)}>
                                <XStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    backgroundColor={pandraColors.surface}
                                    paddingHorizontal={12}
                                    paddingVertical={9}
                                    borderRadius={radius.sm}
                                    borderWidth={1}
                                    borderColor={pandraColors.border}
                                >
                                    <XStack alignItems="center" gap={7}>
                                        <CheckCircle2 size={15} color={activeRoleConfig.color} />
                                        <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.text}>
                                            4 tailored AI widgets pre-loaded on deck
                                        </Text>
                                    </XStack>
                                    <Text fontFamily={fonts.bodySemibold} fontSize={10.5} color={activeRoleConfig.color}>
                                        Ready
                                    </Text>
                                </XStack>
                            </Animated.View>
                        </Animated.View>
                    )}
                </ScrollView>

                { }
                <YStack gap={10} paddingTop={6}>
                    { }
                    <XStack justifyContent="center" alignItems="center" gap={6}>
                        {[0, 1, 2].map((idx) => (
                            <PillDot
                                key={idx}
                                isActive={currentStep === idx}
                                color={pandraColors.primary}
                                onPress={() => setCurrentStep(idx)}
                            />
                        ))}
                    </XStack>

                    { }
                    {currentStep === 2 && (
                        <GoogleSignInButton label="Quick sign in with Google" style={{ marginBottom: 2 }} />
                    )}

                    { }
                    <XStack gap={10}>
                        {currentStep > 0 && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={{
                                    height: 48,
                                    paddingHorizontal: 16,
                                    borderRadius: radius.md,
                                    backgroundColor: pandraColors.surfaceElevated,
                                    borderWidth: 1,
                                    borderColor: pandraColors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                                onPress={handleBack}
                            >
                                <ArrowLeft size={16} color={pandraColors.text} />
                                <Text fontFamily={fonts.bodyMedium} fontSize={13} color={pandraColors.text}>
                                    Back
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={{
                                flex: 1,
                                height: 48,
                                borderRadius: radius.md,
                                backgroundColor: currentStep === 2 ? pandraColors.accentGreen : pandraColors.primary,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                            onPress={handleNext}
                        >
                            <Text fontFamily={fonts.bodySemibold} fontSize={14.5} color="#FFFFFF">
                                {currentStep === 0 && 'Try AI Prompting'}
                                {currentStep === 1 && 'Choose Your Persona'}
                                {currentStep === 2 && 'Launch Your Deck 🚀'}
                            </Text>
                            <ArrowRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </XStack>

                    { }
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{ height: 28, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => router.push('/(auth)/sign-in' as any)}
                    >
                        <Text fontFamily={fonts.bodyMedium} fontSize={12} color={pandraColors.textSecondary}>
                            Already have an account?{' '}
                            <Text color={pandraColors.primary} fontFamily={fonts.bodySemibold}>
                                Sign In
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </YStack>

                { }
                <PaywallModal
                    isOpen={isPaywallOpen}
                    onClose={() => setPaywallOpen(false)}
                    featureContext="Unlock unlimited AI widgets, 10s polling rate, and neural telemetry summaries."
                />
            </YStack>
        </View>
    );
}
