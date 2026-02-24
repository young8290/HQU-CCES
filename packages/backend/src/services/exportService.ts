import prisma from '../config/database.js';
import ExcelJS from 'exceljs';
import * as scoreService from './scoreService.js';
import { SCORE_CATEGORIES } from '../config/scoreRules.js';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Writable } from 'stream';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// templates/ 在项目根目录: packages/backend/src/services/ -> 往上4级到项目根
const TEMPLATE_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'templates');

export async function exportAttachment2(classId: number, academicYearId: number): Promise<Buffer> {
  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { grade: true },
  });
  if (!cls || !academicYear) throw new Error('班级或学年不存在');

  const students = await scoreService.getScoresByClass(classId, academicYearId);

  // Copy template file then fill data
  const workbook = new ExcelJS.Workbook();
  const templatePath = path.join(TEMPLATE_DIR, '附件2_template.xlsx');
  if (fs.existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  } else {
    throw new Error('附件2模板文件不存在，请将模板放入 templates/附件2_template.xlsx');
  }

  const sheet = workbook.worksheets[0];

  // Fill Row 2: Update academic year in title (merged A2:L2)
  sheet.getCell('A2').value = `华侨大学学生综合素质测评成绩汇总表（${academicYear.name}）`;

  // Fill Row 3: 专业/年级/班级/学生总数 (merged A3:L3)
  const majorName = cls.name.replace(/\d+班$/, '').trim();
  sheet.getCell('A3').value = {
    richText: [
      { text: '学院(盖章）' },
      { text: '          ' },
      { text: '专业' },
      { text: ` ${majorName} ` },
      { text: '  年级' },
      { text: ` ${cls.grade.name} ` },
      { text: ' 班级' },
      { text: ` ${cls.name} ` },
      { text: ' 学生总数' },
      { text: ` ${students.length} ` },
      { text: ' 人' },
    ],
  };

  // 附件2列布局(无测评学年列):
  // A=班级排名, B=学号, C=姓名, D=德育测评(100), E=学业学术素质(60),
  // F=创新与实践能力(13), G=体育(7), H=美育(6), I=劳动教育(4),
  // J=公益服务与社会工作(10), K=附加分(5), L=总分
  // 数据从第6行开始(B6=第一个人的学号)
  const startRow = 6;
  students.forEach((student, index) => {
    const row = sheet.getRow(startRow + index);
    row.getCell(1).value = index + 1;                             // A: 班级排名
    row.getCell(2).value = String(student.studentNo);             // B: 学号(文本)
    row.getCell(3).value = student.name;                          // C: 姓名
    row.getCell(4).value = student.scores.moral?.value || 0;      // D: 德育测评
    row.getCell(5).value = student.scores.academic?.value || 0;   // E: 学业学术素质
    row.getCell(6).value = student.scores.innovation?.value || 0; // F: 创新与实践能力
    row.getCell(7).value = student.scores.sports_total?.value || 0; // G: 体育
    row.getCell(8).value = student.scores.aesthetics?.value || 0; // H: 美育
    row.getCell(9).value = student.scores.labor?.value || 0;      // I: 劳动教育
    row.getCell(10).value = student.scores.public_service?.value || 0; // J: 公益服务
    row.getCell(11).value = student.scores.bonus?.value || 0;     // K: 附加分
    row.getCell(12).value = student.scores.total?.value || 0;     // L: 总分
    row.commit();
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportAttachment4(classId: number, academicYearId: number): Promise<Buffer> {
  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { grade: true },
  });
  if (!cls || !academicYear) throw new Error('班级或学年不存在');

  const students = await scoreService.getScoresByClass(classId, academicYearId);

  // Copy template file then fill data
  const workbook = new ExcelJS.Workbook();
  const templatePath = path.join(TEMPLATE_DIR, '附件4_template.xlsx');
  if (fs.existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  } else {
    throw new Error('附件4模板文件不存在，请将模板放入 templates/附件4_template.xlsx');
  }

  const sheet = workbook.worksheets[0];

  // 附件4列布局(无总分列, 11列):
  // A=测评学年(文本), B=学号(文本), C=姓名(文本),
  // D=德育测评(数字,100), E=学业学术素质(数字,60), F=创新与实践能力(数字,13),
  // G=体育(数字,7), H=美育(数字,6), I=劳动教育(数字,4),
  // J=公益服务与社会工作(数字,10), K=附加分(数字,5)
  // 数据从A2开始(第一个人的测评学年)
  const startRow = 2;
  students.forEach((student, index) => {
    const row = sheet.getRow(startRow + index);
    // 文本格式列 (A, B, C)
    row.getCell(1).value = String(academicYear.name);             // A: 测评学年(文本)
    row.getCell(2).value = String(student.studentNo);             // B: 学号(文本)
    row.getCell(3).value = String(student.name);                  // C: 姓名(文本)
    // 数字格式列 (D-K)
    row.getCell(4).value = student.scores.moral?.value || 0;      // D: 德育测评(数字,100分)
    row.getCell(5).value = student.scores.academic?.value || 0;   // E: 学业学术素质(数字,60分)
    row.getCell(6).value = student.scores.innovation?.value || 0; // F: 创新与实践能力(数字,13分)
    row.getCell(7).value = student.scores.sports_total?.value || 0; // G: 体育(数字,7分)
    row.getCell(8).value = student.scores.aesthetics?.value || 0; // H: 美育(数字,6分)
    row.getCell(9).value = student.scores.labor?.value || 0;      // I: 劳动教育(数字,4分)
    row.getCell(10).value = student.scores.public_service?.value || 0; // J: 公益服务(数字,10分)
    row.getCell(11).value = student.scores.bonus?.value || 0;     // K: 附加分(数字,5分)
    row.commit();
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportAllAttachments(
  options: { gradeId?: number; classId?: number },
  academicYearId: number
): Promise<Buffer> {
  let classes: Array<{ id: number; name: string; grade: { name: string } }>;

  if (options.classId) {
    const cls = await prisma.class.findUnique({
      where: { id: options.classId },
      include: { grade: true },
    });
    classes = cls ? [cls] : [];
  } else if (options.gradeId) {
    classes = await prisma.class.findMany({
      where: { gradeId: options.gradeId },
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  } else {
    classes = await prisma.class.findMany({
      include: { grade: true },
      orderBy: [{ grade: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  // Create ZIP archive
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    (async () => {
      for (const cls of classes) {
        const folderName = `${cls.grade.name}_${cls.name}_综测表`;
        
        try {
          const att2 = await exportAttachment2(cls.id, academicYearId);
          archive.append(att2, { name: `${folderName}/${cls.grade.name}${cls.name}附件2.xlsx` });

          const att4 = await exportAttachment4(cls.id, academicYearId);
          archive.append(att4, { name: `${folderName}/${cls.grade.name}${cls.name}附件4.xlsx` });
        } catch (err) {
          console.error(`Export failed for ${cls.grade.name} ${cls.name}:`, err);
        }
      }
      archive.finalize();
    })();
  });
}

export async function exportFailedRecords(failures?: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('导入失败数据');

  sheet.columns = [
    { header: '所在行', key: 'row', width: 10 },
    { header: '学号', key: 'studentNo', width: 20 },
    { header: '姓名', key: 'name', width: 15 },
    { header: '失败原因', key: 'reason', width: 40 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  // If no failures provided, fetch from recent import logs
  if (!failures) {
    const recentLogs = await prisma.importLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    failures = [];
    for (const log of recentLogs) {
      if (log.failDetails) {
        try {
          const parsed = JSON.parse(log.failDetails as string);
          if (Array.isArray(parsed)) failures.push(...parsed);
        } catch {}
      }
    }
  }

  for (const f of failures) {
    sheet.addRow(f);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportAccountsList(accounts?: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('班长账号');

  sheet.columns = [
    { header: '年级', key: 'gradeName', width: 15 },
    { header: '班级', key: 'className', width: 25 },
    { header: '用户名', key: 'username', width: 30 },
    { header: '初始密码', key: 'password', width: 20 },
    { header: '显示名称', key: 'displayName', width: 25 },
    { header: '状态', key: 'status', width: 10 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // If no accounts provided, fetch from DB (without passwords)
  if (!accounts) {
    const users = await prisma.user.findMany({
      where: { role: 'monitor' },
      include: { class: { include: { grade: true } } },
      orderBy: { createdAt: 'desc' },
    });
    accounts = users.map((u: any) => ({
      gradeName: u.class?.grade?.name || '-',
      className: u.class?.name || '-',
      username: u.username,
      password: '***',
      displayName: u.displayName,
      status: '已创建',
    }));
  }

  for (const account of accounts) {
    sheet.addRow(account);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
