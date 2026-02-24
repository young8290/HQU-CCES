import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { getUser, clearAuth } from '../../lib/auth';

interface AcademicYear {
  id: number;
  name: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [newYearName, setNewYearName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      const data = await api.get('/academic-years');
      setYears(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async () => {
    if (!newYearName.trim()) return;
    setError('');
    try {
      await api.post('/academic-years', { name: newYearName });
      setNewYearName('');
      setSuccessMsg('学年创建成功');
      await loadYears();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || '创建失败');
    }
  };

  const handleActivateYear = async (yearId: number) => {
    try {
      await api.put(`/academic-years/${yearId}/activate`, {});
      setSuccessMsg('学年已激活');
      await loadYears();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || '激活失败');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少6个字符');
      return;
    }
    setError('');
    try {
      await api.put('/auth/password', { oldPassword, newPassword });
      setSuccessMsg('密码修改成功，请重新登录');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        clearAuth();
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || '修改失败');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">加载中...</div></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 dark:text-white font-headings">系统设置</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">管理学年和账号安全</p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Academic Year Management */}
      {isAdmin && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-4">学年管理</h2>

          {/* Current years list */}
          <div className="space-y-2 mb-4">
            {years.map((year) => (
              <div
                key={year.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  year.isCurrent
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-neutral-950 dark:text-white font-medium">{year.name}</span>
                  {year.isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300">
                      当前学年
                    </span>
                  )}
                </div>
                {!year.isCurrent && (
                  <button
                    onClick={() => handleActivateYear(year.id)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800"
                  >
                    设为当前
                  </button>
                )}
              </div>
            ))}
            {years.length === 0 && (
              <div className="text-neutral-400 text-sm">暂无学年，请创建</div>
            )}
          </div>

          {/* Add new year */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="学年名称，如：2025-2026学年"
            />
            <button
              onClick={handleCreateYear}
              className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm hover:bg-primary-600 transition-colors"
            >
              创建
            </button>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-4">修改密码</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">当前密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <button
            onClick={handleChangePassword}
            className="px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
          >
            修改密码
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-4">账号信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500">用户名</span>
            <span className="text-neutral-950 dark:text-white font-mono">{user?.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500">显示名</span>
            <span className="text-neutral-950 dark:text-white">{user?.displayName}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-500">角色</span>
            <span className="text-neutral-950 dark:text-white">{user?.role === 'admin' ? '管理员' : '班长'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
