import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CustomWidget, DeckWorkspace } from '@/types/widget';
import { pandraColors } from '@/theme/token';

const memoryCache: Record<string, string> = {};

let AsyncStorageModule: any = null;
try {
  AsyncStorageModule = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch {
  AsyncStorageModule = null;
}

const STORAGE_PREFIX = 'pandra_deck_v3';

export const ADMIN_CREDENTIALS = {
  email: 'admin@pandra.dev',
  password: 'admin123',
  name: 'Pandra Admin',
};

export interface RolePreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  color: string;
  iconName: string;
  widgets: CustomWidget[];
}

export const ONBOARDING_ROLES: Record<string, RolePreset> = {
  
  productivity: {
    id: 'productivity',
    title: 'Productivity & Habits',
    subtitle: 'Focus timer, habit stepper, sprint notes',
    description: 'Track daily water habits, weather radar, and focus timers in real time.',
    badge: 'HABITS',
    color: pandraColors.accentGreen,
    iconName: 'activity',
    widgets: [
      {
        id: 'prod_1',
        title: 'Water Tracker',
        subtitle: 'Daily Hydration Target',
        badge: 'OPTIMAL',
        badgeColor: pandraColors.accentGreen,
        metric: '6/8 Cups',
        metricLabel: 'HABIT COUNTER',
        color: pandraColors.accentGreen,
        iconType: 'telemetry',
        type: 'counter',
        sparklinePattern: 'growth',
        counterConfig: {
          count: 6,
          step: 1,
          unitLabel: 'Cups',
        },
      },
      {
        id: 'prod_2',
        title: 'Focus Sprint',
        subtitle: 'Deep work pomodoro',
        badge: '25:00',
        badgeColor: pandraColors.secondary,
        metric: '4 CYCLES',
        metricLabel: 'FOCUS COMPLETED',
        color: pandraColors.secondary,
        iconType: 'compute',
        type: 'static',
        sparklinePattern: 'pulse',
      },
      {
        id: 'prod_3',
        title: 'Sprint Notes',
        subtitle: 'Quick capture pad',
        badge: 'PINNED',
        badgeColor: pandraColors.primary,
        metric: '3 TASKS',
        metricLabel: 'OPEN ACTION ITEMS',
        color: pandraColors.primary,
        iconType: 'file-text',
        type: 'static',
        sparklinePattern: 'none',
      },
      {
        id: 'prod_4',
        title: 'Streak Counter',
        subtitle: 'Daily consistency',
        badge: '🔥 14 DAYS',
        badgeColor: pandraColors.accentAmber,
        metric: '14 DAYS',
        metricLabel: 'CURRENT STREAK',
        color: pandraColors.accentAmber,
        iconType: 'zap',
        type: 'static',
        sparklinePattern: 'growth',
      },
    ],
  },

  crypto: {
    id: 'crypto',
    title: 'Crypto & Markets',
    subtitle: 'Live Bitcoin oracle, gas fee tracker, portfolio beacon',
    description: 'Live Bitcoin oracle, Ethereum gas tracker, and portfolio telemetry.',
    badge: 'MARKETS',
    color: pandraColors.accentAmber,
    iconName: 'globe',
    widgets: [
      {
        id: 'crypto_1',
        title: 'Bitcoin Oracle',
        subtitle: 'Coinbase Live Feed',
        badge: 'LIVE 200 OK',
        badgeColor: pandraColors.accentAmber,
        metric: '$94,250',
        metricLabel: 'BTC / USD INDEX',
        color: pandraColors.accentAmber,
        iconType: 'globe',
        type: 'api_fetcher',
        sparklinePattern: 'volatile',
        apiConfig: {
          endpointUrl: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
          jsonPath: 'data.amount',
          pollIntervalSec: 30,
          unit: 'USD',
          lastFetched: Date.now(),
          lastStatus: 'success',
        },
      },
      {
        id: 'crypto_2',
        title: 'Gas Fee Tracker',
        subtitle: 'Ethereum mainnet base fee',
        badge: 'LOW CONGESTION',
        badgeColor: pandraColors.accentPurple,
        metric: '12 Gwei',
        metricLabel: 'STANDARD TRANSFER',
        color: pandraColors.accentPurple,
        iconType: 'zap',
        type: 'static',
        sparklinePattern: 'pulse',
      },
      {
        id: 'crypto_3',
        title: 'Portfolio Beacon',
        subtitle: 'Asset aggregate delta',
        badge: '+8.4% 24H',
        badgeColor: pandraColors.accentGreen,
        metric: '$42,850',
        metricLabel: 'TOTAL VALUE',
        color: pandraColors.accentGreen,
        iconType: 'telemetry',
        type: 'static',
        sparklinePattern: 'growth',
        trend: {
          value: '+8.4%',
          isPositive: true,
        },
      },
      {
        id: 'crypto_4',
        title: 'Solana RPC',
        subtitle: 'Validator cluster speed',
        badge: 'SYNCED',
        badgeColor: pandraColors.accentCyan,
        metric: '2,410 TPS',
        metricLabel: 'NETWORK THROUGHPUT',
        color: pandraColors.accentCyan,
        iconType: 'server',
        type: 'static',
        sparklinePattern: 'volatile',
      },
    ],
  },

  ambient: {
    id: 'ambient',
    title: 'Ambient & Lifestyle',
    subtitle: 'Weather radar, battery health, air quality',
    description: 'Live weather radar, device telemetry, and air quality sensors.',
    badge: 'LIFESTYLE',
    color: pandraColors.accentCyan,
    iconName: 'sun',
    widgets: [
      {
        id: 'amb_1',
        title: 'Tokyo Weather',
        subtitle: 'Live Precipitation Radar',
        badge: '22°C CLEAR',
        badgeColor: pandraColors.accentCyan,
        metric: '64% HUMIDITY',
        metricLabel: 'AI WEATHER ENGINE',
        color: pandraColors.accentCyan,
        iconType: 'weather',
        type: 'static',
        sparklinePattern: 'pulse',
      },
      {
        id: 'amb_2',
        title: 'Device Battery',
        subtitle: 'Hardware power telemetry',
        badge: 'FAST CHARGE',
        badgeColor: pandraColors.accentPurple,
        metric: '98%',
        metricLabel: 'BATTERY HEALTH',
        color: pandraColors.accentPurple,
        iconType: 'battery',
        type: 'static',
        sparklinePattern: 'growth',
      },
      {
        id: 'amb_3',
        title: 'Air Quality Index',
        subtitle: 'Local PM2.5 reading',
        badge: 'GOOD',
        badgeColor: pandraColors.accentGreen,
        metric: 'AQI 28',
        metricLabel: 'PM2.5 SENSOR',
        color: pandraColors.accentGreen,
        iconType: 'leaf',
        type: 'static',
        sparklinePattern: 'default',
      },
      {
        id: 'amb_4',
        title: 'Sunrise Timer',
        subtitle: 'Golden hour forecast',
        badge: '06:12 AM',
        badgeColor: pandraColors.accentAmber,
        metric: '06:12 AM',
        metricLabel: 'SUNRISE TOKYO',
        color: pandraColors.accentAmber,
        iconType: 'sun',
        type: 'static',
        sparklinePattern: 'none',
      },
    ],
  },

  developer: {
    id: 'developer',
    title: 'Dev & Engineering',
    subtitle: 'GitHub stars stream, API health, latency beacon',
    description: 'Track GitHub repos, API health pings, and deployment pipeline status.',
    badge: 'DEV HUB',
    color: pandraColors.primary,
    iconName: 'code',
    widgets: [
      {
        id: 'dev_1',
        title: 'GitHub Stars',
        subtitle: 'Expo repo live telemetry',
        badge: 'SYNCED',
        badgeColor: pandraColors.primary,
        metric: '32,450 ★',
        metricLabel: 'EXPO STARS STREAM',
        color: pandraColors.primary,
        iconType: 'code',
        type: 'api_fetcher',
        sparklinePattern: 'growth',
        apiConfig: {
          endpointUrl: 'https://api.github.com/repos/expo/expo',
          jsonPath: 'stargazers_count',
          pollIntervalSec: 60,
          unit: '★',
          lastFetched: Date.now(),
          lastStatus: 'success',
        },
      },
      {
        id: 'dev_2',
        title: 'API Health Beacon',
        subtitle: 'Stripe webhook ingestion',
        badge: '100% 200 OK',
        badgeColor: pandraColors.accentGreen,
        metric: '0 FAILS',
        metricLabel: 'DELIVERY RELIABILITY',
        color: pandraColors.accentGreen,
        iconType: 'webhook',
        type: 'static',
        sparklinePattern: 'pulse',
      },
      {
        id: 'dev_3',
        title: 'Latency Beacon',
        subtitle: 'p95 endpoint response',
        badge: 'FAST',
        badgeColor: pandraColors.accentCyan,
        metric: '38 ms',
        metricLabel: 'P95 LATENCY',
        color: pandraColors.accentCyan,
        iconType: 'zap',
        type: 'static',
        sparklinePattern: 'volatile',
      },
      {
        id: 'dev_4',
        title: 'Vercel Deploy',
        subtitle: 'Production pipeline',
        badge: 'DEPLOYED',
        badgeColor: pandraColors.secondary,
        metric: '42s BUILD',
        metricLabel: 'TURBO PACK LATENCY',
        color: pandraColors.secondary,
        iconType: 'server',
        type: 'static',
        sparklinePattern: 'default',
      },
    ],
  },
};

export const INITIAL_DEFAULT_WIDGETS: CustomWidget[] = [];

export const ADMIN_SEEDED_WIDGETS: CustomWidget[] = [];

function sanitizeKey(key: string): string {
  
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getStorageKey(userId?: string | null): string {
  const userSegment = userId ? userId.slice(0, 32) : 'default_builder';
  return sanitizeKey(`${STORAGE_PREFIX}_${userSegment}`);
}

async function safeGetItem(key: string): Promise<string | null> {
  
  if (AsyncStorageModule?.getItem) {
    try {
      const val = await AsyncStorageModule.getItem(key);
      if (val) return val;
    } catch {
      
    }
  }

  if (Platform.OS !== 'web') {
    try {
      const val = await SecureStore.getItemAsync(sanitizeKey(key));
      if (val) return val;
    } catch {
      
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    } catch {
      
    }
  }

  return memoryCache[key] || null;
}

async function safeSetItem(key: string, value: string): Promise<void> {
  memoryCache[key] = value;

  if (AsyncStorageModule?.setItem) {
    try {
      await AsyncStorageModule.setItem(key, value);
    } catch {
      
    }
  }

  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(sanitizeKey(key), value);
    } catch {
      
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      
    }
  }
}

const ONBOARDING_ROLE_KEY = 'pandra_onboarding_chosen_role';
const FIRST_REGISTRATION_KEY = 'pandra_first_registration_timestamp';
const FIRST_LAUNCH_TOUR_KEY = 'pandra_first_launch_tour_seen';

export function getRoleDefaultWidgets(roleId: string): CustomWidget[] {
  const role = ONBOARDING_ROLES[roleId] || ONBOARDING_ROLES.productivity;
  return role.widgets;
}

export async function getFirstRegistrationDate(userId?: string | null): Promise<number> {
  const key = sanitizeKey(`${FIRST_REGISTRATION_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  const val = await safeGetItem(key);
  if (val) {
    const num = parseInt(val, 10);
    if (!isNaN(num)) return num;
  }
  const now = Date.now();
  await safeSetItem(key, String(now));
  return now;
}

export async function setFirstRegistrationDate(timestamp: number, userId?: string | null): Promise<void> {
  const key = sanitizeKey(`${FIRST_REGISTRATION_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  await safeSetItem(key, String(timestamp));
}

export async function hasSeenFirstLaunchTour(userId?: string | null): Promise<boolean> {
  const key = sanitizeKey(`${FIRST_LAUNCH_TOUR_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  const val = await safeGetItem(key);
  return val === 'true';
}

export async function markFirstLaunchTourSeen(userId?: string | null): Promise<void> {
  const key = sanitizeKey(`${FIRST_LAUNCH_TOUR_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  await safeSetItem(key, 'true');
}

export async function saveOnboardingRolePreference(
  roleId: string,
  userId?: string | null
): Promise<CustomWidget[]> {
  const roleKey = sanitizeKey(`${ONBOARDING_ROLE_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  await safeSetItem(roleKey, roleId);
  return [];
}

export async function getOnboardingRolePreference(userId?: string | null): Promise<string> {
  const roleKey = sanitizeKey(`${ONBOARDING_ROLE_KEY}_${userId ? userId.slice(0, 32) : 'default_builder'}`);
  const val = await safeGetItem(roleKey);
  return val && ONBOARDING_ROLES[val] ? val : 'productivity';
}

export async function loadUserWidgets(userId?: string | null, clerkUser?: any): Promise<CustomWidget[]> {
  try {
    const workspaces = await loadUserWorkspaces(userId, clerkUser);
    const activeId = await getActiveWorkspaceId(userId);
    const fallback = await loadLocalWidgetsOnly(userId);
    return resolveActiveWidgets(workspaces, activeId, fallback);
  } catch (err) {
    console.warn('[Storage] Fallback to empty widgets:', err);
    return [];
  }
}

export async function saveUserWidgets(
  widgets: CustomWidget[],
  userId?: string | null,
  clerkUser?: any
): Promise<void> {
  try {
    const activeId = await getActiveWorkspaceId(userId);
    let workspaces = await loadLocalWorkspacesOnly(userId);
    if (workspaces.length === 0) {
      workspaces = getDefaultStarterWorkspaces(widgets);
    } else {
      workspaces = workspaces.map((ws) =>
        ws.id === activeId ? { ...ws, widgets } : ws
      );
    }
    await persistDeckSnapshot(userId, { widgets, workspaces }, clerkUser);
  } catch (err) {
    console.error('[Storage] Failed to save widgets:', err);
  }
}

export async function addUserWidget(
  newWidget: CustomWidget,
  userId?: string | null,
  clerkUser?: any
): Promise<CustomWidget[]> {
  const current = await loadUserWidgets(userId, clerkUser);
  const updated = [...current, newWidget];
  await saveUserWidgets(updated, userId, clerkUser);
  return updated;
}

export async function deleteUserWidget(
  widgetId: string,
  userId?: string | null,
  clerkUser?: any
): Promise<CustomWidget[]> {
  const current = await loadUserWidgets(userId, clerkUser);
  const updated = current.filter((w) => w.id !== widgetId);
  try {
    const { deleteDbWidget } = require('./database');
    await deleteDbWidget(widgetId, userId || 'default_builder');
  } catch {
    
  }
  await saveUserWidgets(updated, userId, clerkUser);
  return updated;
}

export async function updateUserWidget(
  updatedWidget: CustomWidget,
  userId?: string | null,
  clerkUser?: any
): Promise<CustomWidget[]> {
  const current = await loadUserWidgets(userId, clerkUser);
  const updated = current.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));
  await saveUserWidgets(updated, userId, clerkUser);
  return updated;
}

export async function resetToDefaultWidgets(
  userId?: string | null
): Promise<CustomWidget[]> {
  const effectiveUserId = userId || 'default_builder';
  const isAdmin = effectiveUserId.includes('admin') || effectiveUserId.includes('joulessies') || effectiveUserId.includes('julius');
  const emptyOrAdminWidgets: CustomWidget[] = isAdmin ? ADMIN_SEEDED_WIDGETS : [];
  const key = getStorageKey(userId);
  await safeSetItem(key, JSON.stringify(emptyOrAdminWidgets));
  try {
    const { saveAllDbWidgets } = require('./database');
    await saveAllDbWidgets(emptyOrAdminWidgets, effectiveUserId);
  } catch {}
  return emptyOrAdminWidgets;
}

function getWorkspacesKey(userId?: string | null): string {
  const effectiveUserId = userId || 'default_builder';
  return `pandra_workspaces_${effectiveUserId}`;
}

function getActiveWorkspaceKey(userId?: string | null): string {
  const effectiveUserId = userId || 'default_builder';
  return `pandra_active_workspace_${effectiveUserId}`;
}

function getSyncMetaKey(userId?: string | null): string {
  const effectiveUserId = userId || 'default_builder';
  return `pandra_sync_meta_${effectiveUserId}`;
}

async function getLocalLastSyncedAt(userId?: string | null): Promise<number> {
  try {
    const raw = await safeGetItem(getSyncMetaKey(userId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Number(parsed?.lastSyncedAt) || 0;
  } catch {
    return 0;
  }
}

async function setLocalLastSyncedAt(userId: string | null | undefined, timestamp: number): Promise<void> {
  await safeSetItem(getSyncMetaKey(userId), JSON.stringify({ lastSyncedAt: timestamp }));
}

async function loadLocalWidgetsOnly(userId?: string | null): Promise<CustomWidget[]> {
  const effectiveUserId = userId || 'default_builder';

  try {
    const stored = await safeGetItem(getStorageKey(userId));
    if (stored) {
      const parsed: CustomWidget[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    const { getDbWidgets } = require('./database');
    const sqliteWidgets = await getDbWidgets(effectiveUserId);
    if (sqliteWidgets && sqliteWidgets.length > 0) {
      return sqliteWidgets;
    }
  } catch {}

  return [];
}

async function loadLocalWorkspacesOnly(userId?: string | null): Promise<DeckWorkspace[]> {
  try {
    const raw = await safeGetItem(getWorkspacesKey(userId));
    if (raw) {
      const parsed: DeckWorkspace[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Workspaces] Error loading local workspaces:', err);
  }
  return [];
}

function resolveActiveWidgets(
  workspaces: DeckWorkspace[],
  activeId: string,
  fallbackWidgets: CustomWidget[]
): CustomWidget[] {
  const current = workspaces.find((ws) => ws.id === activeId) || workspaces[0];
  if (current && Array.isArray(current.widgets)) {
    return current.widgets;
  }
  return fallbackWidgets;
}

async function persistDeckSnapshot(
  userId: string | null | undefined,
  data: {
    widgets: CustomWidget[];
    workspaces: DeckWorkspace[];
  },
  clerkUser?: any
): Promise<void> {
  const effectiveUserId = userId || 'default_builder';
  const timestamp = Date.now();

  try {
    const { saveAllDbWidgets } = require('./database');
    await saveAllDbWidgets(data.widgets, effectiveUserId);
  } catch {}

  await safeSetItem(getStorageKey(userId), JSON.stringify(data.widgets));
  await safeSetItem(getWorkspacesKey(userId), JSON.stringify(data.workspaces));
  await setLocalLastSyncedAt(userId, timestamp);

  try {
    const { pushDeckToCloudDatabase } = require('./cloud-database');
    pushDeckToCloudDatabase(
      effectiveUserId,
      { widgets: data.widgets, workspaces: data.workspaces },
      clerkUser
    ).catch(() => {});
  } catch {}
}

export function getDefaultStarterWorkspaces(roleWidgets: CustomWidget[] = []): DeckWorkspace[] {
  return [
    {
      id: 'deck_core',
      name: 'Command Deck',
      icon: 'command',
      badge: 'PRIMARY',
      widgets: roleWidgets,
    },
  ];
}

export async function loadUserWorkspaces(userId?: string | null, clerkUser?: any): Promise<DeckWorkspace[]> {
  const effectiveUserId = userId || 'default_builder';
  const localWorkspaces = await loadLocalWorkspacesOnly(userId);
  const localWidgets = await loadLocalWidgetsOnly(userId);
  const localSyncedAt = await getLocalLastSyncedAt(userId);

  if (clerkUser) {
    try {
      const { pullDeckFromCloudDatabase } = require('./cloud-database');
      const cloudData = await pullDeckFromCloudDatabase(effectiveUserId, clerkUser);
      const cloudWorkspaces = Array.isArray(cloudData?.workspaces) ? cloudData.workspaces : [];
      const cloudWidgets = Array.isArray(cloudData?.widgets) ? cloudData.widgets : [];
      const cloudSyncedAt = Number(cloudData?.lastSyncedAt) || 0;
      const cloudHasDeck = cloudWorkspaces.length > 0 || cloudWidgets.length > 0;
      const localHasDeck = localWorkspaces.length > 0 || localWidgets.length > 0;
      const cloudIsNewer = cloudSyncedAt > localSyncedAt;

      if (cloudHasDeck && (!localHasDeck || (localSyncedAt > 0 && cloudIsNewer))) {
        const mergedWorkspaces =
          cloudWorkspaces.length > 0
            ? cloudWorkspaces
            : getDefaultStarterWorkspaces(cloudWidgets);
        const activeId = await getActiveWorkspaceId(userId);
        const mergedWidgets = resolveActiveWidgets(mergedWorkspaces, activeId, cloudWidgets);
        await persistDeckSnapshot(
          userId,
          { widgets: mergedWidgets, workspaces: mergedWorkspaces },
          undefined
        );
        return mergedWorkspaces;
      }
    } catch {}
  }

  if (localWorkspaces.length > 0) {
    return localWorkspaces;
  }

  const starter = getDefaultStarterWorkspaces(localWidgets);
  await persistDeckSnapshot(userId, { widgets: localWidgets, workspaces: starter }, clerkUser);
  return starter;
}

export async function saveUserWorkspaces(
  workspaces: DeckWorkspace[],
  userId?: string | null,
  clerkUser?: any
): Promise<void> {
  try {
    const activeId = await getActiveWorkspaceId(userId);
    const widgets = resolveActiveWidgets(
      workspaces,
      activeId,
      await loadLocalWidgetsOnly(userId)
    );
    await persistDeckSnapshot(userId, { widgets, workspaces }, clerkUser);
  } catch (err) {
    console.error('[Workspaces] Error saving workspaces:', err);
  }
}

export async function getActiveWorkspaceId(userId?: string | null): Promise<string> {
  const key = getActiveWorkspaceKey(userId);
  try {
    const active = await safeGetItem(key);
    return active || 'deck_core';
  } catch {
    return 'deck_core';
  }
}

export async function setActiveWorkspaceId(
  workspaceId: string,
  userId?: string | null
): Promise<void> {
  const key = getActiveWorkspaceKey(userId);
  await safeSetItem(key, workspaceId);
}

export async function createWorkspace(
  name: string,
  icon: string = 'custom',
  userId?: string | null,
  clerkUser?: any
): Promise<DeckWorkspace[]> {
  const all = await loadUserWorkspaces(userId, clerkUser);
  const newWorkspace: DeckWorkspace = {
    id: `ws_${Date.now()}`,
    name: name.trim() || 'New Deck',
    icon,
    badge: 'CUSTOM',
    widgets: [],
    isCustom: true,
  };
  const updated = [...all, newWorkspace];
  await saveUserWorkspaces(updated, userId, clerkUser);
  await setActiveWorkspaceId(newWorkspace.id, userId);
  return updated;
}

export async function deleteWorkspace(
  workspaceId: string,
  userId?: string | null,
  clerkUser?: any
): Promise<DeckWorkspace[]> {
  const all = await loadUserWorkspaces(userId, clerkUser);
  if (all.length <= 1) return all; 

  const updated = all.filter((w) => w.id !== workspaceId);
  await saveUserWorkspaces(updated, userId, clerkUser);

  const currentActive = await getActiveWorkspaceId(userId);
  if (currentActive === workspaceId) {
    await setActiveWorkspaceId(updated[0].id, userId);
  }
  return updated;
}

export async function updateWorkspaceWidgets(
  workspaceId: string,
  widgets: CustomWidget[],
  userId?: string | null,
  clerkUser?: any
): Promise<DeckWorkspace[]> {
  let all = await loadLocalWorkspacesOnly(userId);
  if (all.length === 0) {
    all = getDefaultStarterWorkspaces(widgets);
  }
  const updated = all.map((ws) => (ws.id === workspaceId ? { ...ws, widgets } : ws));
  const activeId = await getActiveWorkspaceId(userId);
  const payloadWidgets =
    activeId === workspaceId
      ? widgets
      : resolveActiveWidgets(updated, activeId, widgets);
  await persistDeckSnapshot(
    userId,
    { widgets: payloadWidgets, workspaces: updated },
    clerkUser
  );
  return updated;
}
