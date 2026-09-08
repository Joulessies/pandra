import { CustomWidget } from '@/types/widget';

// Web fallback: SQLite is a native mobile engine, so on web we defer directly
// to AsyncStorage and Convex cloud storage managed by widget-storage.ts.

export async function getDbWidgets(_userId: string = 'default_builder'): Promise<CustomWidget[]> {
  return [];
}

export async function saveDbWidget(_widget: CustomWidget, _userId: string = 'default_builder'): Promise<void> {
  // No-op on web; AsyncStorage in widget-storage.ts persists state
}

export async function saveAllDbWidgets(_widgets: CustomWidget[], _userId: string = 'default_builder'): Promise<void> {
  // No-op on web
}

export async function deleteDbWidget(_widgetId: string, _userId: string = 'default_builder'): Promise<void> {
  // No-op on web
}

export async function logDbTelemetry(
  _widgetId: string,
  _metricValue: string,
  _status: string = '200 OK',
  _latencyMs: number = 14,
  _userId: string = 'default_builder'
): Promise<void> {
  // No-op on web
}

export async function getDbTelemetryHistory(_widgetId: string, _limit: number = 20): Promise<any[]> {
  return [];
}

export async function seedDbIfEmpty(_userId: string = 'default_builder'): Promise<CustomWidget[]> {
  return [];
}
