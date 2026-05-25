const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardData(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 10,
  });

  const monthlyIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

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
    recentTransactions: transactions,
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    activeSplitBills,
    unpaidDebts,
    pendingNotifications,
    totalIOwe,
    totalTheyOwe,
  };
}

module.exports = { getDashboardData };
