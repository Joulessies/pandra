export type WidgetIconType =
  | 'telemetry'
  | 'server'
  | 'compute'
  | 'security'
  | 'database'
  | 'ai'
  | 'webhook'
  | 'storage'
  | 'leaf'
  | 'api'
  | 'globe'
  | 'code'
  | 'zap'
  | 'weather'
  | 'sun'
  | 'cloud'
  | 'battery'
  | 'image'
  | 'newspaper'
  | 'file-text'
  | 'hash';

export type WidgetType =
  | 'static'
  | 'api_fetcher'
  | 'counter'
  | 'weather'
  | 'battery'
  | 'photo'
  | 'news'
  | 'note';

export type WidgetSize = 'standard' | 'wide';
export type WidgetCardStyle = 'solid' | 'glass' | 'gradient';
export type SparklineStyle = 'default' | 'growth' | 'pulse' | 'volatile' | 'none';

export interface WidgetTrend {
  value: string;         // e.g. "+12.4%", "-3.2%"
  isPositive: boolean;   // green if positive, red if negative
}

export interface ApiWidgetConfig {
  endpointUrl: string;       // e.g. https://api.github.com/repos/expo/expo
  jsonPath: string;          // e.g. "stargazers_count" or "bpi.USD.rate"
  pollIntervalSec: number;   // e.g. 60 seconds
  unit?: string;             // e.g. "Stars", "USD", "ms"
  lastFetched?: number;      // timestamp
  lastStatus?: 'idle' | 'loading' | 'success' | 'error';
  lastError?: string;
}

export interface WeatherWidgetConfig {
  city: string;              // e.g. "Tokyo", "San Francisco"
  latitude: number;
  longitude: number;
  temperature?: string;      // e.g. "22°C"
  condition?: string;        // e.g. "Sunny", "Rainy", "Partly Cloudy"
  weatherCode?: number;
  unit?: 'celsius' | 'fahrenheit';
  highTemp?: string;
  lowTemp?: string;
  lastFetched?: number;
}

export interface PhotoWidgetConfig {
  imageUrl: string;          // Web URL or local image URI
  caption?: string;          // Optional overlay caption
  aspectRatio?: 'square' | 'wide' | 'tall';
}

export interface NewsWidgetConfig {
  source: 'hackernews' | 'devto' | 'techcrunch' | 'ai';
  headline?: string;
  url?: string;
  sourceLabel?: string;
  timeAgo?: string;
  lastFetched?: number;
}

export interface BatteryWidgetConfig {
  levelPercent?: number;     // 0 - 100
  isCharging?: boolean;
  customLabel?: string;
}

export interface NoteWidgetConfig {
  text: string;
  tag?: string;
}

export interface CounterWidgetConfig {
  count: number;
  step?: number;
  unitLabel?: string;
}

export interface WidgetAlertRule {
  id: string;
  condition: 'gt' | 'lt' | 'eq';      // greater than, less than, equals
  threshold: number;
  metricKey?: string;                 // e.g. "temperature", "btc_price", "battery_level"
  enabled: boolean;
  notifyMessage?: string;
  lastTriggered?: number;
}

export interface CustomWidget {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor?: string;
  metric: string;
  metricLabel: string;
  color: string;
  iconType: WidgetIconType;
  type: WidgetType;
  size?: WidgetSize;                   // 'standard' (1x1) or 'wide' (2x1)
  cardStyle?: WidgetCardStyle;         // 'solid', 'glass', 'gradient'
  sparklinePattern?: SparklineStyle;   // 'default', 'growth', 'pulse', 'volatile', 'none'
  trend?: WidgetTrend;                 // Optional +12.4% trend chip
  apiConfig?: ApiWidgetConfig;
  weatherConfig?: WeatherWidgetConfig;
  photoConfig?: PhotoWidgetConfig;
  newsConfig?: NewsWidgetConfig;
  batteryConfig?: BatteryWidgetConfig;
  noteConfig?: NoteWidgetConfig;
  counterConfig?: CounterWidgetConfig;
  alertRules?: WidgetAlertRule[];      // Smart automation alerts
  tone?: 'ink' | 'paper';
  isProExclusive?: boolean;
}

export interface DeckWorkspace {
  id: string;
  name: string;
  icon: string;                        // 'command' | 'lifestyle' | 'crypto' | 'custom'
  badge?: string;
  widgets: CustomWidget[];
  isCustom?: boolean;
}

