const { Parser } = require('json2csv');
const Expense = require('../models/Expense');

const generateExpenseReport = async (groupId) => {
  try {
    const expenses = await Expense.find({ groupId })
      .populate('paidBy', 'name email')
      .populate('participants.userId', 'name email')
      .lean();

    // Transform data for CSV export
    const reportData = expenses.map((expense) => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Description: expense.description,
      Category: expense.category,
      Amount: expense.amount,
      'Paid By': expense.paidBy.name,
      Participants: expense.participants.map((p) => p.userId.name).join('; '),
    }));

    // Generate CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(reportData);

    return csv;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateExpenseReport,
};
