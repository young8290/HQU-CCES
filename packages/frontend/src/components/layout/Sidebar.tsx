import { useState, useEffect } from 'react';
import { getUser, clearAuth, type User } from '../../lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: '仪表盘', href: '/dashboard', icon: '📊' },
  { name: '分数管理', href: '/scores', icon: '📝' },
  { name: '学生管理', href: '/students', icon: '👥', adminOnly: true },
  { name: '数据导入', href: '/import', icon: '📥' },
  { name: '附件导出', href: '/export', icon: '📤', adminOnly: true },
  { name: '账号管理', href: '/accounts', icon: '🔐', adminOnly: true },
  { name: '系统设置', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    const u = getUser();
    if (!u) {
      window.location.href = '/login';
      return;
    }
    setUser(u);
  }, []);

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 text-white text-sm font-bold">综</span>
            <span className="font-headings font-medium text-neutral-950 dark:text-white text-sm">综测管理系统</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive = currentPath.startsWith(item.href);
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-neutral-950 dark:text-white truncate">
              {user.displayName || user.username}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {user.role === 'admin' ? '管理员' : user.className || '班长'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <span>🚪</span>
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
