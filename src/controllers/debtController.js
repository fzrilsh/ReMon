const debtService = require('../services/debtService');
const { debtSchema } = require('../validators/debtSchema');

async function index(req, res, next) {
  try {
    const data = await debtService.getAll(req.session.user.id);
    res.render('debts/list', {
      title: 'Hutang',
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

async function showCreate(req, res) {
  res.render('debts/create', {
    title: 'Catat Hutang',
    errors: null,
    oldInput: {},
  });
}

async function store(req, res, next) {
  try {
    const parsed = debtSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).render('debts/create', {
        title: 'Catat Hutang',
        errors,
        oldInput: req.body,
      });
    }

    await debtService.create(req.session.user.id, parsed.data);
    res.redirect(`${req.basePath}/debts`);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).render('debts/create', {
        title: 'Catat Hutang',
        errors: { general: [err.message] },
        oldInput: req.body,
      });
    }
    next(err);
  }
}

async function settle(req, res, next) {
  try {
    await debtService.settle(req.params.id, req.session.user.id);
    res.redirect(`${req.basePath}/debts`);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Hutang tidak ditemukan',
        error: null,
      });
    }
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    await debtService.remove(req.params.id, req.session.user.id);
    res.redirect(`${req.basePath}/debts`);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Hutang tidak ditemukan',
        error: null,
      });
    }
    next(err);
  }
}

module.exports = { index, showCreate, store, settle, destroy };
