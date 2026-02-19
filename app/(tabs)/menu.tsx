import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();
  const { t } = useSettings();
  const { user, signOut } = useAuth();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: 'sun.max.fill' as const },
    { value: 'dark' as const, label: 'Dark', icon: 'moon.fill' as const },
    { value: 'system' as const, label: 'System', icon: 'gearshape.fill' as const },
  ];

  const menuItems = [
    { id: 1, icon: 'creditcard', label: 'Subscription', section: 'account' },
    { id: 2, icon: 'chart.line.uptrend.xyaxis', label: 'Portfolio', section: 'features' },
    { id: 3, icon: 'bell.fill', label: 'Notifications', section: 'features' },
    { id: 4, icon: 'list.bullet.rectangle', label: 'Watchlists', section: 'features' },
  ];

  const supportItems = [
    { id: 1, icon: 'bubble.left', label: 'Help & Support' },
    { id: 2, icon: 'doc.text', label: 'Terms of Service' },
    { id: 3, icon: 'lock.fill', label: 'Privacy Policy' },
  ];

  return (
    <SafeAreaView edges={["top","left","right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <IconSymbol name="magnifyingglass" size={16} color={colors.textTertiary} />
          <TextInput
            placeholder={t('SettingsSearchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        {/* Account */}
        <View style={styles.section}>
          
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                }
              }}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                <IconSymbol name="person.fill" size={32} color={colors.primary} />
              </View>
              <View style={styles.accountInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 18 }}>
                    {user?.email || t('GuestUser')}
                  </ThemedText>
                  <View style={[styles.freeBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>{t('Free')}</ThemedText>
                  </View>
                </View>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                  {user?.email || 'guest@yoink.app'}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            {user && (
              <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.border }]} onPress={signOut}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color={colors.textSecondary} />
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Logout
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {/* Wallet Balance */}
            <View style={[styles.walletBalance, { backgroundColor: colors.surfaceElevated }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.coinIcon, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.primaryText} />
                  </View>
                  <View>
                    <ThemedText style={{ color: colors.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Balance')}</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 2 }}>
                      25
                    </ThemedText>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 11 }}>{t('Available')}</ThemedText>
                  <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>5 {t('AdsLeft')}</ThemedText>
                </View>
              </View>
            </View>

            {/* Coin Action Stats */}
            <View style={styles.statsRowInside}>
              <View style={[styles.statMiniInside, { backgroundColor: colors.surfaceElevated }]}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10 }}>{t('DailyClaim')}</ThemedText>
                <ThemedText style={{ color: colors.success, fontSize: 14, fontWeight: '700', marginTop: 2 }}>+4</ThemedText>
              </View>
              <View style={[styles.statMiniInside, { backgroundColor: colors.surfaceElevated }]}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10 }}>{t('PerAd')}</ThemedText>
                <ThemedText style={{ color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 2 }}>+3</ThemedText>
              </View>
              <View style={[styles.statMiniInside, { backgroundColor: colors.surfaceElevated }]}>
                <ThemedText style={{ color: colors.textTertiary, fontSize: 10 }}>{t('MaxPerDay')}</ThemedText>
                <ThemedText style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 }}>15</ThemedText>
              </View>
            </View>

            {/* Action Buttons Inside */}
            <View style={styles.actionButtonsInside}>
              <TouchableOpacity style={[styles.primaryButtonInside, { backgroundColor: colors.primary }]}>
                <IconSymbol name="gift.fill" size={16} color={colors.primaryText} />
                <ThemedText style={[styles.buttonTextSmall, { color: colors.primaryText }]}>
                  {t('ClaimDaily')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryButtonInside, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="play.rectangle.fill" size={16} color={colors.primary} />
                <ThemedText style={[styles.buttonTextSmall, { color: colors.primary }]}>
                  {t('WatchAndEarn')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol name="gearshape.fill" size={18} color={colors.text} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              {t('Settings')}
            </ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.push('/settings/appearance')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="paintbrush.fill" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Appearance')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings/language')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="globe" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Language')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings/currency')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="dollarsign.circle" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Currency')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                } else {
                  router.push('/settings/subscription');
                }
              }}
              style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="creditcard" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Subscription')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings/notifications')} style={styles.settingRow}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="bell.fill" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Notifications')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol name="person.crop.circle" size={18} color={colors.text} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              {t('Activity')}
            </ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                } else {
                  router.push('/activity/saved');
                }
              }}
              style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="bookmark.fill" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Saved')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                } else {
                  router.push('/activity/your-activity');
                }
              }}
              style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}> 
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="clock.fill" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('YourActivity')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                } else {
                  router.push('/portfolio');
                }
              }}
              style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }] }>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Portfolio')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!user) {
                  router.push('/auth/login');
                } else {
                  router.push('/watchlists');
                }
              }}
              style={styles.settingRow}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="list.bullet.rectangle" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('Watchlists')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol name="info.circle.fill" size={18} color={colors.text} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              {t('Support')}
            </ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.push('/support/report-problem')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="exclamationmark.bubble" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('ReportProblem')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/support/privacy-security')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="lock.fill" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('PrivacySecurityHelp')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/support/help-center')} style={styles.settingRow}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="questionmark.circle" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('HelpCenter')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol name="info.circle" size={18} color={colors.text} />
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}> 
              {t('About')}
            </ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.push('/about/privacy-policy')} style={[styles.settingRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="lock" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('PrivacyPolicy')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/about/terms-of-use')} style={styles.settingRow}>
              <View style={styles.themeOptionLeft}>
                <IconSymbol name="doc.text" size={20} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{t('TermsOfUse')}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ThemedText style={{ color: colors.textTertiary, fontSize: 12 }}>yoink v1.0.0</ThemedText>
          <ThemedText style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>Hype-aware. Signal-first.</ThemedText>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  walletBalance: {
    padding: 14,
    marginTop: 1,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRowInside: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  statMiniInside: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonsInside: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  primaryButtonInside: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryButtonInside: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  buttonTextSmall: {
    fontWeight: '600',
    fontSize: 13,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
});
