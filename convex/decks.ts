import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// 1. Fetch user deck and workspaces
export const getDeck = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const deck = await ctx.db
      .query('decks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    return deck || null;
  },
});

// 2. Save/Sync entire deck & workspaces
export const saveDeck = mutation({
  args: {
    userId: v.string(),
    widgets: v.array(v.any()),
    workspaces: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('decks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        widgets: args.widgets,
        workspaces: args.workspaces,
        lastSyncedAt: now,
      });
      return { id: existing._id, lastSyncedAt: now };
    } else {
      const id = await ctx.db.insert('decks', {
        userId: args.userId,
        widgets: args.widgets,
        workspaces: args.workspaces,
        lastSyncedAt: now,
      });
      return { id, lastSyncedAt: now };
    }
  },
});

// 3. Log Telemetry data
export const logTelemetry = mutation({
  args: {
    userId: v.string(),
    widgetId: v.string(),
    metricValue: v.string(),
    status: v.string(),
    latencyMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('telemetryLogs', {
      userId: args.userId,
      widgetId: args.widgetId,
      metricValue: args.metricValue,
      status: args.status,
      latencyMs: args.latencyMs,
      timestamp: Date.now(),
    });
  },
});
