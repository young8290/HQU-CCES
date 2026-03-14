import { type ReactNode, useEffect, useState } from 'react';
import { getUser, isLoggedIn } from '../../lib/auth';
import { navigateTo } from '../../lib/router';
import { usePageMeta } from '../../hooks/usePageMeta';
import ScreenState from '../common/ScreenState';
import Sidebar from './Sidebar';

interface AppShellProps {
  title: string;
  maxWidthClass: string;
  children: ReactNode;
  adminOnly?: boolean;
}

export default function AppShell({
  title,
  maxWidthClass,
  children,
  adminOnly = false,
}: AppShellProps) {
  const [ready, setReady] = useState(false);

  usePageMeta(title);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigateTo('/login', { replace: true });
      return;
    }

    const user = getUser();
    if (adminOnly && user?.role !== 'admin') {
      navigateTo('/dashboard', { replace: true });
      return;
    }

    setReady(true);
  }, [adminOnly]);

  if (!ready) {
    return <ScreenState label="页面加载中..." fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className={`mx-auto w-full p-6 lg:p-8 ${maxWidthClass}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
