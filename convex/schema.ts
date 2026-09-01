import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Stores user decks & custom widgets
  decks: defineTable({
    userId: v.string(),
    widgets: v.array(v.any()),
    workspaces: v.array(v.any()),
    lastSyncedAt: v.number(),
  }).index('by_user', ['userId']),

  // Optional telemetry history logs
  telemetryLogs: defineTable({
    userId: v.string(),
    widgetId: v.string(),
    metricValue: v.string(),
    status: v.string(),
    latencyMs: v.number(),
    timestamp: v.number(),
  }).index('by_widget', ['widgetId', 'timestamp']),
});
