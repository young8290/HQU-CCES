import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { getUser, type User } from '../../lib/auth';
import { AppLink } from '../../lib/router';

interface Stats {
  totalStudents: number;
  totalClasses: number;
  totalGrades: number;
  currentYear: string;
}

export default function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);

    const loadStats = async () => {
      try {
        const years = await api.get('/academic-years');
        const currentYear = years.find((y: any) => y.isCurrent);

        if (u?.role !== 'admin') {
          setStats({
            totalStudents: 0,
            totalClasses: 0,
            totalGrades: 0,
            currentYear: currentYear?.name || '未设置',
          });
          return;
        }

        const grades = await api.get('/grades');
        const gradeClasses = await Promise.all(
          grades.map((grade: any) => api.get(`/grades/${grade.id}/classes`)),
        );

        const totalClasses = gradeClasses.reduce(
          (sum: number, classes: any[]) => sum + classes.length,
          0,
        );
        const totalStudents = gradeClasses.reduce(
          (sum: number, classes: any[]) =>
            sum + classes.reduce(
              (classSum, cls) => classSum + (cls._count?.students || 0),
              0,
            ),
          0,
        );

        setStats({
          totalStudents,
          totalClasses,
          totalGrades: grades.length,
          currentYear: currentYear?.name || '未设置',
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400">加载中...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 dark:text-white font-headings">
          欢迎回来，{user?.displayName || user?.username}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          {isAdmin ? '管理员面板' : `${user?.gradeName || ''} ${user?.className || ''} 班长面板`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="当前学年" value={stats?.currentYear || '-'} icon="📅" color="primary" />
        {isAdmin && (
          <>
            <StatCard title="年级总数" value={stats?.totalGrades?.toString() || '0'} icon="🏫" color="blue" />
            <StatCard title="班级总数" value={stats?.totalClasses?.toString() || '0'} icon="📚" color="green" />
            <StatCard title="学生总数" value={stats?.totalStudents?.toString() || '0'} icon="👥" color="orange" />
          </>
        )}
        {!isAdmin && (
          <>
            <StatCard title="所属班级" value={user?.className || '-'} icon="📚" color="blue" />
            <StatCard title="角色" value="班长" icon="👤" color="green" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-headings mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="填写分数"
            description="进入分数编辑页面，支持实时保存"
            href="/scores"
            icon="📝"
          />
          <ActionCard
            title="导入数据"
            description={isAdmin ? '导入学业成绩、体育基础分' : '导入个人综测填写表'}
            href="/import"
            icon="📥"
          />
          {isAdmin && (
            <>
              <ActionCard
                title="导出附件"
                description="导出附件2和附件4"
                href="/export"
                icon="📤"
              />
              <ActionCard
                title="管理学生"
                description="添加、删除、编辑学生信息"
                href="/students"
                icon="👥"
              />
              <ActionCard
                title="生成账号"
                description="批量生成班长账号并导出"
                href="/accounts"
                icon="🔐"
              />
              <ActionCard
                title="系统设置"
                description="学年管理、修改密码"
                href="/settings"
                icon="⚙️"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-800',
    blue: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`rounded-2xl border p-6 ${colorClasses[color] || colorClasses.primary}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xl font-bold text-neutral-950 dark:text-white mt-1 font-headings">{value}</p>
    </div>
  );
}

function ActionCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <AppLink
      to={href}
      className="group flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-200"
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <h3 className="font-medium text-neutral-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-headings">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
      </div>
    </AppLink>
  );
}
