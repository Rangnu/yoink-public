import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CurrencyScreen() {
  const { colors } = useTheme();
  const { currency, setCurrency, t } = useSettings();
  const currencyOptions = [
    { value: 'USD' as const, label: 'USD', icon: 'dollarsign.circle' as const },
    { value: 'EUR' as const, label: 'EUR', icon: 'eurosign.circle' as const },
    { value: 'KRW' as const, label: 'KRW', icon: 'wonsign.circle' as const },
    { value: 'JPY' as const, label: 'JPY', icon: 'yensign.circle' as const },
    { value: 'CNY' as const, label: 'CNY', icon: 'yensign.circle.fill' as const },
  ];

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.section}>
        <View style={styles.chipRow}>
          {currencyOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setCurrency(opt.value)}
              style={[styles.chip, {
                backgroundColor: currency === opt.value ? colors.primary : colors.surface,
                borderColor: currency === opt.value ? colors.primary : colors.border,
              }]}
            >
              <IconSymbol name={opt.icon} size={18} color={currency === opt.value ? colors.primaryText : colors.text} />
              <ThemedText style={{ color: currency === opt.value ? colors.primaryText : colors.text, fontWeight: currency === opt.value ? '700' : '500' }}>{opt.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: 16, marginBottom: 8 },
});
