const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, getOrderById } = require('../controller/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/status', authMiddleware, updateOrderStatus);

module.exports = router;
