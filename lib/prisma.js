// ============================================================
// PRISMA CLIENT SINGLETON
// Mencegah membuat koneksi baru setiap hot-reload di development
// ============================================================

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
