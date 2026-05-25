const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUnreadByUserId(userId) {
  return prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(data) {
  return prisma.notification.create({ data });
}

async function markAsRead(id) {
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { findUnreadByUserId, create, markAsRead, markAllAsRead };
