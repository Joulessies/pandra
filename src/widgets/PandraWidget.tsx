import React from 'react';
import { Text, VStack, HStack, Spacer } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  padding,
  background,
  cornerRadius,
  containerBackground,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type PandraWidgetProps = {
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  badge: string;
  badgeColor: string;
  color: string;
  iconType: string;
  status: string;
  lastUpdated: number;
};

const C = {
  // Brand & Logo Palette (Sage Green & Warm Panda Forest)
  bg: '#161E1A',
  surface: '#1F2923',
  surfaceElevated: '#28362E',
  surfacePill: '#223027',
  text: '#FAF8F5', // Warm Panda Cream
  textSecondary: '#C8D7CE', // Soft Sage Tint
  textMuted: '#92A498', // Brand Sage Green
  textDim: '#6C7B72',
  primary: '#92A498', // Pandra Logo Sage
  primaryLight: '#AEC2B5',
  accentGreen: '#82A98E',
  border: 'rgba(146, 164, 152, 0.2)',
};

function SmallWidget(props: PandraWidgetProps) {
  'widget';
  return (
    <VStack modifiers={[padding({ all: 16 }), containerBackground(C.bg, 'widget')]}>
      <HStack>
        <Text
          modifiers={[
            font({ size: 9.5, weight: 'semibold', design: 'rounded' }),
            foregroundStyle(props.badgeColor || C.primaryLight),
            padding({ horizontal: 8, vertical: 3 }),
            background(C.surfacePill),
            cornerRadius(8),
          ]}
        >
          {props.badge || 'LIVE'}
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 10, weight: 'medium', design: 'rounded' }),
            foregroundStyle(C.textDim),
          ]}
        >
          Pandra
        </Text>
      </HStack>

      <Spacer />

      <Text
        modifiers={[
          font({ size: 26, weight: 'bold', design: 'rounded' }),
          foregroundStyle(C.text),
        ]}
      >
        {props.metric || '--'}
      </Text>

      <Text
        modifiers={[
          font({ size: 9.5, weight: 'medium', design: 'rounded' }),
          foregroundStyle(C.textMuted),
        ]}
      >
        {props.metricLabel || 'PANDRA TELEMETRY'}
      </Text>

      <Text
        modifiers={[
          font({ size: 12, weight: 'medium', design: 'rounded' }),
          foregroundStyle(C.textSecondary),
          padding({ top: 4 }),
        ]}
      >
        {props.title || 'Overview'}
      </Text>
    </VStack>
  );
}

function MediumWidget(props: PandraWidgetProps) {
  'widget';
  return (
    <HStack modifiers={[padding({ all: 16 }), containerBackground(C.bg, 'widget')]}>
      <VStack>
        <Text
          modifiers={[
            font({ size: 14, weight: 'semibold', design: 'rounded' }),
            foregroundStyle(C.text),
          ]}
        >
          {props.title || 'Telemetry Stream'}
        </Text>
        <Text
          modifiers={[
            font({ size: 11, design: 'rounded' }),
            foregroundStyle(C.textSecondary),
          ]}
        >
          {props.subtitle || 'Live Feed'}
        </Text>

        <Spacer />

        <Text
          modifiers={[
            font({ size: 26, weight: 'bold', design: 'rounded' }),
            foregroundStyle(C.text),
          ]}
        >
          {props.metric || '--'}
        </Text>
        <Text
          modifiers={[
            font({ size: 9.5, weight: 'medium', design: 'rounded' }),
            foregroundStyle(C.textMuted),
          ]}
        >
          {props.metricLabel || 'REALTIME TELEMETRY'}
        </Text>
      </VStack>

      <Spacer />

      <VStack>
        <Text
          modifiers={[
            font({ size: 10, weight: 'semibold', design: 'rounded' }),
            foregroundStyle(props.badgeColor || C.primaryLight),
            padding({ horizontal: 9, vertical: 3.5 }),
            background(C.surfacePill),
            cornerRadius(8),
          ]}
        >
          {props.badge || 'LIVE'}
        </Text>

        <Spacer />

        <Text
          modifiers={[
            font({ size: 10, design: 'rounded' }),
            foregroundStyle(C.textDim),
          ]}
        >
          Pandra
        </Text>
      </VStack>
    </HStack>
  );
}

function LockScreenWidget(props: PandraWidgetProps) {
  'widget';
  return (
    <VStack modifiers={[padding({ all: 4 })]}>
      <Text
        modifiers={[
          font({ size: 11, weight: 'semibold', design: 'rounded' }),
        ]}
      >
        {props.title || 'Pandra'}
      </Text>
      <Text
        modifiers={[
          font({ size: 14, weight: 'bold', design: 'rounded' }),
        ]}
      >
        {props.metric || '--'}{' '}
        <Text
          modifiers={[
            font({ size: 10, design: 'rounded' }),
          ]}
        >
          {props.metricLabel || ''}
        </Text>
      </Text>
    </VStack>
  );
}

const PandraWidgetComponent = (
  props: PandraWidgetProps,
  environment: WidgetEnvironment
) => {
  'widget';

  if (environment.widgetFamily === 'systemSmall') {
    return <SmallWidget {...props} />;
  }

  if (environment.widgetFamily === 'systemMedium') {
    return <MediumWidget {...props} />;
  }

  if (environment.widgetFamily === 'accessoryRectangular') {
    return <LockScreenWidget {...props} />;
  }

  return <SmallWidget {...props} />;
};

export default createWidget('PandraWidget', PandraWidgetComponent);
