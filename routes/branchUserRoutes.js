const express = require('express');
const router = express.Router();
const { createBranchUser, getBranchUsers, deleteBranchUser } = require('../controller/branchUserController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createBranchUser);
router.get('/', authMiddleware, getBranchUsers);
router.delete('/:id', authMiddleware, deleteBranchUser);

module.exports = router;
