import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * Normalize SSL mode in a Postgres connection string to suppress
 * the pg-connection-string deprecation warning.
 *
 * The aliases "prefer", "require", and "verify-ca" are deprecated
 * and treated as "verify-full" in the current adapter. This function
 * replaces them explicitly so the warning is not emitted.
 */
function normalizeSslMode(url: string): string {
  return url.replace(
    /(\?|&)sslmode=(prefer|require|verify-ca)(?=&|$)/gi,
    "$1sslmode=verify-full"
  );
}

function createPrismaClient(connectionString: string) {
  const normalized = normalizeSslMode(connectionString);

  if (normalized.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: normalized,
    });
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: normalized }),
  });
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
