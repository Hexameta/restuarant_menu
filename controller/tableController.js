const { Table } = require("../model/tableModel");
const { sendResponse } = require("../utils/responseHelper");

const createTable = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const { name } = req.body;

        if (!name) {
            return sendResponse(res, 400, "Table name is required");
        }

        const table = new Table({
            name,
            branch_id,
            created_by: req.user.id
        });

        await table.save();
        return sendResponse(res, 201, "Table created successfully", table);
    } catch (error) {
        console.error("Create Table Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const getTables = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const tables = await Table.find({ branch_id }).sort({ createdAt: -1 });
        return sendResponse(res, 200, "Tables fetched successfully", tables);
    } catch (error) {
        console.error("Get Tables Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const table = await Table.findById(id);
        if (!table) {
            return sendResponse(res, 404, "Table not found");
        }

        table.name = name;
        table.updated_by = req.user.id;
        await table.save();

        return sendResponse(res, 200, "Table updated successfully", table);
    } catch (error) {
        console.error("Update Table Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        await Table.findByIdAndDelete(id);
        return sendResponse(res, 200, "Table deleted successfully");
    } catch (error) {
        console.error("Delete Table Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

module.exports = {
    createTable,
    getTables,
    updateTable,
    deleteTable
};
