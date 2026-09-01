import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerWidgetTaskHandler,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';
import {
  PandraSmallWidget,
  PandraWideWidget,
  type PandraWidgetData,
} from './PandraAndroidWidget';

const STORAGE_KEY_PAYLOAD_PREFIX = 'pandra_native_widget_payload_';

const DEFAULT_DATA: PandraWidgetData = {
  title: 'Pandra Deck',
  subtitle: 'Tap to sync metrics',
  metric: '--',
  metricLabel: 'PANDRA TELEMETRY',
  badge: 'ONLINE',
  badgeColor: '#92A498',
  color: '#92A498',
  status: 'live',
};

async function getWidgetData(slot: string): Promise<PandraWidgetData> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY_PAYLOAD_PREFIX}${slot}`);
    if (raw) {
      const payload = JSON.parse(raw);
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
  registerWidgetTaskHandler(widgetTaskHandler);
}
