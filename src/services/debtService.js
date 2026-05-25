const debtRepository = require('../repositories/debtRepository');
const notificationService = require('./notificationService');

async function getAll(userId) {
  const debts = await debtRepository.findByUserId(userId);
  
  const active = debts.filter(d => d.status === 'UNPAID');
  const settled = debts.filter(d => d.status === 'PAID');
  
  const totalIOwe = active
    .filter(d => d.direction === 'I_OWE')
    .reduce((sum, d) => sum + Number(d.amount), 0);
    
  const totalTheyOwe = active
    .filter(d => d.direction === 'THEY_OWE')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return {
    all: debts,
    active,
    settled,
    totalIOwe,
    totalTheyOwe,
    netBalance: totalTheyOwe - totalIOwe,
  };
}

async function getById(id) {
  const debt = await debtRepository.findById(id);
  if (!debt) {
    const error = new Error('Hutang tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return debt;
}

async function create(userId, data) {
  const debt = await debtRepository.create({
    userId,
    otherPersonName: data.otherPersonName,
    amount: data.amount,
    description: data.description,
    direction: data.direction,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
  });

  // Notify if due date set
  if (data.dueDate) {
    await notificationService.create({
      userId,
      type: 'DEBT_DUE',
      title: 'Hutang Baru dengan Jatuh Tempo',
      message: `Hutang ${data.direction === 'I_OWE' ? 'kepada' : 'dari'} ${data.otherPersonName} sebesar Rp ${Number(data.amount).toLocaleString('id-ID')} jatuh tempo ${new Date(data.dueDate).toLocaleDateString('id-ID')}`,
      link: `/ReMon/debts`,
    });
  }

  return debt;
}

async function settle(id, userId) {
  const debt = await getById(id);
  if (debt.userId !== userId) {
    const error = new Error('Hutang tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  
  const settled = await debtRepository.settle(id);
  
  await notificationService.create({
    userId,
    type: 'DEBT_SETTLED',
    title: 'Hutang Lunas',
    message: `Hutang ${debt.direction === 'I_OWE' ? 'kepada' : 'dari'} ${debt.otherPersonName} sebesar Rp ${Number(debt.amount).toLocaleString('id-ID')} telah dilunasi`,
    link: `/ReMon/debts`,
  });
  
  return settled;
}

async function remove(id, userId) {
  const debt = await getById(id);
  if (debt.userId !== userId) {
    const error = new Error('Hutang tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return debtRepository.remove(id);
}

module.exports = { getAll, getById, create, settle, remove };
