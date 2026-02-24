import prisma from '../config/database.js';
import ExcelJS from 'exceljs';
import { calculateAcademicScore, calculateSportsBaseScore } from '../utils/calculation.js';
import * as scoreService from './scoreService.js';

export async function importAcademicScores(buffer: Buffer, academicYearId: number, userId: number, classId?: number) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Excel文件中没有工作表');

  let successCount = 0;
  let failCount = 0;
  const failures: any[] = [];

  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const studentNo = row.getCell(1).text?.trim();
    const name = row.getCell(2).text?.trim();
    const gpaStr = row.getCell(6).text?.trim();

    if (!studentNo) continue;

    try {
      const gpa = parseFloat(gpaStr);
      if (isNaN(gpa)) {
        failCount++;
        failures.push({ row: rowNum, studentNo, name, reason: `绩点值无效: ${gpaStr}` });
        continue;
      }

      const student = await prisma.student.findUnique({ where: { studentNo } });
      if (!student) {
        failCount++;
        failures.push({ row: rowNum, studentNo, name, reason: '学号不存在' });
        continue;
      }

      if (classId && student.classId !== classId) {
        continue; // Skip students not in the target class
      }

      const academicScore = calculateAcademicScore(gpa);
      await scoreService.updateScore({
        studentId: student.id,
        academicYearId,
        category: 'academic',
        value: academicScore,
        updatedBy: userId,
      });

      successCount++;
    } catch (err: any) {
      failCount++;
      failures.push({ row: rowNum, studentNo, name, reason: err.message });
    }
  }

  // Save import log
  await prisma.importLog.create({
    data: {
      type: 'academic',
      filename: 'academic_import.xlsx',
      successCount,
      failCount,
      failDetails: JSON.stringify(failures),
      importedBy: userId,
    },
  });

  return { successCount, failCount, failures };
}

export async function importSportsScores(buffer: Buffer, academicYearId: number, userId: number, classId?: number) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Excel文件中没有工作表');

  let successCount = 0;
  let failCount = 0;
  const failures: any[] = [];

  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const studentNo = row.getCell(1).text?.trim();
    const name = row.getCell(2).text?.trim();
    const baseStr = row.getCell(8).text?.trim();

    if (!studentNo) continue;

    try {
      const rawBase = parseFloat(baseStr);
      if (isNaN(rawBase)) {
        failCount++;
        failures.push({ row: rowNum, studentNo, name, reason: `基础分无效: ${baseStr}` });
        continue;
      }

      const student = await prisma.student.findUnique({ where: { studentNo } });
      if (!student) {
        failCount++;
        failures.push({ row: rowNum, studentNo, name, reason: '学号不存在' });
        continue;
      }

      if (classId && student.classId !== classId) {
        continue; // Skip students not in the target class
      }

      const sportsBase = calculateSportsBaseScore(rawBase);
      await scoreService.updateScore({
        studentId: student.id,
        academicYearId,
        category: 'sports_base',
        value: sportsBase,
        updatedBy: userId,
      });

      successCount++;
    } catch (err: any) {
      failCount++;
      failures.push({ row: rowNum, studentNo, name, reason: err.message });
    }
  }

  await prisma.importLog.create({
    data: {
      type: 'sports',
      filename: 'sports_import.xlsx',
      successCount,
      failCount,
      failDetails: JSON.stringify(failures),
      importedBy: userId,
    },
  });

  return { successCount, failCount, failures };
}

export async function importPersonalForm(buffer: Buffer, academicYearId: number, classId: number, userId: number) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  let successCount = 0;
  let failCount = 0;
  const failures: any[] = [];

  // Process each worksheet (each could be a student)
  for (const worksheet of workbook.worksheets) {
    try {
      // Try to find student number in the worksheet
      // Common patterns: cell B2 or A2 contains student number
      let studentNo = '';
      let studentName = '';

      // Search for student number in first few rows
      for (let r = 1; r <= 10; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= 10; c++) {
          const cellValue = row.getCell(c).text?.trim() || '';
          if (cellValue.includes('学号')) {
            // Next cell or same row next column
            const nextCell = row.getCell(c + 1).text?.trim();
            if (nextCell && /^\d+$/.test(nextCell)) {
              studentNo = nextCell;
            }
          }
          if (cellValue.includes('姓名')) {
            const nextCell = row.getCell(c + 1).text?.trim();
            if (nextCell) studentName = nextCell;
          }
        }
      }

      if (!studentNo) {
        // Try getting from specific cells
        studentNo = worksheet.getCell('B2').text?.trim() || worksheet.getCell('D2').text?.trim() || '';
        studentName = worksheet.getCell('B3').text?.trim() || worksheet.getCell('D3').text?.trim() || '';
      }

      if (!studentNo) {
        failCount++;
        failures.push({ row: 0, studentNo: '', name: worksheet.name, reason: '无法识别学号' });
        continue;
      }

      const student = await prisma.student.findUnique({ where: { studentNo } });
      if (!student) {
        failCount++;
        failures.push({ row: 0, studentNo, name: studentName, reason: '学号不存在' });
        continue;
      }

      if (student.classId !== classId) {
        failCount++;
        failures.push({ row: 0, studentNo, name: studentName, reason: '该学生不属于本班' });
        continue;
      }

      // Parse scores from the form - look for score values
      const scoreMapping: Record<string, { searchTerms: string[]; category: string }> = {
        moral: { searchTerms: ['德育', '思想品德'], category: 'moral' },
        innovation: { searchTerms: ['创新', '实践'], category: 'innovation' },
        sports_reward: { searchTerms: ['体育奖励', '体育加分'], category: 'sports_reward' },
        aesthetics: { searchTerms: ['美育'], category: 'aesthetics' },
        labor: { searchTerms: ['劳动'], category: 'labor' },
        public_service: { searchTerms: ['公益', '社会工作'], category: 'public_service' },
        bonus: { searchTerms: ['附加', '加分'], category: 'bonus' },
      };

      for (const [key, mapping] of Object.entries(scoreMapping)) {
        for (let r = 1; r <= worksheet.rowCount; r++) {
          const row = worksheet.getRow(r);
          for (let c = 1; c <= 15; c++) {
            const cellText = row.getCell(c).text?.trim() || '';
            if (mapping.searchTerms.some((term) => cellText.includes(term))) {
              // Look for the score value in nearby cells
              for (let nc = c + 1; nc <= Math.min(c + 5, 15); nc++) {
                const val = parseFloat(row.getCell(nc).text?.trim() || '');
                if (!isNaN(val)) {
                  // Look for remark
                  let remark: string | null = null;
                  const remarkCell = row.getCell(nc + 1).text?.trim();
                  if (remarkCell && !/^\d/.test(remarkCell)) {
                    remark = remarkCell;
                  }

                  await scoreService.updateScore({
                    studentId: student.id,
                    academicYearId,
                    category: mapping.category as any,
                    value: val,
                    remark,
                    updatedBy: userId,
                  });
                  break;
                }
              }
              break;
            }
          }
        }
      }

      successCount++;
    } catch (err: any) {
      failCount++;
      failures.push({ row: 0, studentNo: '', name: worksheet.name, reason: err.message });
    }
  }

  await prisma.importLog.create({
    data: {
      type: 'personal_form',
      filename: 'personal_form_import.xlsx',
      successCount,
      failCount,
      failDetails: JSON.stringify(failures),
      importedBy: userId,
    },
  });

  return { successCount, failCount, failures };
}

export async function getImportLogs(filters?: { type?: string; limit?: number }) {
  return prisma.importLog.findMany({
    where: filters?.type ? { type: filters.type } : undefined,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
    include: {
      importedByUser: {
        select: { username: true, displayName: true },
      },
    },
  });
}
