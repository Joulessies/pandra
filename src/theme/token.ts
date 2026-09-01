export const pandraColors = {
    // Panda White & Sage Light Theme (inspired by logo)
    bg: '#FAF8F5',
    bgSubtle: '#F5F2EE',
    bgCanvas: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F4F1',
    surfaceHover: '#E8EDE9',
    surfaceGlass: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(44, 51, 47, 0.10)',
    borderSubtle: 'rgba(44, 51, 47, 0.06)',
    borderHighlight: 'rgba(44, 51, 47, 0.16)',
    borderGlow: 'rgba(146, 164, 152, 0.28)',

    // Accent Palette — Sage Green Brand Accent
    primary: '#7A9182',
    primaryLight: '#92A498',
    primaryDark: '#637568',
    primaryGlow: 'rgba(122, 145, 130, 0.10)',
    primaryGlowStrong: 'rgba(122, 145, 130, 0.20)',

    secondary: '#F97316',
    secondaryLight: '#FB923C',
    secondaryDark: '#EA580C',
    secondaryGlow: 'rgba(249, 115, 22, 0.08)',

    accentCyan: '#0891B2',
    accentGreen: '#059669',
    accentBamboo: '#6D9A7B',
    accentGreenGlow: 'rgba(109, 154, 123, 0.10)',
    accentAmber: '#D97706',
    accentAmberGlow: 'rgba(217, 119, 6, 0.08)',
    accentPurple: '#7C3AED',
    accentPurpleGlow: 'rgba(124, 58, 237, 0.08)',
    accentPink: '#DB2777',

    // Typography — Charcoal & Forest Tones (panda dark patches)
    text: '#2C332F',
    textSecondary: '#5C665F',
    textMuted: '#8A9490',
    textDim: '#A8B0AB',
    textDisabled: '#C5CBC7',

    // Card & Widget
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(44, 51, 47, 0.10)',
    dotHandle: '#C5CBC7',
    dotHandleActive: '#7A9182',

    // Status
    error: '#DC2626',
    errorBg: 'rgba(220, 38, 38, 0.08)',
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.08)',
    warning: '#D97706',
    warningBg: 'rgba(217, 119, 6, 0.08)',
} as const;

export const fonts = {
    display: 'SpaceGrotesk_700Bold',
    displayMedium: 'SpaceGrotesk_500Medium',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
    mono: 'JetBrainsMono_500Medium',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
} as const;

export const radius = {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
} as const;

export const shadows = {
    subtle: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 1,
    },
    card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    elevated: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 3,
    },
} as const;

export const motion = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
        damping: 20,
        mass: 1,
        stiffness: 120,
    },
} as const;