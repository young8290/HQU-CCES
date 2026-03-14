import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route render failed:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
          <h1 className="text-2xl font-semibold text-neutral-950 dark:text-white font-headings">
            页面加载失败
          </h1>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            可能是页面资源刚更新，当前标签页仍在使用旧缓存。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex rounded-2xl bg-primary-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            重新加载页面
          </button>
        </div>
      </div>
    );
  }
}
