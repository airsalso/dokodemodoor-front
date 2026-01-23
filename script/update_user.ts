import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "cold.park@samsung.com";

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log(`User ${username} not found. Please register this account first.`);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { username },
    data: { role: "ADMIN" },
  });

  console.log(`Successfully updated ${username} to ADMIN.`);
  console.log(updatedUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
