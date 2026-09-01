import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomWidget } from '@/types/widget';

export type NativeWidgetSlot = 'slot_small' | 'slot_medium' | 'slot_accessory';

export interface NativeWidgetPayload {
  slot: NativeWidgetSlot;
  widgetId: string;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  badge: string;
  badgeColor: string;
  color: string;
  iconType: string;
  type: string;
  sparkline?: number[];
  lastUpdated: number;
  status: 'live' | 'stale' | 'error';
}

export interface NativeWidgetSlotsState {
  slot_small: string | null;
  slot_medium: string | null;
  slot_accessory: string | null;
  lastSyncedAt: number;
}

const STORAGE_KEY_SLOTS = 'pandra_native_widget_slots_v1';
const STORAGE_KEY_PAYLOAD_PREFIX = 'pandra_native_widget_payload_';
export const APP_GROUP_ID = 'group.com.joulessies.pandra';

export async function getNativeWidgetSlotAssignments(): Promise<NativeWidgetSlotsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SLOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        slot_small: parsed.slot_small ?? null,
        slot_medium: parsed.slot_medium ?? null,
        slot_accessory: parsed.slot_accessory ?? null,
        lastSyncedAt: parsed.lastSyncedAt ?? Date.now(),
      };
    }
  } catch (err) {
    console.warn('[NativeWidgetBridge] Failed to load slot assignments:', err);
  }
  return {
    slot_small: null,
    slot_medium: null,
    slot_accessory: null,
    lastSyncedAt: 0,
  };
}

export async function saveNativeWidgetSlotAssignments(
  slots: Partial<NativeWidgetSlotsState>
): Promise<NativeWidgetSlotsState> {
  try {
    const current = await getNativeWidgetSlotAssignments();
    const updated: NativeWidgetSlotsState = {
      ...current,
      ...slots,
      lastSyncedAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[NativeWidgetBridge] Failed to save slot assignments:', err);
    return {
      slot_small: null,
      slot_medium: null,
      slot_accessory: null,
      lastSyncedAt: Date.now(),
    };
  }
}

export function buildNativeWidgetPayload(
  widget: CustomWidget,
  slot: NativeWidgetSlot
): NativeWidgetPayload {
  return {
    slot,
    widgetId: widget.id,
    title: widget.title || 'Pandra Widget',
    subtitle: widget.subtitle || '',
    metric: widget.metric || '0',
    metricLabel: widget.metricLabel || '',
    badge: widget.badge || 'LIVE',
    badgeColor: widget.badgeColor || '#92A498',
    color: widget.color || '#92A498',
    iconType: widget.iconType || 'api',
    type: widget.type || 'static',
    lastUpdated: Date.now(),
    status: 'live',
  };
}

export async function syncDeckToNativeWidgets(
  widgets: CustomWidget[],
  customSlots?: Partial<NativeWidgetSlotsState>
): Promise<{ success: boolean; syncedCount: number; payloads: NativeWidgetPayload[] }> {
  try {
    const slots = customSlots
      ? await saveNativeWidgetSlotAssignments(customSlots)
      : await getNativeWidgetSlotAssignments();

    if (!widgets || widgets.length === 0) {
      return { success: true, syncedCount: 0, payloads: [] };
    }

    const smallWidget =
      (slots.slot_small ? widgets.find((w) => w.id === slots.slot_small) : null) ||
      widgets.find((w) => w.size !== 'wide') ||
      widgets[0];

    const mediumWidget =
      (slots.slot_medium ? widgets.find((w) => w.id === slots.slot_medium) : null) ||
      widgets.find((w) => w.size === 'wide') ||
      widgets[1] ||
      widgets[0];

    const accessoryWidget =
      (slots.slot_accessory ? widgets.find((w) => w.id === slots.slot_accessory) : null) ||
      widgets[0];

    const payloads: NativeWidgetPayload[] = [];

    if (smallWidget) {
      payloads.push(buildNativeWidgetPayload(smallWidget, 'slot_small'));
    }
    if (mediumWidget) {
      payloads.push(buildNativeWidgetPayload(mediumWidget, 'slot_medium'));
    }
    if (accessoryWidget) {
      payloads.push(buildNativeWidgetPayload(accessoryWidget, 'slot_accessory'));
    }

    for (const p of payloads) {
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PAYLOAD_PREFIX}${p.slot}`,
        JSON.stringify(p)
      );
    }

    if (Platform.OS === 'ios') {
      try {
        const PandraWidget = require('@/widgets/PandraWidget').default;
        if (PandraWidget && typeof PandraWidget.updateSnapshot === 'function') {
          const primary =
            payloads.find((p) => p.slot === 'slot_medium') ||
            payloads.find((p) => p.slot === 'slot_small') ||
            payloads[0];
          if (primary) {
            PandraWidget.updateSnapshot({
              title: primary.title,
              subtitle: primary.subtitle,
              metric: primary.metric,
              metricLabel: primary.metricLabel,
              badge: primary.badge,
              badgeColor: primary.badgeColor,
              color: primary.color,
              iconType: primary.iconType,
              status: primary.status,
              lastUpdated: primary.lastUpdated,
            });
          }
        }
      } catch (err) {
        console.warn(
          '[NativeWidgetBridge] iOS widget updateSnapshot skipped:',
          err
        );
      }
    }

    if (Platform.OS === 'android') {
      try {
        const { requestWidgetUpdate } = require('react-native-android-widget');
        const {
          PandraSmallWidget,
          PandraWideWidget,
        } = require('@/widgets/PandraAndroidWidget');
        const React = require('react');

        const smallPayload =
          payloads.find((p) => p.slot === 'slot_small') || payloads[0];
        const mediumPayload =
          payloads.find((p) => p.slot === 'slot_medium') || payloads[0];

        if (smallPayload) {
          await requestWidgetUpdate({
            widgetName: 'PandraSmallWidget',
            renderWidget: () =>
              React.createElement(PandraSmallWidget, { data: smallPayload }),
          });
        }
        if (mediumPayload) {
          await requestWidgetUpdate({
            widgetName: 'PandraWideWidget',
            renderWidget: () =>
              React.createElement(PandraWideWidget, { data: mediumPayload }),
          });
        }
      } catch (err) {
        console.warn(
          '[NativeWidgetBridge] Android requestWidgetUpdate skipped:',
          err
        );
      }
    }

    return {
      success: true,
      syncedCount: payloads.length,
      payloads,
    };
  } catch (err) {
    console.error('[NativeWidgetBridge] Sync failed:', err);
    return { success: false, syncedCount: 0, payloads: [] };
  }
}

export async function getCachedNativePayload(
  slot: NativeWidgetSlot
): Promise<NativeWidgetPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY_PAYLOAD_PREFIX}${slot}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[NativeWidgetBridge] Failed to get payload for ${slot}:`, err);
  }
  return null;
}
