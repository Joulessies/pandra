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
  value: string;         
  isPositive: boolean;   
}

export interface ApiWidgetConfig {
  endpointUrl: string;       
  jsonPath: string;          
  pollIntervalSec: number;   
  unit?: string;             
  lastFetched?: number;      
  lastStatus?: 'idle' | 'loading' | 'success' | 'error';
  lastError?: string;
}

export interface WeatherWidgetConfig {
  city: string;              
  latitude: number;
  longitude: number;
  temperature?: string;      
  condition?: string;        
  weatherCode?: number;
  unit?: 'celsius' | 'fahrenheit';
  highTemp?: string;
  lowTemp?: string;
  lastFetched?: number;
}

export interface PhotoWidgetConfig {
  imageUrl: string;          
  caption?: string;          
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
  levelPercent?: number;     
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
  condition: 'gt' | 'lt' | 'eq';      
  threshold: number;
  metricKey?: string;                 
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
  size?: WidgetSize;                   
  cardStyle?: WidgetCardStyle;         
  sparklinePattern?: SparklineStyle;   
  trend?: WidgetTrend;                 
  apiConfig?: ApiWidgetConfig;
  weatherConfig?: WeatherWidgetConfig;
  photoConfig?: PhotoWidgetConfig;
  newsConfig?: NewsWidgetConfig;
  batteryConfig?: BatteryWidgetConfig;
  noteConfig?: NoteWidgetConfig;
  counterConfig?: CounterWidgetConfig;
  alertRules?: WidgetAlertRule[];      
  tone?: 'ink' | 'paper';
  isProExclusive?: boolean;
}

export interface DeckWorkspace {
  id: string;
  name: string;
  icon: string;                        
  badge?: string;
  widgets: CustomWidget[];
  isCustom?: boolean;
}
