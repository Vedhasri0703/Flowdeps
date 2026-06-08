import express from 'express';
import mongoose from 'mongoose';
import {
    createTask,
    getAllTasks,
    getAllTasksForCreator,
    getTaskById,
    executeTask,
    getCreatorTasks,
    getExecutorTasks,
    getAvailableTasks,
    updateTask,
    deleteTask,
    addComment,
    getDashboardStats,
    getTaskDependencyGraph
} from '../controllers/taskController.js';
import { authMiddleware, creatorMiddleware, executorMiddleware } from '../middleware/authMiddleware.js';

const taskRouter = express.Router();

const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid task ID'
        });
    }
    next();
};

// Apply authMiddleware to ALL task routes
taskRouter.use(authMiddleware);

// Dashboard stats (both roles)
taskRouter.get("/dashboard", getDashboardStats);

// Creator routes
taskRouter.post("/create", creatorMiddleware, createTask);
taskRouter.get("/creator", creatorMiddleware, getCreatorTasks);
taskRouter.put("/:id", validateObjectId, creatorMiddleware, updateTask);
taskRouter.delete("/:id", validateObjectId, creatorMiddleware, deleteTask);

// Executor routes
taskRouter.get("/executor", executorMiddleware, getExecutorTasks);
taskRouter.get("/available", executorMiddleware, getAvailableTasks);
taskRouter.put("/execute/:id", validateObjectId, executorMiddleware, executeTask);

// Comment routes
taskRouter.post("/:id/comments", validateObjectId, addComment);

// Common routes (accessible to both with auth)
taskRouter.get("/all", getAllTasksForCreator);   // must be before /:id
taskRouter.get("/", getAllTasks);
taskRouter.get("/:id", validateObjectId, getTaskById);
taskRouter.get("/dependency/:id", validateObjectId, getTaskDependencyGraph);

export default taskRouter;