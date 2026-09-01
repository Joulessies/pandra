import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  PanResponder,
  PanResponderInstance,
  Animated,
  TouchableOpacity,
  View as RNView,
  LayoutChangeEvent,
  StyleSheet,
  Platform,
} from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Maximize2,
  Minimize2,
  Sparkles,
  Cloud,
  Battery,
  Newspaper,
  FileText,
  Hash,
  Globe,
  Camera,
  Server,
  Zap,
  Shield,
  Activity,
  Cpu,
  Lock,
} from 'lucide-react-native';
import { CustomWidget } from '@/types/widget';
import { WidgetTile } from '@/components/widgets/widgetTile';
import { pandraColors, fonts, radius } from '@/theme/token';

interface DraggableWidgetGridProps {
  widgets: CustomWidget[];
  isOrganizeMode: boolean;
  onPressWidget: (widget: CustomWidget) => void;
  onReorder?: (newWidgets: CustomWidget[]) => void;
  onReorderWidgets?: (newWidgets: CustomWidget[]) => void;
  onToggleWidgetSize: (widgetId: string) => void;
  onDuplicateWidget: (widget: CustomWidget) => void;
  onDeleteWidget: (widgetId: string, widgetTitle: string) => void;
  onMoveWidgetIndex: (index: number, direction: 'up' | 'down') => void;
  onCounterIncrement: (widgetId: string) => void;
  onCounterDecrement: (widgetId: string) => void;
  renderWidgetIcon?: (iconType: CustomWidget['iconType'], color: string) => React.ReactNode;
  onNewsPress?: (url?: string) => void;
}

interface ItemLayout {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

type GridRow =
  | { type: 'wide'; widget: CustomWidget; index: number }
  | { type: 'pair'; left: CustomWidget; leftIdx: number; right?: CustomWidget; rightIdx?: number };

// Helper to resolve widget icons
function renderWidgetIcon(iconType: string, color: string) {
  const props = { size: 16, color };
  switch (iconType) {
    case 'weather':
      return <Cloud {...props} />;
    case 'battery':
      return <Battery {...props} />;
    case 'news':
      return <Newspaper {...props} />;
    case 'notes':
      return <FileText {...props} />;
    case 'counter':
      return <Hash {...props} />;
    case 'photo':
      return <Camera {...props} />;
    case 'ai':
      return <Sparkles {...props} />;
    case 'globe':
      return <Globe {...props} />;
    case 'security':
      return <Shield {...props} />;
    case 'telemetry':
      return <Activity {...props} />;
    case 'compute':
      return <Cpu {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'server':
    default:
      return <Server {...props} />;
  }
}

export function DraggableWidgetGrid({
  widgets,
  isOrganizeMode,
  onPressWidget,
  onReorder,
  onReorderWidgets,
  onToggleWidgetSize,
  onDuplicateWidget,
  onDeleteWidget,
  onMoveWidgetIndex,
  onCounterIncrement,
  onCounterDecrement,
  renderWidgetIcon: customRenderWidgetIcon,
  onNewsPress,
}: DraggableWidgetGridProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverTargetIndex, setHoverTargetIndex] = useState<number | null>(null);

  // Drag coordinates & scale animation
  const [pan] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  const [dragScale] = useState(() => new Animated.Value(1));
  const [dragOpacity] = useState(() => new Animated.Value(1));

  // Slot layout measurements
  const layoutsRef = useRef<{ [index: number]: ItemLayout }>({});
  const gridContainerRef = useRef<RNView>(null);
  const gridOriginRef = useRef<{ pageX: number; pageY: number }>({ pageX: 0, pageY: 0 });

  // Keep latest state in refs for callbacks
  const widgetsRef = useRef(widgets);
  const draggingIndexRef = useRef(draggingIndex);
  const hoverTargetIndexRef = useRef(hoverTargetIndex);
  const activeIndexRef = useRef<number | null>(null);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    draggingIndexRef.current = draggingIndex;
  }, [draggingIndex]);

  useEffect(() => {
    hoverTargetIndexRef.current = hoverTargetIndex;
  }, [hoverTargetIndex]);

  const calculateTargetIndex = useCallback((touchX: number, touchY: number) => {
    const layouts = layoutsRef.current;
    let closestIndex = draggingIndexRef.current;
    let minDistance = Infinity;

    for (const layout of Object.values(layouts)) {
      const centerX = layout.x + layout.width / 2;
      const centerY = layout.y + layout.height / 2;
      const dist = Math.hypot(touchX - centerX, touchY - centerY);

      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = layout.index;
      }
    }

    return closestIndex !== null && closestIndex !== undefined ? closestIndex : null;
  }, []);

  const handleContainerLayout = useCallback(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.measure((_x, _y, _width, _height, pageX, pageY) => {
        gridOriginRef.current = { pageX, pageY };
      });
    }
  }, []);

  const handleItemLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    layoutsRef.current[index] = { index, x, y, width, height };
  }, []);

  const handleEndDrag = useCallback((currentIndex: number) => {
    const targetIdx = hoverTargetIndexRef.current;
    const currentWidgets = widgetsRef.current;

    Animated.parallel([
      Animated.spring(dragScale, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        speed: 24,
      }),
      Animated.spring(dragOpacity, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: Platform.OS !== 'web',
        speed: 24,
      }),
    ]).start(() => {
      if (
        targetIdx !== null &&
        targetIdx !== undefined &&
        targetIdx !== currentIndex &&
        targetIdx >= 0 &&
        targetIdx < currentWidgets.length
      ) {
        const updated = [...currentWidgets];
        const [movedItem] = updated.splice(currentIndex, 1);
        updated.splice(targetIdx, 0, movedItem);
        const reorderFn = onReorder || onReorderWidgets;
        if (reorderFn) {
          reorderFn(updated);
        }
      }

      setDraggingIndex(null);
      setHoverTargetIndex(null);
    });
  }, [dragOpacity, dragScale, onReorder, onReorderWidgets, pan]);

  const [panResponder, setPanResponder] = useState<PanResponderInstance | null>(null);

  useEffect(() => {
    const pr = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        const itemIndex = activeIndexRef.current;
        if (itemIndex !== null) {
          setDraggingIndex(itemIndex);
          setHoverTargetIndex(itemIndex);
          pan.setValue({ x: 0, y: 0 });

          Animated.parallel([
            Animated.spring(dragScale, {
              toValue: 1.04,
              useNativeDriver: Platform.OS !== 'web',
              speed: 20,
              bounciness: 6,
            }),
            Animated.timing(dragOpacity, {
              toValue: 0.92,
              duration: 120,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        const origin = gridOriginRef.current;
        const touchX = (evt.nativeEvent.pageX || 0) - origin.pageX;
        const touchY = (evt.nativeEvent.pageY || 0) - origin.pageY;

        const target = calculateTargetIndex(touchX, touchY);
        if (target !== null) {
          setHoverTargetIndex(target);
        }
      },
      onPanResponderRelease: () => {
        const current = activeIndexRef.current;
        if (current !== null) {
          handleEndDrag(current);
        }
      },
      onPanResponderTerminate: () => {
        const current = activeIndexRef.current;
        if (current !== null) {
          handleEndDrag(current);
        }
      },
    });

    setPanResponder(pr);
  }, [calculateTargetIndex, dragOpacity, dragScale, handleEndDrag, pan]);

  // Group into pairs or wide rows
  const rows: GridRow[] = useMemo(() => {
    const list: GridRow[] = [];
    let i = 0;
    while (i < widgets.length) {
      const curr = widgets[i];
      if (curr.size === 'wide') {
        list.push({ type: 'wide', widget: curr, index: i });
        i++;
      } else {
        const left = curr;
        const leftIdx = i;
        const right = i + 1 < widgets.length && widgets[i + 1].size !== 'wide' ? widgets[i + 1] : undefined;
        const rightIdx = right ? i + 1 : undefined;
        list.push({ type: 'pair', left, leftIdx, right, rightIdx });
        i += right ? 2 : 1;
      }
    }
    return list;
  }, [widgets]);

  const renderOrganizeBar = (widget: CustomWidget, index: number) => (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      backgroundColor={pandraColors.surfaceElevated}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={radius.sm}
      borderWidth={1}
      borderColor={pandraColors.borderHighlight}
      marginBottom={6}
    >
      {/* Drag Grip Handle */}
      <RNView
        {...(panResponder ? panResponder.panHandlers : {})}
        onTouchStart={() => {
          activeIndexRef.current = index;
        }}
        style={styles.dragGrip}
      >
        <GripVertical size={14} color={pandraColors.primary} />
        <Text fontFamily={fonts.mono} fontSize={10} color={pandraColors.primary}>
          Drag #{index + 1}
        </Text>
      </RNView>

      <XStack gap={8} alignItems="center">
        {/* Move Up / Down */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={index === 0}
          onPress={() => onMoveWidgetIndex(index, 'up')}
          style={{ opacity: index === 0 ? 0.3 : 1 }}
        >
          <ChevronUp size={14} color={pandraColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={index === widgets.length - 1}
          onPress={() => onMoveWidgetIndex(index, 'down')}
          style={{ opacity: index === widgets.length - 1 ? 0.3 : 1 }}
        >
          <ChevronDown size={14} color={pandraColors.textSecondary} />
        </TouchableOpacity>

        {/* 1x1 / 2x1 Size Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleWidgetSize(widget.id)}
        >
          {widget.size === 'wide' ? (
            <Minimize2 size={13} color={pandraColors.textSecondary} />
          ) : (
            <Maximize2 size={13} color={pandraColors.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Clone */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onDuplicateWidget(widget)}
        >
          <Plus size={13} color={pandraColors.textSecondary} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onDeleteWidget(widget.id, widget.title)}
        >
          <Trash2 size={13} color={pandraColors.error} />
        </TouchableOpacity>
      </XStack>
    </XStack>
  );

  const renderTileCard = (widget: CustomWidget, index: number) => {
    const isThisDragging = draggingIndex === index;
    const isThisHoverTarget = hoverTargetIndex === index && draggingIndex !== null && !isThisDragging;

    return (
      <RNView
        key={`widget-slot-${widget.id}-${index}`}
        onLayout={(e) => handleItemLayout(index, e)}
        style={{ flex: widget.size === 'wide' ? undefined : 1 }}
      >
        {isOrganizeMode && renderOrganizeBar(widget, index)}

        {isThisHoverTarget && (
          <View
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            borderRadius={radius.md}
            borderWidth={1.5}
            borderColor={pandraColors.primary}
            borderStyle="dashed"
            backgroundColor="rgba(59, 130, 246, 0.08)"
            zIndex={10}
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily={fonts.mono} fontSize={11} color={pandraColors.primary}>
              Drop here
            </Text>
          </View>
        )}

        <Animated.View
          style={
            isThisDragging
              ? {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: dragScale },
                  ],
                  opacity: dragOpacity,
                  zIndex: 999,
                  shadowColor: pandraColors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.45,
                  shadowRadius: 16,
                  elevation: 16,
                }
              : undefined
          }
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => !isOrganizeMode && onPressWidget(widget)}
            onLongPress={() => {
              activeIndexRef.current = index;
              setDraggingIndex(index);
              setHoverTargetIndex(index);
            }}
            delayLongPress={220}
          >
            <WidgetTile
              widget={widget}
              icon={
                customRenderWidgetIcon
                  ? customRenderWidgetIcon(widget.iconType, widget.color)
                  : renderWidgetIcon(widget.iconType, widget.color)
              }
              onCounterIncrement={() => onCounterIncrement(widget.id)}
              onCounterDecrement={() => onCounterDecrement(widget.id)}
              onNewsPress={onNewsPress}
            />
          </TouchableOpacity>
        </Animated.View>
      </RNView>
    );
  };

  return (
    <RNView
      ref={gridContainerRef}
      onLayout={handleContainerLayout}
      style={styles.container}
    >
      <YStack gap={10}>
        {rows.map((row, rowIndex) => {
          if (row.type === 'wide') {
            return (
              <YStack key={`row-wide-${row.widget.id}-${rowIndex}`}>
                {renderTileCard(row.widget, row.index)}
              </YStack>
            );
          }

          return (
            <XStack key={`row-pair-${rowIndex}`} gap={10}>
              {renderTileCard(row.left, row.leftIdx)}
              {row.right ? (
                renderTileCard(row.right, row.rightIdx!)
              ) : (
                <View flex={1} />
              )}
            </XStack>
          );
        })}
      </YStack>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dragGrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    cursor: Platform.OS === 'web' ? ('grab' as any) : undefined,
  },
});
