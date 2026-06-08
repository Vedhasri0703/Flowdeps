import express from 'express';
import {
    getAllUsers,
    getUserById,
    getExecutors,
    updateUserRole
} from '../controllers/userController.js';
import { authMiddleware, creatorMiddleware } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

// All user routes require authentication
userRouter.use(authMiddleware);

// Creator only routes
userRouter.get("/", creatorMiddleware, getAllUsers);
userRouter.put("/:id/role", creatorMiddleware, updateUserRole);
userRouter.get("/executors", getExecutors);

// Common routes
userRouter.get("/:id", getUserById);

export default userRouter;