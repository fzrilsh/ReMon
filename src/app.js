const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');
const basePathMiddleware = require('./middleware/basePath');
const indexRouter = require('./routes/index');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override (for PUT/DELETE forms) — MUST be after body parsers
app.use(methodOverride('_method'));

app.set('trust proxy', 1);

// Session
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
}));

// Static files
app.use(env.appBasePath, express.static(path.join(__dirname, '..', 'public')));

// Base path middleware (adds req.basePath for views)
app.use(basePathMiddleware);

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.basePath = env.appBasePath;
  next();
});

// Routes
app.use(env.appBasePath, indexRouter);

// Home redirect
app.get('/', (req, res) => {
  res.redirect(`${env.appBasePath}/auth/login`);
});

// Error handler
app.use(errorHandler);

module.exports = app;
