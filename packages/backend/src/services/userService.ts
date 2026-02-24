import prisma from '../config/database.js';
import { hashPassword, generateRandomPassword } from '../utils/password.js';

export async function listUsers(filters?: { role?: string }) {
  const where: any = {};
  if (filters?.role) where.role = filters.role;

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      role: true,
      displayName: true,
      classId: true,
      createdAt: true,
      class: {
        select: {
          name: true,
          grade: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser(data: {
  username: string;
  password: string;
  role: string;
  classId?: number;
  displayName?: string;
}) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      role: data.role,
      classId: data.classId,
      displayName: data.displayName,
    },
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({ where: { id } });
}

export async function resetPassword(id: number) {
  const newPassword = generateRandomPassword();
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
  return { newPassword };
}

export async function batchGenerateMonitors(options: {
  gradeId?: number;
  overwrite: boolean;
}) {
  // Get all classes, optionally filtered by grade
  const where: any = {};
  if (options.gradeId && options.gradeId > 0) where.gradeId = options.gradeId;

  const classes = await prisma.class.findMany({
    where,
    include: { grade: true },
    orderBy: [{ grade: { name: 'asc' } }, { name: 'asc' }],
  });

  const results: Array<{
    gradeName: string;
    className: string;
    username: string;
    password: string;
    displayName: string;
    status: string;
  }> = [];

  for (const cls of classes) {
    const username = `monitor_${cls.grade.name.replace('级', '')}_${cls.name.replace(/\s+/g, '_')}`;
    const displayName = `${cls.grade.name}${cls.name}班长`;

    // Check if account already exists
    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing && !options.overwrite) {
      results.push({
        gradeName: cls.grade.name,
        className: cls.name,
        username,
        password: '***已存在***',
        displayName,
        status: '跳过',
      });
      continue;
    }

    const password = generateRandomPassword();
    const passwordHash = await hashPassword(password);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, displayName, classId: cls.id },
      });
    } else {
      await prisma.user.create({
        data: {
          username,
          passwordHash,
          role: 'monitor',
          classId: cls.id,
          displayName,
        },
      });
    }

    results.push({
      gradeName: cls.grade.name,
      className: cls.name,
      username,
      password,
      displayName,
      status: existing ? '已重置' : '新建',
    });
  }

  return results;
}
