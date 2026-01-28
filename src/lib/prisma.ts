import { PrismaClient } from "@prisma/client";

// Force reload after schema change: 2026-01-29 00:07
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
