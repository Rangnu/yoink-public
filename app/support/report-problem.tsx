import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function ReportProblemScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="exclamationmark.bubble"
        eyebrow={t('ReportProblem')}
        title={t('PlaceholderReportTitle')}
        description={t('PlaceholderReportBody')}
        bullets={[
          t('PlaceholderReportBullet1'),
          t('PlaceholderReportBullet2'),
          t('PlaceholderReportBullet3'),
        ]}
        note={t('ReportProblem')}
      />
    </SafeAreaView>
  );
}
