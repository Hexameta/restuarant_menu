const express = require('express');
const router = express.Router();
const { createTable, getTables, updateTable, deleteTable } = require('../controller/tableController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createTable);
router.get('/', authMiddleware, getTables);
router.put('/:id', authMiddleware, updateTable);
router.delete('/:id', authMiddleware, deleteTable);

module.exports = router;
