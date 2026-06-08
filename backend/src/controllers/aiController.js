import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

// Feature 1: Smart Dependency Suggestions (tag-based + keyword matching)
export const getDependencySuggestions = async (req, res) => {
    try {
        const { title, description, tags, taskId, existingDependencies } = req.body;
        const inputText = `${title} ${description || ''}`.toLowerCase();
        const inputTags = Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : [];

        const query = { status: { $in: ['pending', 'in-progress', 'completed'] } };
        if (taskId) query._id = { $ne: taskId };

        const existingTasks = await Task.find(query).select('_id title description status priority tags');

        const suggestions = [];

        for (const task of existingTasks) {
            // Skip tasks already added as dependencies
            if (existingDependencies && existingDependencies.includes(task._id.toString())) continue;

            let score = 0;
            const taskTags = Array.isArray(task.tags) ? task.tags.map(t => t.toLowerCase()) : [];
            const taskText = `${task.title} ${task.description || ''}`.toLowerCase();

            // ── Tag overlap (strongest signal, 40 pts per match) ──
            let tagMatches = 0;
            for (const tag of inputTags) {
                if (taskTags.includes(tag)) {
                    score += 40;
                    tagMatches++;
                }
            }

            // ── Title keyword overlap (20 pts per matching word) ──
            const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            for (const word of titleWords) {
                if (task.title.toLowerCase().includes(word)) score += 20;
            }

            // ── Description keyword overlap (5 pts per word) ──
            const descWords = inputText.split(/\s+/).filter(w => w.length > 3);
            for (const word of descWords) {
                if (taskText.includes(word)) score += 5;
            }

            // Only include if meaningful relevance
            if (score >= 20) {
                const reasons = [];
                if (tagMatches > 0) reasons.push(`${tagMatches} shared tag(s): ${inputTags.filter(t => taskTags.includes(t)).join(', ')}`);
                else reasons.push('Related title/description keywords');

                suggestions.push({
                    taskId: task._id,
                    title: task.title,
                    status: task.status,
                    tags: task.tags,
                    reason: reasons[0],
                    score: Math.min(Math.round(score), 100),
                });
            }
        }

        suggestions.sort((a, b) => b.score - a.score);
        const top = suggestions.slice(0, 5);

        res.json({ success: true, suggestions: top });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Feature 2: Risk Score Prediction
// ─────────────────────────────────────────────────────────────────────────────
//  SCORING METHODOLOGY — each factor is analysed independently then combined.
//
//  Factor 1 — Dependency Blockage (weight 40)
//  Rationale: blocked dependencies directly prevent work. The more of a task's
//  deps are incomplete, the higher the probability the task itself slips.
//  Formula: (incomplete / total) * 40  → max 40 pts
//  Edge: task with no deps gets 0 here (no dependency risk).
//
//  Factor 2 — Time Pressure (weight 30)
//  Rationale: due-date proximity is the strongest real-world predictor of whether
//  a task will be escalated. Uses an exponential decay curve so that risk rises
//  sharply in the last 3 days but gently for tasks 2+ weeks away.
//  Formula: 30 * e^(-0.1 * daysUntilDue)  clamped to [0,30].
//  Overdue tasks get the full 30 immediately.
//
//  Factor 3 — Priority Severity (weight 20)
//  Rationale: a critical task failing has more downstream impact than a low one.
//  Uses an S-curve so that the jump from medium→high is larger than low→medium.
//  Values: low=5, medium=10, high=16, critical=20.
//
//  Factor 4 — Ambiguity / Clarity (weight 10)
//  Rationale: short/missing descriptions signal unclear requirements — a leading
//  cause of rework and delay. Counter-intuitively, longer descriptions = LOWER
//  risk (requirements are understood). We reward clarity.
//  Formula: 10 if no description; 6 if < 20 chars; 3 if < 80 chars; 0 if ≥ 80.
//
//  Threshold calibration:
//  With the above model, a "worst case" task (critical, overdue, all deps blocked,
//  no description) = 40+30+20+10 = 100. A "best case" (low priority, 30+ days
//  away, no deps, full description) ≈ 5 + 0.5 + 0 + 0 = 5.
//  The typical task (medium priority, 7 days away, half deps done, short desc)
//  scores roughly: 20 + 14 + 10 + 3 = 47.
//  Thresholds set to split the realistic range evenly:
//    low    < 25   (genuinely safe: plenty of time, mostly done deps, clear desc)
//    medium 25–59  (needs watching: some pressure or some unknown)
//    high   ≥ 60   (needs action: overdue, blocked, or critical with no clarity)
// ─────────────────────────────────────────────────────────────────────────────
export const calculateRiskScore = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId)
            .populate('dependencies');

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const breakdown = {};

        // ── Factor 1: Dependency Blockage (max 40 pts) ───────────────────────
        // Uses the ratio of incomplete deps to total deps.
        // If task has no deps at all, this factor contributes 0 (no dep risk).
        let depScore = 0;
        if (task.dependencies.length > 0) {
            const incompleteDeps = task.dependencies.filter(d => d.status !== 'completed');
            const blockedRatio   = incompleteDeps.length / task.dependencies.length;
            depScore             = Math.round(blockedRatio * 40);
        }
        breakdown.dependencyBlockage = {
            score: depScore,
            weight: 40,
            detail: task.dependencies.length === 0
                ? 'No dependencies — no blockage risk'
                : `${task.dependencies.filter(d => d.status !== 'completed').length} of ${task.dependencies.length} dependencies incomplete`,
        };

        // ── Factor 2: Time Pressure (max 30 pts) ─────────────────────────────
        // Exponential decay: risk = 30 × e^(−0.08 × daysLeft).
        // This means:
        //   overdue     → 30 pts (full score)
        //   0–1 days    → 30 pts
        //   3 days      → ~28 pts
        //   7 days      → ~17 pts
        //   14 days     → ~9 pts
        //   30 days     → ~2 pts
        //   > 60 days   → < 0.5 pts (negligible)
        const today      = new Date();
        const dueDate    = new Date(task.dueDate);
        const daysLeft   = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        let timeScore;
        if (daysLeft <= 0) {
            timeScore = 30; // already overdue — maximum pressure
        } else {
            timeScore = Math.round(30 * Math.exp(-0.08 * daysLeft));
        }
        timeScore = Math.min(30, Math.max(0, timeScore));
        const overdueBy  = daysLeft < 0 ? Math.abs(daysLeft) : 0;
        breakdown.timePressure = {
            score: timeScore,
            weight: 30,
            detail: daysLeft <= 0
                ? `Overdue by ${overdueBy} day(s) — maximum time pressure`
                : `${daysLeft} day(s) until due (score decays exponentially with time)`,
        };

        // ── Factor 3: Priority Severity (max 20 pts) ─────────────────────────
        // S-curve: the gap between medium→high is larger than low→medium,
        // because critical/high tasks have wider blast radius when they slip.
        const PRIORITY_SCORES = { low: 5, medium: 10, high: 16, critical: 20 };
        const priorityScore   = PRIORITY_SCORES[task.priority] ?? 10;
        breakdown.prioritySeverity = {
            score: priorityScore,
            weight: 20,
            detail: `Priority "${task.priority}" — higher priority tasks have larger impact when delayed`,
        };

        // ── Factor 4: Ambiguity / Description Clarity (max 10 pts) ───────────
        // Missing or very short description = unclear requirements = higher rework risk.
        // Counter-intuitive insight: a LONG description means requirements are
        // understood → LOWER risk. We penalise lack of clarity, not verbosity.
        const descLen = (task.description || '').trim().length;
        let clarityScore;
        let clarityDetail;
        if (descLen === 0) {
            clarityScore = 10;
            clarityDetail = 'No description — requirements unclear, rework risk high';
        } else if (descLen < 20) {
            clarityScore = 6;
            clarityDetail = 'Very short description — may be underdefined';
        } else if (descLen < 80) {
            clarityScore = 3;
            clarityDetail = 'Brief description — some clarity present';
        } else {
            clarityScore = 0;
            clarityDetail = 'Well-described — requirements clear, low ambiguity risk';
        }
        breakdown.ambiguity = {
            score: clarityScore,
            weight: 10,
            detail: clarityDetail,
        };

        // ── Combine ───────────────────────────────────────────────────────────
        const rawScore     = depScore + timeScore + priorityScore + clarityScore;
        const finalScore   = Math.min(100, Math.max(0, Math.round(rawScore)));

        // ── Threshold calibration (analytically derived above) ────────────────
        //  low    < 25  — safe, no immediate action needed
        //  medium 25–59 — watch, may need intervention soon
        //  high   ≥ 60  — act now, high probability of delay/failure
        let riskLevel, riskColor, message;
        if (finalScore < 25) {
            riskLevel = 'low';
            riskColor = 'green';
            message   = 'Low risk — task is well-positioned to complete on time';
        } else if (finalScore < 60) {
            riskLevel = 'medium';
            riskColor = 'yellow';
            message   = 'Medium risk — monitor closely, some pressure factors present';
        } else {
            riskLevel = 'high';
            riskColor = 'red';
            message   = 'High risk — immediate attention needed to prevent failure';
        }

        // ── Persist to task ───────────────────────────────────────────────────
        task.riskScore = finalScore;
        await task.save();

        res.json({
            success: true,
            riskScore: finalScore,
            riskLevel,
            riskColor,
            message,
            breakdown,
            interpretation: {
                thresholds: { low: '< 25', medium: '25–59', high: '≥ 60' },
                worstCase:  100,
                bestCase:   5,
                methodology: 'Weights derived from impact analysis: dependency blockage (40) > time pressure (30) > priority severity (20) > ambiguity (10)',
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Feature 3: Priority Recommendation
export const recommendPriority = async (req, res) => {
    try {
        const { title, description, dueDate, taskDependencies } = req.body;
        let priorityScore = 0;
        const factors = [];
        const text = `${title} ${description || ''}`.toLowerCase();

        // ── Urgency keywords ──
        const criticalKw = ['critical', 'blocker', 'production', 'outage', 'security', 'emergency', 'breaking', 'urgent', 'asap'];
        const highKw     = ['important', 'priority', 'deadline', 'launch', 'release', 'deploy', 'high', 'required', 'must'];
        const mediumKw   = ['feature', 'implement', 'build', 'develop', 'integrate', 'setup', 'create', 'add', 'update'];

        if (criticalKw.some(k => text.includes(k))) {
            priorityScore += 70;
            factors.push(`Critical urgency keyword found: "${criticalKw.find(k => text.includes(k))}"`);
        } else if (highKw.some(k => text.includes(k))) {
            priorityScore += 45;
            factors.push(`Urgency keyword detected: "${highKw.find(k => text.includes(k))}"`);
        } else if (mediumKw.some(k => text.includes(k))) {
            priorityScore += 25;
            factors.push(`Development keyword identified: "${mediumKw.find(k => text.includes(k))}"`);
        }

        // ── Due date proximity ──
        if (dueDate) {
            const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) {
                priorityScore += 50; 
                factors.push(`⚠️ Already overdue by ${Math.abs(daysUntilDue)} days`);
            } else if (daysUntilDue === 0) {
                priorityScore += 48; 
                factors.push(`Due today — maximum urgency`);
            } else if (daysUntilDue === 1) {
                priorityScore += 45; 
                factors.push(`Due tomorrow — very urgent`);
            } else if (daysUntilDue < 3) {
                priorityScore += 40; 
                factors.push(`Due in ${daysUntilDue} days — high urgency`);
            } else if (daysUntilDue < 7) {
                priorityScore += 28; 
                factors.push(`Due in ${daysUntilDue} days — moderate urgency`);
            } else if (daysUntilDue < 14) {
                priorityScore += 15; 
                factors.push(`Due in ${daysUntilDue} days — some time available`);
            } else if (daysUntilDue < 30) {
                priorityScore += 8;  
                factors.push(`Due in ${daysUntilDue} days — comfortable timeline`);
            } else {
                priorityScore += 2;  
                factors.push(`Due in ${daysUntilDue} days — plenty of time`);
            }
        } else {
            // No due date — slight penalty for lack of deadline clarity
            priorityScore += 15;
            factors.push('No due date set — baseline priority');
        }

        // ── Dependencies ──
        if (taskDependencies && taskDependencies.length > 0) {
            const depScore = Math.min(taskDependencies.length * 8, 25);
            priorityScore += depScore;
            factors.push(`${taskDependencies.length} dependency task(s) — affects downstream work`);
        } else {
            priorityScore += 2;
            factors.push('No upstream dependencies');
        }

        // ── Title clarity heuristic ──
        const titleWords = title?.trim?.()?.split(/\s+/) || [];
        if (titleWords.length > 5) {
            priorityScore += 3;
            factors.push('Clear, detailed title');
        } else if (titleWords.length <= 2) {
            priorityScore -= 5;
            factors.push('Very short title — may indicate low priority');
        }

        // ── Description detail ──
        const descLen = (description || '').trim().length;
        if (descLen > 100) {
            priorityScore += 5;
            factors.push('Well-documented requirements');
        } else if (descLen === 0) {
            priorityScore -= 3;
            factors.push('No description — unclear scope');
        }

        let recommendedPriority;
        const score = Math.min(Math.max(priorityScore, 0), 100);
        
        if      (score >= 70) recommendedPriority = 'critical';
        else if (score >= 50) recommendedPriority = 'high';
        else if (score >= 28) recommendedPriority = 'medium';
        else                  recommendedPriority = 'low';

        const confidence = factors.length >= 3 ? 'high' : factors.length >= 2 ? 'medium' : 'low';

        res.json({
            success: true,
            recommendedPriority,
            confidence,
            score: score,
            factors: factors.slice(0, 4),
            message: `Recommended ${recommendedPriority.toUpperCase()} priority based on ${factors.length} factor(s)`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Feature 4: Delay Prediction
export const predictDelay = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId)
            .populate('dependencies');
        
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        let delayDays = 0;
        const delayReasons = [];
        
        // Check dependencies behind schedule
        for (const dep of task.dependencies) {
            if (dep.status !== 'completed' && dep.dueDate < new Date()) {
                const daysLate = Math.ceil((new Date() - new Date(dep.dueDate)) / (1000 * 60 * 60 * 24));
                delayDays += daysLate * 0.6;
                delayReasons.push(`Dependency "${dep.title}" is ${daysLate} day(s) late`);
            }
        }
        
        // Check if task is already behind
        if (task.dueDate < new Date() && task.status !== 'completed') {
            const daysBehind = Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
            delayDays += daysBehind;
            delayReasons.push(`Task is ${daysBehind} day(s) behind schedule`);
        }
        
        // Check risk score impact
        if (task.riskScore > 70) {
            delayDays += 2;
            delayReasons.push(`High risk score (${task.riskScore}) indicates potential delays`);
        } else if (task.riskScore > 50) {
            delayDays += 1;
        }
        
        // Historical performance factor
        const similarTasks = await Task.find({
            title: { $regex: task.title.split(' ')[0], $options: 'i' },
            status: 'completed'
        });
        if (similarTasks.length > 0) {
            const avgDelay = similarTasks.reduce((sum, t) => 
                sum + (t.actualTime - t.estimatedTime), 0) / similarTasks.length;
            if (avgDelay > 8) { // More than a day delay
                delayDays += 1;
                delayReasons.push(`Similar tasks historically take longer`);
            }
        }
        
        const predictedDelayDays = Math.ceil(delayDays);
        
        task.delayPrediction = {
            days: predictedDelayDays,
            lastCalculated: new Date()
        };
        await task.save();
        
        res.json({
            success: true,
            predictedDelayDays,
            willBeDelayed: predictedDelayDays > 0,
            severity: predictedDelayDays === 0 ? 'none' : predictedDelayDays < 3 ? 'minor' : predictedDelayDays < 7 ? 'moderate' : 'severe',
            reasons: delayReasons,
            message: predictedDelayDays === 0 ? 'Task is on track' : `Task may be delayed by ${predictedDelayDays} day(s)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Feature 5: Executor Recommendation
export const recommendExecutor = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        const executors = await User.find({ role: 'executor' });
        const recommendations = [];
        
        for (const executor of executors) {
            let score = 0;
            const factors = [];
            
            // Workload balance (35%)
            const activeTasks = await Task.countDocuments({
                executedBy: executor._id,
                status: 'in-progress'
            });
            let workloadScore = 100;
            if (activeTasks === 0) {
                workloadScore = 100;
                factors.push('No active tasks');
            } else if (activeTasks === 1) {
                workloadScore = 80;
                factors.push('1 active task');
            } else if (activeTasks === 2) {
                workloadScore = 60;
                factors.push('2 active tasks');
            } else {
                workloadScore = 30;
                factors.push(`${activeTasks} active tasks - high workload`);
            }
            score += workloadScore * 0.35;
            
            // Past performance (40%)
            const completedTasksCount = executor.performance.tasksCompleted || 0;
            let performanceScore = 50; // default
            if (completedTasksCount > 20) {
                performanceScore = 90;
                factors.push('Experienced (20+ tasks completed)');
            } else if (completedTasksCount > 10) {
                performanceScore = 75;
                factors.push('Experienced (10+ tasks completed)');
            } else if (completedTasksCount > 5) {
                performanceScore = 60;
                factors.push('Some experience');
            } else if (completedTasksCount > 0) {
                performanceScore = 45;
                factors.push('Limited experience');
            } else {
                performanceScore = 30;
                factors.push('No completed tasks yet');
            }
            score += performanceScore * 0.4;
            
            // Skill match based on tags (15%)
            let skillMatchScore = 70; // default
            if (task.tags && task.tags.length > 0) {
                // Simple check for now - in production, would need skill tags on users
                skillMatchScore = 65;
            }
            score += skillMatchScore * 0.15;
            
            // Availability (10%)
            const availabilityScore = executor.performance.tasksCompleted < 15 ? 90 : 60;
            score += availabilityScore * 0.1;
            
            recommendations.push({
                executorId: executor._id,
                name: executor.name,
                email: executor.email,
                avatar: executor.avatar,
                score: Math.round(score),
                currentWorkload: activeTasks,
                completedTasks: completedTasksCount,
                factors: factors.slice(0, 3)
            });
        }
        
        recommendations.sort((a, b) => b.score - a.score);
        
        res.json({ 
            success: true, 
            recommendations: recommendations.slice(0, 3),
            message: `Top recommendation: ${recommendations[0]?.name} with ${recommendations[0]?.score}% match`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Feature 6: Critical Path Detection
export const getCriticalPath = async (req, res) => {
    try {
        const tasks = await Task.find().populate('dependencies');
        
        // Build dependency graph and find longest paths
        const taskMap = new Map();
        tasks.forEach(task => {
            taskMap.set(task._id.toString(), task);
        });
        
        // Find tasks with no dependencies (starting points)
        const startTasks = tasks.filter(task => !task.dependencies || task.dependencies.length === 0);
        
        // Calculate longest path from each start task
        const memoizedPaths = new Map();
        
        const findLongestPath = (taskId, visited = new Set()) => {
            if (visited.has(taskId)) return { path: [], length: 0 };
            if (memoizedPaths.has(taskId)) return memoizedPaths.get(taskId);
            
            const task = taskMap.get(taskId);
            if (!task) return { path: [], length: 0 };
            
            visited.add(taskId);
            let longest = { path: [taskId], length: 1 };
            
            // Find tasks that depend on this task
            const dependents = tasks.filter(t => 
                t.dependencies && t.dependencies.some(d => d._id.toString() === taskId)
            );
            
            for (const dependent of dependents) {
                const subPath = findLongestPath(dependent._id.toString(), new Set(visited));
                if (subPath.length + 1 > longest.length) {
                    longest = {
                        path: [taskId, ...subPath.path],
                        length: subPath.length + 1
                    };
                }
            }
            
            memoizedPaths.set(taskId, longest);
            return longest;
        };
        
        let criticalPath = [];
        let maxLength = 0;
        
        for (const startTask of startTasks) {
            const path = findLongestPath(startTask._id.toString());
            if (path.length > maxLength) {
                maxLength = path.length;
                criticalPath = path.path;
            }
        }
        
        // Get task details for critical path
        const criticalPathTasks = criticalPath.map(id => {
            const task = taskMap.get(id);
            return {
                id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                isDelayed: task.status !== 'completed' && task.dueDate < new Date()
            };
        });
        
        // Identify blockers on critical path
        const blockers = criticalPathTasks.filter(task => 
            task.status === 'blocked' || (task.status !== 'completed' && task.isDelayed)
        );
        
        res.json({
            success: true,
            criticalPath: criticalPathTasks,
            length: maxLength,
            blockers: blockers,
            message: blockers.length > 0 
                ? `⚠️ ${blockers.length} blocker(s) found on critical path` 
                : '✅ Critical path is clear',
            recommendation: blockers.length > 0 
                ? `Focus on resolving: ${blockers.map(b => b.title).join(', ')}` 
                : 'Continue current progress'
        });
    } catch (error) {
        console.error('Critical path error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};