import prisma from '../config/database.js';
import ExcelJS from 'exceljs';
import * as scoreService from './scoreService.js';
import { SCORE_CATEGORIES } from '../config/scoreRules.js';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Writable } from 'stream';

const TEMPLATE_DIR = path.resolve(process.cwd(), 'templates');

export async function exportAttachment2(classId: number, academicYearId: number): Promise<Buffer> {
  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { grade: true },
  });
  if (!cls || !academicYear) throw new Error('班级或学年不存在');

  const students = await scoreService.getScoresByClass(classId, academicYearId);

  const workbook = new ExcelJS.Workbook();

  // Try to load template
  const templatePath = path.join(TEMPLATE_DIR, '附件2_template.xlsx');
  if (fs.existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  } else {
    // Create from scratch
    const sheet = workbook.addWorksheet('综测成绩汇总表');
    sheet.addRow([`${academicYear.name} ${cls.grade.name} ${cls.name} 综测成绩汇总表`]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow([]);
    sheet.addRow(['序号', '学号', '姓名', '德育测评', '学业学术素质', '创新与实践能力', '体育', '美育', '劳动教育', '公益服务与社会工作', '附加分', '总分']);
  }

  const sheet = workbook.worksheets[0];

  // Data starts at row 6
  const startRow = 6;
  students.forEach((student, index) => {
    const row = sheet.getRow(startRow + index);
    row.getCell(1).value = index + 1; // 序号
    row.getCell(2).value = student.studentNo;
    row.getCell(3).value = student.name;
    row.getCell(4).value = student.scores.moral?.value || 0;
    row.getCell(5).value = student.scores.academic?.value || 0;
    row.getCell(6).value = student.scores.innovation?.value || 0;
    row.getCell(7).value = student.scores.sports_total?.value || 0;
    row.getCell(8).value = student.scores.aesthetics?.value || 0;
    row.getCell(9).value = student.scores.labor?.value || 0;
    row.getCell(10).value = student.scores.public_service?.value || 0;
    row.getCell(11).value = student.scores.bonus?.value || 0;
    row.getCell(12).value = student.scores.total?.value || 0;
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

  const workbook = new ExcelJS.Workbook();

  const templatePath = path.join(TEMPLATE_DIR, '附件4_template.xlsx');
  if (fs.existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  } else {
    const sheet = workbook.addWorksheet('学年总评表');
    sheet.addRow(['测评学年', '学号', '姓名', '德育测评', '学业学术素质', '创新与实践能力', '体育', '美育', '劳动教育', '公益服务与社会工作', '附加分']);
  }

  const sheet = workbook.worksheets[0];

  // Data starts at row 2
  const startRow = 2;
  students.forEach((student, index) => {
    const row = sheet.getRow(startRow + index);
    row.getCell(1).value = academicYear.name;
    row.getCell(2).value = student.studentNo;
    row.getCell(3).value = student.name;
    row.getCell(4).value = student.scores.moral?.value || 0;
    row.getCell(5).value = student.scores.academic?.value || 0;
    row.getCell(6).value = student.scores.innovation?.value || 0;
    row.getCell(7).value = student.scores.sports_total?.value || 0;
    row.getCell(8).value = student.scores.aesthetics?.value || 0;
    row.getCell(9).value = student.scores.labor?.value || 0;
    row.getCell(10).value = student.scores.public_service?.value || 0;
    row.getCell(11).value = student.scores.bonus?.value || 0;
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
          archive.append(att2, { name: `${folderName}/附件2-综测成绩汇总表.xlsx` });

          const att4 = await exportAttachment4(cls.id, academicYearId);
          archive.append(att4, { name: `${folderName}/附件4-学生素质综合测评学年总评表.xlsx` });
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
    { header: '显示名称', key: 'displayName', width: 25 },
    { header: '角色', key: 'role', width: 10 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // If no accounts provided, fetch from DB
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
      displayName: u.displayName,
      role: '班长',
    }));
  }

  for (const account of accounts) {
    sheet.addRow(account);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
