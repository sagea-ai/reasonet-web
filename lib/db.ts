import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

if (!db.analysis || !db.repository || !db.user || !db.chatSession) {
  console.warn('WARNING: Some Prisma models are undefined. Make sure to run `npm run db:generate` to generate the Prisma client.');
}