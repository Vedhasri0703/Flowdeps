import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        // Get MongoDB URI from environment
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/task_execution_system';
        
        console.log('🔄 Connecting to MongoDB...');
        console.log(`📦 Database URI: ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials
        
        // Connection options for better reliability
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds
            family: 4 // Use IPv4, skip trying IPv6
        };
        
        // Connect to MongoDB
        const conn = await mongoose.connect(mongoURI, options);
        
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        console.log(`🔗 Host: ${conn.connection.host}`);
        console.log(`🔢 Port: ${conn.connection.port}`);
        console.log(`📡 Connection State: ${mongoose.STATES[conn.connection.readyState]}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });
        
        return conn;
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        
        // Don't exit process immediately, retry connection
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(() => {
            console.log('🔄 Retrying MongoDB connection...');
            connectDB();
        }, 5000);
        
        throw error;
    }
};

// Gracefully close connection on app termination
const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
    }
};

export { connectDB, closeDB };
export default connectDB;