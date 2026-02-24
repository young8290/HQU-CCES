import { Router, Request, Response } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import * as exportService from '../services/exportService.js';
import * as academicYearService from '../services/academicYearService.js';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

async function getAcademicYearId(yearIdParam?: any): Promise<number> {
  if (yearIdParam) return parseInt(yearIdParam);
  const current = await academicYearService.getCurrentAcademicYear();
  if (!current) throw new Error('未设置当前学年');
  return current.id;
}

// Export attachment 2
router.get('/attachment2/:classId', async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId as string);
    const academicYearId = await getAcademicYearId(req.query.academicYearId);

    const buffer = await exportService.exportAttachment2(classId, academicYearId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attachment2.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export attachment 4
router.get('/attachment4/:classId', async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.classId as string);
    const academicYearId = await getAcademicYearId(req.query.academicYearId);

    const buffer = await exportService.exportAttachment4(classId, academicYearId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attachment4.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export all attachments (ZIP)
router.get('/all/:gradeId', async (req: Request, res: Response) => {
  try {
    const gradeId = parseInt(req.params.gradeId as string);
    const academicYearId = await getAcademicYearId(req.query.academicYearId);

    const buffer = await exportService.exportAllAttachments({ gradeId }, academicYearId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=attachments_${Date.now()}.zip`);
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export failed records
router.get('/failed-records', async (req: Request, res: Response) => {
  try {
    const buffer = await exportService.exportFailedRecords();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=failed_records.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export accounts list
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const buffer = await exportService.exportAccountsList();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
