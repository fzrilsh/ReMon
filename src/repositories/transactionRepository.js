const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findByUserId(userId, filters = {}) {
  const where = { userId, ...filters };
  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });
}

async function findById(id) {
  return prisma.transaction.findUnique({
    where: { id },
    include: { category: true },
  });
}

async function create(data) {
  return prisma.transaction.create({ data });
}

async function update(id, data) {
  return prisma.transaction.update({ where: { id }, data });
}

async function remove(id) {
  return prisma.transaction.delete({ where: { id } });
}

module.exports = { findByUserId, findById, create, update, remove };
