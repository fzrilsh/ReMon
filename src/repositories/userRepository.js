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

async function updateBankInfo(id, { bankName, bankNumber, bankHolder }) {
  return prisma.user.update({
    where: { id },
    data: { bankName, bankNumber, bankHolder },
  });
}

module.exports = { findByEmail, findById, create, updateBankInfo };
