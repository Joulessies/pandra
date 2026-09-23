"use no memo";

import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import {
  PandraSmallWidget,
  PandraWideWidget,
  type PandraWidgetData,
} from './PandraAndroidWidget';

const STORAGE_KEY_PAYLOAD_PREFIX = 'pandra_native_widget_payload_';

const DEFAULT_DATA: PandraWidgetData = {
  title: 'Pandra',
  subtitle: 'Tap to sync metrics',
  metric: '--',
  metricLabel: 'PANDRA TELEMETRY',
  badge: 'ONLINE',
  badgeColor: '#92A498',
  color: '#92A498',
  status: 'live',
};

const STORAGE_KEY_ALL_PAYLOADS = 'pandra_native_widget_all_payloads';

function payloadToWidgetData(payload: any): PandraWidgetData {
  return {
    title: payload.title || DEFAULT_DATA.title,
    subtitle: payload.subtitle || DEFAULT_DATA.subtitle,
    metric: payload.metric || DEFAULT_DATA.metric,
    metricLabel: payload.metricLabel || DEFAULT_DATA.metricLabel,
    badge: payload.badge || DEFAULT_DATA.badge,
    badgeColor: payload.badgeColor || DEFAULT_DATA.badgeColor,
    color: payload.color || DEFAULT_DATA.color,
    status: payload.status || DEFAULT_DATA.status,
  };
}

async function getWidgetData(slot: string): Promise<PandraWidgetData> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY_PAYLOAD_PREFIX}${slot}`);
    if (raw) {
      return payloadToWidgetData(JSON.parse(raw));
    }

    const allRaw = await AsyncStorage.getItem(STORAGE_KEY_ALL_PAYLOADS);
    if (allRaw) {
      const allPayloads = JSON.parse(allRaw) as Array<any>;
      if (Array.isArray(allPayloads) && allPayloads.length > 0) {
        const slotMatch = allPayloads.find((p: any) => p.slot === slot);
        return payloadToWidgetData(slotMatch || allPayloads[0]);
      }
    }
  } catch (err) {
    console.warn('[AndroidWidgetHandler] Failed to read payload:', err);
  }
  return DEFAULT_DATA;
}

const widgetTaskHandler = async (props: WidgetTaskHandlerProps) => {
  const { widgetInfo, widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (widgetInfo.widgetName === 'PandraSmallWidget') {
        const data = await getWidgetData('slot_small');
        renderWidget(<PandraSmallWidget data={data} />);
      } else if (widgetInfo.widgetName === 'PandraWideWidget') {
        const data = await getWidgetData('slot_medium');
        renderWidget(<PandraWideWidget data={data} />);
      }
      break;
    }
    case 'WIDGET_CLICK':
    case 'WIDGET_DELETED':
    default:
      break;
  }
};

export function registerPandraWidgetHandler() {
  if (Platform.OS !== 'android') return;
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err: any) {
    if (!err?.message?.includes("doesn't seem to be linked")) {
      console.warn('[AndroidWidget] Failed to register task handler:', err);
    }
  }
}
