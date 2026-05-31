const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardData(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Fetch recent transactions for table list display (most recent 10 overall)
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 10,
  });

  // 2. Fetch ALL transactions for the current month to sum them accurately
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth }
    },
    include: { category: true },
  });

  const transactionIncome = monthlyTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const transactionExpense = monthlyTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Fetch Split Bill recoveries (income when others pay me back) for current month
  const splitBillPayments = await prisma.splitBillParticipant.findMany({
    where: {
      splitBill: { userId },
      status: 'PAID',
      paidAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  const splitBillIncome = splitBillPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 4. Fetch Debt perputaran dana for current month
  // - New debts created this month where I borrowed: direction === 'I_OWE'
  const newDebtsBorrowed = await prisma.debt.findMany({
    where: {
      userId,
      direction: 'I_OWE',
      createdAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const debtBorrowedIncome = newDebtsBorrowed.reduce((sum, d) => sum + Number(d.amount), 0);

  // - Settled debts where someone paid me back: direction === 'THEY_OWE', status === 'PAID', updatedAt in current month
  const settledDebtsReceived = await prisma.debt.findMany({
    where: {
      userId,
      direction: 'THEY_OWE',
      status: 'PAID',
      updatedAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const debtReceivedIncome = settledDebtsReceived.reduce((sum, d) => sum + Number(d.amount), 0);

  // - New debts created this month where I lent: direction === 'THEY_OWE'
  const newDebtsLent = await prisma.debt.findMany({
    where: {
      userId,
      direction: 'THEY_OWE',
      createdAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const debtLentExpense = newDebtsLent.reduce((sum, d) => sum + Number(d.amount), 0);

  // - Settled debts where I paid back: direction === 'I_OWE', status === 'PAID', updatedAt in current month
  const settledDebtsPaid = await prisma.debt.findMany({
    where: {
      userId,
      direction: 'I_OWE',
      status: 'PAID',
      updatedAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const debtPaidExpense = settledDebtsPaid.reduce((sum, d) => sum + Number(d.amount), 0);

  // 5. Aggregate overall Pemasukan & Pengeluaran
  const monthlyIncome = transactionIncome + splitBillIncome + debtBorrowedIncome + debtReceivedIncome;
  const monthlyExpense = transactionExpense + debtLentExpense + debtPaidExpense;

  // 6. Aggregate expenses by category for current month
  const categoryExpensesMap = {};
  monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      const catName = t.category ? `${t.category.icon || '📁'} ${t.category.name}` : '📁 Lainnya';
      categoryExpensesMap[catName] = (categoryExpensesMap[catName] || 0) + Number(t.amount);
    });

  const categoryExpenses = Object.keys(categoryExpensesMap).map(name => ({
    name,
    amount: categoryExpensesMap[name],
  })).sort((a, b) => b.amount - a.amount);

  // 7. General count and debt summaries
  const activeSplitBills = await prisma.splitBill.count({
    where: { userId, status: 'ACTIVE' },
  });

  const unpaidDebts = await prisma.debt.count({
    where: { userId, status: 'UNPAID' },
  });

  const pendingNotifications = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  const activeDebts = await prisma.debt.findMany({
    where: { userId, status: 'UNPAID' },
  });

  const totalIOwe = activeDebts
    .filter(d => d.direction === 'I_OWE')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalTheyOwe = activeDebts
    .filter(d => d.direction === 'THEY_OWE')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return {
    recentTransactions,
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    activeSplitBills,
    unpaidDebts,
    pendingNotifications,
    totalIOwe,
    totalTheyOwe,
    categoryExpenses,
  };
}

module.exports = { getDashboardData };
