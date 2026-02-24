import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface UserAccount {
  id: number;
  username: string;
  displayName: string;
  role: string;
  grade?: { name: string } | null;
  class?: { name: string } | null;
  createdAt: string;
}

interface Grade {
  id: number;
  name: string;
}

export default function AccountsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
    loadGrades();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const data = await api.get('/grades');
      setGrades(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedGrade) return;
    setGenerating(true);
    setError('');
    try {
      const result = await api.post(`/users/generate-monitors/${selectedGrade}`, {});
      setGenerateResult(result);
      setShowGenerate(false);
      setSuccessMsg(`成功生成 ${Array.isArray(result) ? result.length : result.created} 个班长账号`);
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setError(err.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleResetPassword = async (userId: number, username: string) => {
    if (!confirm(`确定要重置 ${username} 的密码吗？`)) return;
    try {
      const result = await api.post(`/users/${userId}/reset-password`, {});
      setSuccessMsg(`密码已重置为: ${result.newPassword}`);
      setTimeout(() => setSuccessMsg(''), 10000);
    } catch (err: any) {
      setError(err.message || '重置失败');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`确定要删除用户 ${username} 吗？`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setSuccessMsg('用户已删除');
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const handleExportAccounts = async () => {
    try {
      await api.download('/export/accounts', '账号列表.xlsx');
      setSuccessMsg('导出成功');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || '导出失败');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">加载中...</div></div>;
  }

  const admins = users.filter((u) => u.role === 'admin');
  const monitors = users.filter((u) => u.role === 'monitor');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950 dark:text-white font-headings">账号管理</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">管理管理员和班长账号</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportAccounts}
            className="px-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            导出账号
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="px-4 py-2 text-sm rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            批量生成班长账号
          </button>
        </div>
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

      {/* Admin accounts */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-3">管理员账号 ({admins.length})</h2>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">用户名</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">显示名</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                  <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">{u.username}</td>
                  <td className="px-4 py-3 text-neutral-950 dark:text-white">{u.displayName}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{new Date(u.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monitor accounts */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-3">班长账号 ({monitors.length})</h2>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">用户名</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">显示名</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">年级</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">班级</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">{u.username}</td>
                  <td className="px-4 py-3 text-neutral-950 dark:text-white">{u.displayName}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{(u as any).class?.grade?.name || '-'}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{(u.class as any)?.name || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(u.id, u.username)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {monitors.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-400">暂无班长账号</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowGenerate(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-96 shadow-xl border border-neutral-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-4">批量生成班长账号</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              为选定年级下的每个班级自动生成一个班长账号。用户名格式: monitor_年级_班级名
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择年级</label>
              <select
                value={selectedGrade || ''}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">请选择年级</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowGenerate(false)} className="px-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">取消</button>
              <button
                onClick={handleGenerate}
                disabled={!selectedGrade || generating}
                className="px-4 py-2 text-sm rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {generating ? '生成中...' : '开始生成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
