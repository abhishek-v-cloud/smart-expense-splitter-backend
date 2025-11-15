const express = require('express');
const {
  getSettlements,
  settlePayment,
  getExpenseReport,
  getGroupSummary,
} = require('../controllers/settlementController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/:groupId/summary', protect, getGroupSummary);
router.get('/:groupId/report', protect, getExpenseReport);
router.get('/:groupId', protect, getSettlements);
router.put('/:settlementId/settle', protect, settlePayment);

module.exports = router;
