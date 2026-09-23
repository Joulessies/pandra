import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { CustomWidget } from '@/types/widget';

export const isExpoGo = Constants.appOwnership === 'expo';

export function isNativeAndroidWidgetAvailable(): boolean {
  if (Platform.OS !== 'android') return false;
  if (isExpoGo) return false;
  // In a dev build (expo run:android), the native module is always available.
  // Rather than checking for a specific TurboModule name (which varies between
  // RN architectures), we just confirm we're not in Expo Go.
  return true;
}

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
const STORAGE_KEY_ALL_PAYLOADS = 'pandra_native_widget_all_payloads';
const STORAGE_KEY_WIDGET_BY_ID_PREFIX = 'pandra_native_widget_byid_';
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

function hasUsableMetric(widget: CustomWidget): boolean {
  const m = widget.metric;
  return Boolean(m && m.trim() !== '' && m !== '--');
}

function pickWidgetForSlot(
  widgets: CustomWidget[],
  assignedId: string | null | undefined,
  preferWide?: boolean
): CustomWidget | undefined {
  const assigned = assignedId ? widgets.find((w) => w.id === assignedId) : undefined;
  if (assigned) return assigned;
  if (preferWide) {
    return widgets.find((w) => w.size === 'wide') || widgets[1] || widgets[0];
  }
  return widgets.find((w) => w.size !== 'wide') || widgets[0];
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
    status: hasUsableMetric(widget) ? 'live' : 'stale',
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

    const smallWidget = pickWidgetForSlot(widgets, slots.slot_small, false);
    const mediumWidget = pickWidgetForSlot(widgets, slots.slot_medium, true);
    const accessoryWidget = pickWidgetForSlot(widgets, slots.slot_accessory, false);

    const nextSlots: NativeWidgetSlotsState = {
      slot_small: smallWidget?.id ?? null,
      slot_medium: mediumWidget?.id ?? null,
      slot_accessory: accessoryWidget?.id ?? null,
      lastSyncedAt: Date.now(),
    };
    if (
      nextSlots.slot_small !== slots.slot_small ||
      nextSlots.slot_medium !== slots.slot_medium ||
      nextSlots.slot_accessory !== slots.slot_accessory
    ) {
      await saveNativeWidgetSlotAssignments(nextSlots);
    }

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

    // Write per-slot payloads (for backwards compatibility)
    for (const p of payloads) {
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PAYLOAD_PREFIX}${p.slot}`,
        JSON.stringify(p)
      );
    }

    // Write ALL widget payloads individually by widget ID, so the task
    // handler can always find data for any widget — not just the assigned slot.
    const allPayloads: NativeWidgetPayload[] = [];
    for (const w of widgets) {
      const p = buildNativeWidgetPayload(w, 'slot_small');
      allPayloads.push(p);
      await AsyncStorage.setItem(
        `${STORAGE_KEY_WIDGET_BY_ID_PREFIX}${w.id}`,
        JSON.stringify(p)
      );
    }
    // Write a manifest of all payloads so the task handler can enumerate them
    await AsyncStorage.setItem(
      STORAGE_KEY_ALL_PAYLOADS,
      JSON.stringify(allPayloads)
    );

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
      } catch (err: any) {
        if (!err?.message?.includes("doesn't seem to be linked")) {
          console.warn(
            '[NativeWidgetBridge] Android requestWidgetUpdate skipped:',
            err
          );
        }
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

export async function pinWidgetToHomeScreen(
  widgetName: 'PandraSmallWidget' | 'PandraWideWidget' = 'PandraWideWidget'
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!isNativeAndroidWidgetAvailable()) return false;
  try {
    const { requestPinWidget } = require('react-native-android-widget');
    return await requestPinWidget({ widgetName });
  } catch (err) {
    console.warn('[NativeWidgetBridge] requestPinWidget failed:', err);
    return false;
  }
}

