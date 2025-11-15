const express = require('express');
const {
  createExpense,
  getGroupExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createExpense);
router.get('/group/:groupId', protect, getGroupExpenses);
router.get('/:expenseId', protect, getExpense);
router.put('/:expenseId', protect, updateExpense);
router.delete('/:expenseId', protect, deleteExpense);

module.exports = router;
