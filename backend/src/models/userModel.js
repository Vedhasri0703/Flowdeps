import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['creator', 'executor'],
        default: 'executor'
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?background=3b82f6&color=fff'
    },
    isVerified: {
        type: Boolean,
        default: true   // change to false if email verification is implemented
    },
    verificationToken : {
      type: String
    },
    verificationTokenExpires: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    notificationPreferences: {
        emailNotifications: { type: Boolean, default: false },
        dailyDigest: { type: Boolean, default: false }
    },
    performance: {
        tasksCompleted: { type: Number, default: 0 },
        avgCompletionTime: { type: Number, default: 0 },
        taskHistory: [{
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
            completedAt: Date,
            estimatedTime: Number,
            actualTime: Number
        }]
    }
}, { 
    timestamps: true 
});

// Hash password before saving
userSchema.pre("save", async function() {
    if (!this.isModified("password")) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        return error;
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;