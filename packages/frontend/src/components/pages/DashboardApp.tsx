import { useEffect, useState } from 'react';
import { isLoggedIn } from '../../lib/auth';
import Sidebar from '../layout/Sidebar';
import DashboardContent from '../dashboard/DashboardContent';

export default function DashboardApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}
