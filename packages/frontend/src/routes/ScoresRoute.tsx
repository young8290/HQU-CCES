import AppShell from '../components/layout/AppShell';
import ScoresPage from '../components/scores/ScoresPage';

export default function ScoresRoute() {
  return (
    <AppShell title="分数填写 - 综测填写系统" maxWidthClass="max-w-7xl">
      <ScoresPage />
    </AppShell>
  );
}
