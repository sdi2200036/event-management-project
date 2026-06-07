import prisma from '../src/config/prisma';

async function main() {
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: '$2a$10$UGUQxCZj.LzWwWLyg2ej7euJcOTPYT24.H32Wo4SgQV4T6MZQ1ukm',
      first_name: 'System',
      last_name: 'Admin',
      email: 'admin@eventmanagement.com',
      afm: '000000000',
      role: 'admin',
      status: 'approved',
    },
  });
  console.log('Admin user seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
