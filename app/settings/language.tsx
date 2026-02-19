import { StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { language, setLanguage, t } = useSettings();
  const languageOptions = [
    { value: 'en' as const, label: 'English', flag: '🇺🇸' },
    { value: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
    { value: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { value: 'it' as const, label: 'Italiano', flag: '🇮🇹' },
    { value: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { value: 'pl' as const, label: 'Polski', flag: '🇵🇱' },
    { value: 'pt' as const, label: 'Português', flag: '🇵🇹' },
    { value: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
    { value: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
    { value: 'id' as const, label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { value: 'ms' as const, label: 'Bahasa Melayu', flag: '🇲🇾' },
    { value: 'th' as const, label: 'ไทย', flag: '🇹🇭' },
    { value: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'ja' as const, label: '日本語', flag: '🇯🇵' },
    { value: 'ko' as const, label: '한국어', flag: '🇰🇷' },
    { value: 'zh' as const, label: '中文（简体）', flag: '🇨🇳' },
    { value: 'zh-Hant' as const, label: '中文（繁體）', flag: '🇹🇼' },
    { value: 'he' as const, label: 'עברית', flag: '🇮🇱' },
    { value: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.section}>
        <FlatList
          data={languageOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = language === item.value;
            return (
              <TouchableOpacity
                onPress={() => setLanguage(item.value)}
                style={[
                  styles.row,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : undefined,
                  },
                ]}
              >
                <View style={styles.rowLeft}>
                  <ThemedText style={styles.flag}>{item.flag}</ThemedText>
                  <ThemedText
                    style={{
                      color: isSelected ? colors.primaryText : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {item.label}
                  </ThemedText>
                </View>
                {isSelected ? (
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.primaryText} />
                ) : (
                  <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flag: { fontSize: 18 },
});
