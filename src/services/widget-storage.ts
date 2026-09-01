import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CustomWidget, DeckWorkspace } from '@/types/widget';
import { pandraColors } from '@/theme/token';

// In-memory fallback cache
const memoryCache: Record<string, string> = {};

// Safe dynamic AsyncStorage loader
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
  devops: {
    id: 'devops',
    title: 'DevOps & Cloud',
    subtitle: 'Cluster & Edge Telemetry',
    description: 'Monitor server latency, pod status, and security shield in real time.',
    badge: 'DEVOPS',
    color: pandraColors.primary,
    iconName: 'server',
    widgets: [
      {
        id: 'devops_1',
        title: 'Edge Gateway',
        subtitle: 'Global router network',
        badge: '14 ms',
        badgeColor: pandraColors.primary,
        metric: '99.99%',
        metricLabel: 'EDGE AVAILABILITY',
        color: pandraColors.primary,
        iconType: 'server',
        type: 'static',
      },
      {
        id: 'devops_2',
        title: 'Kubernetes Pods',
        subtitle: 'Cluster us-east-1',
        badge: '24/24 READY',
        badgeColor: pandraColors.accentGreen,
        metric: '100%',
        metricLabel: 'POD REPLICA HEALTH',
        color: pandraColors.accentGreen,
        iconType: 'telemetry',
        type: 'static',
      },
      {
        id: 'devops_3',
        title: 'Bamboo Sentinel',
        subtitle: 'Zero-trust guard',
        badge: 'STRICT',
        badgeColor: pandraColors.secondary,
        metric: '0 THREATS',
        metricLabel: 'SHIELD STATUS',
        color: pandraColors.secondary,
        iconType: 'security',
        type: 'static',
      },
      {
        id: 'devops_4',
        title: 'Cluster CPU Load',
        subtitle: 'Worker pool alpha',
        badge: 'OPTIMAL',
        badgeColor: pandraColors.accentPurple,
        metric: '34.2%',
        metricLabel: 'PEAK UTILIZATION',
        color: pandraColors.accentPurple,
        iconType: 'compute',
        type: 'static',
      },
    ],
  },
  ai_ops: {
    id: 'ai_ops',
    title: 'AI & LLM Ops',
    subtitle: 'Tokens, Inference & Prompts',
    description: 'Track prompt compiler throughput, token usage, and latency metrics.',
    badge: 'AI OPS',
    color: pandraColors.accentPurple,
    iconName: 'ai',
    widgets: [
      {
        id: 'ai_1',
        title: 'Berry AI Agent',
        subtitle: 'Prompt Compiler Core',
        badge: 'READY',
        badgeColor: pandraColors.accentPurple,
        metric: '480 t/s',
        metricLabel: 'PROMPT COMPILER',
        color: pandraColors.accentPurple,
        iconType: 'ai',
        type: 'static',
      },
      {
        id: 'ai_2',
        title: 'Context Window',
        subtitle: 'Active session cache',
        badge: 'WARM TIER',
        badgeColor: pandraColors.accentCyan,
        metric: '128k ctx',
        metricLabel: 'MAX CONTEXT DEPTH',
        color: pandraColors.accentCyan,
        iconType: 'database',
        type: 'static',
      },
      {
        id: 'ai_3',
        title: 'Inference Latency',
        subtitle: 'p95 token stream',
        badge: 'FAST',
        badgeColor: pandraColors.accentGreen,
        metric: '310 ms',
        metricLabel: 'TIME TO FIRST TOKEN',
        color: pandraColors.accentGreen,
        iconType: 'zap',
        type: 'static',
      },
      {
        id: 'ai_4',
        title: 'Semantic Cache',
        subtitle: 'Vector similarity cache',
        badge: '94.6% HIT',
        badgeColor: pandraColors.primary,
        metric: '1.2M hits',
        metricLabel: 'EMBEDDING REUSE',
        color: pandraColors.primary,
        iconType: 'storage',
        type: 'static',
      },
    ],
  },
  crypto: {
    id: 'crypto',
    title: 'Crypto & Web3',
    subtitle: 'Price Feeds & Gas Rates',
    description: 'Live Bitcoin oracle, Ethereum gas tracker, and blockchain nodes.',
    badge: 'WEB3',
    color: pandraColors.accentAmber,
    iconName: 'globe',
    widgets: [
      {
        id: 'crypto_1',
        title: 'Bitcoin Oracle',
        subtitle: 'CoinDesk Live Feed',
        badge: 'LIVE 200 OK',
        badgeColor: pandraColors.accentAmber,
        metric: '$94,250',
        metricLabel: 'BTC / USD INDEX',
        color: pandraColors.accentAmber,
        iconType: 'globe',
        type: 'api_fetcher',
        apiConfig: {
          endpointUrl: 'https://api.coinbase.com/v2/prices/spot?currency=USD',
          jsonPath: 'data.amount',
          pollIntervalSec: 30,
          unit: 'USD',
          lastFetched: Date.now(),
          lastStatus: 'success',
        },
      },
      {
        id: 'crypto_2',
        title: 'Ethereum Gas',
        subtitle: 'Mainnet base fee',
        badge: 'LOW CONGESTION',
        badgeColor: pandraColors.accentPurple,
        metric: '12 Gwei',
        metricLabel: 'STANDARD TRANSFER',
        color: pandraColors.accentPurple,
        iconType: 'zap',
        type: 'static',
      },
      {
        id: 'crypto_3',
        title: 'Solana RPC Node',
        subtitle: 'Validator cluster',
        badge: 'SYNCED',
        badgeColor: pandraColors.accentGreen,
        metric: '2,410 TPS',
        metricLabel: 'NETWORK SPEED',
        color: pandraColors.accentGreen,
        iconType: 'server',
        type: 'static',
      },
      {
        id: 'crypto_4',
        title: 'Portfolio Delta',
        subtitle: 'Asset aggregate',
        badge: '+8.4% 24H',
        badgeColor: pandraColors.primary,
        metric: '$42,850',
        metricLabel: 'TOTAL VALUE',
        color: pandraColors.primary,
        iconType: 'telemetry',
        type: 'static',
      },
    ],
  },
  developer: {
    id: 'developer',
    title: 'Developer & APIs',
    subtitle: 'Repositories & Webhooks',
    description: 'Track GitHub repos, webhook deliveries, and deployment status.',
    badge: 'DEV HUB',
    color: pandraColors.accentCyan,
    iconName: 'code',
    widgets: [
      {
        id: 'dev_1',
        title: 'Expo GitHub',
        subtitle: 'Live Repo Telemetry',
        badge: 'SYNCED',
        badgeColor: pandraColors.primary,
        metric: '32,450 ★',
        metricLabel: 'EXPO STARS',
        color: pandraColors.primary,
        iconType: 'code',
        type: 'api_fetcher',
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
        title: 'Stripe Webhooks',
        subtitle: 'Payment ingestion pipe',
        badge: '100% 200 OK',
        badgeColor: pandraColors.accentGreen,
        metric: '0 FAILS',
        metricLabel: 'DELIVERY RELIABILITY',
        color: pandraColors.accentGreen,
        iconType: 'webhook',
        type: 'static',
      },
      {
        id: 'dev_3',
        title: 'Vercel Pipeline',
        subtitle: 'Production deploy',
        badge: 'DEPLOYED',
        badgeColor: pandraColors.secondary,
        metric: '42s BUILD',
        metricLabel: 'TURBO PACK LATENCY',
        color: pandraColors.secondary,
        iconType: 'server',
        type: 'static',
      },
      {
        id: 'dev_4',
        title: 'Sentry Error Index',
        subtitle: 'Client runtime issues',
        badge: 'HEALTHY',
        badgeColor: pandraColors.accentPurple,
        metric: '0.01%',
        metricLabel: 'CRASH-FREE USERS',
        color: pandraColors.accentPurple,
        iconType: 'security',
        type: 'static',
      },
    ],
  },
};

export const INITIAL_DEFAULT_WIDGETS: CustomWidget[] = [];

export const ADMIN_SEEDED_WIDGETS: CustomWidget[] = [];

function sanitizeKey(key: string): string {
  // SecureStore keys only accept alphanumeric, '.', '-', and '_'
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getStorageKey(userId?: string | null): string {
  const userSegment = userId ? userId.slice(0, 32) : 'default_builder';
  return sanitizeKey(`${STORAGE_PREFIX}_${userSegment}`);
}

async function safeGetItem(key: string): Promise<string | null> {
  // 1. Try AsyncStorage
  if (AsyncStorageModule?.getItem) {
    try {
      const val = await AsyncStorageModule.getItem(key);
      if (val) return val;
    } catch {
      // Fallback
    }
  }

  // 2. Try SecureStore on Native
  if (Platform.OS !== 'web') {
    try {
      const val = await SecureStore.getItemAsync(sanitizeKey(key));
      if (val) return val;
    } catch {
      // Fallback
    }
  }

  // 3. Try Web LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    } catch {
      // Fallback
    }
  }

  // 4. In-memory cache
  return memoryCache[key] || null;
}

async function safeSetItem(key: string, value: string): Promise<void> {
  memoryCache[key] = value;

  // 1. Try AsyncStorage
  if (AsyncStorageModule?.setItem) {
    try {
      await AsyncStorageModule.setItem(key, value);
    } catch {
      // Fallback
    }
  }

  // 2. Try SecureStore on Native
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(sanitizeKey(key), value);
    } catch {
      // Fallback
    }
  }

  // 3. Try Web LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Fallback
    }
  }
}

const ONBOARDING_ROLE_KEY = 'pandra_onboarding_chosen_role';
const FIRST_REGISTRATION_KEY = 'pandra_first_registration_timestamp';
const FIRST_LAUNCH_TOUR_KEY = 'pandra_first_launch_tour_seen';

export function getRoleDefaultWidgets(roleId: string): CustomWidget[] {
  const role = ONBOARDING_ROLES[roleId] || ONBOARDING_ROLES.devops;
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
  return val && ONBOARDING_ROLES[val] ? val : 'devops';
}

export async function loadUserWidgets(userId?: string | null, clerkUser?: any): Promise<CustomWidget[]> {
  const effectiveUserId = userId || 'default_builder';
  try {
    // 1. Try Cloud Database Sync
    if (clerkUser) {
      try {
        const { pullDeckFromCloudDatabase } = require('./cloud-database');
        const cloudData = await pullDeckFromCloudDatabase(effectiveUserId, clerkUser);
        if (cloudData && Array.isArray(cloudData.widgets)) {
          return cloudData.widgets;
        }
      } catch {}
    }

    // 2. Try SQLite Native Database
    const { getDbWidgets } = require('./database');
    const sqliteWidgets = await getDbWidgets(effectiveUserId);
    if (sqliteWidgets && sqliteWidgets.length > 0) {
      return sqliteWidgets;
    }

    // 3. Try Key-Value Persistent Storage
    const key = getStorageKey(userId);
    const stored = await safeGetItem(key);

    if (stored !== null && stored !== undefined) {
      try {
        const parsed: CustomWidget[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {}
    }

    // 4. Admin Account Seeding
    const isAdmin = effectiveUserId.includes('admin') || effectiveUserId.includes('joulessies') || effectiveUserId.includes('julius');
    if (isAdmin) {
      const { seedDbIfEmpty } = require('./database');
      const seeded = await seedDbIfEmpty(effectiveUserId);
      await safeSetItem(key, JSON.stringify(seeded));
      return seeded;
    }

    // 5. Regular new users start with an empty dashboard in database and storage (zero mock data)
    await safeSetItem(key, JSON.stringify([]));
    return [];
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
  const effectiveUserId = userId || 'default_builder';
  try {
    // 1. Save to SQLite
    try {
      const { saveAllDbWidgets } = require('./database');
      await saveAllDbWidgets(widgets, effectiveUserId);
    } catch {
      // Ignore SQLite fallback
    }

    // 2. Save to Key-Value Store
    const key = getStorageKey(userId);
    await safeSetItem(key, JSON.stringify(widgets));

    // 3. Push to Cloud Database
    try {
      const { pushDeckToCloudDatabase } = require('./cloud-database');
      const { loadUserWorkspaces } = require('./widget-storage');
      const workspaces = await loadUserWorkspaces(effectiveUserId);
      pushDeckToCloudDatabase(effectiveUserId, { widgets, workspaces }, clerkUser).catch(() => {});
    } catch {}
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
    // Fallback
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

// -------------------------------------------------------------
// MULTI-DECK WORKSPACES PERSISTENCE & MANAGEMENT
// -------------------------------------------------------------

function getWorkspacesKey(userId?: string | null): string {
  const effectiveUserId = userId || 'default_builder';
  return `pandra_workspaces_${effectiveUserId}`;
}

function getActiveWorkspaceKey(userId?: string | null): string {
  const effectiveUserId = userId || 'default_builder';
  return `pandra_active_workspace_${effectiveUserId}`;
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

  // 1. Try Cloud Database First
  if (clerkUser) {
    try {
      const { pullDeckFromCloudDatabase } = require('./cloud-database');
      const cloudData = await pullDeckFromCloudDatabase(effectiveUserId, clerkUser);
      if (cloudData && Array.isArray(cloudData.workspaces) && cloudData.workspaces.length > 0) {
        return cloudData.workspaces;
      }
    } catch {}
  }

  // 2. Try Key-Value Persistent Storage
  const wsKey = getWorkspacesKey(userId);
  try {
    const raw = await safeGetItem(wsKey);
    if (raw) {
      const parsed: DeckWorkspace[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Workspaces] Error loading workspaces:', err);
  }

  // 3. Seed starter workspaces with user widgets
  const currentWidgets = await loadUserWidgets(userId, clerkUser);
  const starter = getDefaultStarterWorkspaces(currentWidgets);
  await saveUserWorkspaces(starter, userId, clerkUser);
  return starter;
}

export async function saveUserWorkspaces(
  workspaces: DeckWorkspace[],
  userId?: string | null,
  clerkUser?: any
): Promise<void> {
  const effectiveUserId = userId || 'default_builder';
  const wsKey = getWorkspacesKey(userId);
  try {
    await safeSetItem(wsKey, JSON.stringify(workspaces));

    // Push to Cloud Database
    try {
      const { pushDeckToCloudDatabase } = require('./cloud-database');
      const currentWidgets = await loadUserWidgets(effectiveUserId, clerkUser);
      pushDeckToCloudDatabase(effectiveUserId, { widgets: currentWidgets, workspaces }, clerkUser).catch(() => {});
    } catch {}
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
  if (all.length <= 1) return all; // Cannot delete the only workspace

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
  const all = await loadUserWorkspaces(userId, clerkUser);
  const updated = all.map((ws) => (ws.id === workspaceId ? { ...ws, widgets } : ws));
  await saveUserWorkspaces(updated, userId, clerkUser);

  // If this is the active workspace, also sync primary user widgets
  const activeId = await getActiveWorkspaceId(userId);
  if (activeId === workspaceId) {
    await saveUserWidgets(widgets, userId, clerkUser);
  }
  return updated;
}

