import React from 'react';
import {
  FlexWidget,
  TextWidget,
  type ColorProp,
} from 'react-native-android-widget';

const C = {
  // Brand & Logo Palette (Sage Green & Warm Panda Forest)
  bg: '#161E1A' as ColorProp,
  surface: '#1F2923' as ColorProp,
  surfaceElevated: '#28362E' as ColorProp,
  surfacePill: '#223027' as ColorProp,
  text: '#FAF8F5' as ColorProp, // Warm Panda Cream
  textSecondary: '#C8D7CE' as ColorProp, // Soft Sage Tint
  textMuted: '#92A498' as ColorProp, // Brand Sage Green
  textDim: '#6C7B72' as ColorProp,
  primary: '#92A498' as ColorProp, // Pandra Logo Sage
  primaryLight: '#AEC2B5' as ColorProp,
  accentGreen: '#82A98E' as ColorProp,
  border: '#2A3830' as ColorProp,
};

export interface PandraWidgetData {
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  badge: string;
  badgeColor: string;
  color: string;
  status: string;
}

function toColorProp(colorStr?: string, fallback: ColorProp = C.primary): ColorProp {
  if (colorStr && (colorStr.startsWith('#') || colorStr.startsWith('rgba('))) {
    return colorStr as ColorProp;
  }
  return fallback;
}

export function PandraSmallWidget({ data }: { data: PandraWidgetData }) {
  const badgeColor = toColorProp(data.badgeColor, C.primaryLight);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: C.bg,
        borderRadius: 22,
      }}
    >
      {/* Top Header Pill */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: C.surfacePill,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={data.badge || 'LIVE'}
            style={{
              fontSize: 9.5,
              fontFamily: 'sans-serif-medium',
              color: badgeColor,
            }}
          />
        </FlexWidget>

        <TextWidget
          text="Pandra"
          style={{
            fontSize: 10,
            fontFamily: 'sans-serif-medium',
            color: C.textDim,
          }}
        />
      </FlexWidget>

      {/* Main Metric Section */}
      <FlexWidget style={{ flexDirection: 'column', marginTop: 4 }}>
        <TextWidget
          text={data.metric || '--'}
          style={{
            fontSize: 26,
            fontWeight: 'bold',
            fontFamily: 'sans-serif-medium',
            color: C.text,
          }}
        />
        <TextWidget
          text={data.metricLabel || 'PANDRA TELEMETRY'}
          style={{
            fontSize: 9.5,
            fontFamily: 'sans-serif-medium',
            color: C.textMuted,
            marginTop: 2,
          }}
        />
        <TextWidget
          text={data.title || 'Overview'}
          style={{
            fontSize: 12,
            fontFamily: 'sans-serif',
            color: C.textSecondary,
            marginTop: 6,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export function PandraWideWidget({ data }: { data: PandraWidgetData }) {
  const badgeColor = toColorProp(data.badgeColor, C.primaryLight);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: C.bg,
        borderRadius: 22,
      }}
    >
      {/* Left Column: Title & Metric */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          height: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={data.title || 'Telemetry Stream'}
            style={{
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'sans-serif-medium',
              color: C.text,
            }}
          />
          <TextWidget
            text={data.subtitle || 'Live Feed'}
            style={{
              fontSize: 11,
              fontFamily: 'sans-serif',
              color: C.textSecondary,
              marginTop: 1,
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={data.metric || '--'}
            style={{
              fontSize: 26,
              fontWeight: 'bold',
              fontFamily: 'sans-serif-medium',
              color: C.text,
            }}
          />
          <TextWidget
            text={data.metricLabel || 'REALTIME TELEMETRY'}
            style={{
              fontSize: 9.5,
              fontFamily: 'sans-serif-medium',
              color: C.textMuted,
              marginTop: 1,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Right Column: Status Badge & Branding */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: 'match_parent',
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: C.surfacePill,
            borderRadius: 10,
            paddingHorizontal: 9,
            paddingVertical: 3.5,
          }}
        >
          <TextWidget
            text={data.badge || 'LIVE'}
            style={{
              fontSize: 10,
              fontFamily: 'sans-serif-medium',
              color: badgeColor,
            }}
          />
        </FlexWidget>

        <TextWidget
          text="Pandra"
          style={{
            fontSize: 10,
            fontFamily: 'sans-serif-medium',
            color: C.textDim,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
