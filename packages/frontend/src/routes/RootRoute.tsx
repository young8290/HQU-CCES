import { useEffect } from 'react';
import DashboardRoute from './DashboardRoute';
import LoginRoute from './LoginRoute';
import { usePageMeta } from '../hooks/usePageMeta';
import { isLoggedIn } from '../lib/auth';
import { navigateTo } from '../lib/router';

export default function RootRoute() {
  usePageMeta('综测填写系统');

  const targetPath = isLoggedIn() ? '/dashboard' : '/login';
  const TargetRoute = targetPath === '/dashboard' ? DashboardRoute : LoginRoute;

  useEffect(() => {
    navigateTo(targetPath, { replace: true });
  }, [targetPath]);

  return <TargetRoute />;
}
