import { registerPandraWidgetHandler } from './src/widgets/android-widget-task-handler';

// Register Android widget headless task handler at root startup
registerPandraWidgetHandler();

import 'expo-router/entry';
