const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAll() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

async function findByType(type) {
  return prisma.category.findMany({
    where: { type },
    orderBy: { name: 'asc' },
  });
}

async function findDefaults() {
  return prisma.category.findMany({
    where: { userId: null },
    orderBy: { name: 'asc' },
  });
}

module.exports = { findAll, findByType, findDefaults };
