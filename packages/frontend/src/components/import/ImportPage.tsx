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

interface ImportLog {
  id: number;
  type: string;
  filename: string | null;
  successCount: number;
  failCount: number;
  failDetails: string | null;
  createdAt: string;
}

const IMPORT_TYPES = [
  { value: 'academic', label: '学业成绩', description: '导入教务系统导出的成绩表（F列GPA）', adminOnly: true },
  { value: 'sports', label: '体育基础分', description: '导入体育成绩表（H列体育成绩）', adminOnly: true },
  { value: 'personal', label: '个人综测填写表', description: '导入班级同学的个人综测填写表', adminOnly: false },
];

export default function ImportPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [importType, setImportType] = useState<string>('academic');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadGrades();
    loadLogs();
  }, []);

  const loadGrades = async () => {
    try {
      const data = await api.get('/grades');
      setGrades(data);
      if (!isAdmin && user?.gradeId) {
        setSelectedGrade(user.gradeId);
        loadClasses(user.gradeId);
        setImportType('personal');
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
      if (!isAdmin && user?.classId) {
        setSelectedClass(user.classId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await api.get('/import/logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrade(gradeId);
    setSelectedClass(null);
    loadClasses(gradeId);
  };

  const handleImport = async () => {
    if (importType === 'personal') {
      // Personal import: use folder/multiple files
      if (files.length === 0) return;
      if (!selectedClass) return;
    } else {
      if (!file) return;
    }
    setUploading(true);
    setError('');
    setResult(null);

    try {
      let endpoint = '';
      switch (importType) {
        case 'academic':
          endpoint = '/import/academic';
          break;
        case 'sports':
          endpoint = '/import/sports';
          break;
        case 'personal':
          endpoint = `/import/personal/${selectedClass}`;
          break;
      }

      let data;
      if (importType === 'personal') {
        data = await api.uploadMultiple(endpoint, files, 'files');
      } else {
        data = await api.upload(endpoint, file!);
      }
      setResult(data);
      setFile(null);
      setFiles([]);
      await loadLogs();
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setUploading(false);
    }
  };

  const availableTypes = IMPORT_TYPES.filter((t) => isAdmin || !t.adminOnly);

  // academic/sports imports don't need class selection
  const needsClassSelection = importType === 'personal';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 dark:text-white font-headings">数据导入</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">导入Excel文件中的成绩数据</p>
      </div>

      {/* Import Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setImportType(t.value)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              importType === t.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300'
            }`}
          >
            <div className="font-medium text-neutral-950 dark:text-white">{t.label}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.description}</div>
          </button>
        ))}
      </div>

      {/* Target Selection - only for personal import */}
      {needsClassSelection && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择年级</label>
            <select
              value={selectedGrade || ''}
              onChange={(e) => handleGradeChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">请选择年级</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
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
      )}

      {/* File upload */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
        <div className="space-y-4">
          {importType === 'personal' ? (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择文件夹（包含全班同学的综测填写表）</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              {...({ webkitdirectory: '', directory: '' } as any)}
              multiple
              onChange={(e) => {
                const allFiles = Array.from(e.target.files || []);
                const excelFiles = allFiles.filter(f => /\.(xlsx|xls)$/i.test(f.name));
                setFiles(excelFiles);
                setFile(null);
              }}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400"
            />
            {files.length > 0 && (
              <p className="mt-2 text-xs text-primary-600 dark:text-primary-400">
                已选择 {files.length} 个Excel文件
              </p>
            )}
          </div>
          ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">选择文件</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400"
            />
          </div>
          )}

          {/* Import type specific tips */}
          <div className="text-xs text-neutral-400 dark:text-neutral-500 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            {importType === 'academic' && (
              <div>
                <strong>学业成绩导入说明：</strong>
                <br />• 读取F列（GPA）数据
                <br />• 自动计算学业学术素质分 = (GPA + 2.5) × 8
                <br />• 按学号自动匹配全部学生，无需选择年级班级
              </div>
            )}
            {importType === 'sports' && (
              <div>
                <strong>体育基础分导入说明：</strong>
                <br />• 读取H列（体育成绩）数据
                <br />• 自动计算体育基础分 = 原始分 × 0.04
                <br />• 按学号自动匹配全部学生，无需选择年级班级
              </div>
            )}
            {importType === 'personal' && (
              <div>
                <strong>个人综测填写表导入说明：</strong>
                <br />• 选择包含全班同学综测表的文件夹，自动导入全部Excel文件
                <br />• 每个文件的每个工作表对应一个学生
                <br />• B1=学号, D1=姓名, B3-H3=各项分数, B4-H4=备注
                <br />• 列顺序: 德育(100) / 创新(13) / 体育附加(3) / 美育(6) / 劳动(4) / 公益(10) / 附加(5)
                <br />• 不匹配的学生会记录在失败列表中
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={(importType === 'personal' ? files.length === 0 : !file) || (needsClassSelection && !selectedClass) || uploading}
            className="px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '导入中...' : '开始导入'}
          </button>
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-500/10 p-6">
          <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">导入结果</h3>
          <div className="space-y-1 text-sm text-green-600 dark:text-green-400">
            <p>成功: {result.successCount ?? 0} 条</p>
            {(result.failCount ?? 0) > 0 && <p className="text-red-500">失败: {result.failCount} 条</p>}
            {result.failures?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-red-500">失败记录:</p>
                <ul className="list-disc pl-5 mt-1 text-red-500">
                  {result.failures.slice(0, 20).map((r: any, i: number) => (
                    <li key={i}>{r.studentNo || r.name}: {r.reason}</li>
                  ))}
                  {result.failures.length > 20 && (
                    <li>...还有 {result.failures.length - 20} 条</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Logs */}
      <div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
        >
          {showLogs ? '隐藏' : '查看'}导入历史 ({logs.length})
        </button>
        {showLogs && logs.length > 0 && (
          <div className="mt-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <th className="px-4 py-2 text-left text-neutral-600 dark:text-neutral-300">时间</th>
                  <th className="px-4 py-2 text-left text-neutral-600 dark:text-neutral-300">类型</th>
                  <th className="px-4 py-2 text-left text-neutral-600 dark:text-neutral-300">成功</th>
                  <th className="px-4 py-2 text-left text-neutral-600 dark:text-neutral-300">失败</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="px-4 py-2 text-neutral-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">{log.type}</td>
                    <td className="px-4 py-2 text-green-600">{log.successCount}</td>
                    <td className="px-4 py-2 text-red-500">{log.failCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
