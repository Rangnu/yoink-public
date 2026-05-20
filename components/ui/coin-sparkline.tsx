import { supabase } from '@/utils/supabase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GestureResponderEvent, PointerEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect } from 'react-native-svg';

import { useTheme } from '@/contexts/theme-context';

export type CoinChartRange = '1H' | '24H' | '7D';

type CoinSparklineProps = {
  symbol: string;
  coinId?: string;
  color: string;
  width?: number;
  height?: number;
  historyLimit?: number;
  range?: CoinChartRange;
  variant?: 'line' | 'bar';
  interactive?: boolean;
  showArea?: boolean;
  showGrid?: boolean;
  showVolumeBars?: boolean;
  tooltipBackgroundColor?: string;
  tooltipTextColor?: string;
};

type SparklineDatum = {
  ts: string;
  price: number;
  volume24h: number | null;
};

const RANGE_TO_WINDOW_MS: Record<CoinChartRange, number> = {
  '1H': 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatTooltipPrice = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 6 })}`;

const formatTooltipTime = (value: string, range: CoinChartRange) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  if (range === '7D') {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
    });
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatCompactDollars = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return '--';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const getTargetPointCount = (range: CoinChartRange, width: number) => {
  if (range === '1H') return 24;
  if (range === '24H') return clamp(Math.floor(width / 3), 48, 120);
  return clamp(Math.floor(width / 4), 56, 100);
};

const downsampleSeries = (series: SparklineDatum[], maxPoints: number) => {
  if (series.length <= maxPoints) return series;

  const bucketSize = series.length / maxPoints;
  const sampled: SparklineDatum[] = [];

  for (let index = 0; index < maxPoints; index += 1) {
    const start = Math.floor(index * bucketSize);
    const end = Math.floor((index + 1) * bucketSize);
    const bucket = series.slice(start, Math.max(start + 1, end));
    if (!bucket.length) continue;

    const last = bucket[bucket.length - 1];
    const averagePrice = bucket.reduce((sum, point) => sum + point.price, 0) / bucket.length;
    const volumePoints = bucket.map((point) => point.volume24h).filter((value): value is number => value != null && Number.isFinite(value));
    const averageVolume = volumePoints.length
      ? volumePoints.reduce((sum, value) => sum + value, 0) / volumePoints.length
      : null;

    sampled.push({
      ts: last.ts,
      price: averagePrice,
      volume24h: averageVolume,
    });
  }

  const lastRawPoint = series[series.length - 1];
  const lastSamplePoint = sampled[sampled.length - 1];

  if (!lastSamplePoint || lastSamplePoint.ts !== lastRawPoint.ts) {
    sampled[sampled.length - 1] = lastRawPoint;
  }

  return sampled;
};

export function CoinSparkline({
  symbol,
  coinId,
  color,
  width = 50,
  height = 24,
  historyLimit = 2500,
  range = '24H',
  variant = 'line',
  interactive = false,
  showArea = false,
  showGrid = false,
  showVolumeBars = false,
  tooltipBackgroundColor = 'rgba(18, 18, 18, 0.96)',
  tooltipTextColor = '#FFFFFF',
}: CoinSparklineProps) {
  const { colors, resolvedTheme } = useTheme();
  const [rawSeries, setRawSeries] = useState<SparklineDatum[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const thresholdIso = useMemo(
    () => new Date(Date.now() - RANGE_TO_WINDOW_MS[range]).toISOString(),
    [range]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        let resolvedCoinId = coinId;

        if (!resolvedCoinId) {
          const upper = symbol.toUpperCase();

          const { data: coinRow, error: coinErr } = await supabase
            .from('coins')
            .select('id')
            .eq('symbol', upper)
            .limit(1)
            .maybeSingle();

          if (!active) return;

          if (coinErr || !coinRow?.id) {
            setRawSeries(null);
            return;
          }

          resolvedCoinId = coinRow.id as string;
        }

        const { data: snaps, error: snapErr } = await supabase
          .from('coin_snapshots')
          .select('ts, price_usd, volume_24h_usd')
          .eq('coin_id', resolvedCoinId)
          .gte('ts', thresholdIso)
          .order('ts', { ascending: true })
          .limit(historyLimit);

        if (!active) return;

        if (snapErr) {
          setRawSeries(null);
          return;
        }

        let parsed = (snaps ?? [])
          .map((row: any) => ({
            ts: String(row.ts ?? ''),
            price: row.price_usd != null ? Number(row.price_usd) : NaN,
            volume24h: row.volume_24h_usd != null ? Number(row.volume_24h_usd) : null,
          }))
          .filter((row) => row.ts && Number.isFinite(row.price));

        if (parsed.length < 2) {
          const { data: fallbackSnaps, error: fallbackErr } = await supabase
            .from('coin_snapshots')
            .select('ts, price_usd, volume_24h_usd')
            .eq('coin_id', resolvedCoinId)
            .order('ts', { ascending: false })
            .limit(Math.min(historyLimit, 72));

          if (!active) return;

          if (fallbackErr) {
            setRawSeries(null);
            return;
          }

          parsed = (fallbackSnaps ?? [])
            .map((row: any) => ({
              ts: String(row.ts ?? ''),
              price: row.price_usd != null ? Number(row.price_usd) : NaN,
              volume24h: row.volume_24h_usd != null ? Number(row.volume_24h_usd) : null,
            }))
            .filter((row) => row.ts && Number.isFinite(row.price))
            .reverse();
        }

        if (parsed.length < 2) {
          setRawSeries(null);
          return;
        }

        setRawSeries(parsed);
      } catch {
        if (!active) return;
        setRawSeries(null);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [coinId, historyLimit, symbol, thresholdIso]);

  const series = useMemo(() => {
    if (!rawSeries || rawSeries.length < 2) return null;
    return downsampleSeries(rawSeries, getTargetPointCount(range, width));
  }, [range, rawSeries, width]);

  useEffect(() => {
    if (!interactive || !series?.length) {
      setSelectedIndex(null);
      return;
    }

    setSelectedIndex(null);
  }, [interactive, series]);

  const metrics = useMemo(() => {
    if (!series || series.length < 2) return null;

    const priceTop = interactive ? 18 : 3;
    const bottomInset = interactive ? 8 : 4;
    const panelGap = showVolumeBars ? 12 : 0;
    const volumeHeight = showVolumeBars ? Math.max(24, Math.round((height - priceTop - bottomInset) * 0.22)) : 0;
    const availablePriceHeight = Math.max(1, height - priceTop - bottomInset - panelGap - volumeHeight);
    const priceHeight = interactive || showVolumeBars
      ? Math.max(36, availablePriceHeight)
      : availablePriceHeight;
    const priceBottom = priceTop + priceHeight;
    const volumeTop = priceBottom + panelGap;
    const volumeBottom = volumeTop + volumeHeight;
    const minPrice = Math.min(...series.map((point) => point.price));
    const maxPrice = Math.max(...series.map((point) => point.price));
    const priceRange = maxPrice - minPrice || 1;
    const volumeValues = series.map((point) => point.volume24h ?? 0);
    const maxVolume = Math.max(...volumeValues, 0);
    const stepX = series.length > 1 ? width / (series.length - 1) : width;
    const slotWidth = width / series.length;
    const priceBarWidth = Math.max(3, slotWidth * 0.58);
    const volumeBarWidth = Math.max(2, slotWidth * 0.52);

    const plotted = series.map((point, index) => {
      const x = series.length > 1 ? index * stepX : width / 2;
      const priceNormalized = (point.price - minPrice) / priceRange;
      const y = priceBottom - priceNormalized * priceHeight;
      const volumeNormalized = maxVolume > 0 && point.volume24h != null ? point.volume24h / maxVolume : 0;
      const volumeBarHeight = volumeNormalized * volumeHeight;

      return {
        ...point,
        x,
        y,
        volumeBarHeight,
      };
    });

    const linePoints = plotted.map((point) => `${point.x},${point.y}`).join(' ');
    const areaPoints = plotted.length
      ? `0,${priceBottom} ${linePoints} ${width},${priceBottom}`
      : '';

    return {
      priceTop,
      priceBottom,
      priceHeight,
      minPrice,
      maxPrice,
      maxVolume,
      volumeTop,
      volumeBottom,
      volumeHeight,
      panelGap,
      stepX,
      slotWidth,
      priceBarWidth,
      volumeBarWidth,
      plotted,
      linePoints,
      areaPoints,
    };
  }, [height, interactive, series, showVolumeBars, width]);

  const updateSelectionFromX = useCallback((rawX: number) => {
    if (!metrics || !series?.length) return;

    const safeX = clamp(rawX, 0, width);
    const nextIndex = variant === 'bar'
      ? Math.floor(safeX / metrics.slotWidth)
      : Math.round(safeX / metrics.stepX);

    setSelectedIndex(clamp(nextIndex, 0, series.length - 1));
  }, [metrics, series, variant, width]);

  const handlePointerEvent = useCallback((event: PointerEvent) => {
    updateSelectionFromX(event.nativeEvent.offsetX);
  }, [updateSelectionFromX]);

  const handleResponderEvent = useCallback((event: GestureResponderEvent) => {
    updateSelectionFromX(event.nativeEvent.locationX);
  }, [updateSelectionFromX]);

  if (!metrics || !series || series.length < 2) {
    return <View style={{ width, height }} />;
  }

  const selectedPoint = selectedIndex != null ? metrics.plotted[selectedIndex] : null;
  const selectedDeltaPct = selectedPoint && series[0]?.price
    ? ((selectedPoint.price - series[0].price) / series[0].price) * 100
    : 0;
  const tooltipWidth = interactive ? 156 : 0;
  const tooltipLeft = selectedPoint
    ? clamp(selectedPoint.x - tooltipWidth / 2, 8, Math.max(8, width - tooltipWidth - 8))
    : 0;
  const gridStroke = colors.border;
  const neutralBarFill = resolvedTheme === 'dark' ? colors.textTertiary : '#AEB7C8';
  const neutralVolumeFill = resolvedTheme === 'dark' ? '#3B4558' : '#D7DFEC';
  const selectionStroke = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(31,41,55,0.18)';

  return (
    <View style={[styles.container, { width, height: interactive ? height + 48 : height }]}>
      {interactive && selectedPoint ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: tooltipLeft,
              backgroundColor: tooltipBackgroundColor,
            },
          ]}
        >
          <Text style={[styles.tooltipPrice, { color: tooltipTextColor }]}>
            {formatTooltipPrice(selectedPoint.price)}
          </Text>
          <Text style={[styles.tooltipMeta, { color: tooltipTextColor }]}>
            {formatTooltipTime(selectedPoint.ts, range)}
          </Text>
          <Text
            style={[
              styles.tooltipMeta,
              {
                color: selectedDeltaPct >= 0 ? color : '#FF8A80',
                fontWeight: '700',
              },
            ]}
          >
            {selectedDeltaPct >= 0 ? '+' : ''}
            {selectedDeltaPct.toFixed(2)}%
          </Text>
          {showVolumeBars ? (
            <Text style={[styles.tooltipMeta, { color: tooltipTextColor }]}>
              24h vol {formatCompactDollars(selectedPoint.volume24h)}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Svg width={width} height={height}>
        {showGrid ? [0.2, 0.4, 0.6, 0.8].map((ratio) => {
          const y = metrics.priceTop + metrics.priceHeight * ratio;
          return (
            <Line
              key={ratio}
              x1="0"
              y1={y}
              x2={width}
              y2={y}
              stroke={gridStroke}
              opacity={resolvedTheme === 'dark' ? 0.45 : 0.55}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          );
        }) : null}

        {showVolumeBars ? (
          <>
            <Line
              x1="0"
              y1={metrics.volumeTop - metrics.panelGap / 2}
              x2={width}
              y2={metrics.volumeTop - metrics.panelGap / 2}
              stroke={gridStroke}
              opacity={resolvedTheme === 'dark' ? 0.5 : 0.7}
              strokeWidth={1}
            />
            {metrics.plotted.map((point, index) => {
              const volumeX = index * metrics.slotWidth + (metrics.slotWidth - metrics.volumeBarWidth) / 2;
              const isSelected = selectedIndex === index;

              return (
                <Rect
                  key={`volume-${point.ts}-${index}`}
                  x={volumeX}
                  y={metrics.volumeBottom - point.volumeBarHeight}
                  width={metrics.volumeBarWidth}
                  height={Math.max(2, point.volumeBarHeight)}
                  rx={Math.min(3, metrics.volumeBarWidth / 2)}
                  fill={isSelected ? neutralBarFill : neutralVolumeFill}
                  opacity={isSelected ? (resolvedTheme === 'dark' ? 0.95 : 0.9) : resolvedTheme === 'dark' ? 0.85 : 1}
                />
              );
            })}
          </>
        ) : null}

        {variant === 'bar'
          ? metrics.plotted.map((point, index) => {
            const barHeight = Math.max(2, metrics.priceBottom - point.y);
            const barX = index * metrics.slotWidth + (metrics.slotWidth - metrics.priceBarWidth) / 2;
            const isSelected = selectedIndex === index;

            return (
              <Rect
                key={`price-${point.ts}-${index}`}
                x={barX}
                y={metrics.priceBottom - barHeight}
                width={metrics.priceBarWidth}
                height={barHeight}
                rx={Math.min(4, metrics.priceBarWidth / 2)}
                fill={isSelected ? color : neutralBarFill}
                opacity={isSelected ? 1 : resolvedTheme === 'dark' ? 0.8 : 0.95}
              />
            );
          })
          : (
            <>
              {showArea && metrics.areaPoints ? (
                <Polygon points={metrics.areaPoints} fill={color} opacity={0.12} />
              ) : null}
              <Polyline points={metrics.linePoints} stroke={color} strokeWidth={2.4} fill="none" />
            </>
          )}

        {selectedPoint ? (
          <>
            <Line
              x1={selectedPoint.x}
              y1={metrics.priceTop}
              x2={selectedPoint.x}
              y2={metrics.priceBottom}
              stroke={selectionStroke}
              strokeDasharray="4 4"
              strokeWidth={1}
            />

            {variant === 'line' ? (
              <>
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r={5} fill={color} />
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r={2.5} fill="#FFFFFF" />
              </>
            ) : null}
          </>
        ) : null}
      </Svg>

      {interactive ? (
        <View
          style={StyleSheet.absoluteFill}
          onPointerDown={handlePointerEvent}
          onPointerEnter={handlePointerEvent}
          onPointerMove={handlePointerEvent}
          onPointerLeave={() => setSelectedIndex(null)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleResponderEvent}
          onResponderMove={handleResponderEvent}
          onResponderRelease={() => setSelectedIndex(null)}
          onResponderTerminate={() => setSelectedIndex(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 156,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tooltipPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  tooltipMeta: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.92,
  },
});
