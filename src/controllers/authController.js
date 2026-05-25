const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authSchema');

function showRegister(req, res) {
  res.render('auth/register', { layout: false, title: 'Daftar', errors: null, oldInput: {} });
}

async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).render('auth/register', {
        layout: false,
        title: 'Daftar',
        errors,
        oldInput: req.body,
      });
    }

    const user = await authService.register(parsed.data);
    req.session.user = user;
    res.redirect(`${req.basePath}/dashboard`);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).render('auth/register', {
        layout: false,
        title: 'Daftar',
        errors: { email: [err.message] },
        oldInput: req.body,
      });
    }
    next(err);
  }
}

function showLogin(req, res) {
  res.render('auth/login', { layout: false, title: 'Masuk', errors: null, oldInput: {} });
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).render('auth/login', {
        layout: false,
        title: 'Masuk',
        errors,
        oldInput: req.body,
      });
    }

    const user = await authService.login(parsed.data);
    req.session.user = user;
    res.redirect(`${req.basePath}/dashboard`);
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).render('auth/login', {
        layout: false,
        title: 'Masuk',
        errors: { email: [err.message] },
        oldInput: req.body,
      });
    }
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect(`${req.basePath}/dashboard`);
    }
    res.clearCookie('connect.sid');
    res.redirect(`${req.basePath}/auth/login`);
  });
}

module.exports = { showRegister, register, showLogin, login, logout };
