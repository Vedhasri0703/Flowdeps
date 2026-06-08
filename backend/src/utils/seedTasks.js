/**
 * Sample Task Seeding Script
 * Run this to populate database with test tasks for development/testing
 * Usage: node src/utils/seedTasks.js (requires MongoDB connection)
 */

import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const sampleTasks = [
  {
    title: "Design API Architecture",
    description: "Design the RESTful API architecture for the new microservices platform including authentication, rate limiting, and caching strategies.",
    priority: "critical",
    status: "pending",
    estimatedTime: 8,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tags: ["api", "architecture", "design"],
    dependencies: [],
  },
  {
    title: "Setup Database Schema",
    description: "Create MongoDB schemas for users, tasks, and dependencies with proper indexing for performance.",
    priority: "critical",
    status: "pending",
    estimatedTime: 6,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    tags: ["database", "schema", "mongodb"],
    dependencies: [],
  },
  {
    title: "Implement Authentication Service",
    description: "Build JWT-based authentication service with bcrypt password hashing and session management.",
    priority: "high",
    status: "pending",
    estimatedTime: 12,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    tags: ["auth", "security", "backend"],
    dependencies: [], // Will set to [Design API Architecture, Setup Database Schema]
  },
  {
    title: "Create User Registration Endpoint",
    description: "Implement the /register endpoint with email validation, password strength checks, and user creation.",
    priority: "high",
    status: "pending",
    estimatedTime: 4,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    tags: ["auth", "api", "backend"],
    dependencies: [], // Will set to [Implement Authentication Service]
  },
  {
    title: "Create Task CRUD Endpoints",
    description: "Implement Create, Read, Update, Delete endpoints for task management with proper validation and error handling.",
    priority: "high",
    status: "pending",
    estimatedTime: 10,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    tags: ["api", "backend", "tasks"],
    dependencies: [], // Will set to [Design API Architecture, Setup Database Schema]
  },
  {
    title: "Implement Dependency Resolution Logic",
    description: "Create algorithm to resolve task dependencies, prevent circular dependencies, and determine task readiness.",
    priority: "critical",
    status: "pending",
    estimatedTime: 10,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    tags: ["logic", "algorithm", "backend"],
    dependencies: [], // Will set to [Create Task CRUD Endpoints]
  },
  {
    title: "Build Frontend Login Page",
    description: "Create React login page with email/password fields, form validation, and error messages.",
    priority: "high",
    status: "pending",
    estimatedTime: 5,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    tags: ["frontend", "auth", "react"],
    dependencies: [], // Will set to [Create User Registration Endpoint]
  },
  {
    title: "Build Task Dashboard",
    description: "Create main dashboard showing pending, in-progress, and completed tasks with filtering and sorting.",
    priority: "high",
    status: "pending",
    estimatedTime: 12,
    dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    tags: ["frontend", "dashboard", "react"],
    dependencies: [], // Will set to [Create Task CRUD Endpoints]
  },
  {
    title: "Implement Dependency Visualization",
    description: "Use React Flow to visualize task dependencies as a directed graph with interactive node selection.",
    priority: "medium",
    status: "pending",
    estimatedTime: 8,
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    tags: ["frontend", "visualization", "react-flow"],
    dependencies: [], // Will set to [Build Task Dashboard]
  },
  {
    title: "Setup Email Notifications",
    description: "Configure Nodemailer with Gmail SMTP for sending task notifications, status updates, and reminders.",
    priority: "medium",
    status: "pending",
    estimatedTime: 4,
    dueDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    tags: ["email", "notifications", "backend"],
    dependencies: [], // Will set to [Design API Architecture]
  },
  {
    title: "Write Unit Tests",
    description: "Create unit tests for all API endpoints and core business logic with >80% code coverage.",
    priority: "medium",
    status: "pending",
    estimatedTime: 15,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    tags: ["testing", "backend", "qa"],
    dependencies: [], // Will set to all core endpoints
  },
  {
    title: "Deploy to Production",
    description: "Deploy application to production server with CI/CD pipeline setup and monitoring.",
    priority: "critical",
    status: "pending",
    estimatedTime: 6,
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    tags: ["devops", "deployment", "production"],
    dependencies: [], // Will set to [Write Unit Tests, Build Frontend Login Page]
  },
];

export const seedTasks = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI not set in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get executor and creator users
    const executor = await User.findOne({ role: "executor" });
    const creator = await User.findOne({ role: "creator" });

    if (!executor || !creator) {
      console.error("❌ No executor or creator found. Please create users first.");
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📝 Using Creator: ${creator.name} (${creator.email})`);
    console.log(`👤 Using Executor: ${executor.name} (${executor.email})`);

    // Clear existing tasks (optional - comment out to keep)
    // await Task.deleteMany({});
    // console.log("🗑️  Cleared existing tasks");

    // Create tasks
    const createdTasks = [];
    for (const taskData of sampleTasks) {
      const task = await Task.create({
        ...taskData,
        createdBy: creator._id,
      });
      createdTasks.push(task);
      console.log(`✅ Created: "${task.title}"`);
    }

    // Setup dependencies after all tasks are created
    const dependencyMap = {
      "Implement Authentication Service": [
        "Design API Architecture",
        "Setup Database Schema",
      ],
      "Create User Registration Endpoint": ["Implement Authentication Service"],
      "Create Task CRUD Endpoints": [
        "Design API Architecture",
        "Setup Database Schema",
      ],
      "Implement Dependency Resolution Logic": ["Create Task CRUD Endpoints"],
      "Build Frontend Login Page": ["Create User Registration Endpoint"],
      "Build Task Dashboard": ["Create Task CRUD Endpoints"],
      "Implement Dependency Visualization": ["Build Task Dashboard"],
      "Setup Email Notifications": ["Design API Architecture"],
      "Write Unit Tests": [
        "Implement Authentication Service",
        "Create Task CRUD Endpoints",
        "Implement Dependency Resolution Logic",
      ],
      "Deploy to Production": [
        "Write Unit Tests",
        "Build Frontend Login Page",
        "Build Task Dashboard",
      ],
    };

    for (const task of createdTasks) {
      const depTitles = dependencyMap[task.title];
      if (depTitles && depTitles.length > 0) {
        const depIds = [];
        for (const depTitle of depTitles) {
          const depTask = createdTasks.find(t => t.title === depTitle);
          if (depTask) {
            depIds.push(depTask._id);
          }
        }
        if (depIds.length > 0) {
          task.dependencies = depIds;
          await task.save();
          console.log(
            `🔗 Added dependencies to "${task.title}": ${depTitles.join(", ")}`
          );
        }
      }
    }

    console.log("\n✅ All sample tasks created successfully!");
    console.log(`📊 Total tasks: ${createdTasks.length}`);
    console.log("\nYou can now:");
    console.log("1. Log in as creator to view and manage all tasks");
    console.log("2. Log in as executor to claim and complete available tasks");
    console.log("3. Test the AI suggestions by creating new tasks");

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding tasks:", error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTasks();
}

export default seedTasks;
