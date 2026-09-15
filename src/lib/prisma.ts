import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var _prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis._prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = prisma;
}
