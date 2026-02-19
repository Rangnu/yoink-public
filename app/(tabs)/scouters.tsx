import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScoutersScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  
  const scouters = [
    { id: 1, name: 'Meme Rockets', active: true, matches: 12, lastRun: '5m ago', criteria: 'Meme coins +20% 24h, Volume > $5M' },
    { id: 2, name: 'Micro Caps', active: false, matches: 8, lastRun: '2h ago', criteria: 'MC < $20M, +15% 24h' },
    { id: 3, name: 'On-chain Volume Spikes', active: true, matches: 24, lastRun: '1m ago', criteria: 'DEX Vol 5x avg, Momentum +' },
    { id: 4, name: 'New L1/L2 Breakouts', active: true, matches: 6, lastRun: '10m ago', criteria: 'New listings, +10% 1h' },
    { id: 5, name: 'ETF Narrative', active: false, matches: 3, lastRun: '1d ago', criteria: 'BTC/ETH ecosystem coins + Flow' },
  ];

  const recentMatches = [
    { symbol: 'PEPE', scouter: 'Meme Rockets', change: '+24.3%', positive: true, time: '2m ago' },
    { symbol: 'WIF', scouter: 'On-chain Volume Spikes', change: '+18.7%', positive: true, time: '5m ago' },
    { symbol: 'BTC', scouter: 'New L1/L2 Breakouts', change: '+3.2%', positive: true, time: '12m ago' },
  ];

  const templates = [
    { id: 1, name: 'Meme Rush', description: 'Meme coins with volume + social buzz' },
    { id: 2, name: 'DeFi Momentum', description: 'DeFi tokens with rising TVL & price' },
    { id: 3, name: 'Whale Follows', description: 'Coins bought by top traders/whales' },
  ];
  
  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: colors.text }}>{t('ScoutersHeader')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('ScoutersSubtitle')}
        </ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        contentInsetAdjustmentBehavior="never"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 900);
            }}
            tintColor={colors.primary}
            title={t('RefreshTitle')}
            titleColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        )}
      >
        {/* Recent Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
              {t('RecentMatches')}
            </ThemedText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
            {recentMatches.map((match, idx) => (
              <TouchableOpacity key={idx} style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                  {match.symbol}
                </ThemedText>
                <ThemedText style={{ color: match.positive ? colors.success : colors.danger, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                  {match.change}
                </ThemedText>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10, marginTop: 6 }}>
                  {match.time}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <IconSymbol name="plus.circle.fill" size={20} color={colors.primaryText} />
          <ThemedText style={[styles.createButtonText, { color: colors.primaryText }]}>
            {t('CreateNewScouter')}
          </ThemedText>
        </TouchableOpacity>

        {/* Scouter Cards */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            {t('YourScouters')}
          </ThemedText>
          {scouters.map((scouter) => (
            <View key={scouter.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <IconSymbol name="scope" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                      {scouter.name}
                    </ThemedText>
                    <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
                      {t('LastRun')}: {scouter.lastRun}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: scouter.active ? colors.success : colors.border }]}>
                  <ThemedText style={[styles.statusText, { color: scouter.active ? colors.primaryText : colors.textTertiary }]}>
                    {scouter.active ? t('Active') : t('Paused')}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.criteriaBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 11 }}>
                  {scouter.criteria}
                </ThemedText>
              </View>
              <View style={styles.cardStats}>
                <View style={styles.stat}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={15} color={colors.primary} />
                  <ThemedText style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                    {scouter.matches} {t('MatchesToday')}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}>
                  <IconSymbol name="play.fill" size={13} color={colors.primary} />
                  <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                    {t('RunNow')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}>
                  <IconSymbol name="pencil" size={13} color={colors.text} />
                  <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                    {t('Edit')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
              {t('PopularTemplates')}
            </ThemedText>
          </View>
          {templates.map((template) => (
            <TouchableOpacity key={template.id} style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                  {template.name}
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {template.description}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  matchesScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  matchCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  criteriaBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardStats: {
    gap: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
});
