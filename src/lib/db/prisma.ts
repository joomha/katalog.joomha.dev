import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client singleton for Next.js App Router and HMR development.
 * Prevents multiple PrismaClient instances from exhausting database connection pools during hot reloads.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

