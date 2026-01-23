import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Usage: npx tsx create_user.ts <username> <password> [role]
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("\n❌ Usage error!");
    console.log("Usage: npx tsx create_user.ts <username> <password> [role]");
    console.log("Example: npx tsx create_user.ts admin@example.com mypassword123 ADMIN\n");
    return;
  }

  const [username, password, selectedRole = "USER"] = args;
  const role = selectedRole.toUpperCase();

  // Validate role
  if (!["ADMIN", "SECURITY", "USER"].includes(role)) {
    console.error(`\n❌ Error: Invalid role '${role}'. Must be ADMIN, SECURITY, or USER.\n`);
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.error(`\n❌ Error: User '${username}' already exists.\n`);
    process.exit(1);
  }

  console.log(`\n⌛ Hashing password and creating user...`);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role,
      status: "ACTIVE",
    },
  });

  console.log(`\n✅ Successfully created user!`);
  console.log(`-------------------------------`);
  console.log(`Username: ${user.username}`);
  console.log(`Role:     ${user.role}`);
  console.log(`Status:   ${user.status}`);
  console.log(`ID:       ${user.id}`);
  console.log(`-------------------------------\n`);
}

main()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
