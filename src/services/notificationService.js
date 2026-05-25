const notificationRepository = require('../repositories/notificationRepository');

async function getUnread(userId) {
  return notificationRepository.findUnreadByUserId(userId);
}

async function create({ userId, type, title, message, link }) {
  return notificationRepository.create({ userId, type, title, message, link });
}

async function markAsRead(id, userId) {
  const notif = await notificationRepository.markAsRead(id);
  return notif;
}

async function markAllAsRead(userId) {
  return notificationRepository.markAllAsRead(userId);
}

module.exports = { getUnread, create, markAsRead, markAllAsRead };
