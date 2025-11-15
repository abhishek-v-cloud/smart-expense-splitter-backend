const Settlement = require('../models/Settlement');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const { generateExpenseReport } = require('../utils/reportGenerator');

// Get settlements for a group
const getSettlements = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const settlements = await Settlement.find({ groupId, status: 'pending' })
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      settlements,
    });
  } catch (error) {
    next(error);
  }
};

// Mark settlement as paid
const settlePayment = async (req, res, next) => {
  try {
    const { settlementId } = req.params;
    const settlement = await Settlement.findByIdAndUpdate(
      settlementId,
      {
        status: 'settled',
        settledAt: new Date(),
      },
      { new: true }
    )
      .populate('from', 'name email')
      .populate('to', 'name email');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found',
      });
    }

    res.status(200).json({
      success: true,
      settlement,
    });
  } catch (error) {
    next(error);
  }
};

// Get group summary
const getGroupSummary = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupId',
      });
    }

    const objectId = new mongoose.Types.ObjectId(groupId);

    // Get total expenses
    const expenseAgg = await Expense.aggregate([
      { $match: { groupId: objectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get pending settlements
    const settlements = await Settlement.find({ groupId, status: 'pending' });

    // Get category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: { groupId: objectId } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalExpenses: expenseAgg[0]?.total || 0,
        pendingSettlements: settlements.length,
        totalUnsettled: settlements.reduce((sum, s) => sum + s.amount, 0),
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get expense report
const getExpenseReport = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const csv = await generateExpenseReport(groupId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-report.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettlements,
  settlePayment,
  getGroupSummary,
  getExpenseReport,
};
