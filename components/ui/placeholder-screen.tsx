import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export function PlaceholderScreen({
  icon,
  eyebrow,
  title,
  description,
  bullets = [],
  note,
}: {
  icon: any;
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  note?: string;
}) {
  const { colors } = useTheme();
  const { t } = useSettings();

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <IconSymbol name={icon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <ThemedText style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 19, marginTop: eyebrow ? 6 : 0 }}>
            {title}
          </ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
            {description}
          </ThemedText>
        </View>
      </View>

      {bullets.length ? (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{t('PlaceholderWhatBelongsHere')}</ThemedText>
          <View style={styles.bulletList}>
            {bullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <IconSymbol name="checkmark.seal.fill" size={14} color={colors.success} />
                <ThemedText style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>
                  {bullet}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {note ? (
        <View style={[styles.noteCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ThemedText style={{ color: colors.textSecondary, lineHeight: 20 }}>
            {note}
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  bulletList: {
    marginTop: 12,
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
});
