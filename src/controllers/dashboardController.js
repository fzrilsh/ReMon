const dashboardService = require('../services/dashboardService');

async function index(req, res, next) {
  try {
    const data = await dashboardService.getDashboardData(req.session.user.id);
    res.render('dashboard/index', {
      title: 'Dashboard',
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
