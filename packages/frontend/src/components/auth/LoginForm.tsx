import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isLoggedIn, clearAuth } from '../../lib/auth';
import { navigateTo } from '../../lib/router';

export default function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 页面加载时：如果有有效token则跳转，否则清除过期的旧token
  useEffect(() => {
    if (isLoggedIn()) {
      // 验证token是否有效
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(res => {
        if (res.ok) {
          navigateTo('/dashboard', { replace: true });
        } else {
          clearAuth();
        }
      }).catch(() => {
        clearAuth();
      });
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigateTo('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8 animate-fadeUp">
          <img src="/学院logo.png" alt="学院logo" width="64" height="64" decoding="async" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-neutral-950 dark:text-white font-headings">
            综测填写系统
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            计算机科学与技术学院
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 font-headings">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 font-headings">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center mt-6 gap-2">
          <img src="/学术部logo.png" alt="学术部logo" width="40" height="40" decoding="async" className="w-10 h-10 object-contain opacity-70" />
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            © 2025-2026 计算机科学与技术学院 学术部
          </p>
        </div>
      </div>
    </div>
  );
}
