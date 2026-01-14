import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;

