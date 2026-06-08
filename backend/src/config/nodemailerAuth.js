import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    pool: true,
    maxConnections: 5,
});

transporter.verify((err) => {
    if (err) console.error('❌ Email transporter error:', err.message);
    else console.log(`✅ Email ready (${process.env.EMAIL_USER})`);
});

const BASE = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM = `"FlowDeps" <${process.env.EMAIL_USER}>`;

const send = async (to, subject, html, text) => {
    try {
        const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
        console.log(`📧 Sent "${subject}" → ${to}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ Email failed "${subject}" → ${to}:`, err.message);
        return { success: false, error: err.message };
    }
};

const wrap = (title, accentColor, body) => `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:20px}
  .card{max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,${accentColor});padding:28px 32px;color:#fff}
  .hdr h1{margin:0;font-size:20px;font-weight:700}
  .hdr p{margin:6px 0 0;opacity:.85;font-size:13px}
  .body{padding:28px 32px;color:#1e293b;font-size:14px;line-height:1.7}
  .btn{display:inline-block;margin:20px 0;padding:11px 24px;background:${accentColor.split(',')[0].replace('135deg,','')};color:#fff;text-decoration:none;border-radius:7px;font-weight:600;font-size:14px}
  .footer{padding:16px 32px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center}
  .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;margin:2px}
</style></head><body>
<div class="card">
  <div class="hdr"><h1>${title}</h1></div>
  <div class="body">${body}</div>
  <div class="footer">© FlowDeps · Dependency-Based Task Execution System</div>
</div></body></html>`;

// ── 1. Welcome email (on register) ───────────────────────────────────────────
export const sendWelcomeEmail = (email, name) => send(
    email,
    '🎉 Welcome to FlowDeps!',
    wrap('Welcome to FlowDeps!', '#3b82f6, #8b5cf6', `
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been created successfully. You're all set to start managing tasks with dependency-aware execution.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Create tasks and define dependencies</li>
          <li>Claim available tasks as an executor</li>
          <li>Track progress with AI-powered insights</li>
        </ul>
        <a href="${BASE}/dashboard" class="btn">Go to Dashboard →</a>
    `),
    `Welcome to FlowDeps, ${name}! Your account is ready. Visit: ${BASE}/dashboard`
);

// ── 2. Notify executor when ALL dependencies of their task are completed ──────
export const sendDependencyCompletedNotification = (executorEmail, executorName, taskTitle, completedDepTitle, taskLink) => send(
    executorEmail,
    `✅ Task ready to start: ${taskTitle}`,
    wrap('All Dependencies Completed!', '#10b981, #3b82f6', `
        <p>Hi <strong>${executorName}</strong>,</p>
        <p>Great news — all dependencies for your task are now complete!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Your task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Last completed dep</td><td style="padding:8px">${completedDepTitle}</td></tr>
        </table>
        <p>You can now claim and start working on this task.</p>
        <a href="${taskLink}" class="btn">Start Task →</a>
    `),
    `Hi ${executorName}, all dependencies for "${taskTitle}" are done. Start here: ${taskLink}`
);

// ── 3. Notify creator when a task is delayed beyond estimated time ────────────
export const sendDelayAlert = (creatorEmail, creatorName, taskTitle, dueDate, delayDays, taskLink) => send(
    creatorEmail,
    `⚠️ Task delayed: ${taskTitle}`,
    wrap('Task Delay Alert', '#ef4444, #f59e0b', `
        <p>Hi <strong>${creatorName}</strong>,</p>
        <p>A task you created is running behind schedule.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Due date</td><td style="padding:8px">${new Date(dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</td></tr>
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Overdue by</td><td style="padding:8px;color:#ef4444;font-weight:600">${delayDays} day(s)</td></tr>
        </table>
        <p>Please review the task and take action to get it back on track.</p>
        <a href="${taskLink}" class="btn">Review Task →</a>
    `),
    `Hi ${creatorName}, task "${taskTitle}" is ${delayDays} day(s) overdue. Review: ${taskLink}`
);

// ── 4. Daily digest of blocked tasks (sent to creators) ──────────────────────
export const sendDailyBlockedDigest = (creatorEmail, creatorName, blockedTasks) => {
    const rows = blockedTasks.map(t => `
        <tr>
          <td style="padding:8px;font-weight:500">${t.title}</td>
          <td style="padding:8px;color:#64748b;font-size:12px">${t.missingDeps?.join(', ') || 'Unknown deps'}</td>
          <td style="padding:8px"><a href="${BASE}/tasks/${t._id}" style="color:#3b82f6;font-size:12px">View →</a></td>
        </tr>`).join('');

    return send(
        creatorEmail,
        `📊 Daily Digest: ${blockedTasks.length} blocked task(s)`,
        wrap('Daily Blocked Tasks Digest', '#8b5cf6, #3b82f6', `
            <p>Hi <strong>${creatorName}</strong>,</p>
            <p>Here is your daily summary of blocked tasks that need attention:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">Task</th>
                  <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">Waiting for</th>
                  <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">Link</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <a href="${BASE}/reports" class="btn">View Full Report →</a>
        `),
        `Hi ${creatorName}, you have ${blockedTasks.length} blocked task(s). Visit: ${BASE}/reports`
    );
};

// ── 5. Notify creator when executor completes their task ─────────────────────
export const sendTaskCompletionNotification = (creatorEmail, creatorName, taskTitle, executorName, taskLink) => send(
    creatorEmail,
    `✅ Task completed: ${taskTitle}`,
    wrap('Task Completed!', '#10b981, #3b82f6', `
        <p>Hi <strong>${creatorName}</strong>,</p>
        <p>Great news — one of your tasks has been completed!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Completed by</td><td style="padding:8px">${executorName}</td></tr>
        </table>
        <p>Review the completed work and update your project plan accordingly.</p>
        <a href="${taskLink}" class="btn">View Task →</a>
    `),
    `Hi ${creatorName}, task "${taskTitle}" was completed by ${executorName}. View: ${taskLink}`
);

// ── 6. Notify executor when a new task is created and assigned to them ────────
export const sendTaskAssignedNotification = (executorEmail, executorName, taskTitle, taskId, creatorName) => send(
    executorEmail,
    `📋 Task assigned: ${taskTitle}`,
    wrap('New Task Assigned', '#3b82f6, #8b5cf6', `
        <p>Hi <strong>${executorName}</strong>,</p>
        <p>A new task has been assigned to you by <strong>${creatorName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Assigned by</td><td style="padding:8px">${creatorName}</td></tr>
        </table>
        <a href="${BASE}/tasks/${taskId}" class="btn">View Task →</a>
    `),
    `Hi ${executorName}, task "${taskTitle}" was assigned to you by ${creatorName}. View: ${BASE}/tasks/${taskId}`
);

// ── 7. Notify ALL executors when a new task is created ───────────────────────
export const sendTaskCreatedNotification = (executorEmail, executorName, taskTitle, taskDescription, priority, dueDate, creatorName, taskLink) => {
    const dueDateStr = dueDate
        ? new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Not set';
    const priorityColor = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' }[priority] || '#3b82f6';

    return send(
        executorEmail,
        `🆕 New task available: ${taskTitle}`,
        wrap('New Task Created', '#3b82f6, #6366f1', `
            <p>Hi <strong>${executorName}</strong>,</p>
            <p>A new task has been created by <strong>${creatorName}</strong> and may be available for you to claim.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;color:#64748b;font-size:13px;width:110px">Task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
              ${taskDescription ? `<tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Description</td><td style="padding:8px;font-size:13px">${taskDescription.slice(0, 120)}${taskDescription.length > 120 ? '...' : ''}</td></tr>` : ''}
              <tr><td style="padding:8px;color:#64748b;font-size:13px">Priority</td><td style="padding:8px"><span style="background:${priorityColor}20;color:${priorityColor};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;border:1px solid ${priorityColor}40">${priority?.toUpperCase() || 'MEDIUM'}</span></td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Due date</td><td style="padding:8px">${dueDateStr}</td></tr>
              <tr><td style="padding:8px;color:#64748b;font-size:13px">Created by</td><td style="padding:8px">${creatorName}</td></tr>
            </table>
            <p style="font-size:13px;color:#64748b">Once its dependencies are completed (if any), the task will appear in your available tasks list.</p>
            <a href="${taskLink}" class="btn">View Task →</a>
        `),
        `Hi ${executorName}, new task "${taskTitle}" (${priority} priority) created by ${creatorName}. View: ${taskLink}`
    );
};

// ── 8. Notify executor 2 days before deadline ────────────────────────────────
export const sendUpcomingDeadlineReminder = (executorEmail, executorName, taskTitle, dueDate, daysLeft, taskLink) => send(
    executorEmail,
    `⏰ Deadline in ${daysLeft} day(s): ${taskTitle}`,
    wrap('Deadline Reminder', '#f59e0b, #ef4444', `
        <p>Hi <strong>${executorName}</strong>,</p>
        <p>This is a reminder that one of your tasks is approaching its deadline.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-size:13px;width:110px">Task</td><td style="padding:8px;font-weight:600">${taskTitle}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-size:13px">Due date</td><td style="padding:8px">${new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>
          <tr><td style="padding:8px;color:#64748b;font-size:13px">Time left</td><td style="padding:8px;color:#f59e0b;font-weight:700">${daysLeft} day(s) remaining</td></tr>
        </table>
        <p style="font-size:13px;color:#64748b">Please ensure the task is completed on time to avoid blocking dependent work.</p>
        <a href="${taskLink}" class="btn">Go to Task →</a>
    `),
    `Hi ${executorName}, task "${taskTitle}" is due in ${daysLeft} day(s). View: ${taskLink}`
);

// ── 9. Weekly summary for creators ───────────────────────────────────────────
export const sendWeeklySummary = (creatorEmail, creatorName, stats) => send(
    creatorEmail,
    `📊 Weekly Summary — FlowDeps`,
    wrap('Your Weekly Summary', '#8b5cf6, #3b82f6', `
        <p>Hi <strong>${creatorName}</strong>,</p>
        <p>Here's what happened across your tasks this week:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f0f4ff">
            <td style="padding:12px;font-size:22px;font-weight:700;color:#10b981;text-align:center">${stats.completedThisWeek}</td>
            <td style="padding:12px;font-size:22px;font-weight:700;color:#3b82f6;text-align:center">${stats.createdThisWeek}</td>
            <td style="padding:12px;font-size:22px;font-weight:700;color:#ef4444;text-align:center">${stats.blockedCount}</td>
          </tr>
          <tr>
            <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">Completed</td>
            <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">Created</td>
            <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">Still Blocked</td>
          </tr>
        </table>
        ${stats.blockedCount > 0 ? `<p style="color:#ef4444;font-size:13px">⚠️ You have <strong>${stats.blockedCount}</strong> blocked task(s) that need attention.</p>` : '<p style="color:#10b981;font-size:13px">✅ No blocked tasks — great work!</p>'}
        <a href="${BASE}/reports" class="btn">View Full Report →</a>
    `),
    `Hi ${creatorName}, weekly summary: ${stats.completedThisWeek} completed, ${stats.createdThisWeek} created, ${stats.blockedCount} blocked. View: ${BASE}/reports`
);

// ── 10. Notify creator when executor updates task status ──────────────────────
export const sendStatusUpdateNotification = (creatorEmail, creatorName, taskTitle, executorName, oldStatus, newStatus, taskLink) => {
    const STATUS_CONFIG = {
        'in-progress': { color: '#3b82f6', label: 'In Progress',  icon: '🔄' },
        'completed':   { color: '#10b981', label: 'Completed',    icon: '✅' },
        'blocked':     { color: '#ef4444', label: 'Blocked',      icon: '🚫' },
        'pending':     { color: '#94a3b8', label: 'Pending',      icon: '⏳' },
    };
    const cfg = STATUS_CONFIG[newStatus] || STATUS_CONFIG.pending;

    return send(
        creatorEmail,
        `${cfg.icon} Task status update: "${taskTitle}"`,
        wrap(`Task Status Changed to ${cfg.label}`, `${cfg.color}, #8b5cf6`, `
            <p>Hi <strong>${creatorName}</strong>,</p>
            <p>An executor has updated the status of one of your tasks.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr>
                <td style="padding:10px;color:#64748b;font-size:13px;width:120px">Task</td>
                <td style="padding:10px;font-weight:600;font-size:15px">${taskTitle}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:10px;color:#64748b;font-size:13px">Updated by</td>
                <td style="padding:10px">${executorName}</td>
              </tr>
              <tr>
                <td style="padding:10px;color:#64748b;font-size:13px">Previous status</td>
                <td style="padding:10px">
                  <span style="background:${(STATUS_CONFIG[oldStatus]?.color || '#94a3b8')}20;color:${STATUS_CONFIG[oldStatus]?.color || '#94a3b8'};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;border:1px solid ${(STATUS_CONFIG[oldStatus]?.color || '#94a3b8')}40">
                    ${STATUS_CONFIG[oldStatus]?.label || oldStatus}
                  </span>
                </td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:10px;color:#64748b;font-size:13px">New status</td>
                <td style="padding:10px">
                  <span style="background:${cfg.color}20;color:${cfg.color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;border:1px solid ${cfg.color}40">
                    ${cfg.label}
                  </span>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;color:#64748b">
              ${newStatus === 'blocked' ? '⚠️ This task is now blocked and may impact dependent tasks.' : ''}
              ${newStatus === 'completed' ? '🎉 Great news — this task is done!' : ''}
              ${newStatus === 'in-progress' ? '🔄 Work has started on this task.' : ''}
            </p>
            <a href="${taskLink}" class="btn">View Task →</a>
        `),
        `Hi ${creatorName}, task "${taskTitle}" status changed from ${oldStatus} → ${newStatus} by ${executorName}. View: ${taskLink}`
    );
};

// ── Stubs kept for backward compatibility ─────────────────────────────────────
export const sendVerificationEmail = () => Promise.resolve({ success: true });
export const sendPasswordResetEmail = () => Promise.resolve({ success: true });
export const sendDailyDigest = () => Promise.resolve({ success: true });

export default transporter;
