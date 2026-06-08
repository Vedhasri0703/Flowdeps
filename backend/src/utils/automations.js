import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import {
    sendDependencyCompletedNotification,
    sendDelayAlert,
    sendDailyBlockedDigest,
    sendUpcomingDeadlineReminder,
    sendWeeklySummary,
} from "../config/nodemailerAuth.js";

// ── Automation 1: Daily dependency check (runs at 9 AM) ──────────────────────
// Sends delay alerts to creators for tasks that are overdue
export const checkDependenciesAutomation = async () => {
    try {
        console.log('🔄 Running daily dependency check...');

        const overdueTasks = await Task.find({
            status: { $ne: 'completed' },
            dueDate: { $lt: new Date() },
        }).populate('createdBy', 'name email notificationPreferences');

        let alertsSent = 0;
        for (const task of overdueTasks) {
            const creator = task.createdBy;
            if (!creator?.email) continue;
            if (creator.notificationPreferences?.emailNotifications === false) continue;

            const delayDays = Math.ceil((new Date() - new Date(task.dueDate)) / 86400000);
            const taskLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`;

            await sendDelayAlert(creator.email, creator.name, task.title, task.dueDate, delayDays, taskLink);
            alertsSent++;
        }

        console.log(`✅ Daily check done. Sent ${alertsSent} delay alert(s).`);
        return { alertsSent };
    } catch (error) {
        console.error('Daily dependency check error:', error);
        return { alertsSent: 0 };
    }
};

// ── Automation 2: Daily blocked tasks digest (runs at 9 AM) ──────────────────
export const dailyBlockedDigestAutomation = async () => {
    try {
        console.log('📊 Running daily blocked digest...');

        const blockedTasks = await Task.find({ status: 'blocked' })
            .populate('dependencies', 'title status');

        if (blockedTasks.length === 0) {
            console.log('✅ No blocked tasks today.');
            return;
        }

        const creators = await User.find({
            role: 'creator',
            'notificationPreferences.emailNotifications': { $ne: false },
        });

        const digestData = blockedTasks.map(t => ({
            _id: t._id,
            title: t.title,
            missingDeps: t.dependencies
                .filter(d => d.status !== 'completed')
                .map(d => d.title),
        }));

        for (const creator of creators) {
            await sendDailyBlockedDigest(creator.email, creator.name, digestData);
        }

        console.log(`✅ Blocked digest sent to ${creators.length} creator(s).`);
    } catch (error) {
        console.error('Daily blocked digest error:', error);
    }
};

// ── Automation 3: Upcoming deadline reminder for executors (2 days before) ───
export const upcomingDeadlineReminderAutomation = async () => {
    try {
        console.log('⏰ Running upcoming deadline reminder...');

        const now = new Date();
        const in2Days = new Date(now);
        in2Days.setDate(in2Days.getDate() + 2);

        // Tasks due within the next 2 days, not yet completed, with an executor
        const upcomingTasks = await Task.find({
            status: { $in: ['pending', 'in-progress'] },
            dueDate: { $gte: now, $lte: in2Days },
            executedBy: { $ne: null },
        }).populate('executedBy', 'name email notificationPreferences');

        let remindersSent = 0;
        for (const task of upcomingTasks) {
            const executor = task.executedBy;
            if (!executor?.email) continue;
            if (executor.notificationPreferences?.emailNotifications === false) continue;

            const daysLeft = Math.ceil((new Date(task.dueDate) - now) / 86400000);
            const taskLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`;

            await sendUpcomingDeadlineReminder(
                executor.email, executor.name, task.title, task.dueDate, daysLeft, taskLink
            );
            remindersSent++;
        }

        console.log(`✅ Deadline reminders sent: ${remindersSent}`);
        return { remindersSent };
    } catch (error) {
        console.error('Deadline reminder error:', error);
        return { remindersSent: 0 };
    }
};

// ── Automation 4: Weekly summary for creators (runs Friday 5 PM) ─────────────
export const weeklySummaryAutomation = async () => {
    try {
        console.log('📊 Running weekly summary...');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const completedThisWeek = await Task.countDocuments({ status: 'completed', updatedAt: { $gte: oneWeekAgo } });
        const createdThisWeek   = await Task.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const blockedCount      = await Task.countDocuments({ status: 'blocked' });

        const stats = { completedThisWeek, createdThisWeek, blockedCount };

        // Send to all creators with notifications enabled
        const creators = await User.find({
            role: 'creator',
            'notificationPreferences.emailNotifications': { $ne: false },
        });

        for (const creator of creators) {
            await sendWeeklySummary(creator.email, creator.name, stats);
        }

        console.log(`✅ Weekly summary sent to ${creators.length} creator(s).`);
        return stats;
    } catch (error) {
        console.error('Weekly summary error:', error);
    }
};

// ── Trigger: notify executor when ALL deps of their task are completed ────────
export const notifyExecutorDepsCompleted = async (completedTaskId) => {
    try {
        // Find tasks that list completedTaskId as a dependency
        const dependentTasks = await Task.find({ dependencies: completedTaskId })
            .populate('dependencies', 'status title')
            .populate('executedBy', 'name email notificationPreferences');

        for (const task of dependentTasks) {
            const allDone = task.dependencies.every(d => d.status === 'completed');
            if (!allDone) continue;

            const executor = task.executedBy;
            if (!executor?.email) continue;
            if (executor.notificationPreferences?.emailNotifications === false) continue;

            const completedTask = await Task.findById(completedTaskId).select('title');
            const taskLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks/${task._id}`;

            await sendDependencyCompletedNotification(
                executor.email,
                executor.name,
                task.title,
                completedTask?.title || 'A dependency',
                taskLink
            );
            console.log(`📧 Notified ${executor.email} — task "${task.title}" is now unblocked.`);
        }
    } catch (error) {
        console.error('notifyExecutorDepsCompleted error:', error);
    }
};
