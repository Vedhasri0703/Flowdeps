import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import {
    sendDelayAlert,
    sendTaskAssignedNotification,
    sendTaskCompletionNotification,
    sendDependencyCompletedNotification,
    sendTaskCreatedNotification,
    sendUpcomingDeadlineReminder,
    sendStatusUpdateNotification,
} from "../config/nodemailerAuth.js";
import { notifyExecutorDepsCompleted } from "../utils/automations.js";

// Helper function to check if all dependencies are completed
const areDependenciesCompleted = async (dependencies) => {
    if (!dependencies || dependencies.length === 0) return true;
    
    const tasks = await Task.find({ _id: { $in: dependencies } });
    return tasks.every(task => task.status === 'completed');
};

// Helper function to check for circular dependencies
const hasCircularDependency = async (taskId, dependencyId, visited = new Set()) => {
    if (visited.has(dependencyId.toString())) return true;
    visited.add(dependencyId.toString());
    
    const dependency = await Task.findById(dependencyId).populate('dependencies');
    if (!dependency) return false;
    
    for (const dep of dependency.dependencies) {
        if (dep._id.toString() === taskId?.toString()) return true;
        if (await hasCircularDependency(taskId, dep._id, visited)) return true;
    }
    return false;
};

// Helper function to check for delayed tasks and send alerts
const checkAndSendDelayAlerts = async (task) => {
    try {
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        
        if (dueDate < today && task.status !== 'completed') {
            const delayDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            
            // Send alert to task creator
            const creator = await User.findById(task.createdBy);
            if (creator && creator.notificationPreferences?.emailNotifications) {
                await sendDelayAlert(
                    creator.email,
                    creator.name,
                    task.title,
                    task.dueDate,
                    delayDays,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`
                );
            }
            
            // Send alert to executor if assigned
            if (task.executedBy) {
                const executor = await User.findById(task.executedBy);
                if (executor && executor.notificationPreferences?.emailNotifications) {
                    await sendDelayAlert(
                        executor.email,
                        executor.name,
                        task.title,
                        task.dueDate,
                        delayDays,
                        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error sending delay alerts:', error);
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, dependencies, estimatedTime, priority, dueDate, tags } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({ 
                success: false,
                message: "Title is required" 
            });
        }
        
        if (!dueDate) {
            return res.status(400).json({ 
                success: false,
                message: "Due date is required" 
            });
        }

        // Ensure dependencies is an array
        const taskDependencies = Array.isArray(dependencies) ? dependencies : [];

        // Check for circular dependencies
        for (const depId of taskDependencies) {
            if (await hasCircularDependency(null, depId)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Circular dependency detected" 
                });
            }
        }

        const newTask = await Task.create({
            title,
            description: description || '',
            dependencies: taskDependencies,
            createdBy: req.user._id,
            estimatedTime: estimatedTime || 0,
            priority: priority || 'medium',
            dueDate,
            tags: tags || []
        });

        // Add task to history
        newTask.history.push({
            status: 'pending',
            changedBy: req.user._id,
            comment: 'Task created'
        });
        await newTask.save();

        // Populate the task before returning
        const populatedTask = await Task.findById(newTask._id)
            .populate('createdBy', 'name email')
            .populate('dependencies', 'title status');

        // Notify all executors about the new task (fire-and-forget)
        const taskLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${newTask._id}`;
        const creator = await User.findById(req.user._id).select('name');
        const allExecutors = await User.find({ role: 'executor' }).select('name email notificationPreferences');
        for (const executor of allExecutors) {
            if (executor.notificationPreferences?.emailNotifications !== false) {
                sendTaskCreatedNotification(
                    executor.email, executor.name, newTask.title,
                    newTask.description, newTask.priority, newTask.dueDate,
                    creator?.name || 'A creator', taskLink
                ).catch(err => console.error('Task created notification failed:', err));
            }
        }

        // Notify executor if task is created with all dependencies already completed
        const allDepsComplete = await areDependenciesCompleted(taskDependencies);
        if (allDepsComplete && taskDependencies.length > 0) {
            if (newTask.executedBy) {
                const executor = await User.findById(newTask.executedBy).select('name email notificationPreferences');
                if (executor?.email && executor.notificationPreferences?.emailNotifications !== false) {
                    await sendDependencyCompletedNotification(
                        executor.email, executor.name, newTask.title, 'All dependencies', taskLink
                    ).catch(err => console.error('Dep notification failed:', err));
                }
            }
        }

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: populatedTask
        });

    } catch (error) {
        console.error("Error in createTask:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getAllTasks = async (req, res) => {
    try {
        let query = {};
        
        // If executor, only show available tasks
        if (req.user.role === 'executor') {
            const allTasks = await Task.find().populate('dependencies');
            const availableTaskIds = [];
            
            for (const task of allTasks) {
                const depsCompleted = await areDependenciesCompleted(task.dependencies);
                if (depsCompleted && task.status === 'pending') {
                    availableTaskIds.push(task._id);
                }
            }
            
            query._id = { $in: availableTaskIds };
        }
        
        const tasks = await Task.find(query)
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status')
            .sort({ priority: -1, createdAt: -1 });
        
        res.status(200).json({ 
            success: true,
            tasks 
        });
    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId)
            .populate('createdBy', 'name email avatar')
            .populate('executedBy', 'name email avatar')
            .populate('dependencies', 'title status priority dueDate')
            .populate('dependentTasks', 'title status priority')
            .populate('comments.user', 'name email avatar');
        
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }
        
        // Check if executor can view this task
        if (req.user.role === 'executor') {
            const depsCompleted = await areDependenciesCompleted(task.dependencies);
            if (!depsCompleted && task.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: "You cannot view this task yet - dependencies not completed"
                });
            }
        }
        
        res.status(200).json({ 
            success: true,
            task 
        });
    } catch (error) {
        console.error('Get task by id error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const executeTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status, actualTime } = req.body;
        
        const task = await Task.findById(taskId)
            .populate('dependencies', 'status title')
            .populate('createdBy', 'name email');
        
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }

        // Check if user is executor
        if (req.user.role !== 'executor') {
            return res.status(403).json({ 
                success: false,
                message: "Only executors can execute tasks" 
            });
        }

        // Check if task is already assigned to another executor
        if (task.executedBy && task.executedBy.toString() !== req.user._id.toString()) {
            return res.status(400).json({ 
                success: false,
                message: "Task is already assigned to another executor" 
            });
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['in-progress'],
            'in-progress': ['completed', 'blocked'],
            'blocked': ['pending'],
            'completed': []
        };

        if (!validTransitions[task.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${task.status} to ${status}`
            });
        }

        // Check dependencies for 'in-progress' status
        if (status === 'in-progress') {
            const depsCompleted = await areDependenciesCompleted(task.dependencies);
            if (!depsCompleted) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot start task. Dependencies are not completed",
                    incompleteDependencies: task.dependencies
                        .filter(dep => dep.status !== 'completed')
                        .map(dep => ({ id: dep._id, title: dep.title, status: dep.status }))
                });
            }
        }

        // Handle task claiming (in-progress)
        if (status === 'in-progress' && !task.executedBy) {
            const executor = await User.findById(req.user._id);
            const creator = await User.findById(task.createdBy);
            
            // Send assignment notification to executor
            if (executor && executor.notificationPreferences?.emailNotifications) {
                await sendTaskAssignedNotification(
                    executor.email,
                    executor.name,
                    task.title,
                    task._id,
                    creator.name
                );
            }

            // Notify creator that work has started
            if (creator && creator.notificationPreferences?.emailNotifications) {
                sendStatusUpdateNotification(
                    creator.email, creator.name, task.title,
                    executor.name, task.status, status,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`
                ).catch(err => console.error('Status update email failed:', err));
            }
        }

        // Notify creator on blocked or any other transition (not already handled above)
        if (status !== 'in-progress' || task.executedBy) {
            const creator = await User.findById(task.createdBy).select('name email notificationPreferences');
            const executorUser = await User.findById(req.user._id).select('name');
            if (creator && creator.notificationPreferences?.emailNotifications && status !== 'completed') {
                sendStatusUpdateNotification(
                    creator.email, creator.name, task.title,
                    executorUser?.name || 'An executor', task.status, status,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`
                ).catch(err => console.error('Status update email failed:', err));
            }
        }

        // Update task
        const updateData = {
            status,
            executedBy: req.user._id,
            history: [...task.history, {
                status,
                changedBy: req.user._id,
                comment: `Task marked as ${status}`
            }]
        };

        if (status === 'completed') {
            updateData.actualTime = actualTime || 0;
            
            // Update executor performance
            const executor = await User.findById(req.user._id);
            executor.performance.tasksCompleted += 1;
            executor.performance.taskHistory.push({
                taskId: task._id,
                completedAt: new Date(),
                estimatedTime: task.estimatedTime,
                actualTime: actualTime || 0
            });
            await executor.save();
            
            // Send completion notification to creator
            const creator = await User.findById(task.createdBy);
            const executorUser = await User.findById(req.user._id);
            
            if (creator && creator.notificationPreferences?.emailNotifications) {
                await sendTaskCompletionNotification(
                    creator.email,
                    creator.name,
                    task.title,
                    executorUser.name,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`
                );
            }
            
            // Check and notify dependent tasks that this task is completed
            const dependentTasks = await Task.find({ dependencies: taskId });
            for (const dependentTask of dependentTasks) {
                const allDepsCompleted = await areDependenciesCompleted(dependentTask.dependencies);
                if (allDepsCompleted && dependentTask.executedBy) {
                    const dependentExecutor = await User.findById(dependentTask.executedBy);
                    if (dependentExecutor && dependentExecutor.notificationPreferences?.emailNotifications) {
                        await sendDependencyCompletedNotification(
                            dependentExecutor.email,
                            dependentExecutor.name,
                            dependentTask.title,
                            task.title,
                            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${dependentTask._id}`
                        );
                    }
                }
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true }
        ).populate('createdBy', 'name email')
         .populate('executedBy', 'name email')
         .populate('dependencies', 'title status');

        // Check for delays after update
        await checkAndSendDelayAlerts(updatedTask);

        res.status(200).json({
            success: true,
            message: `Task ${status === 'in-progress' ? 'claimed' : 'updated'} successfully`,
            task: updatedTask
        });
    } catch (error) {
        console.error('Execute task error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const addComment = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { text } = req.body;
        
        const task = await Task.findById(taskId)
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email');
            
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }
        
        task.comments.push({
            user: req.user._id,
            text,
            createdAt: new Date()
        });
        
        await task.save();
        
        // Send notification to task creator about new comment (if not the commenter)
        if (task.createdBy._id.toString() !== req.user._id.toString()) {
            const creator = await User.findById(task.createdBy._id);
            if (creator && creator.notificationPreferences?.emailNotifications) {
                // Optional: Send email notification about new comment
                console.log(`📧 New comment on task "${task.title}" - notify creator: ${creator.email}`);
            }
        }
        
        const populatedTask = await Task.findById(taskId)
            .populate('comments.user', 'name email avatar');
        
        res.status(200).json({
            success: true,
            message: "Comment added successfully",
            comment: populatedTask.comments[populatedTask.comments.length - 1]
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// All tasks — only tasks created by or assigned to current user (for "My Tasks" tab)
export const getAllTasksForCreator = async (req, res) => {
    try {
        const tasks = await Task.find({
            $or: [
                { createdBy: req.user._id },
                { executedBy: req.user._id },
            ]
        })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getCreatorTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ createdBy: req.user._id })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ 
            success: true,
            tasks 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getExecutorTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ executedBy: req.user._id })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ 
            success: true,
            tasks 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getAvailableTasks = async (req, res) => {
    try {
        // Get tasks with no executor assigned and status pending
        const tasks = await Task.find({
            executedBy: null,
            status: 'pending'
        }).populate('dependencies', 'status title');
        
        // Filter tasks where all dependencies are completed
        const availableTasks = [];
        for (const task of tasks) {
            const depsCompleted = await areDependenciesCompleted(task.dependencies);
            if (depsCompleted) {
                availableTasks.push(task);
            }
        }

        // Populate additional fields
        const populatedTasks = await Task.populate(availableTasks, [
            { path: 'createdBy', select: 'name email' },
            { path: 'dependencies', select: 'title status priority' }
        ]);

        res.status(200).json({ 
            success: true,
            count: populatedTasks.length,
            tasks: populatedTasks 
        });
    } catch (error) {
        console.error('Get available tasks error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, description, priority, estimatedTime, dueDate, tags, dependencies } = req.body;
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }

        // Check if user is the creator
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "Only task creator can update task details" 
            });
        }

        // Cannot update if task is in progress or completed
        if (task.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: "Cannot update task that is already in progress or completed" 
            });
        }

        // Check for circular dependencies if updating
        if (dependencies && dependencies.length > 0) {
            for (const depId of dependencies) {
                if (await hasCircularDependency(taskId, depId)) {
                    return res.status(400).json({ 
                        success: false,
                        message: "Circular dependency detected" 
                    });
                }
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            {
                title: title || task.title,
                description: description || task.description,
                priority: priority || task.priority,
                estimatedTime: estimatedTime || task.estimatedTime,
                dueDate: dueDate || task.dueDate,
                tags: tags || task.tags,
                dependencies: dependencies || task.dependencies
            },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email')
         .populate('dependencies', 'title status');

        // Check for delays after update
        await checkAndSendDelayAlerts(updatedTask);

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }

        // Check if user is the creator
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "Only task creator can delete tasks" 
            });
        }

        // Check if any tasks depend on this
        const dependentTasks = await Task.find({ dependencies: taskId });
        if (dependentTasks.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete task. ${dependentTasks.length} task(s) depend on it`,
                dependentTasks: dependentTasks.map(t => ({ id: t._id, title: t.title }))
            });
        }

        await Task.findByIdAndDelete(taskId);
        
        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        if (req.user.role === 'creator') {
            const totalTasks = await Task.countDocuments();
            const completedTasks = await Task.countDocuments({ status: 'completed' });
            const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
            const pendingTasks = await Task.countDocuments({ status: 'pending' });
            const blockedTasks = await Task.countDocuments({ status: 'blocked' });
            
            const executors = await User.find({ role: 'executor' }).select('-password');
            
            const recentTasks = await Task.find()
                .populate('createdBy', 'name')
                .populate('executedBy', 'name')
                .sort('-createdAt')
                .limit(10);
            
            const tasksByPriority = {
                low: await Task.countDocuments({ priority: 'low' }),
                medium: await Task.countDocuments({ priority: 'medium' }),
                high: await Task.countDocuments({ priority: 'high' }),
                critical: await Task.countDocuments({ priority: 'critical' })
            };
            
            const tasksByStatus = {
                pending: pendingTasks,
                'in-progress': inProgressTasks,
                completed: completedTasks,
                blocked: blockedTasks
            };
            
            const completionRate = totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
            
            res.json({
                success: true,
                stats: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks,
                    pendingTasks,
                    blockedTasks,
                    completionRate,
                    executors,
                    recentTasks,
                    tasksByPriority,
                    tasksByStatus
                }
            });
        } else {
            // Executor dashboard
            const allTasks = await Task.find();
            const myTasks = await Task.find({ executedBy: req.user._id });
            
            const availableTasks = [];
            for (const task of allTasks) {
                const depsCompleted = await areDependenciesCompleted(task.dependencies);
                if (depsCompleted && task.status === 'pending' && !task.executedBy) {
                    availableTasks.push(task);
                }
            }
            
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - 7);
            const completedThisWeek = await Task.countDocuments({
                executedBy: req.user._id,
                status: 'completed',
                updatedAt: { $gte: thisWeek }
            });
            
            const myInProgress = myTasks.filter(t => t.status === 'in-progress');
            const myCompleted = myTasks.filter(t => t.status === 'completed');
            
            res.json({
                success: true,
                stats: {
                    availableTasksCount: availableTasks.length,
                    myInProgressCount: myInProgress.length,
                    myCompletedCount: myCompleted.length,
                    completedThisWeek,
                    totalCompleted: myCompleted.length,
                    availableTasks: availableTasks.slice(0, 5),
                    myTasks: myInProgress.slice(0, 5),
                    recentCompleted: myCompleted.slice(0, 5)
                }
            });
        }
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getTaskDependencyGraph = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        const task = await Task.findById(taskId)
            .populate({
                path: 'dependencies',
                select: 'title status priority',
                populate: {
                    path: 'dependencies',
                    select: 'title status'
                }
            })
            .populate({
                path: 'dependentTasks',
                select: 'title status priority',
                populate: {
                    path: 'dependencies',
                    select: 'title status'
                }
            });
        
        if (!task) {
            return res.status(404).json({ 
                success: false,
                message: "Task not found" 
            });
        }

        res.status(200).json({
            success: true,
            task: {
                id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority
            },
            dependencies: task.dependencies,
            dependentTasks: task.dependentTasks
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Additional function to manually check and send delay alerts for all tasks
export const checkAllTasksForDelays = async (req, res) => {
    try {
        const tasks = await Task.find({ status: { $ne: 'completed' } });
        let alertsSent = 0;
        
        for (const task of tasks) {
            await checkAndSendDelayAlerts(task);
            alertsSent++;
        }
        
        res.status(200).json({
            success: true,
            message: `Checked ${alertsSent} tasks for delays`,
            tasksChecked: alertsSent
        });
    } catch (error) {
        console.error('Check all tasks for delays error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};