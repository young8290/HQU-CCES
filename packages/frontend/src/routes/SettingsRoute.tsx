import AppShell from '../components/layout/AppShell';
import SettingsPage from '../components/settings/SettingsPage';

export default function SettingsRoute() {
  return (
    <AppShell title="系统设置 - 综测填写系统" maxWidthClass="max-w-5xl">
      <SettingsPage />
    </AppShell>
  );
}
