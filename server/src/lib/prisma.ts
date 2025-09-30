import { PrismaClient } from "../generated/prisma"; // or "@prisma/client" if default output

// Ensure only 1 instance is created (fixes hot-reload issue in dev)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // optional, good for debugging
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
