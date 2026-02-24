import { useEffect, useState } from 'react';
import { isLoggedIn, getUser } from '../../lib/auth';
import Sidebar from '../layout/Sidebar';
import StudentsPage from '../students/StudentsPage';

export default function StudentsApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    const user = getUser();
    if (user?.role !== 'admin') { window.location.href = '/dashboard'; return; }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <StudentsPage />
        </div>
      </main>
    </div>
  );
}
