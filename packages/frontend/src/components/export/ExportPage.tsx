import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { getUser } from '../../lib/auth';

interface Grade {
  id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
}

export default function ExportPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const data = await api.get('/grades');
      setGrades(data);
      if (!isAdmin && user?.gradeId) {
        setSelectedGrade(user.gradeId);
        loadClasses(user.gradeId);
        if (user?.classId) {
          setSelectedClass(user.classId);
        }
      } else if (data.length > 0) {
        setSelectedGrade(data[0].id);
        loadClasses(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadClasses = async (gradeId: number) => {
    try {
      const data = await api.get(`/grades/${gradeId}/classes`);
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId);
    setSelectedClass(null);
    loadClasses(gradeId);
  };

  const handleExport = async (type: string) => {
    if (!selectedClass && type !== 'all' && type !== 'accounts' && type !== 'failed') return;
    setExporting(true);
    setError('');
    setSuccessMsg('');

    try {
      let filename = '';
      let endpoint = '';

      // Build grade+class name prefix
      const gradeName = grades.find(g => g.id === selectedGrade)?.name || '';
      const className = classes.find(c => c.id === selectedClass)?.name || '';
      const prefix = `${gradeName}${className}`;

      switch (type) {
        case 'attachment2':
          endpoint = `/export/attachment2/${selectedClass}`;
          filename = `${prefix}附件2.xlsx`;
          break;
        case 'attachment4':
          endpoint = `/export/attachment4/${selectedClass}`;
          filename = `${prefix}附件4.xlsx`;
          break;
        case 'all':
          if (!selectedGrade) return;
          endpoint = `/export/all/${selectedGrade}`;
          filename = `${gradeName}全部附件.zip`;
          break;
        case 'failed':
          endpoint = `/export/failed-records`;
          filename = '导入失败记录.xlsx';
          break;
        case 'accounts':
          endpoint = `/export/accounts`;
          filename = '账号列表.xlsx';
          break;
      }

      await api.download(endpoint, filename);
      setSuccessMsg(`导出成功: ${filename}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 dark:text-white font-headings">数据导出</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">导出成绩附件和其他数据</p>
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
        </div>
      )}

      {/* Target Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择年级</label>
          <select
            value={selectedGrade || ''}
            onChange={(e) => handleGradeChange(Number(e.target.value))}
            disabled={!isAdmin}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50"
          >
            <option value="">请选择年级</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择班级</label>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            disabled={!isAdmin && !!user?.classId}
            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50"
          >
            <option value="">请选择班级</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExportCard
          title="导出附件2"
          description="复制附件2模板并填入数据，B6开始填写学号，无测评学年列"
          disabled={!selectedClass || exporting}
          onClick={() => handleExport('attachment2')}
          icon="📊"
        />
        {isAdmin && (
          <>
            <ExportCard
              title="导出附件4"
              description="复制附件4模板并填入数据，A2开始填写，文本/数字按模板格式，无总分列"
              disabled={!selectedClass || exporting}
              onClick={() => handleExport('attachment4')}
              icon="📋"
            />
            <ExportCard
              title="导出全部附件(ZIP)"
              description="导出选定年级下所有班级的附件2和附件4，打包为ZIP"
              disabled={!selectedGrade || exporting}
              onClick={() => handleExport('all')}
              icon="📦"
            />
            <ExportCard
              title="导出导入失败记录"
              description="导出最近导入过程中未匹配到学生的记录"
              disabled={exporting}
              onClick={() => handleExport('failed')}
              icon="⚠️"
            />
            <ExportCard
              title="导出账号列表"
              description="导出所有班长账号信息（用户名、密码）"
              disabled={exporting}
              onClick={() => handleExport('accounts')}
              icon="🔑"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ExportCard({ title, description, disabled, onClick, icon }: {
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-200 disabled:hover:shadow-none group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div>
          <h3 className="font-medium text-neutral-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-headings">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
