const { Order } = require("../model/orderModel");
const { sendResponse } = require("../utils/responseHelper");

const createOrder = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const { customer_name, customer_phone, items, table_id, total_amount } = req.body;

        if (!table_id || !items || items.length === 0) {
            return sendResponse(res, 400, "Table ID and items are required");
        }

        // Check for existing open/confirmed orders for the same table
        const existingOrder = await Order.findOne({
            table_id,
            status: { $in: ['open', 'confirmed'] }
        });

        if (existingOrder) {
            return sendResponse(res, 400, "There is already an active order for this table. Please complete or cancel it first.");
        }

        const order = new Order({
            customer_name,
            customer_phone,
            items,
            table_id,
            branch_id,
            total_amount,
            status: 'open'
        });

        await order.save();
        return sendResponse(res, 201, "Order created successfully", order);
    } catch (error) {
        console.error("Create Order Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const getOrders = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const { status } = req.query;
        
        const filter = { branch_id };
        if (status) {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('table_id')
            .populate('items.product_id')
            .sort({ createdAt: -1 });

        return sendResponse(res, 200, "Orders fetched successfully", orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancel_reason } = req.body;

        if (!['open', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return sendResponse(res, 400, "Invalid status");
        }

        const order = await Order.findById(id);
        if (!order) {
            return sendResponse(res, 404, "Order not found");
        }

        order.status = status;
        if (status === 'cancelled') {
            order.cancel_reason = cancel_reason || "No reason provided";
        }
        await order.save();

        return sendResponse(res, 200, `Order status updated to ${status}`, order);
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('table_id')
            .populate('items.product_id');
        
        if (!order) {
            return sendResponse(res, 404, "Order not found");
        }

        return sendResponse(res, 200, "Order fetched successfully", order);
    } catch (error) {
        console.error("Get Order By Id Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
    getOrderById
};
