import User from "../models/userModel.js";
import Task from "../models/taskModel.js";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('performance.taskHistory.taskId', 'title');
        
        const creators = users.filter(u => u.role === 'creator');
        const executors = users.filter(u => u.role === 'executor');
        
        res.status(200).json({
            success: true,
            count: users.length,
            users,
            creators,
            executors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('performance.taskHistory.taskId', 'title');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Get user's tasks
        const createdTasks = await Task.find({ createdBy: user._id }).countDocuments();
        const executedTasks = await Task.find({ executedBy: user._id }).countDocuments();
        const completedTasks = await Task.find({ executedBy: user._id, status: 'completed' }).countDocuments();
        
        res.status(200).json({
            success: true,
            user,
            stats: {
                createdTasks,
                executedTasks,
                completedTasks,
                completionRate: executedTasks > 0 ? ((completedTasks / executedTasks) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getExecutors = async (req, res) => {
    try {
        const executors = await User.find({ role: 'executor' })
            .select('-password')
            .populate('performance.taskHistory.taskId', 'title');
        
        // Get current workload for each executor
        const executorsWithWorkload = await Promise.all(executors.map(async (executor) => {
            const activeTasks = await Task.countDocuments({
                executedBy: executor._id,
                status: 'in-progress'
            });
            
            const pendingTasks = await Task.countDocuments({
                executedBy: executor._id,
                status: 'pending'
            });
            
            return {
                ...executor.toObject(),
                currentWorkload: activeTasks,
                pendingTasks
            };
        }));
        
        res.status(200).json({
            success: true,
            count: executorsWithWorkload.length,
            executors: executorsWithWorkload
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['creator', 'executor'].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }
        
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};