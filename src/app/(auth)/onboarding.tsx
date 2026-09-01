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
    withSpring,
    withTiming,
    FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, XStack, Text, View } from 'tamagui';
import {
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Zap,
    Server,
    Globe,
    Code,
    ShieldCheck,
    Check,
    RefreshCw,
    Activity,
    Terminal,
    CheckCircle2,
    Cpu,
    Layers,
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
import { measureNetworkLatency } from '@/services/personal-widget-fetcher';

const SPRING_CONFIG = {
    damping: 18,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
};

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [currentStep, setCurrentStep] = useState(0); // 0: Command Deck, 1: API Telemetry, 2: Personalize Stack
    const [selectedRole, setSelectedRole] = useState<string>('devops');
    const [highlightedTile, setHighlightedTile] = useState<number | null>(0);
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);

    // Step 1: Live ticking telemetry state
    const [liveLatency, setLiveLatency] = useState(14);
    const [liveRps, setLiveRps] = useState(240);

    // Step 2: Interactive API fetch simulator
    const [apiFetching, setApiFetching] = useState(false);
    const [apiMetricValue, setApiMetricValue] = useState('$94,250');
    const [apiSparklinePattern, setApiSparklinePattern] = useState<SparklinePattern>('volatile');

    // Reanimated Shared Values for Step Transitions
    const stepProgress = useSharedValue(0);
    const ambientGlowOpacity = useSharedValue(0.6);

    const cardSize = Math.min((width - 48 - 12) / 2, 155);

    // Live real network latency for step 1
    useEffect(() => {
        const updatePing = async () => {
            try {
                const res = await measureNetworkLatency();
                setLiveLatency(res.latencyMs);
                setLiveRps(res.rps);
            } catch {}
        };
        updatePing();
        const interval = setInterval(updatePing, 10000);
        return () => clearInterval(interval);
    }, []);

    // Animate step transitions
    useEffect(() => {
        stepProgress.value = withSpring(currentStep, SPRING_CONFIG);
        ambientGlowOpacity.value = withTiming(0.8, { duration: 400 }, () => {
            ambientGlowOpacity.value = withTiming(0.5, { duration: 800 });
        });
    }, [currentStep, ambientGlowOpacity, stepProgress]);

    // Handle role selection change
    const handleSelectRole = async (roleId: string) => {
        setSelectedRole(roleId);
        try {
            await saveOnboardingRolePreference(roleId);
        } catch (err) {
            console.warn('[Onboarding] Failed to save role preference:', err);
        }
    };

    // Live real API fetch on Step 2
    const handleSimulateApiFetch = async () => {
        if (apiFetching) return;
        setApiFetching(true);
        try {
            const res = await fetch('https://api.coinbase.com/v2/prices/spot?currency=USD');
            if (res.ok) {
                const data = await res.json();
                const num = parseFloat(data.data.amount);
                setApiMetricValue(`$${num.toLocaleString()}`);
            }
        } catch {
            setApiMetricValue('$94,250');
        } finally {
            setApiSparklinePattern((prev: SparklinePattern) => (prev === 'volatile' ? 'growth' : 'volatile'));
            setApiFetching(false);
        }
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Save chosen role and proceed to sign up
            saveOnboardingRolePreference(selectedRole).catch(() => {});
            router.push('/(auth)/sign-up' as any);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSkip = () => {
        saveOnboardingRolePreference(selectedRole).catch(() => {});
        router.push('/(auth)/sign-up' as any);
    };

    const activeRoleConfig: RolePreset = ONBOARDING_ROLES[selectedRole] || ONBOARDING_ROLES.devops;

    const topPadding = Math.max(insets.top, 16) + 4;
    const bottomPadding = Math.max(insets.bottom, 16) + 6;

    return (
        <View flex={1} backgroundColor={pandraColors.bg}>
            {/* Ambient Background Gradient Aura */}
            <View
                position="absolute"
                top={0}
                left={0}
                right={0}
                height={380}
                pointerEvents="none"
                overflow="hidden"
            >
                <LinearGradient
                    colors={[
                        currentStep === 0
                            ? 'rgba(146, 164, 152, 0.15)'
                            : currentStep === 1
                            ? 'rgba(130, 169, 142, 0.15)'
                            : 'rgba(174, 194, 181, 0.15)',
                        'transparent',
                    ]}
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
                {/* 1. TOP BAR */}
                <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
                    <XStack alignItems="center" gap={8}>
                        <Text
                            fontFamily={fonts.display}
                            fontSize={16}
                            color={pandraColors.text}
                            letterSpacing={-0.3}
                        >
                            Pandra
                        </Text>
                        <View
                            paddingHorizontal={6}
                            paddingVertical={2}
                            borderRadius={radius.xs}
                            backgroundColor="rgba(16, 185, 129, 0.12)"
                            borderWidth={1}
                            borderColor="rgba(16, 185, 129, 0.3)"
                        >
                            <Text fontFamily={fonts.mono} fontSize={9} color={pandraColors.accentGreen} fontWeight="700">
                                2.0
                            </Text>
                        </View>
                    </XStack>

                    <View
                        paddingHorizontal={10}
                        paddingVertical={3}
                        borderRadius={radius.full}
                        backgroundColor={pandraColors.surfaceElevated}
                        borderWidth={1}
                        borderColor={pandraColors.border}
                    >
                        <Text
                            fontFamily={fonts.mono}
                            fontSize={11}
                            color={pandraColors.textSecondary}
                        >
                            {currentStep + 1} / 3
                        </Text>
                    </View>

                    <XStack alignItems="center" gap={10}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setIsPaywallOpen(true)}
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
                            <Text fontFamily={fonts.bodyMedium} fontSize={10} color={pandraColors.text}>
                                Pro
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                            onPress={handleSkip}
                        >
                            <Text
                                fontFamily={fonts.bodyMedium}
                                fontSize={12}
                                color={pandraColors.textMuted}
                            >
                                Skip
                            </Text>
                        </TouchableOpacity>
                    </XStack>
                </XStack>

                {/* 2. MAIN SCROLLABLE SLIDE CONTENT */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 8 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* SLIDE 0: REAL-TIME COMMAND DECK */}
                    {currentStep === 0 && (
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >

                            <YStack alignItems="center" gap={5} marginBottom={14}>
                                <View
                                    paddingHorizontal={10}
                                    paddingVertical={3}
                                    borderRadius={radius.xs}
                                    backgroundColor="rgba(59, 130, 246, 0.08)"
                                    flexDirection="row"
                                    alignItems="center"
                                    gap={5}
                                >
                                    <Activity size={12} color={pandraColors.primary} />
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={10.5}
                                        color={pandraColors.primary}
                                    >
                                        Real-time command deck
                                    </Text>
                                </View>

                                <Text
                                    fontFamily={fonts.display}
                                    fontSize={22}
                                    color={pandraColors.text}
                                    textAlign="center"
                                    letterSpacing={-0.5}
                                >
                                    Your Pocket Command Center
                                </Text>
                                <Text
                                    fontFamily={fonts.body}
                                    fontSize={12.5}
                                    color={pandraColors.textSecondary}
                                    textAlign="center"
                                    lineHeight={17}
                                    paddingHorizontal={12}
                                >
                                    Monitor servers, APIs, weather, and hardware telemetry with customizable glass tiles.
                                </Text>
                            </YStack>

                            {/* 2x2 Interactive Live Tiles */}
                            <YStack alignItems="center" justifyContent="center" gap={10}>
                                <XStack gap={10}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setHighlightedTile(0)}
                                        style={{ width: cardSize, height: cardSize }}
                                    >
                                        <WidgetTile
                                            title="Edge Gateway"
                                            subtitle="Global Router"
                                            badge={`${liveLatency} ms`}
                                            badgeColor={pandraColors.primary}
                                            icon={<Server size={15} color={pandraColors.primary} />}
                                            showSparkline={true}
                                            sparklineColor={pandraColors.primary}
                                            sparklinePattern="pulse"
                                            highlighted={highlightedTile === 0}
                                            isLive={true}
                                            metric="99.98%"
                                            metricLabel="UPTIME RATE"
                                            accentColor={pandraColors.primary}
                                            flex={1}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setHighlightedTile(1)}
                                        style={{ width: cardSize, height: cardSize }}
                                    >
                                        <WidgetTile
                                            title="Kubernetes"
                                            subtitle="24/24 Pods"
                                            badge="HEALTHY"
                                            badgeColor={pandraColors.accentGreen}
                                            icon={<Layers size={15} color={pandraColors.accentGreen} />}
                                            showSparkline={true}
                                            sparklineColor={pandraColors.accentGreen}
                                            sparklinePattern="growth"
                                            highlighted={highlightedTile === 1}
                                            isLive={true}
                                            metric={`${liveRps} r/s`}
                                            metricLabel="CLUSTER INGEST"
                                            accentColor={pandraColors.accentGreen}
                                            flex={1}
                                        />
                                    </TouchableOpacity>
                                </XStack>

                                <XStack gap={10}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setHighlightedTile(2)}
                                        style={{ width: cardSize, height: cardSize }}
                                    >
                                        <WidgetTile
                                            title="Bamboo Sentinel"
                                            subtitle="Zero-Trust Guard"
                                            badge="STRICT"
                                            badgeColor={pandraColors.secondary}
                                            icon={<ShieldCheck size={15} color={pandraColors.secondary} />}
                                            showSparkline={true}
                                            sparklineColor={pandraColors.secondary}
                                            sparklinePattern="default"
                                            highlighted={highlightedTile === 2}
                                            metric="0 THREATS"
                                            metricLabel="SHIELD STATUS"
                                            accentColor={pandraColors.secondary}
                                            flex={1}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setHighlightedTile(3)}
                                        style={{ width: cardSize, height: cardSize }}
                                    >
                                        <WidgetTile
                                            title="Berry AI Core"
                                            subtitle="Prompt Compiler"
                                            badge="READY"
                                            badgeColor={pandraColors.accentPurple}
                                            icon={<Cpu size={15} color={pandraColors.accentPurple} />}
                                            showSparkline={true}
                                            sparklineColor={pandraColors.accentPurple}
                                            sparklinePattern="volatile"
                                            highlighted={highlightedTile === 3}
                                            metric="480 t/s"
                                            metricLabel="TOKEN COMPILER"
                                            accentColor={pandraColors.accentPurple}
                                            flex={1}
                                        />
                                    </TouchableOpacity>
                                </XStack>
                            </YStack>

                            <XStack alignItems="center" justifyContent="center" gap={6} marginTop={10}>
                                <Move size={11} color={pandraColors.primary} />
                                <Text
                                    fontFamily={fonts.mono}
                                    fontSize={10}
                                    color={pandraColors.textMuted}
                                    textAlign="center"
                                >
                                    Long-press any widget to drag & organize your deck
                                </Text>
                            </XStack>
                        </Animated.View>
                    )}

                    {/* SLIDE 1: ZERO-CODE API TELEMETRY PLAYGROUND */}
                    {currentStep === 1 && (
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >

                            <YStack alignItems="center" gap={6} marginBottom={14}>
                                <View
                                    paddingHorizontal={10}
                                    paddingVertical={4}
                                    borderRadius={radius.full}
                                    backgroundColor={pandraColors.primaryGlow}
                                    borderWidth={1}
                                    borderColor={pandraColors.borderGlow}
                                    flexDirection="row"
                                    alignItems="center"
                                    gap={6}
                                >
                                    <Terminal size={12} color={pandraColors.primary} />
                                    <Text
                                        fontFamily={fonts.mono}
                                        fontSize={10.5}
                                        fontWeight="600"
                                        color={pandraColors.primary}
                                    >
                                        Connect any REST API
                                    </Text>
                                </View>

                                <Text
                                    fontFamily={fonts.display}
                                    fontSize={22}
                                    color={pandraColors.text}
                                    textAlign="center"
                                    letterSpacing={-0.5}
                                >
                                    Instant Live Endpoints
                                </Text>
                                <Text
                                    fontFamily={fonts.body}
                                    fontSize={12.5}
                                    color={pandraColors.textSecondary}
                                    textAlign="center"
                                    lineHeight={17}
                                    paddingHorizontal={12}
                                >
                                    Fetch JSON endpoints with zero backend required. Test the live simulator below:
                                </Text>
                            </YStack>

                            {/* Redesigned Simulated Endpoint Console Box */}
                            <YStack
                                backgroundColor={pandraColors.surfaceElevated}
                                borderRadius={radius.lg}
                                borderWidth={1}
                                borderColor={pandraColors.borderHighlight}
                                padding={12}
                                gap={10}
                                marginBottom={14}
                            >
                                {/* Row 1: URL Bar with Method and Status */}
                                <View
                                    backgroundColor={pandraColors.bgCanvas}
                                    borderRadius={radius.sm}
                                    borderWidth={1}
                                    borderColor={pandraColors.border}
                                    paddingHorizontal={10}
                                    paddingVertical={8}
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={8}
                                >
                                    <XStack alignItems="center" gap={8} flex={1}>
                                        <View
                                            paddingHorizontal={6}
                                            paddingVertical={2}
                                            borderRadius={radius.xs}
                                            backgroundColor="rgba(130, 169, 142, 0.18)"
                                            borderWidth={1}
                                            borderColor={pandraColors.accentBamboo}
                                        >
                                            <Text fontFamily={fonts.mono} fontSize={10} fontWeight="700" color={pandraColors.accentBamboo}>
                                                GET
                                            </Text>
                                        </View>
                                        <Text
                                            fontFamily={fonts.mono}
                                            fontSize={11}
                                            color={pandraColors.text}
                                            flex={1}
                                            numberOfLines={1}
                                            ellipsizeMode="middle"
                                        >
                                            api.coindesk.com/v1/bpi/currentprice
                                        </Text>
                                    </XStack>
                                    <View flexDirection="row" alignItems="center" gap={4}>
                                        <View width={5} height={5} borderRadius={2.5} backgroundColor={pandraColors.accentBamboo} />
                                        <Text fontFamily={fonts.mono} fontSize={9.5} color={pandraColors.textSecondary}>
                                            HTTPS
                                        </Text>
                                    </View>
                                </View>

                                {/* Row 2: JSON Path Key Extractor */}
                                <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={2}>
                                    <XStack alignItems="center" gap={5}>
                                        <Code size={12} color={pandraColors.textSecondary} />
                                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.textSecondary}>
                                            JSON Path:
                                        </Text>
                                    </XStack>
                                    <View
                                        paddingHorizontal={8}
                                        paddingVertical={3}
                                        borderRadius={radius.xs}
                                        backgroundColor={pandraColors.bgCanvas}
                                        borderWidth={1}
                                        borderColor={pandraColors.border}
                                    >
                                        <Text fontFamily={fonts.mono} fontSize={10.5} color={pandraColors.primary}>
                                            $.bpi.USD.rate
                                        </Text>
                                    </View>
                                </XStack>

                                {/* Row 3: Action Trigger Button */}
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleSimulateApiFetch}
                                    style={{
                                        height: 38,
                                        borderRadius: radius.sm,
                                        backgroundColor: pandraColors.primaryGlow,
                                        borderWidth: 1,
                                        borderColor: pandraColors.primary,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 7,
                                    }}
                                >
                                    {apiFetching ? (
                                        <>
                                            <ActivityIndicator size="small" color={pandraColors.primary} />
                                            <Text fontFamily={fonts.bodySemibold} fontSize={11.5} color={pandraColors.primary}>
                                                Querying Live API…
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={13} color={pandraColors.primary} />
                                            <Text fontFamily={fonts.bodySemibold} fontSize={11.5} color={pandraColors.primary}>
                                                Test live query
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </YStack>

                            {/* Rendered Live Preview Widget */}
                            <YStack alignItems="center">
                                <View width="100%" maxWidth={285}>
                                    <WidgetTile
                                        title="Bitcoin Oracle"
                                        subtitle="CoinDesk Live Feed"
                                        badge={apiFetching ? 'FETCHING' : '200 OK LIVE'}
                                        badgeColor={pandraColors.accentAmber}
                                        icon={<Globe size={16} color={pandraColors.accentAmber} />}
                                        showSparkline={true}
                                        sparklineColor={pandraColors.accentAmber}
                                        sparklinePattern={apiSparklinePattern}
                                        highlighted={true}
                                        isLive={true}
                                        metric={apiMetricValue}
                                        metricLabel="BTC / USD INDEX"
                                        accentColor={pandraColors.accentAmber}
                                    />
                                </View>
                            </YStack>
                        </Animated.View>
                    )}

                    {/* SLIDE 2: USE CASE & ROLE PERSONALIZATION */}
                    {currentStep === 2 && (
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >

                            <YStack alignItems="center" gap={4} marginBottom={10}>
                                <View
                                    paddingHorizontal={10}
                                    paddingVertical={3}
                                    borderRadius={radius.xs}
                                    backgroundColor="rgba(16, 185, 129, 0.08)"
                                    flexDirection="row"
                                    alignItems="center"
                                    gap={5}
                                >
                                    <Sparkles size={12} color={pandraColors.accentGreen} />
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={10.5}
                                        color={pandraColors.accentGreen}
                                    >
                                        Personalize your setup
                                    </Text>
                                </View>

                                <Text
                                    fontFamily={fonts.display}
                                    fontSize={22}
                                    color={pandraColors.text}
                                    textAlign="center"
                                    letterSpacing={-0.5}
                                >
                                    Tailor Your Dashboard
                                </Text>
                                <Text
                                    fontFamily={fonts.body}
                                    fontSize={12.5}
                                    color={pandraColors.textSecondary}
                                    textAlign="center"
                                >
                                    Choose what you monitor to pre-configure your deck:
                                </Text>
                            </YStack>

                            {/* 4 Selectable Role Options */}
                            <YStack gap={7} marginBottom={10}>
                                {Object.values(ONBOARDING_ROLES).map((role) => {
                                    const isSelected = selectedRole === role.id;
                                    return (
                                        <TouchableOpacity
                                            key={role.id}
                                            activeOpacity={0.8}
                                            onPress={() => handleSelectRole(role.id)}
                                            style={{
                                                padding: 9,
                                                borderRadius: radius.md,
                                                backgroundColor: isSelected
                                                    ? pandraColors.surfaceElevated
                                                    : pandraColors.surface,
                                                borderWidth: 1.5,
                                                borderColor: isSelected
                                                    ? role.color
                                                    : pandraColors.border,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <XStack alignItems="center" gap={10} flex={1}>
                                                <View
                                                    width={32}
                                                    height={32}
                                                    borderRadius={radius.sm}
                                                    backgroundColor={role.color + '22'}
                                                    borderWidth={1}
                                                    borderColor={role.color}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    {role.id === 'devops' && <Server size={16} color={role.color} />}
                                                    {role.id === 'ai_ops' && <Cpu size={16} color={role.color} />}
                                                    {role.id === 'crypto' && <Globe size={16} color={role.color} />}
                                                    {role.id === 'developer' && <Code size={16} color={role.color} />}
                                                </View>

                                                <YStack flex={1}>
                                                    <XStack alignItems="center" gap={6}>
                                                        <Text
                                                            fontFamily={fonts.bodySemibold}
                                                            fontSize={13}
                                                            color={pandraColors.text}
                                                        >
                                                            {role.title}
                                                        </Text>
                                                        <View
                                                            paddingHorizontal={5}
                                                            paddingVertical={1.5}
                                                            borderRadius={radius.xs}
                                                            backgroundColor={role.color + '18'}
                                                        >
                                                            <Text
                                                                fontFamily={fonts.mono}
                                                                fontSize={9}
                                                                fontWeight="700"
                                                                color={role.color}
                                                            >
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

                                            <View
                                                width={20}
                                                height={20}
                                                borderRadius={10}
                                                borderWidth={1.5}
                                                borderColor={isSelected ? role.color : pandraColors.borderHighlight}
                                                backgroundColor={isSelected ? role.color : 'transparent'}
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </YStack>

                            {/* Tailored Seeded Deck Preview Highlight */}
                            <XStack
                                alignItems="center"
                                justifyContent="space-between"
                                backgroundColor={pandraColors.surface}
                                paddingHorizontal={12}
                                paddingVertical={8}
                                borderRadius={radius.sm}
                                borderWidth={1}
                                borderColor={pandraColors.border}
                            >
                                <XStack alignItems="center" gap={6}>
                                    <CheckCircle2 size={14} color={activeRoleConfig.color} />
                                    <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.text}>
                                        4 tailored widgets ready for your deck
                                    </Text>
                                </XStack>
                                <Text fontFamily={fonts.bodyMedium} fontSize={10} color={activeRoleConfig.color}>
                                    Ready
                                </Text>
                            </XStack>
                        </Animated.View>
                    )}
                </ScrollView>

                {/* 3. BOTTOM CONTROLS & PAGINATION */}
                <YStack gap={10} paddingTop={6}>
                    {/* Animated Step Dots */}
                    <XStack justifyContent="center" alignItems="center" gap={6}>
                        {[0, 1, 2].map((idx) => {
                            const isActive = currentStep === idx;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setCurrentStep(idx)}
                                    activeOpacity={0.7}
                                    style={{
                                        height: 5,
                                        width: isActive ? 26 : 7,
                                        borderRadius: 3,
                                        backgroundColor: isActive
                                            ? pandraColors.primary
                                            : pandraColors.borderHighlight,
                                    }}
                                />
                            );
                        })}
                    </XStack>

                    {/* Google Quick Auth on final step */}
                    {currentStep === 2 && (
                        <GoogleSignInButton
                            label="Quick sign in with Google"
                            style={{ marginBottom: 2 }}
                        />
                    )}

                    {/* Navigation Buttons */}
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
                                backgroundColor: pandraColors.primary,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                            onPress={handleNext}
                        >
                            <Text
                                fontFamily={fonts.bodySemibold}
                                fontSize={14}
                                color="#FFFFFF"
                            >
                                {currentStep === 0 && 'Explore APIs'}
                                {currentStep === 1 && 'Personalize deck'}
                                {currentStep === 2 && 'Get started'}
                            </Text>
                            <ArrowRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </XStack>

                    {/* Already have an account link */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={{
                            height: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={() => router.push('/(auth)/sign-in' as any)}
                    >
                        <Text
                            fontFamily={fonts.bodyMedium}
                            fontSize={12}
                            color={pandraColors.textSecondary}
                        >
                            Already have an account? <Text color={pandraColors.primary} fontFamily={fonts.bodySemibold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </YStack>

                {/* Pro Pass Preview Modal */}
                <PaywallModal
                    isOpen={isPaywallOpen}
                    onClose={() => setIsPaywallOpen(false)}
                    featureContext="Unlock unlimited API widgets, 10s polling rate, and AI telemetry summaries."
                />
            </YStack>
        </View>
    );
}