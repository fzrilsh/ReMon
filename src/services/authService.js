const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10;

async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const error = new Error('Email sudah terdaftar');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
  });

  return { id: user.id, name: user.name, email: user.email };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Email atau password salah');
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const error = new Error('Email atau password salah');
    error.statusCode = 401;
    throw error;
  }

  return { id: user.id, name: user.name, email: user.email };
}

module.exports = { register, login };
