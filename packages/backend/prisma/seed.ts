import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin account
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'admin',
      displayName: '系统管理员',
    },
  });

  // Create default academic year
  await prisma.academicYear.upsert({
    where: { name: '2025-2026学年' },
    update: { isCurrent: true },
    create: {
      name: '2025-2026学年',
      isCurrent: true,
    },
  });

  console.log('✅ Seed data created successfully');
  console.log('   Default admin: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
