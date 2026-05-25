const notificationService = require('../services/notificationService');

async function getUnread(req, res, next) {
  try {
    const notifications = await notificationService.getUnread(req.session.user.id);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.params.id, req.session.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.session.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUnread, markAsRead, markAllAsRead };
