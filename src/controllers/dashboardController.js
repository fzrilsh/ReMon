const dashboardService = require('../services/dashboardService');

async function index(req, res, next) {
  try {
    if (!req.query.content) {
      return res.render('skeletons/dashboard', { title: 'Dashboard' });
    }

    const filter = req.query.filter || 'monthly';
    const data = await dashboardService.getDashboardData(req.session.user.id, filter);
    res.render('dashboard/index', {
      title: 'Dashboard',
      filter,
      ...data,
      isPartial: true
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
