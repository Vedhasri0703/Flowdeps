import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    estimatedTime: {
        type: Number,
        default: 0
    },
    actualTime: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    history: [{
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        comment: String
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    delayPrediction: {
        days: Number,
        lastCalculated: Date
    }
}, { 
    timestamps: true 
});

// Virtual for dependent tasks
taskSchema.virtual('dependentTasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'dependencies'
});

// Index for better query performance
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ dependencies: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ executedBy: 1 });

// Ensure virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Pre-save middleware
taskSchema.pre('save', function() {
    if (this.isModified('status') && this.status === 'completed') {
        this.completionDate = new Date();
    }
});

const Task = mongoose.model("Task", taskSchema);
export default Task;