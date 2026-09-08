import { create } from "zustand";

export type StudioTab = "workshop" | "blueprints" | "palette" | "backup";

interface ExploreScreenState {
  activeTab: StudioTab;
  copiedToken: string | null;
  studioPrompt: string;
  deckWidgets: any[];
  paywallContext: string;
  engineType: string;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  badge: string;
  selectedColor: string;
  customHexInput: string;
  selectedIcon: string;
  selectedSize: "standard" | "wide";
  cardStyle: "glass" | "solid" | "gradient";
  tone: "ink" | "paper";
  sparklinePattern: string;
  trendType: "positive" | "negative" | "none";
  trendValue: string;
  counterCount: number;
  counterStep: number;
  counterUnit: string;
  noteBody: string;
  photoUrl: string;
  weatherCity: string;
  weatherTemp: string;
  weatherCondition: string;
  isWeatherFetching: boolean;
  apiUrl: string;
  apiJsonPath: string;
  apiUnit: string;
  isApiTesting: boolean;

  setActiveTab: (tab: StudioTab) => void;
  setCopiedToken: (token: string | null) => void;
  setStudioPrompt: (prompt: string) => void;
  setDeckWidgets: (widgets: any[]) => void;
  setPaywallContext: (context: string) => void;
  setEngineType: (type: string) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setMetric: (metric: string) => void;
  setMetricLabel: (label: string) => void;
  setBadge: (badge: string) => void;
  setSelectedColor: (color: string) => void;
  setCustomHexInput: (input: string) => void;
  setSelectedIcon: (icon: string) => void;
  setSelectedSize: (size: "standard" | "wide") => void;
  setCardStyle: (style: "glass" | "solid" | "gradient") => void;
  setTone: (tone: "ink" | "paper") => void;
  setSparklinePattern: (pattern: string) => void;
  setTrendType: (type: "positive" | "negative" | "none") => void;
  setTrendValue: (value: string) => void;
  setCounterCount: (count: number) => void;
  setCounterStep: (step: number) => void;
  setCounterUnit: (unit: string) => void;
  setNoteBody: (body: string) => void;
  setPhotoUrl: (url: string) => void;
  setWeatherCity: (city: string) => void;
  setWeatherTemp: (temp: string) => void;
  setWeatherCondition: (condition: string) => void;
  setIsWeatherFetching: (fetching: boolean) => void;
  setApiUrl: (url: string) => void;
  setApiJsonPath: (path: string) => void;
  setApiUnit: (unit: string) => void;
  setIsApiTesting: (testing: boolean) => void;
  reset: () => void;
}

const useExploreScreenStore = create<ExploreScreenState>((set) => ({
  activeTab: "workshop",
  copiedToken: null,
  studioPrompt: "",
  deckWidgets: [],
  paywallContext: "",
  engineType: "static",
  title: "",
  subtitle: "",
  metric: "",
  metricLabel: "",
  badge: "",
  selectedColor: "#007AFF",
  customHexInput: "",
  selectedIcon: "dashboard",
  selectedSize: "standard",
  cardStyle: "glass",
  tone: "ink",
  sparklinePattern: "",
  trendType: "none",
  trendValue: "",
  counterCount: 0,
  counterStep: 1,
  counterUnit: "",
  noteBody: "",
  photoUrl: "",
  weatherCity: "",
  weatherTemp: "",
  weatherCondition: "",
  isWeatherFetching: false,
  apiUrl: "",
  apiJsonPath: "",
  apiUnit: "",
  isApiTesting: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCopiedToken: (token) => set({ copiedToken: token }),
  setStudioPrompt: (prompt) => set({ studioPrompt: prompt }),
  setDeckWidgets: (widgets) => set({ deckWidgets: widgets }),
  setPaywallContext: (context) => set({ paywallContext: context }),
  setEngineType: (type) => set({ engineType: type }),
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setMetric: (metric) => set({ metric }),
  setMetricLabel: (label) => set({ metricLabel: label }),
  setBadge: (badge) => set({ badge }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setCustomHexInput: (input) => set({ customHexInput: input }),
  setSelectedIcon: (icon) => set({ selectedIcon: icon }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setCardStyle: (style) => set({ cardStyle: style }),
  setTone: (tone) => set({ tone }),
  setSparklinePattern: (pattern) => set({ sparklinePattern: pattern }),
  setTrendType: (type) => set({ trendType: type }),
  setTrendValue: (value) => set({ trendValue: value }),
  setCounterCount: (count) => set({ counterCount: count }),
  setCounterStep: (step) => set({ counterStep: step }),
  setCounterUnit: (unit) => set({ counterUnit: unit }),
  setNoteBody: (body) => set({ noteBody: body }),
  setPhotoUrl: (url) => set({ photoUrl: url }),
  setWeatherCity: (city) => set({ weatherCity: city }),
  setWeatherTemp: (temp) => set({ weatherTemp: temp }),
  setWeatherCondition: (condition) => set({ weatherCondition: condition }),
  setIsWeatherFetching: (fetching) => set({ isWeatherFetching: fetching }),
  setApiUrl: (url) => set({ apiUrl: url }),
  setApiJsonPath: (path) => set({ apiJsonPath: path }),
  setApiUnit: (unit) => set({ apiUnit: unit }),
  setIsApiTesting: (testing) => set({ isApiTesting: testing }),

  reset: () =>
    set({
      activeTab: "workshop",
      copiedToken: null,
      studioPrompt: "",
      deckWidgets: [],
      paywallContext: "",
      engineType: "static",
      title: "",
      subtitle: "",
      metric: "",
      metricLabel: "",
      badge: "",
      selectedColor: "#007AFF",
      customHexInput: "",
      selectedIcon: "dashboard",
      selectedSize: "standard",
      cardStyle: "glass",
      tone: "ink",
      sparklinePattern: "",
      trendType: "none",
      trendValue: "",
      counterCount: 0,
      counterStep: 1,
      counterUnit: "",
      noteBody: "",
      photoUrl: "",
      weatherCity: "",
      weatherTemp: "",
      weatherCondition: "",
      isWeatherFetching: false,
      apiUrl: "",
      apiJsonPath: "",
      apiUnit: "",
      isApiTesting: false,
    }),
}));

export default useExploreScreenStore;
