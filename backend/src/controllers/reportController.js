import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

export const exportTasksCSV = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email');
        
        // CSV headers
        let csv = 'ID,Title,Status,Priority,Created By,Executed By,Due Date,Estimated Time (hrs),Actual Time (hrs),Tags,Created At\n';
        
        tasks.forEach(task => {
            csv += `"${task._id}","${task.title.replace(/"/g, '""')}",${task.status},${task.priority},"${task.createdBy?.name || 'N/A'}","${task.executedBy?.name || 'N/A'}",${new Date(task.dueDate).toLocaleDateString()},${task.estimatedTime},${task.actualTime},"${(task.tags || []).join(';')}",${new Date(task.createdAt).toLocaleDateString()}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDependencyHealth = async (req, res) => {
    try {
        const tasks = await Task.find().populate('dependencies');
        const tasksWithDeps = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
        
        let healthyTasks = 0;
        let blockedTasks = 0;
        let waitingTasks = 0;
        const dependencyIssues = [];
        
        for (const task of tasksWithDeps) {
            const incompleteDeps = task.dependencies.filter(dep => dep.status !== 'completed');
            
            if (incompleteDeps.length === 0) {
                healthyTasks++;
            } else if (task.status === 'blocked') {
                blockedTasks++;
                dependencyIssues.push({
                    taskId: task._id,
                    title: task.title,
                    missingDependencies: incompleteDeps.map(dep => ({ id: dep._id, title: dep.title, status: dep.status }))
                });
            } else {
                waitingTasks++;
            }
        }
        
        const totalDependentTasks = tasksWithDeps.length;
        const healthScore = totalDependentTasks > 0 ? ((healthyTasks / totalDependentTasks) * 100).toFixed(1) : 100;
        
        res.json({
            success: true,
            health: {
                totalTasksWithDependencies: totalDependentTasks,
                healthyTasks,
                blockedTasks,
                waitingTasks,
                healthScore,
                healthStatus: healthScore > 80 ? 'Good' : healthScore > 50 ? 'Warning' : 'Critical',
                dependencyIssues: dependencyIssues.slice(0, 10)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTeamPerformance = async (req, res) => {
    try {
        const executors = await User.find({ role: 'executor' });
        const performance = [];
        
        for (const executor of executors) {
            const completedTasks = await Task.find({
                executedBy: executor._id,
                status: 'completed'
            });
            
            const totalEstimatedTime = completedTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
            const totalActualTime = completedTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
            const efficiency = totalEstimatedTime > 0 ? (totalEstimatedTime / totalActualTime) * 100 : 0;
            
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - 7);
            const tasksThisWeek = completedTasks.filter(t => t.updatedAt >= thisWeek).length;
            
            performance.push({
                id: executor._id,
                name: executor.name,
                email: executor.email,
                totalCompleted: completedTasks.length,
                tasksThisWeek,
                averageEfficiency: Math.round(efficiency),
                totalEstimatedHours: totalEstimatedTime,
                totalActualHours: totalActualTime,
                avatar: executor.avatar
            });
        }
        
        // Sort by completed tasks
        performance.sort((a, b) => b.totalCompleted - a.totalCompleted);
        
        // Calculate team averages
        const teamAverage = {
            avgCompletionRate: performance.reduce((sum, p) => sum + p.totalCompleted, 0) / performance.length || 0,
            avgEfficiency: performance.reduce((sum, p) => sum + p.averageEfficiency, 0) / performance.length || 0,
            totalTasksCompleted: performance.reduce((sum, p) => sum + p.totalCompleted, 0),
            activeExecutors: performance.length
        };
        
        res.json({
            success: true,
            teamPerformance: performance,
            teamAverage,
            topPerformer: performance[0] || null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTaskAnalytics = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
        const pendingTasks = await Task.countDocuments({ status: 'pending' });
        const blockedTasks = await Task.countDocuments({ status: 'blocked' });
        
        // Tasks by priority
        const priorityStats = {
            critical: await Task.countDocuments({ priority: 'critical' }),
            high: await Task.countDocuments({ priority: 'high' }),
            medium: await Task.countDocuments({ priority: 'medium' }),
            low: await Task.countDocuments({ priority: 'low' })
        };
        
        // Completion rate by priority
        const completionByPriority = {};
        for (const priority of ['critical', 'high', 'medium', 'low']) {
            const total = await Task.countDocuments({ priority });
            const completed = await Task.countDocuments({ priority, status: 'completed' });
            completionByPriority[priority] = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        }
        
        // Average completion time
        const completedTasksList = await Task.find({ status: 'completed', actualTime: { $gt: 0 } });
        const avgCompletionTime = completedTasksList.length > 0 
            ? (completedTasksList.reduce((sum, t) => sum + t.actualTime, 0) / completedTasksList.length).toFixed(1)
            : 0;
        
        // Tasks created over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const tasksByDate = await Task.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        res.json({
            success: true,
            analytics: {
                overview: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks,
                    pendingTasks,
                    blockedTasks,
                    completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
                },
                priorityStats,
                completionByPriority,
                averageCompletionTimeHours: parseFloat(avgCompletionTime),
                tasksCreatedLast30Days: tasksByDate,
                estimatedVsActual: {
                    totalEstimated: await Task.aggregate([{ $group: { _id: null, total: { $sum: "$estimatedTime" } } }]),
                    totalActual: await Task.aggregate([{ $group: { _id: null, total: { $sum: "$actualTime" } } }])
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};