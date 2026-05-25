const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findByUserId(userId) {
  return prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function findById(id) {
  return prisma.debt.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.debt.create({ data });
}

async function settle(id) {
  return prisma.debt.update({
    where: { id },
    data: { status: 'PAID' },
  });
}

async function remove(id) {
  return prisma.debt.delete({ where: { id } });
}

module.exports = { findByUserId, findById, create, settle, remove };
