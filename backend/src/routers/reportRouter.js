import express from 'express';
import {
    exportTasksCSV,
    getDependencyHealth,
    getTeamPerformance,
    getTaskAnalytics
} from '../controllers/reportController.js';
import { authMiddleware, creatorMiddleware } from '../middleware/authMiddleware.js';

const reportRouter = express.Router();

// All report routes require authentication and creator role
reportRouter.use(authMiddleware);
reportRouter.use(creatorMiddleware);

reportRouter.get("/tasks/export", exportTasksCSV);
reportRouter.get("/dependency-health", getDependencyHealth);
reportRouter.get("/team-performance", getTeamPerformance);
reportRouter.get("/analytics", getTaskAnalytics);

export default reportRouter;