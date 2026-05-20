import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ActivityEvent } from '@/contexts/activity-context';
import { useTheme } from '@/contexts/theme-context';

export function ActivityEventList({
  events,
  emptyTitle,
  emptyBody,
  title,
  subtitle,
}: {
  events: ActivityEvent[];
  emptyTitle: string;
  emptyBody: string;
  title?: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
      {title ? (
        <View style={styles.header}>
          <ThemedText type="title" style={{ color: colors.text, fontSize: 24 }}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={{ color: colors.textSecondary, marginTop: 4 }}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {!events.length ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="clock.arrow.circlepath" size={24} color={colors.textTertiary} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.text, marginTop: 10 }}>
            {emptyTitle}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {emptyBody}
          </ThemedText>
        </View>
      ) : (
        events.map((event) => {
          const icon = eventIcon(event.eventType);
          const iconColor =
            event.eventType === 'save_coin'
              ? colors.primary
              : event.eventType === 'unsave_coin'
                ? colors.warning
                : event.eventType === 'signed_in'
                  ? colors.success
                  : event.eventType === 'signed_out'
                    ? colors.danger
                    : colors.text;

          const onPress =
            event.entityType === 'coin'
              ? () => router.push({ pathname: '/coin' as any, params: { symbol: event.entityId } })
              : undefined;

          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              disabled={!onPress}
              onPress={onPress}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
                <IconSymbol name={icon} size={18} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.topRow}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text, flex: 1 }}>
                    {event.title || event.entityId}
                  </ThemedText>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 12 }}>
                    {formatRelativeTime(event.createdAt)}
                  </ThemedText>
                </View>
                {event.subtitle ? (
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>
                    {event.subtitle}
                  </ThemedText>
                ) : null}
              </View>
              {onPress ? <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} /> : null}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

function eventIcon(eventType: ActivityEvent['eventType']) {
  switch (eventType) {
    case 'save_coin':
      return 'bookmark.fill';
    case 'unsave_coin':
      return 'bookmark.slash';
    case 'signed_in':
      return 'person.crop.circle.badge.checkmark';
    case 'signed_out':
      return 'rectangle.portrait.and.arrow.right';
    case 'view_coin':
    default:
      return 'chart.line.uptrend.xyaxis';
  }
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 4,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
