"use no memo";

import React from 'react';
import {
  FlexWidget,
  TextWidget,
  type ColorProp,
} from 'react-native-android-widget';

const C = {
  bg: '#0F1512' as ColorProp,
  surface: '#18221D' as ColorProp,
  surfaceElevated: '#1F2C24' as ColorProp,
  surfacePill: '#25372C' as ColorProp,
  text: '#FAF8F5' as ColorProp,
  textSecondary: '#C8D7CE' as ColorProp,
  textMuted: '#8E9F94' as ColorProp,
  textDim: '#64756A' as ColorProp,
  primary: '#92A498' as ColorProp,
  primaryLight: '#B5C8BC' as ColorProp,
  accentGreen: '#34D399' as ColorProp,
  border: '#2A3C31' as ColorProp,
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
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: C.bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {/* Top Bar: Badge + Brand */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget
          style={{
            backgroundColor: C.surfacePill,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text={data.badge || 'LIVE'}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 8.5,
              fontWeight: '600',
              fontFamily: 'sans-serif-medium',
              color: badgeColor,
            }}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.accentGreen,
              marginRight: 4,
            }}
          />
          <TextWidget
            text="Pandra"
            style={{
              fontSize: 9,
              fontFamily: 'sans-serif-medium',
              color: C.textDim,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Middle: Big Metric */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={data.metric || '--'}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 21,
            fontWeight: 'bold',
            fontFamily: 'sans-serif-medium',
            color: C.text,
          }}
        />
        <TextWidget
          text={(data.metricLabel || 'PANDRA TELEMETRY').toUpperCase()}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 8,
            fontWeight: '600',
            fontFamily: 'sans-serif-medium',
            color: C.primaryLight,
            letterSpacing: 0.4,
          }}
        />
      </FlexWidget>

      {/* Bottom: Title & Subtitle */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={data.title || 'Overview'}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 10.5,
            fontWeight: '600',
            fontFamily: 'sans-serif-medium',
            color: C.text,
          }}
        />
        <TextWidget
          text={data.subtitle || 'Live Feed'}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 8.5,
            fontFamily: 'sans-serif',
            color: C.textSecondary,
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
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: C.bg,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {/* Left Column: Metrics & Titles */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 'match_parent',
          marginRight: 8,
        }}
      >
        {/* Top Tag: Live Status Indicator */}
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: C.accentGreen,
              marginRight: 5,
            }}
          />
          <TextWidget
            text={(data.metricLabel || 'PANDRA TELEMETRY').toUpperCase()}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 8,
              fontWeight: '600',
              fontFamily: 'sans-serif-medium',
              color: C.primaryLight,
              letterSpacing: 0.5,
            }}
          />
        </FlexWidget>

        {/* Big Prominent Metric */}
        <TextWidget
          text={data.metric || '--'}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            fontFamily: 'sans-serif-medium',
            color: C.text,
          }}
        />

        {/* Title & Subtitle */}
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={data.title || 'Telemetry Stream'}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 11.5,
              fontWeight: '600',
              fontFamily: 'sans-serif-medium',
              color: C.text,
            }}
          />
          <TextWidget
            text={data.subtitle || 'Live Feed'}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 9.5,
              fontFamily: 'sans-serif',
              color: C.textSecondary,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Right Column: Dedicated Elevated Telemetry Panel */}
      <FlexWidget
        style={{
          width: 96,
          height: 'match_parent',
          backgroundColor: C.surfaceElevated,
          borderRadius: 14,
          paddingVertical: 6,
          paddingHorizontal: 8,
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        {/* Status Badge */}
        <FlexWidget
          style={{
            backgroundColor: C.surfacePill,
            borderRadius: 7,
            paddingHorizontal: 6,
            paddingVertical: 2,
            width: 'match_parent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text={data.badge || 'LIVE'}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: 8,
              fontWeight: '600',
              fontFamily: 'sans-serif-medium',
              color: badgeColor,
            }}
          />
        </FlexWidget>

        {/* Dynamic Telemetry Sparkline Bars */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            height: 16,
            width: 'match_parent',
          }}
        >
          <FlexWidget style={{ width: 3, height: 7, borderRadius: 1.5, backgroundColor: C.primary, marginHorizontal: 1.5 }} />
          <FlexWidget style={{ width: 3, height: 12, borderRadius: 1.5, backgroundColor: C.accentGreen, marginHorizontal: 1.5 }} />
          <FlexWidget style={{ width: 3, height: 9, borderRadius: 1.5, backgroundColor: C.primaryLight, marginHorizontal: 1.5 }} />
          <FlexWidget style={{ width: 3, height: 16, borderRadius: 1.5, backgroundColor: badgeColor, marginHorizontal: 1.5 }} />
          <FlexWidget style={{ width: 3, height: 13, borderRadius: 1.5, backgroundColor: C.accentGreen, marginHorizontal: 1.5 }} />
          <FlexWidget style={{ width: 3, height: 10, borderRadius: 1.5, backgroundColor: C.primary, marginHorizontal: 1.5 }} />
        </FlexWidget>

        {/* Footer Brand & Status */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FlexWidget
            style={{
              width: 3.5,
              height: 3.5,
              borderRadius: 2,
              backgroundColor: C.accentGreen,
              marginRight: 3,
            }}
          />
          <TextWidget
            text="Pandra"
            style={{
              fontSize: 8,
              fontWeight: '500',
              fontFamily: 'sans-serif-medium',
              color: C.textDim,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
