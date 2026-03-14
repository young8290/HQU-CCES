import { AppLink } from '../lib/router';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFoundRoute() {
  usePageMeta('404 - 页面未找到');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
      <div className="text-center rounded-3xl border border-neutral-200 bg-white/80 p-10 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <p className="font-headings text-7xl text-primary-500">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-950 dark:text-white">
          页面未找到
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          您访问的页面不存在，或链接已经失效。
        </p>
        <AppLink
          to="/login"
          className="mt-6 inline-flex rounded-2xl bg-primary-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          返回登录页
        </AppLink>
      </div>
    </div>
  );
}
