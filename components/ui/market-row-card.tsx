import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { CoinChartRange } from '@/components/ui/coin-sparkline';
import { CoinSparkline } from '@/components/ui/coin-sparkline';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';

type MarketRowCardProps = {
  symbol: string;
  name: string;
  priceLabel: string;
  changeLabel: string;
  secondaryChangeLabel?: string;
  metricLabel?: string;
  metricValue?: string;
  badgeText?: string;
  coinId?: string;
  chartRange?: CoinChartRange;
  saved?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onToggleSaved?: () => void;
};

export function MarketRowCard({
  symbol,
  name,
  priceLabel,
  changeLabel,
  secondaryChangeLabel,
  metricLabel,
  metricValue,
  badgeText,
  coinId,
  chartRange = '24H',
  saved = false,
  dimmed = false,
  disabled = false,
  onPress,
  onToggleSaved,
}: MarketRowCardProps) {
  const { colors } = useTheme();
  const isPositive = !changeLabel.trim().startsWith('-');
  const changeColor = isPositive ? colors.success : colors.danger;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: dimmed ? 0.68 : 1,
        },
      ]}
    >
      <View style={styles.leftColumn}>
        <View style={styles.identityRow}>
          {badgeText ? (
            <View style={[styles.badge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                {badgeText}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.identityText}>
            <ThemedText style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
              {symbol}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {name}
            </ThemedText>
          </View>
        </View>

        {metricLabel && metricValue ? (
          <View style={[styles.metricPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.textTertiary, fontSize: 10, fontWeight: '700' }}>
              {metricLabel.toUpperCase()}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
              {metricValue}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.chartSection, dimmed && styles.dimmedChart]}>
        <CoinSparkline
          coinId={coinId}
          symbol={symbol}
          color={changeColor}
          width={78}
          height={30}
          range={chartRange}
          historyLimit={400}
        />
      </View>

      <View style={styles.rightSection}>
        <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 14, textAlign: 'right' }}>
          {priceLabel}
        </ThemedText>

        <View style={[styles.changePill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ThemedText style={{ color: changeColor, fontWeight: '700', fontSize: 12 }}>
            {changeLabel}
          </ThemedText>
        </View>

        {secondaryChangeLabel ? (
          <ThemedText style={{ color: changeColor, fontSize: 11, fontWeight: '600', textAlign: 'right' }}>
            {secondaryChangeLabel}
          </ThemedText>
        ) : null}
      </View>

      {onToggleSaved ? (
        <TouchableOpacity
          accessibilityLabel={saved ? `Remove ${symbol} from saved` : `Save ${symbol}`}
          onPress={onToggleSaved}
          style={[styles.saveButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <IconSymbol
            name={saved ? 'bookmark.fill' : 'bookmark'}
            size={17}
            color={saved ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 10,
  },
  leftColumn: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    minWidth: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartSection: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmedChart: {
    opacity: 0.48,
  },
  rightSection: {
    minWidth: 90,
    alignItems: 'flex-end',
    gap: 6,
  },
  changePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
