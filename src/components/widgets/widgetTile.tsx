import React from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, View, YStackProps } from 'tamagui';
import { Image } from 'expo-image';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import {
    Sun,
    Cloud,
    CloudRain,
    Battery,
    Plus,
    Minus,
    Zap,
    ExternalLink,
    TrendingUp,
    TrendingDown,
} from 'lucide-react-native';
import { pandraColors, fonts, radius, shadows } from '@/theme/token';
import { CustomWidget, SparklineStyle } from '@/types/widget';

export type SparklinePattern = SparklineStyle;
export type WidgetTileTone = 'ink' | 'paper';

export interface WidgetTileProps extends YStackProps {
    widget?: CustomWidget;
    title?: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    metric?: string;
    metricLabel?: string;
    tone?: WidgetTileTone;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    highlighted?: boolean;
    accentColor?: string;
    showDots?: boolean;
    showSparkline?: boolean;
    sparklineColor?: string;
    sparklinePattern?: SparklineStyle;
    isLive?: boolean;
    glow?: boolean;
    onCounterIncrement?: () => void;
    onCounterDecrement?: () => void;
    onNewsPress?: (url?: string) => void;
}

interface SparklineProfile {
    path: string;
    endY: number;
}

const SPARKLINE_PROFILES: Record<string, SparklineProfile> = {
    growth: {
        path: "M 0 19 C 20 18, 35 15, 50 14 C 65 13, 75 9, 90 7 C 102 5, 112 2, 120 1.5",
        endY: 1.5,
    },
    volatile: {
        path: "M 0 14 C 12 6, 22 18, 35 8 C 48 0, 58 19, 72 6 C 85 -1, 96 17, 108 8 C 114 4, 118 6, 120 5",
        endY: 5,
    },
    pulse: {
        path: "M 0 15 L 32 15 C 36 15, 39 12, 42 3 C 44 -2, 47 22, 50 18 C 53 14, 56 8, 60 15 L 120 15",
        endY: 15,
    },
    default: {
        path: "M 0 16 C 18 16, 25 7, 45 7 C 65 7, 72 15, 92 15 C 105 15, 112 8, 120 7",
        endY: 7,
    },
};

export function MiniSparkline({
    color = pandraColors.primary,
    pattern = 'default',
    height = 22,
}: {
    color?: string;
    pattern?: SparklineStyle;
    height?: number;
}) {
    if (pattern === 'none') return null;

    const profile = SPARKLINE_PROFILES[pattern] || SPARKLINE_PROFILES.default;
    const gradientId = `spark_${color.replace(/[^a-zA-Z0-9]/g, '_')}_${pattern}`;

    return (
        <View height={height} width="100%" marginTop={8} overflow="hidden">
            <Svg height="100%" width="100%" viewBox="0 0 120 22">
                <Defs>
                    <SvgGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={color} stopOpacity="0.32" />
                        <Stop offset="70%" stopColor={color} stopOpacity="0.08" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </SvgGradient>
                </Defs>

                {/* Subtle baseline guide */}
                <Line
                    x1="0"
                    y1="21.5"
                    x2="120"
                    y2="21.5"
                    stroke={color}
                    strokeOpacity="0.12"
                    strokeDasharray="3 3"
                />

                {/* Smooth Area Gradient Fill */}
                <Path
                    d={`${profile.path} L 120 22 L 0 22 Z`}
                    fill={`url(#${gradientId})`}
                />

                {/* Primary Metric Trend Stroke */}
                <Path
                    d={profile.path}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Live Data Cursor Dot */}
                <Circle
                    cx={120}
                    cy={profile.endY}
                    r={3.5}
                    fill={color}
                    fillOpacity={0.25}
                />
                <Circle
                    cx={120}
                    cy={profile.endY}
                    r={1.5}
                    fill={color}
                />
            </Svg>
        </View>
    );
}

export function WidgetTile({
    widget,
    title: propTitle,
    subtitle: propSubtitle,
    badge: propBadge,
    badgeColor: propBadgeColor,
    metric: propMetric,
    metricLabel: propMetricLabel,
    tone = 'ink',
    icon: propIcon,
    children,
    highlighted: _highlighted = false,
    accentColor: propAccentColor,
    showDots: _showDots = false,
    showSparkline: _showSparkline = false,
    sparklineColor,
    sparklinePattern: propSparklinePattern = 'default',
    isLive = false,
    glow: _glow = false,
    onCounterIncrement,
    onCounterDecrement,
    onNewsPress,
    style,
    ...props
}: WidgetTileProps) {
    const isInk = tone === 'ink';

    // Derive properties from widget if supplied
    const title = widget ? widget.title : propTitle;
    const subtitle = widget ? widget.subtitle : propSubtitle;
    const badge = widget ? widget.badge : propBadge;
    const badgeColor = widget?.badgeColor || propBadgeColor;
    const metric = widget ? widget.metric : propMetric;
    const metricLabel = widget ? widget.metricLabel : propMetricLabel;
    const effectiveAccent = widget?.color || propAccentColor || pandraColors.primary;
    const isWide = widget?.size === 'wide';
    const trend = widget?.trend;
    const sparkPattern = widget?.sparklinePattern || propSparklinePattern;
    const cardStyle = widget?.cardStyle || 'solid';

    // Determine card background
    let bgStyle: any = { backgroundColor: isInk ? pandraColors.cardBg : '#FFFFFF' };
    if (cardStyle === 'glass') {
        bgStyle = { backgroundColor: pandraColors.surfaceGlass };
    } else if (cardStyle === 'gradient') {
        bgStyle = { backgroundColor: 'rgba(255, 255, 255, 0.03)' };
    }

    const widgetType = widget?.type;

    return (
        <YStack
            borderRadius={radius.md}
            borderWidth={1}
            borderColor={pandraColors.border}
            padding={14}
            position="relative"
            overflow="hidden"
            style={[bgStyle, style as any]}
            {...shadows.card}
            {...props}
        >
            {/* Header */}
            {(title || propIcon || badge) && (
                <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    marginBottom={6}
                >
                    <XStack alignItems="center" gap={8} flex={1}>
                        {propIcon && (
                            <View
                                width={28}
                                height={28}
                                borderRadius={radius.xs}
                                backgroundColor={pandraColors.surfaceElevated}
                                alignItems="center"
                                justifyContent="center"
                            >
                                {propIcon}
                            </View>
                        )}
                        {title && (
                            <YStack flex={1}>
                                <XStack alignItems="center" gap={5}>
                                    {(isLive || widgetType === 'api_fetcher') && (
                                        <View
                                            width={5}
                                            height={5}
                                            borderRadius={2.5}
                                            backgroundColor={pandraColors.accentGreen}
                                        />
                                    )}
                                    <Text
                                        fontFamily={fonts.bodyMedium}
                                        fontSize={13}
                                        color={pandraColors.text}
                                        numberOfLines={1}
                                    >
                                        {title}
                                    </Text>
                                </XStack>
                                {subtitle && (
                                    <Text
                                        fontFamily={fonts.body}
                                        fontSize={11}
                                        color={pandraColors.textMuted}
                                        numberOfLines={1}
                                    >
                                        {subtitle}
                                    </Text>
                                )}
                            </YStack>
                        )}
                    </XStack>

                    {badge && (
                        <View
                            paddingHorizontal={6}
                            paddingVertical={2}
                            borderRadius={radius.xs}
                            backgroundColor="rgba(255, 255, 255, 0.05)"
                        >
                            <Text
                                fontFamily={fonts.bodyMedium}
                                fontSize={9.5}
                                color={badgeColor || pandraColors.textMuted}
                            >
                                {badge}
                            </Text>
                        </View>
                    )}
                </XStack>
            )}

            {/* 1. PHOTO WIDGET */}
            {widgetType === 'photo' && widget?.photoConfig && (
                <YStack marginTop={4} flex={1} gap={6}>
                    <View
                        width="100%"
                        height={isWide ? 130 : 90}
                        borderRadius={radius.xs}
                        overflow="hidden"
                        backgroundColor={pandraColors.surfaceElevated}
                    >
                        <Image
                            source={{ uri: widget.photoConfig.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={300}
                        />
                    </View>
                    {widget.photoConfig.caption && (
                        <Text fontFamily={fonts.body} fontSize={11} color={pandraColors.textSecondary} numberOfLines={1}>
                            {widget.photoConfig.caption}
                        </Text>
                    )}
                </YStack>
            )}

            {/* 2. WEATHER WIDGET */}
            {widgetType === 'weather' && widget?.weatherConfig && (
                <YStack marginTop={4} gap={4}>
                    <XStack alignItems="center" justifyContent="space-between">
                        <XStack alignItems="baseline" gap={8}>
                            <Text fontFamily={fonts.display} fontSize={isWide ? 28 : 24} color={pandraColors.text}>
                                {widget.weatherConfig.temperature || widget.metric || '22°C'}
                            </Text>
                            {isWide && (
                                <Text fontFamily={fonts.bodyMedium} fontSize={13} color={pandraColors.textSecondary}>
                                    {widget.weatherConfig.city}
                                </Text>
                            )}
                        </XStack>

                        <View
                            width={32}
                            height={32}
                            borderRadius={16}
                            backgroundColor={pandraColors.surfaceElevated}
                            alignItems="center"
                            justifyContent="center"
                        >
                            {widget.weatherConfig.weatherCode && widget.weatherConfig.weatherCode > 50 ? (
                                <CloudRain size={16} color={pandraColors.primary} />
                            ) : widget.weatherConfig.weatherCode && widget.weatherConfig.weatherCode > 0 ? (
                                <Cloud size={16} color={pandraColors.textSecondary} />
                            ) : (
                                <Sun size={16} color={pandraColors.secondary} />
                            )}
                        </View>
                    </XStack>

                    <XStack justifyContent="space-between" alignItems="center">
                        <Text fontFamily={fonts.bodyMedium} fontSize={11} color={pandraColors.textSecondary}>
                            {widget.weatherConfig.condition || 'Clear Sky'}
                        </Text>
                        {widget.weatherConfig.highTemp && (
                            <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.textMuted}>
                                H: {widget.weatherConfig.highTemp} L: {widget.weatherConfig.lowTemp}
                            </Text>
                        )}
                    </XStack>
                </YStack>
            )}

            {/* 3. BATTERY WIDGET */}
            {widgetType === 'battery' && widget?.batteryConfig && (
                <YStack marginTop={4} gap={6}>
                    <XStack alignItems="center" justifyContent="space-between">
                        <Text fontFamily={fonts.display} fontSize={22} color={pandraColors.text}>
                            {widget.batteryConfig.levelPercent ?? 88}%
                        </Text>
                        <XStack alignItems="center" gap={4}>
                            {widget.batteryConfig.isCharging ? (
                                <Zap size={14} color={pandraColors.accentGreen} />
                            ) : (
                                <Battery size={16} color={pandraColors.textSecondary} />
                            )}
                            <Text fontFamily={fonts.bodyMedium} fontSize={10} color={widget.batteryConfig.isCharging ? pandraColors.accentGreen : pandraColors.textMuted}>
                                {widget.batteryConfig.isCharging ? 'Charging' : 'Battery'}
                            </Text>
                        </XStack>
                    </XStack>

                    {/* Progress Gauge Bar */}
                    <View
                        width="100%"
                        height={6}
                        backgroundColor={pandraColors.surfaceElevated}
                        borderRadius={3}
                        overflow="hidden"
                    >
                        <View
                            width={`${Math.min(widget.batteryConfig.levelPercent ?? 88, 100)}%`}
                            height="100%"
                            backgroundColor={(widget.batteryConfig.levelPercent ?? 88) > 20 ? pandraColors.accentGreen : pandraColors.error}
                            borderRadius={3}
                        />
                    </View>
                </YStack>
            )}

            {/* 4. NEWS WIDGET */}
            {widgetType === 'news' && widget?.newsConfig && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onNewsPress?.(widget.newsConfig?.url)}
                    style={{ marginTop: 4, gap: 4 }}
                >
                    <Text
                        fontFamily={fonts.bodyMedium}
                        fontSize={12}
                        color={pandraColors.text}
                        lineHeight={16}
                        numberOfLines={isWide ? 3 : 2}
                    >
                        {widget.newsConfig.headline || widget.title}
                    </Text>
                    <XStack alignItems="center" justifyContent="space-between" marginTop={2}>
                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.primary}>
                            {widget.newsConfig.sourceLabel || 'Tech Feed'}
                        </Text>
                        <XStack alignItems="center" gap={3}>
                            <Text fontFamily={fonts.mono} fontSize={9.5} color={pandraColors.textMuted}>
                                {widget.newsConfig.timeAgo || 'Live'}
                            </Text>
                            <ExternalLink size={10} color={pandraColors.textMuted} />
                        </XStack>
                    </XStack>
                </TouchableOpacity>
            )}

            {/* 5. STICKY NOTE WIDGET */}
            {widgetType === 'note' && widget?.noteConfig && (
                <YStack marginTop={4} flex={1} justifyContent="space-between" gap={4}>
                    <Text
                        fontFamily={fonts.body}
                        fontSize={12}
                        color={pandraColors.textSecondary}
                        lineHeight={16}
                        numberOfLines={isWide ? 4 : 3}
                    >
                        {widget.noteConfig.text}
                    </Text>
                    {widget.noteConfig.tag && (
                        <View
                            alignSelf="flex-start"
                            paddingHorizontal={6}
                            paddingVertical={2}
                            borderRadius={radius.xs}
                            backgroundColor={pandraColors.surfaceElevated}
                        >
                            <Text fontFamily={fonts.bodyMedium} fontSize={9} color={pandraColors.textMuted}>
                                #{widget.noteConfig.tag}
                            </Text>
                        </View>
                    )}
                </YStack>
            )}

            {/* 6. COUNTER WIDGET */}
            {widgetType === 'counter' && widget?.counterConfig && (
                <XStack marginTop={4} alignItems="center" justifyContent="space-between">
                    <YStack gap={2}>
                        <Text fontFamily={fonts.display} fontSize={24} color={pandraColors.text}>
                            {widget.counterConfig.count}
                        </Text>
                        <Text fontFamily={fonts.body} fontSize={10} color={pandraColors.textMuted}>
                            {widget.counterConfig.unitLabel || 'Tally'}
                        </Text>
                    </YStack>

                    <XStack gap={6} alignItems="center">
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onCounterDecrement}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.surfaceElevated,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Minus size={14} color={pandraColors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onCounterIncrement}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: radius.xs,
                                backgroundColor: pandraColors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Plus size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </XStack>
                </XStack>
            )}

            {/* 7. STANDARD METRIC & LABEL WITH OPTIONAL TREND (Fallback for static / api_fetcher) */}
            {(!widgetType || widgetType === 'static' || widgetType === 'api_fetcher') && metric && (
                <YStack marginTop={4} marginBottom={2}>
                    <XStack alignItems="center" justifyContent="space-between">
                        <Text
                            fontFamily={fonts.display}
                            fontSize={isWide ? 26 : 20}
                            color={pandraColors.text}
                            letterSpacing={-0.5}
                        >
                            {metric}
                        </Text>

                        {/* Trend Delta Chip */}
                        {trend && (
                            <XStack
                                alignItems="center"
                                gap={3}
                                paddingHorizontal={6}
                                paddingVertical={2}
                                borderRadius={radius.xs}
                                backgroundColor={trend.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}
                            >
                                {trend.isPositive ? (
                                    <TrendingUp size={11} color={pandraColors.accentGreen} />
                                ) : (
                                    <TrendingDown size={11} color={pandraColors.error} />
                                )}
                                <Text
                                    fontFamily={fonts.mono}
                                    fontSize={10}
                                    color={trend.isPositive ? pandraColors.accentGreen : pandraColors.error}
                                >
                                    {trend.value}
                                </Text>
                            </XStack>
                        )}
                    </XStack>

                    {metricLabel && (
                        <Text
                            fontFamily={fonts.body}
                            fontSize={10}
                            color={pandraColors.textMuted}
                            marginTop={1}
                        >
                            {metricLabel}
                        </Text>
                    )}
                </YStack>
            )}

            {/* Custom Children Content */}
            {children && <YStack flex={1}>{children}</YStack>}

            {/* Sparkline (ONLY for metric / telemetry / API widgets with an active sparkline pattern) */}
            {sparkPattern !== 'none' &&
                (!widgetType || widgetType === 'static' || widgetType === 'api_fetcher') && (
                <MiniSparkline
                    color={sparklineColor || effectiveAccent}
                    pattern={sparkPattern}
                    height={isWide ? 28 : 20}
                />
            )}
        </YStack>
    );
}
