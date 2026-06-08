import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';
import dns from 'node:dns';
dns.setServers(['8.8.8.8','1.1.1.1']);

import { connectDB, closeDB } from './database/connection.js';
import authRouter from './routers/authRouter.js';
import taskRouter from './routers/taskRouter.js';
import userRouter from './routers/userRouter.js';
import reportRouter from './routers/reportRouter.js';
import aiRouter from './routers/aiRouter.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { checkDependenciesAutomation, weeklySummaryAutomation, dailyBlockedDigestAutomation, upcomingDeadlineReminderAutomation } from './utils/automations.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        const allowed = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:5173',
        ].filter(Boolean);
        // allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({ message: "Dependency-Based Task Execution System API is running" });
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes - These will only work after database is connected
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint (before database connection)
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
    try {
        await connectDB();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}\n`);
        });

        // ── Cron: Daily 9 AM — delay alerts to creators ──
        cron.schedule('0 9 * * *', () => {
            console.log(`[CRON] Daily dependency/delay check`);
            checkDependenciesAutomation().catch(console.error);
        });

        // ── Cron: Daily 9 AM — blocked digest to creators ──
        cron.schedule('0 9 * * *', () => {
            console.log(`[CRON] Daily blocked digest`);
            dailyBlockedDigestAutomation().catch(console.error);
        });

        // ── Cron: Daily 8 AM — upcoming deadline reminders to executors ──
        cron.schedule('0 8 * * *', () => {
            console.log(`[CRON] Upcoming deadline reminders`);
            upcomingDeadlineReminderAutomation().catch(console.error);
        });

        // ── Cron: Every Friday 5 PM — weekly summary to creators ──
        cron.schedule('0 17 * * 5', () => {
            console.log(`[CRON] Weekly summary`);
            weeklySummaryAutomation().catch(console.error);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();



// Database status endpoint
app.get('/api/db-status', async (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    res.json({
        success: true,
        database: {
            isConnected: dbStatus === 1,
            status: {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            }[dbStatus],
            name: mongoose.connection.name || 'Not connected',
            host: mongoose.connection.host || 'Unknown',
            port: mongoose.connection.port || 'Unknown'
        }
    });
});

/*
// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        message: `Route ${req.originalUrl} not found`
    });
});

// Global variable to track if server is running
let server = null;

// Initialize and start server ONLY after database connection
const startServer = async () => {
    console.log('\n=================================');
    console.log('🚀 Starting Task Execution System Backend');
    console.log('=================================\n');
    
    try {
        // STEP 1: Connect to MongoDB FIRST
        console.log('📡 Step 1: Establishing database connection...');
        await connectDB();
        
        // Verify connection is established
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection not ready');
        }
        
        console.log('\n✅ Database connection verified and ready\n');
        
        // STEP 2: Setup cron jobs for automations (only if connected)
        console.log('⏰ Step 2: Setting up automation schedules...');
        
        // Daily dependency check at 9 AM
        const dailyJob = cron.schedule('0 9 * * *', () => {
            console.log(`[${new Date().toISOString()}] 🔄 Running daily dependency check...`);
            checkDependenciesAutomation().catch(err => {
                console.error('Daily dependency check failed:', err);
            });
        });
        
        // Weekly summary every Friday at 5 PM
        const weeklyJob = cron.schedule('0 17 * * 5', () => {
            console.log(`[${new Date().toISOString()}] 📊 Running weekly summary...`);
            weeklySummaryAutomation().catch(err => {
                console.error('Weekly summary failed:', err);
            });
        });
        
        console.log('✅ Daily dependency check scheduled (9:00 AM)');
        console.log('✅ Weekly summary scheduled (Friday 5:00 PM)\n');
        
        // STEP 3: Start HTTP server ONLY after database is connected
        const PORT = process.env.PORT || 5000;

        server = app.listen(PORT, (res, req) => {
            console.log('=================================');
            console.log('🎉 SERVER STARTED SUCCESSFULLY');
            console.log('=================================');
            console.log(`🌐 Server URL: http://localhost:${PORT}`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`💾 Database Status: http://localhost:${PORT}/api/db-status`);
            console.log(`📝 API Endpoints:`);
            console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
            console.log(`   - Tasks: http://localhost:${PORT}/api/tasks`);
            console.log(`   - Users: http://localhost:${PORT}/api/users`);
            console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
            console.log(`   - AI: http://localhost:${PORT}/api/ai`);
            console.log('=================================\n');
        });
        
        return { server, dailyJob, weeklyJob };
        
    } catch (error) {
        console.error('\n❌ FATAL ERROR: Failed to start server');
        console.error('=================================');
        console.error(`Error: ${error.message}`);
        console.error('=================================\n');
        
        // Don't start server if database connection fails
        process.exit(1);
    }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} signal received: starting graceful shutdown...`);
    
    // Stop accepting new requests
    if (server) {
        console.log('🛑 Closing HTTP server...');
        server.close(async () => {
            console.log('✅ HTTP server closed');
            
            // Close database connection
            console.log('📡 Closing database connection...');
            await closeDB();
            
            console.log('👋 Graceful shutdown completed');
            process.exit(0);
        });
        
        // Force close after 10 seconds if server doesn't close gracefully
        setTimeout(() => {
            console.error('❌ Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    } else {
        // If server wasn't started yet
        await closeDB();
        process.exit(0);
    }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

export default app;
*/