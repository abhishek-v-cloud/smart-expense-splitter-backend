const express = require('express');
const {
  createGroup,
  getUserGroups,
  getGroup,
  addMember,
  removeMember,
} = require('../controllers/groupController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:groupId', protect, getGroup);
router.post('/:groupId/members', protect, addMember);
router.delete('/:groupId/members/:memberId', protect, removeMember);

module.exports = router;
