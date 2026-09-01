import { CustomWidget, DeckWorkspace } from '@/types/widget';
import { saveAllDbWidgets } from './database';

export interface CloudUserData {
  widgets: CustomWidget[];
  workspaces: DeckWorkspace[];
  lastSyncedAt: number;
}

export interface CloudSyncResult {
  success: boolean;
  source: 'convex' | 'clerk_cloud' | 'local_db' | 'custom_api';
  data?: CloudUserData;
  error?: string;
}

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const CLOUD_SYNC_ENDPOINT = process.env.EXPO_PUBLIC_CLOUD_DB_URL || '';
const CLOUD_API_KEY = process.env.EXPO_PUBLIC_CLOUD_DB_ANON_KEY || '';

/**
 * Pushes user deck and workspaces to Convex / Cloud Database
 */
export async function pushDeckToCloudDatabase(
  userId: string,
  data: {
    widgets: CustomWidget[];
    workspaces: DeckWorkspace[];
  },
  clerkUser?: any
): Promise<CloudSyncResult> {
  const safeUserId = userId || 'default_builder';
  const payload: CloudUserData = {
    widgets: data.widgets || [],
    workspaces: data.workspaces || [],
    lastSyncedAt: Date.now(),
  };

  // 1. Sync to Convex Cloud Database if configured
  if (CONVEX_URL) {
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'decks:saveDeck',
          args: {
            userId: safeUserId,
            widgets: payload.widgets,
            workspaces: payload.workspaces,
          },
        }),
      });

      if (response.ok) {
        return {
          success: true,
          source: 'convex',
          data: payload,
        };
      }
    } catch (err: any) {
      console.warn('[Convex] Cloud mutation push error:', err);
    }
  }

  // 2. Sync to Clerk User Cloud Metadata
  if (clerkUser && typeof clerkUser.update === 'function') {
    try {
      await clerkUser.update({
        unsafeMetadata: {
          ...clerkUser.unsafeMetadata,
          pandra_cloud_deck: payload,
        },
      });
      return {
        success: true,
        source: 'clerk_cloud',
        data: payload,
      };
    } catch (err: any) {
      console.warn('[CloudDB] Clerk metadata push error:', err);
    }
  }

  // 3. Optional Remote REST / Supabase Endpoint
  if (CLOUD_SYNC_ENDPOINT && CLOUD_API_KEY) {
    try {
      const response = await fetch(`${CLOUD_SYNC_ENDPOINT}/rest/v1/user_decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CLOUD_API_KEY,
          Authorization: `Bearer ${CLOUD_API_KEY}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: safeUserId,
          widgets: payload.widgets,
          workspaces: payload.workspaces,
          updated_at: payload.lastSyncedAt,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          source: 'custom_api',
          data: payload,
        };
      }
    } catch (err: any) {
      console.warn('[CloudDB] Remote API push error:', err);
    }
  }

  // 4. Fallback: Saved to local SQLite database
  try {
    await saveAllDbWidgets(payload.widgets, safeUserId);
    return {
      success: true,
      source: 'local_db',
      data: payload,
    };
  } catch (err: any) {
    return {
      success: false,
      source: 'local_db',
      error: err.message,
    };
  }
}

/**
 * Pulls user deck and workspaces from Convex / Cloud Database
 */
export async function pullDeckFromCloudDatabase(
  userId: string,
  clerkUser?: any
): Promise<CloudUserData | null> {
  const safeUserId = userId || 'default_builder';

  // 1. Try Convex Cloud Database First
  if (CONVEX_URL) {
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'decks:getDeck',
          args: { userId: safeUserId },
        }),
      });

      if (response.ok) {
        const res = await response.json();
        const deck = res.value;
        if (deck && Array.isArray(deck.widgets)) {
          const cloudData: CloudUserData = {
            widgets: deck.widgets || [],
            workspaces: deck.workspaces || [],
            lastSyncedAt: deck.lastSyncedAt || Date.now(),
          };
          saveAllDbWidgets(cloudData.widgets, safeUserId).catch(() => {});
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('[Convex] Cloud query pull error:', err);
    }
  }

  // 2. Try Clerk User Cloud Metadata
  if (clerkUser && clerkUser.unsafeMetadata?.pandra_cloud_deck) {
    const cloudDeck = clerkUser.unsafeMetadata.pandra_cloud_deck as CloudUserData;
    if (cloudDeck && Array.isArray(cloudDeck.widgets)) {
      saveAllDbWidgets(cloudDeck.widgets, safeUserId).catch(() => {});
      return cloudDeck;
    }
  }

  // 3. Try Remote Cloud Database Endpoint if configured
  if (CLOUD_SYNC_ENDPOINT && CLOUD_API_KEY) {
    try {
      const response = await fetch(
        `${CLOUD_SYNC_ENDPOINT}/rest/v1/user_decks?user_id=eq.${encodeURIComponent(safeUserId)}&select=*`,
        {
          headers: {
            apikey: CLOUD_API_KEY,
            Authorization: `Bearer ${CLOUD_API_KEY}`,
          },
        }
      );
      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].widgets) {
          const cloudData: CloudUserData = {
            widgets: rows[0].widgets || [],
            workspaces: rows[0].workspaces || [],
            lastSyncedAt: rows[0].updated_at || Date.now(),
          };
          saveAllDbWidgets(cloudData.widgets, safeUserId).catch(() => {});
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('[CloudDB] Remote pull error:', err);
    }
  }

  return null;
}
