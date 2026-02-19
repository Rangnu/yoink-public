import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AppearanceScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { t } = useSettings();
  const themeOptions = [
    { value: 'light' as const, label: t('ThemeLight'), icon: 'sun.max.fill' as const },
    { value: 'dark' as const, label: t('ThemeDark'), icon: 'moon.fill' as const },
    { value: 'system' as const, label: t('ThemeSystem'), icon: 'gearshape.fill' as const },
  ];
  

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.section}>

        <View style={styles.previewRow}>
          <ThemePreview
            label={t('ThemeLight')}
            icon="sun.max.fill"
            palette={{
              background: '#FFFFFF',
              text: '#0F0F0F',
              surface: '#F5F7FA',
              border: '#E5E7EB',
              primary: '#00C805',
              primaryText: '#0A0A0A',
            }}
          />
          <ThemePreview
            label={t('ThemeDark')}
            icon="moon.fill"
            palette={{
              background: '#0B0D10',
              text: '#FFFFFF',
              surface: '#111418',
              border: 'rgba(255,255,255,0.08)',
              primary: '#00C805',
              primaryText: '#071A07',
            }}
          />
          <ThemePreview
            label={t('ThemeSystem')}
            icon="gearshape.fill"
            palette={{
              background: '#101114',
              text: '#EDEDED',
              surface: '#17181C',
              border: 'rgba(255,255,255,0.08)',
              primary: '#00C805',
              primaryText: '#062006',
            }}
          />
        </View>

        <View style={styles.row}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setTheme(option.value)}
              style={[styles.btn, { 
                backgroundColor: theme === option.value ? colors.primary : colors.surface,
                borderColor: theme === option.value ? colors.primary : colors.border,
              }]}
            >
              <IconSymbol name={option.icon} size={22} color={theme === option.value ? colors.primaryText : colors.text} />
              <ThemedText style={{ color: theme === option.value ? colors.primaryText : colors.text, fontWeight: theme === option.value ? '700' : '500' }}>{option.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
    </SafeAreaView>
  );
}

type Palette = {
  background: string;
  surface: string;
  border: string;
  text: string;
  primary: string;
  primaryText: string;
};

function ThemePreview({ label, icon, palette }: { label: string; icon: any; palette: Palette }) {
  return (
    <View style={[styles.previewCard, { backgroundColor: palette.background, borderColor: palette.border }]}> 
      <View style={[styles.previewHeader, { backgroundColor: palette.surface }]}> 
        <View style={[styles.previewIndicator, { backgroundColor: palette.primary }]} />
        <View style={[styles.previewIndicator, { backgroundColor: palette.primary, opacity: 0.5 }]} />
        <View style={[styles.previewIndicator, { backgroundColor: palette.primary, opacity: 0.25 }]} />
      </View>
      <View style={styles.previewBody}>
        <View style={[styles.previewTile, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.previewBadge, { backgroundColor: palette.primary }]} />
          <View style={[styles.previewLine, { backgroundColor: palette.text, opacity: 0.8 }]} />
          <View style={[styles.previewLine, { backgroundColor: palette.text, opacity: 0.5, width: '60%' }]} />
        </View>
        <View style={[styles.previewTile, { backgroundColor: palette.surface, borderColor: palette.border }]} />
      </View>
      <View style={styles.previewFooter}>
        <IconSymbol name={icon} size={14} color={palette.text} />
        <ThemedText style={{ color: palette.text, fontSize: 11, fontWeight: '600' }}>{label}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 },
  previewRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  previewCard: { flex: 1, borderWidth: 1, borderRadius: 12, overflow: 'hidden', minHeight: 130 },
  previewHeader: { height: 16, flexDirection: 'row', gap: 3, paddingHorizontal: 6, alignItems: 'center' },
  previewIndicator: { width: 8, height: 8, borderRadius: 4 },
  previewBody: { flex: 1, flexDirection: 'row', gap: 6, padding: 8 },
  previewTile: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 6, gap: 4 },
  previewBadge: { width: 10, height: 10, borderRadius: 5 },
  previewLine: { height: 4, borderRadius: 2 },
  previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center', gap: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: 16, marginBottom: 8 },
});
