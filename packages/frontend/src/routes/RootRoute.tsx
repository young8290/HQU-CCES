import { useEffect } from 'react';
import ScreenState from '../components/common/ScreenState';
import { usePageMeta } from '../hooks/usePageMeta';
import { isLoggedIn } from '../lib/auth';
import { navigateTo } from '../lib/router';

export default function RootRoute() {
  usePageMeta('综测填写系统');

  useEffect(() => {
    navigateTo(isLoggedIn() ? '/dashboard' : '/login', { replace: true });
  }, []);

  return <ScreenState label="跳转中..." fullScreen />;
}
