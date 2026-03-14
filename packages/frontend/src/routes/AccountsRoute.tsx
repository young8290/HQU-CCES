import AccountsPage from '../components/accounts/AccountsPage';
import AppShell from '../components/layout/AppShell';

export default function AccountsRoute() {
  return (
    <AppShell
      title="账号管理 - 综测填写系统"
      maxWidthClass="max-w-6xl"
      adminOnly
    >
      <AccountsPage />
    </AppShell>
  );
}
