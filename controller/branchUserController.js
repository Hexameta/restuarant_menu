const { User } = require("../model/userModel");
const bcrypt = require("bcrypt");
const { sendResponse } = require("../utils/responseHelper");

const createBranchUser = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return sendResponse(res, 400, "All fields are required");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return sendResponse(res, 400, "User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            Password: hashedPassword,
            role,
            branch_id
        });

        await user.save();
        return sendResponse(res, 201, "User created successfully", {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error("Create Branch User Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const getBranchUsers = async (req, res) => {
    try {
        const branch_id = req.user.branchId;
        const users = await User.find({ branch_id, role: { $ne: 'superadmin' } })
            .select("-Password")
            .sort({ createdAt: -1 });
        return sendResponse(res, 200, "Branch users fetched successfully", users);
    } catch (error) {
        console.error("Get Branch Users Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

const deleteBranchUser = async (req, res) => {
    try {
        const { id } = req.params;
        const branch_id = req.user.branchId;

        const user = await User.findOne({ _id: id, branch_id });
        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        await User.findByIdAndDelete(id);
        return sendResponse(res, 200, "User deleted successfully");
    } catch (error) {
        console.error("Delete Branch User Error:", error);
        return sendResponse(res, 500, "Internal Server Error");
    }
};

module.exports = {
    createBranchUser,
    getBranchUsers,
    deleteBranchUser
};
