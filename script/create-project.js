/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { name: 'juice-shop' },
    update: {
      repoUrl: 'https://github.com/juice-shop/juice-shop.git',
      localPath: '/home/ubuntu/dokodemodoor/repos/juice-shop',
    },
    create: {
      name: 'juice-shop',
      repoUrl: 'https://github.com/juice-shop/juice-shop.git',
      localPath: '/home/ubuntu/dokodemodoor/repos/juice-shop',
      description: 'OWASP Juice Shop - Manual Import',
    },
  });
  console.log('Project upserted:', project);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
