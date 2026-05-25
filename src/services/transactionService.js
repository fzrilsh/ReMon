const transactionRepository = require('../repositories/transactionRepository');
const categoryRepository = require('../repositories/categoryRepository');

async function getAll(userId, filters = {}) {
  return transactionRepository.findByUserId(userId, filters);
}

async function getById(id) {
  const transaction = await transactionRepository.findById(id);
  if (!transaction) {
    const error = new Error('Transaksi tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return transaction;
}

async function create(userId, data) {
  return transactionRepository.create({
    userId,
    amount: data.amount,
    description: data.description,
    categoryId: data.categoryId || null,
    type: data.type,
    date: new Date(data.date),
  });
}

async function update(id, userId, data) {
  const existing = await getById(id);
  if (existing.userId !== userId) {
    const error = new Error('Transaksi tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return transactionRepository.update(id, {
    amount: data.amount,
    description: data.description,
    categoryId: data.categoryId || null,
    type: data.type,
    date: new Date(data.date),
  });
}

async function remove(id, userId) {
  const existing = await getById(id);
  if (existing.userId !== userId) {
    const error = new Error('Transaksi tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return transactionRepository.remove(id);
}

async function getCategories() {
  return categoryRepository.findDefaults();
}

module.exports = { getAll, getById, create, update, remove, getCategories };
