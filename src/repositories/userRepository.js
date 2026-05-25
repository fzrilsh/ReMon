const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.user.create({ data });
}

module.exports = { findByEmail, findById, create };
