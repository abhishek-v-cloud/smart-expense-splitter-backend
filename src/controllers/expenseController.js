const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { calculateSplits } = require('../utils/expenseSplitter');
const { calculateSettlements, saveSettlements } = require('../utils/settlementCalculator');

// Helper: Recalculate settlements after expense change
const recalculateGroupSettlements = async (groupId) => {
  const settlements = await calculateSettlements(groupId);
  await saveSettlements(groupId, settlements);
};

// Create expense
const createExpense = async (req, res, next) => {
  try {
    const { groupId, description, amount, category, paidBy, participants } = req.body;

    if (!groupId || !description || !amount || !paidBy || !participants?.length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const splits = calculateSplits(amount, participants);
    const expense = await Expense.create({
      groupId,
      description,
      amount,
      category,
      paidBy,
      splitType: 'equal',
      participants: splits,
      date: new Date(),
    });

    await expense.populate('paidBy', 'name email');
    await expense.populate('participants.userId', 'name email');
    await recalculateGroupSettlements(groupId);

    res.status(201).json({
      success: true,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// Get all expenses for a group
const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { category, startDate, endDate } = req.query;

    const filter = { groupId };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter)
      .populate('paidBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// Get single expense
const getExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name email')
      .populate('participants.userId', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// Update expense
const updateExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, category, paidBy, participants } = req.body;

    let expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    let updatedParticipants = expense.participants;
    if (participants) {
      updatedParticipants = calculateSplits(amount || expense.amount, participants);
    }

    expense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        description: description || expense.description,
        amount: amount || expense.amount,
        category: category || expense.category,
        paidBy: paidBy || expense.paidBy,
        participants: updatedParticipants,
      },
      { new: true, runValidators: true }
    )
      .populate('paidBy', 'name email')
      .populate('participants.userId', 'name email');

    await recalculateGroupSettlements(expense.groupId);

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// Delete expense
const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findByIdAndDelete(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    await recalculateGroupSettlements(expense.groupId);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};
