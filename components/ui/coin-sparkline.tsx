import { supabase } from '@/utils/supabase';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

type CoinSparklineProps = {
  symbol: string;
  color: string;
  width?: number;
  height?: number;
};

export function CoinSparkline({ symbol, color, width = 50, height = 24 }: CoinSparklineProps) {
  const [points, setPoints] = useState<number[] | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const upper = symbol.toUpperCase();

        const { data: coinRows, error: coinErr } = await supabase
          .from('coins')
          .select('id')
          .eq('symbol', upper)
          .limit(1);

        if (!active) return;

        if (coinErr || !coinRows || coinRows.length === 0) {
          setPoints(null);
          return;
        }

        const coinId = coinRows[0].id as string;

        const { data: snaps, error: snapErr } = await supabase
          .from('coin_snapshots')
          .select('ts, price_usd')
          .eq('coin_id', coinId)
          .order('ts', { ascending: true })
          .limit(36); // last ~3h at 5m cadence

        if (!active) return;

        if (snapErr || !snaps || snaps.length < 2) {
          setPoints(null);
          return;
        }

        const prices = snaps
          .map((row: any) => (row.price_usd != null ? Number(row.price_usd) : NaN))
          .filter((v) => Number.isFinite(v));

        if (prices.length < 2) {
          setPoints(null);
          return;
        }

        setPoints(prices);
      } catch (err) {
        if (!active) return;
        setPoints(null);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [symbol]);

  if (!points || points.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const pathPoints = points
    .map((p, i) => {
      const x = i * stepX;
      const yNorm = (p - min) / range;
      const y = height - yNorm * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={pathPoints}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
    </View>
  );
}
