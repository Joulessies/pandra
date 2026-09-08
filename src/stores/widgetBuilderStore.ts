import { create } from "zustand";
import type {
  WidgetCardStyle,
  WidgetIconType,
  WidgetSize,
  SparklineStyle,
} from "@/types/widget";

export type BuilderCategory =
  | "photo"
  | "weather"
  | "battery"
  | "news"
  | "note"
  | "counter"
  | "api"
  | "static";

interface WidgetBuilderState {
  activeCategory: BuilderCategory;
  title: string;
  subtitle: string;
  selectedColor: string;
  selectedIcon: WidgetIconType;
  selectedSize: WidgetSize;
  cardStyle: WidgetCardStyle;
  sparklinePattern: SparklineStyle;
  hasTrend: boolean;
  trendValue: string;
  trendPositive: boolean;
  customMetric: string;
  customMetricLabel: string;
  photoUrl: string;
  photoCaption: string;
  selectedCity: any;
  tempUnit: "celsius" | "fahrenheit";
  weatherLiveTemp: string;
  weatherCondition: string;
  batteryLevel: number;
  isCharging: boolean;
  newsSource: "hackernews" | "devto" | "ai" | "techcrunch";
  newsHeadline: string;
  noteContent: string;
  noteTag: string;
  counterCount: number;
  counterUnit: string;
  apiUrl: string;
  apiJsonPath: string;
  apiUnit: string;
  apiTestResult: string | null;
  aiFillPrompt: string;
  isAiFilling: boolean;

  setActiveCategory: (category: BuilderCategory) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setSelectedColor: (color: string) => void;
  setSelectedIcon: (icon: string) => void;
  setSelectedSize: (size: "standard" | "wide") => void;
  setCardStyle: (style: "glass" | "solid" | "gradient") => void;
  setSparklinePattern: (pattern: string) => void;
  setHasTrend: (hasTrend: boolean) => void;
  setTrendValue: (value: string) => void;
  setTrendPositive: (positive: boolean) => void;
  setCustomMetric: (metric: string) => void;
  setCustomMetricLabel: (label: string) => void;
  setPhotoUrl: (url: string) => void;
  setPhotoCaption: (caption: string) => void;
  setSelectedCity: (city: any) => void;
  setTempUnit: (unit: "celsius" | "fahrenheit") => void;
  setWeatherLiveTemp: (temp: string) => void;
  setWeatherCondition: (condition: string) => void;
  setBatteryLevel: (level: number) => void;
  setIsCharging: (charging: boolean) => void;
  setNewsSource: (source: "hackernews" | "devto" | "ai" | "techcrunch") => void;
  setNewsHeadline: (headline: string) => void;
  setNoteContent: (content: string) => void;
  setNoteTag: (tag: string) => void;
  setCounterCount: (count: number) => void;
  setCounterUnit: (unit: string) => void;
  setApiUrl: (url: string) => void;
  setApiJsonPath: (path: string) => void;
  setApiUnit: (unit: string) => void;
  setApiTestResult: (result: string | null) => void;
  setAiFillPrompt: (prompt: string) => void;
  setIsAiFilling: (filling: boolean) => void;
  reset: () => void;
}

const useWidgetBuilderStore = create<WidgetBuilderState>((set) => ({
  activeCategory: "photo",
  title: "Personal Photo",
  subtitle: "My Inspiration",
  selectedColor: "#007AFF",
  selectedIcon: "image",
  selectedSize: "standard",
  cardStyle: "solid",
  sparklinePattern: "default",
  hasTrend: false,
  trendValue: "+14.2%",
  trendPositive: true,
  customMetric: "99.9%",
  customMetricLabel: "Availability",
  photoUrl: "",
  photoCaption: "",
  selectedCity: {
    name: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
    country: "USA",
  },
  tempUnit: "celsius",
  weatherLiveTemp: "22°C",
  weatherCondition: "Clear Sky",
  batteryLevel: 88,
  isCharging: false,
  newsSource: "hackernews",
  newsHeadline: "Modern developer toolchains report 40% latency reduction",
  noteContent:
    "Refactor edge router before Monday release. Run full test matrix.",
  noteTag: "priority",
  counterCount: 4,
  counterUnit: "Deploys Today",
  apiUrl: "",
  apiJsonPath: "",
  apiUnit: "",
  apiTestResult: null,
  aiFillPrompt: "",
  isAiFilling: false,

  setActiveCategory: (category) => set({ activeCategory: category }),
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setSelectedIcon: (icon) => set({ selectedIcon: icon }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setCardStyle: (style) => set({ cardStyle: style }),
  setSparklinePattern: (pattern) => set({ sparklinePattern: pattern }),
  setHasTrend: (hasTrend) => set({ hasTrend }),
  setTrendValue: (value) => set({ trendValue: value }),
  setTrendPositive: (positive) => set({ trendPositive: positive }),
  setCustomMetric: (metric) => set({ customMetric: metric }),
  setCustomMetricLabel: (label) => set({ customMetricLabel: label }),
  setPhotoUrl: (url) => set({ photoUrl: url }),
  setPhotoCaption: (caption) => set({ photoCaption: caption }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setTempUnit: (unit) => set({ tempUnit: unit }),
  setWeatherLiveTemp: (temp) => set({ weatherLiveTemp: temp }),
  setWeatherCondition: (condition) => set({ weatherCondition: condition }),
  setBatteryLevel: (level) => set({ batteryLevel: level }),
  setIsCharging: (charging) => set({ isCharging: charging }),
  setNewsSource: (source) => set({ newsSource: source }),
  setNewsHeadline: (headline) => set({ newsHeadline: headline }),
  setNoteContent: (content) => set({ noteContent: content }),
  setNoteTag: (tag) => set({ noteTag: tag }),
  setCounterCount: (count) => set({ counterCount: count }),
  setCounterUnit: (unit) => set({ counterUnit: unit }),
  setApiUrl: (url) => set({ apiUrl: url }),
  setApiJsonPath: (path) => set({ apiJsonPath: path }),
  setApiUnit: (unit) => set({ apiUnit: unit }),
  setApiTestResult: (result) => set({ apiTestResult: result }),
  setAiFillPrompt: (prompt) => set({ aiFillPrompt: prompt }),
  setIsAiFilling: (filling) => set({ isAiFilling: filling }),

  reset: () =>
    set({
      activeCategory: "photo",
      title: "",
      subtitle: "",
      selectedColor: "#007AFF",
      selectedIcon: "dashboard",
      selectedSize: "standard",
      cardStyle: "glass",
      sparklinePattern: "sparkline",
      hasTrend: false,
      trendValue: "0",
      trendPositive: true,
      customMetric: "",
      customMetricLabel: "",
      photoUrl: "",
      photoCaption: "",
      selectedCity: null,
      tempUnit: "celsius",
      weatherLiveTemp: "",
      weatherCondition: "",
      batteryLevel: 100,
      isCharging: false,
      newsSource: "hackernews",
      newsHeadline: "",
      noteContent: "",
      noteTag: "",
      counterCount: 0,
      counterUnit: "",
      apiUrl: "",
      apiJsonPath: "",
      apiUnit: "",
      apiTestResult: null,
      aiFillPrompt: "",
      isAiFilling: false,
    }),
}));

export default useWidgetBuilderStore;
