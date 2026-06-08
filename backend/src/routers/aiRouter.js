import express from 'express';
import {
    getDependencySuggestions,
    calculateRiskScore,
    recommendPriority,
    predictDelay,
    recommendExecutor,
    getCriticalPath
} from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const aiRouter = express.Router();

// All AI routes require authentication
aiRouter.use(authMiddleware);

aiRouter.post("/dependencies/suggest", getDependencySuggestions);
aiRouter.get("/risk/:taskId", calculateRiskScore);
aiRouter.post("/priority/recommend", recommendPriority);
aiRouter.get("/delay/:taskId", predictDelay);
aiRouter.get("/executor/recommend/:taskId", recommendExecutor);
aiRouter.get("/critical-path", getCriticalPath);

export default aiRouter;