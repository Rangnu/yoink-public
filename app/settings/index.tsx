import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsIndexScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="gearshape.fill"
        eyebrow={t('Settings')}
        title={t('PlaceholderSettingsTitle')}
        description={t('SelectASetting')}
        bullets={[
          t('PlaceholderSettingsBullet1'),
          t('PlaceholderSettingsBullet2'),
          t('PlaceholderSettingsBullet3'),
        ]}
      />
    </SafeAreaView>
  );
}
