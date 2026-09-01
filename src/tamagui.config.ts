import { createTamagui, createFont, createTokens } from 'tamagui';
import { config as configBase } from '@tamagui/config/v3';
import { pandraColors, radius, spacing } from './theme/token';

const spaceGroteskFont = createFont({
    family: 'SpaceGrotesk_700Bold',
    size: {
        1: 11,
        2: 12,
        3: 13,
        4: 14,
        5: 16,
        6: 18,
        7: 20,
        8: 24,
        9: 28,
        10: 34,
        11: 42,
        12: 50,
        true: 14,
    },
    lineHeight: {
        1: 15,
        2: 16,
        3: 18,
        4: 20,
        5: 22,
        6: 24,
        7: 26,
        8: 30,
        9: 34,
        10: 42,
        11: 50,
        12: 58,
        true: 20,
    },
    weight: { 5: '500', 7: '700' },
    face: {
        500: { normal: 'SpaceGrotesk_500Medium' },
        700: { normal: 'SpaceGrotesk_700Bold' },
    },
});

const interFont = createFont({
    family: 'Inter_400Regular',
    size: {
        1: 11,
        2: 12,
        3: 13,
        4: 14,
        5: 15,
        6: 16,
        7: 18,
        8: 20,
        9: 24,
        10: 28,
        true: 14,
    },
    lineHeight: {
        1: 15,
        2: 16,
        3: 18,
        4: 20,
        5: 22,
        6: 24,
        7: 26,
        8: 28,
        9: 32,
        10: 36,
        true: 20,
    },
    weight: { 4: '400', 5: '500', 6: '600' },
    face: {
        400: { normal: 'Inter_400Regular' },
        500: { normal: 'Inter_500Medium' },
        600: { normal: 'Inter_600SemiBold' },
    },
});

const jetbrainsMonoFont = createFont({
    family: 'JetBrainsMono_500Medium',
    size: {
        1: 10,
        2: 11,
        3: 12,
        4: 13,
        5: 14,
        6: 16,
        7: 18,
        8: 20,
        true: 13,
    },
    lineHeight: {
        1: 14,
        2: 15,
        3: 16,
        4: 18,
        5: 20,
        6: 22,
        7: 24,
        8: 28,
        true: 18,
    },
    weight: { 5: '500' },
    face: {
        500: { normal: 'JetBrainsMono_500Medium' },
    },
});

export const tokens = createTokens({
    ...configBase.tokens,
    color: {
        ...configBase.tokens.color,
        ...pandraColors,
    },
    radius: {
        ...configBase.tokens.radius,
        xs: radius.xs,
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        full: radius.full,
    },
    space: {
        ...configBase.tokens.space,
        xs: spacing.xs,
        sm: spacing.sm,
        md: spacing.md,
        lg: spacing.lg,
        xl: spacing.xl,
        xxl: spacing.xxl,
        '3xl': spacing['3xl'],
        '4xl': spacing['4xl'],
        '5xl': spacing['5xl'],
    },
});

export const tamaguiConfig = createTamagui({
    ...configBase,
    tokens,
    fonts: {
        ...configBase.fonts,
        heading: spaceGroteskFont,
        body: interFont,
        display: spaceGroteskFont,
        mono: jetbrainsMonoFont,
    },
    themes: {
        ...configBase.themes,
        dark: {
            ...configBase.themes.dark,
        },
        light: {
            ...configBase.themes.light,
            background: pandraColors.bg,
            color: pandraColors.text,
            borderColor: pandraColors.border,
            ...pandraColors,
        },
    },
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
