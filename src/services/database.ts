import { Platform } from 'react-native';
import { CustomWidget } from '@/types/widget';

let sqliteDbInstance: any = null;
let isSqliteDisabled = false;

// Dynamically and safely initialize expo-sqlite
async function getDatabase(): Promise<any> {
  if (Platform.OS === 'web' || isSqliteDisabled) return null;
  if (sqliteDbInstance) return sqliteDbInstance;

  try {
    const SQLite = require('expo-sqlite');
    if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
      const db = await SQLite.openDatabaseAsync('pandra_deck_v3.db');
      const initialized = await initTables(db);
      if (initialized) {
        sqliteDbInstance = db;
        return sqliteDbInstance;
      }
    }
  } catch {
    // Graceful fallback to AsyncStorage / SecureStore
    console.log('[SQLite] Native database not available in this environment. Using multi-tier persistent storage.');
    isSqliteDisabled = true;
    sqliteDbInstance = null;
  }
  return null;
}

// 1. Schema Initialization
async function initTables(db: any): Promise<boolean> {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS widgets (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        badge TEXT NOT NULL DEFAULT '',
        badge_color TEXT NOT NULL DEFAULT '',
        metric TEXT NOT NULL DEFAULT '',
        metric_label TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#3B82F6',
        icon_type TEXT NOT NULL DEFAULT 'server',
        type TEXT NOT NULL DEFAULT 'static',
        widget_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS telemetry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        widget_id TEXT NOT NULL,
        metric_value TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '200 OK',
        latency_ms INTEGER NOT NULL DEFAULT 14,
        timestamp INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_widgets_user ON widgets(user_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_widget ON telemetry_logs(widget_id, timestamp);
    `);
    return true;
  } catch {
    console.log('[SQLite] Database init skipped. Using AsyncStorage storage engine.');
    isSqliteDisabled = true;
    return false;
  }
}

// 2. Fetch User Widgets from SQLite
export async function getDbWidgets(userId: string = 'default_builder'): Promise<CustomWidget[]> {
  if (isSqliteDisabled) return [];
  try {
    const db = await getDatabase();
    if (!db) return [];

    const safeUserId = String(userId || 'default_builder');
    const rows = await db.getAllAsync(
      `SELECT * FROM widgets WHERE user_id = ? ORDER BY created_at ASC`,
      [safeUserId]
    );

    if (rows && rows.length > 0) {
      return rows.map((r: any) => {
        try {
          if (r.widget_json && r.widget_json.startsWith('{')) {
            return JSON.parse(r.widget_json);
          }
        } catch {}

        return {
          id: String(r.id),
          title: String(r.title || 'Widget'),
          subtitle: String(r.subtitle || ''),
          badge: String(r.badge || ''),
          badgeColor: String(r.badge_color || ''),
          metric: String(r.metric || '0'),
          metricLabel: String(r.metric_label || ''),
          color: String(r.color || '#3B82F6'),
          iconType: r.icon_type || 'server',
          type: r.type || 'static',
        };
      });
    }
  } catch {
    // Non-blocking fallback
    isSqliteDisabled = true;
  }
  return [];
}

// 3. Upsert a Widget in SQLite
export async function saveDbWidget(widget: CustomWidget, userId: string = 'default_builder'): Promise<void> {
  if (isSqliteDisabled || !widget || !widget.id) return;
  try {
    const db = await getDatabase();
    if (!db) return;

    const safeUserId = String(userId || 'default_builder');
    const safeId = String(widget.id);
    const safeTitle = String(widget.title || '');
    const safeSubtitle = String(widget.subtitle || '');
    const safeBadge = String(widget.badge || '');
    const safeBadgeColor = String(widget.badgeColor || '');
    const safeMetric = String(widget.metric || '');
    const safeMetricLabel = String(widget.metricLabel || '');
    const safeColor = String(widget.color || '#3B82F6');
    const safeIconType = String(widget.iconType || 'server');
    const safeType = String(widget.type || 'static');
    const safeJson = JSON.stringify(widget);
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO widgets (id, user_id, title, subtitle, badge, badge_color, metric, metric_label, color, icon_type, type, widget_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         subtitle = excluded.subtitle,
         badge = excluded.badge,
         badge_color = excluded.badge_color,
         metric = excluded.metric,
         metric_label = excluded.metric_label,
         color = excluded.color,
         icon_type = excluded.icon_type,
         type = excluded.type,
         widget_json = excluded.widget_json,
         updated_at = excluded.updated_at`,
      [
        safeId,
        safeUserId,
        safeTitle,
        safeSubtitle,
        safeBadge,
        safeBadgeColor,
        safeMetric,
        safeMetricLabel,
        safeColor,
        safeIconType,
        safeType,
        safeJson,
        now,
        now,
      ]
    );
  } catch {
    // Non-blocking fallback to AsyncStorage
    isSqliteDisabled = true;
  }
}

// 4. Batch Save All Widgets for User
export async function saveAllDbWidgets(widgets: CustomWidget[], userId: string = 'default_builder'): Promise<void> {
  if (isSqliteDisabled || !Array.isArray(widgets)) return;
  try {
    const db = await getDatabase();
    if (!db) return;

    for (const w of widgets) {
      await saveDbWidget(w, userId);
    }
  } catch {
    isSqliteDisabled = true;
  }
}

// 5. Delete a Widget from SQLite
export async function deleteDbWidget(widgetId: string, userId: string = 'default_builder'): Promise<void> {
  if (isSqliteDisabled) return;
  try {
    const db = await getDatabase();
    if (!db) return;

    await db.runAsync(
      `DELETE FROM widgets WHERE id = ? AND user_id = ?`,
      [String(widgetId), String(userId)]
    );
  } catch {
    isSqliteDisabled = true;
  }
}

// 6. Log Telemetry / API Polls into Database
export async function logDbTelemetry(
  widgetId: string,
  metricValue: string,
  status: string = '200 OK',
  latencyMs: number = 14,
  userId: string = 'default_builder'
): Promise<void> {
  if (isSqliteDisabled) return;
  try {
    const db = await getDatabase();
    if (!db) return;

    await db.runAsync(
      `INSERT INTO telemetry_logs (user_id, widget_id, metric_value, status, latency_ms, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(userId), String(widgetId), String(metricValue), String(status), Number(latencyMs || 0), Date.now()]
    );
  } catch {
    isSqliteDisabled = true;
  }
}

// 7. Get Telemetry History for a Widget
export async function getDbTelemetryHistory(widgetId: string, limit: number = 20): Promise<any[]> {
  if (isSqliteDisabled) return [];
  try {
    const db = await getDatabase();
    if (!db) return [];

    return await db.getAllAsync(
      `SELECT * FROM telemetry_logs WHERE widget_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [String(widgetId), Number(limit || 20)]
    );
  } catch {
    isSqliteDisabled = true;
    return [];
  }
}

// 8. Fetch or Initialize Deck in SQLite (Zero Mock Data)
export async function seedDbIfEmpty(userId: string = 'default_builder'): Promise<CustomWidget[]> {
  if (isSqliteDisabled) return [];
  try {
    const existing = await getDbWidgets(userId);
    if (existing && existing.length > 0) {
      return existing;
    }
    return [];
  } catch {
    isSqliteDisabled = true;
    return [];
  }
}
