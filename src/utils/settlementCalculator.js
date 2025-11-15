const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');

// Calculate who owes whom based on expenses
const calculateSettlements = async (groupId) => {
  try {
    const expenses = await Expense.find({ groupId }).populate('paidBy').populate('participants.userId');

    // Track balances for each user
    const balances = new Map();

    // Initialize balances
    expenses.forEach((expense) => {
      // skip malformed expense records
      if (!expense || !expense.paidBy || !expense.paidBy._id) return;

      const payerId = expense.paidBy._id.toString();
      if (!balances.has(payerId)) {
        balances.set(payerId, 0);
      }

      if (Array.isArray(expense.participants)) {
        expense.participants.forEach((participant) => {
          if (!participant || !participant.userId || !participant.userId._id) return;
          const participantId = participant.userId._id.toString();
          if (!balances.has(participantId)) {
            balances.set(participantId, 0);
          }
        });
      }
    });

    // Calculate balances
    expenses.forEach((expense) => {
      if (!expense || !expense.paidBy || !expense.paidBy._id) return;

      const paidById = expense.paidBy._id.toString();
      const amt = Number(expense.amount) || 0;
      balances.set(paidById, (balances.get(paidById) || 0) + amt);

      if (Array.isArray(expense.participants)) {
        expense.participants.forEach((participant) => {
          if (!participant || !participant.userId || !participant.userId._id) return;
          const userId = participant.userId._id.toString();
          const partAmt = Number(participant.amount) || 0;
          balances.set(userId, (balances.get(userId) || 0) - partAmt);
        });
      }
    });

    // Generate minimal settlement transactions
    const settlements = minimizeTransactions(Array.from(balances.entries()));

    return settlements;
  } catch (error) {
    throw error;
  }
};

// Minimize transactions using a greedy algorithm
const minimizeTransactions = (balances) => {
  const transactions = [];
  const positive = [];
  const negative = [];

  balances.forEach(([userId, balance]) => {
    if (balance > 0.01) {
      positive.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      negative.push({ userId, amount: -balance });
    }
  });

  while (positive.length > 0 && negative.length > 0) {
    const creditor = positive[0];
    const debtor = negative[0];

    const amount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: parseFloat(amount.toFixed(2)),
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) {
      positive.shift();
    }
    if (debtor.amount < 0.01) {
      negative.shift();
    }
  }

  return transactions;
};

// Save settlements to database
const saveSettlements = async (groupId, settlements) => {
  try {
    // Clear existing pending settlements
    await Settlement.deleteMany({ groupId, status: 'pending' });

    // Create new settlements
    const savedSettlements = await Settlement.insertMany(
      settlements.map((settlement) => ({
        groupId,
        from: settlement.from,
        to: settlement.to,
        amount: settlement.amount,
        status: 'pending',
      }))
    );

    return savedSettlements;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  calculateSettlements,
  minimizeTransactions,
  saveSettlements,
};
