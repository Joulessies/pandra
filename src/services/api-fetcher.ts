import { ApiWidgetConfig } from '@/types/widget';

export interface ApiFetchResult {
  success: boolean;
  value: string;
  badge: string;
  badgeColor?: string;
  error?: string;
  rawJsonPreview?: string;
}

export interface ApiTemplatePreset {
  id: string;
  name: string;
  description: string;
  endpointUrl: string;
  jsonPath: string;
  unit: string;
  metricLabel: string;
  defaultTitle: string;
  defaultSubtitle: string;
  color: string;
  iconType: 'api' | 'globe' | 'code' | 'compute' | 'server';
}

export const API_PRESET_TEMPLATES: ApiTemplatePreset[] = [
  {
    id: 'github_stars',
    name: 'GitHub Repo Stars',
    description: 'Track real-time stars on any public GitHub repository',
    endpointUrl: 'https://api.github.com/repos/expo/expo',
    jsonPath: 'stargazers_count',
    unit: '★',
    metricLabel: 'EXPO STARS',
    defaultTitle: 'Expo GitHub',
    defaultSubtitle: 'Live Repo Telemetry',
    color: '#38BDF8',
    iconType: 'code',
  },
  {
    id: 'btc_price',
    name: 'Bitcoin Live Price (USD)',
    description: 'Fetch real-time BTC index rates via Coinbase API',
    endpointUrl: 'https://api.coinbase.com/v2/prices/spot?currency=USD',
    jsonPath: 'data.amount',
    unit: 'USD',
    metricLabel: 'BTC / USD INDEX',
    defaultTitle: 'Bitcoin Oracle',
    defaultSubtitle: 'Coinbase Feed',
    color: '#F59E0B',
    iconType: 'globe',
  },
  {
    id: 'weather_temp',
    name: 'Open-Meteo Weather Temp',
    description: 'Live temperature stream via open weather models',
    endpointUrl: 'https://api.open-meteo.com/v1/forecast?latitude=37.77&longitude=-122.41&current_weather=true',
    jsonPath: 'current_weather.temperature',
    unit: '°C',
    metricLabel: 'SF AMBIENT TEMP',
    defaultTitle: 'Breezy Nodes',
    defaultSubtitle: 'Weather Telemetry',
    color: '#10B981',
    iconType: 'api',
  },
  {
    id: 'solana_price',
    name: 'Solana Spot Price (USD)',
    description: 'Fetch live SOL prices from CoinGecko API',
    endpointUrl: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    jsonPath: 'solana.usd',
    unit: 'USD',
    metricLabel: 'SOL / USD SPOT',
    defaultTitle: 'Solana Oracle',
    defaultSubtitle: 'CoinGecko Live Feed',
    color: '#8B5CF6',
    iconType: 'globe',
  },
  {
    id: 'ethereum_price',
    name: 'Ethereum Spot Price (USD)',
    description: 'Fetch live ETH spot price from Coinbase API',
    endpointUrl: 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
    jsonPath: 'data.amount',
    unit: 'USD',
    metricLabel: 'ETH / USD SPOT',
    defaultTitle: 'Ethereum Oracle',
    defaultSubtitle: 'Coinbase Live Feed',
    color: '#6366F1',
    iconType: 'globe',
  },
  {
    id: 'cloudflare_ping',
    name: 'Agify Age Predictor API',
    description: 'Public test API predicting name statistics',
    endpointUrl: 'https://api.agify.io?name=pandra',
    jsonPath: 'count',
    unit: 'queries',
    metricLabel: 'GLOBAL MENTIONS',
    defaultTitle: 'Agify Engine',
    defaultSubtitle: 'Name Telemetry',
    color: '#A855F7',
    iconType: 'compute',
  },
];

/**
 * Extracts a value from a nested object using dot-notation (e.g., "bpi.USD.rate" or "data.0.name")
 */
function extractJsonValue(obj: any, path: string): any {
  if (!obj || !path) return obj;

  const parts = path.trim().replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Formats values for display inside widget cards (adds commas, units, decimals)
 */
function formatDisplayValue(val: any, unit?: string): string {
  if (val === null || val === undefined) return '--';

  if (typeof val === 'number') {
    const formatted = val.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
    return unit ? `${formatted} ${unit}` : formatted;
  }

  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }

  const str = String(val);
  return unit && !str.includes(unit) ? `${str} ${unit}` : str;
}

/**
 * Executes a live fetch to the configured API endpoint with timeout
 */
export async function fetchApiWidgetData(config: ApiWidgetConfig): Promise<ApiFetchResult> {
  if (!config.endpointUrl || !config.endpointUrl.startsWith('http')) {
    return {
      success: false,
      value: 'ERR_URL',
      badge: 'INVALID URL',
      badgeColor: '#EF4444',
      error: 'Endpoint URL must start with http:// or https://',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(config.endpointUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Pandra-Cyber-Deck/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        value: `HTTP ${response.status}`,
        badge: 'HTTP ERROR',
        badgeColor: '#EF4444',
        error: `Server responded with status code ${response.status}`,
      };
    }

    const text = await response.text();
    let jsonData: any;

    try {
      jsonData = JSON.parse(text);
    } catch {
      // Plain text response fallback
      return {
        success: true,
        value: text.slice(0, 16),
        badge: 'RAW 200 OK',
        badgeColor: '#10B981',
        rawJsonPreview: text.slice(0, 200),
      };
    }

    const extracted = config.jsonPath ? extractJsonValue(jsonData, config.jsonPath) : jsonData;

    if (extracted === undefined) {
      return {
        success: false,
        value: 'PATH_MISS',
        badge: 'KEY NOT FOUND',
        badgeColor: '#F59E0B',
        error: `Key path "${config.jsonPath}" was not found in response JSON.`,
        rawJsonPreview: JSON.stringify(jsonData, null, 2).slice(0, 300),
      };
    }

    const formattedValue = formatDisplayValue(extracted, config.unit);

    return {
      success: true,
      value: formattedValue,
      badge: 'LIVE 200 OK',
      badgeColor: '#10B981',
      rawJsonPreview: JSON.stringify(jsonData, null, 2).slice(0, 400),
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      value: isTimeout ? 'TIMEOUT' : 'FETCH_ERR',
      badge: isTimeout ? 'TIMEOUT (7s)' : 'NET ERROR',
      badgeColor: '#EF4444',
      error: error.message || 'Network request failed',
    };
  }
}
