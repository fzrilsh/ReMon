const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardData(userId, filter = 'monthly') {
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

  // 2. Fetch ALL transactions for the selected range to sum them accurately
  const transactionWhere = { userId };
  if (filter === 'monthly') {
    transactionWhere.date = { gte: startOfMonth, lte: endOfMonth };
  }
  const monthlyTransactions = await prisma.transaction.findMany({
    where: transactionWhere,
    include: { category: true },
  });

  const transactionIncome = monthlyTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const transactionExpense = monthlyTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 3. Fetch Split Bill recoveries (income when others pay me back) for selected range
  const splitBillPaymentsWhere = {
    splitBill: { userId },
    status: 'PAID'
  };
  if (filter === 'monthly') {
    splitBillPaymentsWhere.paidAt = { gte: startOfMonth, lte: endOfMonth };
  }
  const splitBillPayments = await prisma.splitBillParticipant.findMany({
    where: splitBillPaymentsWhere
  });

  const splitBillIncome = splitBillPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 4. Fetch Debt perputaran dana for selected range
  // - New debts created this month where I borrowed: direction === 'I_OWE'
  const newDebtsBorrowedWhere = {
    userId,
    direction: 'I_OWE'
  };
  if (filter === 'monthly') {
    newDebtsBorrowedWhere.createdAt = { gte: startOfMonth, lte: endOfMonth };
  }
  const newDebtsBorrowed = await prisma.debt.findMany({
    where: newDebtsBorrowedWhere
  });
  const debtBorrowedIncome = newDebtsBorrowed.reduce((sum, d) => sum + Number(d.amount), 0);

  // - Settled debts where someone paid me back: direction === 'THEY_OWE', status === 'PAID', updatedAt in selected range
  const settledDebtsReceivedWhere = {
    userId,
    direction: 'THEY_OWE',
    status: 'PAID'
  };
  if (filter === 'monthly') {
    settledDebtsReceivedWhere.updatedAt = { gte: startOfMonth, lte: endOfMonth };
  }
  const settledDebtsReceived = await prisma.debt.findMany({
    where: settledDebtsReceivedWhere
  });
  const debtReceivedIncome = settledDebtsReceived.reduce((sum, d) => sum + Number(d.amount), 0);

  // - New debts created this month where I lent: direction === 'THEY_OWE'
  const newDebtsLentWhere = {
    userId,
    direction: 'THEY_OWE'
  };
  if (filter === 'monthly') {
    newDebtsLentWhere.createdAt = { gte: startOfMonth, lte: endOfMonth };
  }
  const newDebtsLent = await prisma.debt.findMany({
    where: newDebtsLentWhere
  });
  const debtLentExpense = newDebtsLent.reduce((sum, d) => sum + Number(d.amount), 0);

  // - Settled debts where I paid back: direction === 'I_OWE', status === 'PAID', updatedAt in selected range
  const settledDebtsPaidWhere = {
    userId,
    direction: 'I_OWE',
    status: 'PAID'
  };
  if (filter === 'monthly') {
    settledDebtsPaidWhere.updatedAt = { gte: startOfMonth, lte: endOfMonth };
  }
  const settledDebtsPaid = await prisma.debt.findMany({
    where: settledDebtsPaidWhere
  });
  const debtPaidExpense = settledDebtsPaid.reduce((sum, d) => sum + Number(d.amount), 0);

  // 5. Aggregate overall Pemasukan & Pengeluaran
  const monthlyIncome = transactionIncome + splitBillIncome + debtBorrowedIncome + debtReceivedIncome;
  const monthlyExpense = transactionExpense + debtLentExpense + debtPaidExpense;

  // 6. Aggregate expenses by category for selected range
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

  // 8. Monthly trend calculation for last 6 months (only when filter is 'all')
  let trendLabels = [];
  let trendIncomeData = [];
  let trendExpenseData = [];

  if (filter === 'all') {
    const trendDataMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      trendDataMap[key] = { income: 0, expense: 0, label };
    }

    const getMonthKey = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    monthlyTransactions.forEach(t => {
      const key = getMonthKey(t.date);
      if (trendDataMap[key]) {
        if (t.type === 'INCOME') {
          trendDataMap[key].income += Number(t.amount);
        } else {
          trendDataMap[key].expense += Number(t.amount);
        }
      }
    });

    splitBillPayments.forEach(p => {
      const key = getMonthKey(p.paidAt);
      if (trendDataMap[key]) {
        trendDataMap[key].income += Number(p.amount);
      }
    });

    newDebtsBorrowed.forEach(d => {
      const key = getMonthKey(d.createdAt);
      if (trendDataMap[key]) {
        trendDataMap[key].income += Number(d.amount);
      }
    });

    settledDebtsReceived.forEach(d => {
      const key = getMonthKey(d.updatedAt);
      if (trendDataMap[key]) {
        trendDataMap[key].income += Number(d.amount);
      }
    });

    newDebtsLent.forEach(d => {
      const key = getMonthKey(d.createdAt);
      if (trendDataMap[key]) {
        trendDataMap[key].expense += Number(d.amount);
      }
    });

    settledDebtsPaid.forEach(d => {
      const key = getMonthKey(d.updatedAt);
      if (trendDataMap[key]) {
        trendDataMap[key].expense += Number(d.amount);
      }
    });

    trendLabels = Object.values(trendDataMap).map(v => v.label);
    trendIncomeData = Object.values(trendDataMap).map(v => v.income);
    trendExpenseData = Object.values(trendDataMap).map(v => v.expense);
  }

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
    trendLabels,
    trendIncomeData,
    trendExpenseData,
  };
}

module.exports = { getDashboardData };
