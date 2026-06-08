import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

// ─── REGISTER (no email verification, no welcome email) ──────────────────────
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            phone,
            role: role || 'executor',
            isVerified: true,          // auto-verified — no email check needed
        });

        const token = generateToken(newUser._id, res);

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                isVerified: true,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── STUB: kept so existing router imports don't break ────────────────────────
export const verifyEmail = async (req, res) => {
    res.status(200).json({ success: true, message: "Email verification is disabled." });
};

export const resendVerificationEmail = async (req, res) => {
    res.status(200).json({ success: true, message: "Email verification is disabled." });
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = generateToken(user._id, res);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                joinDate: user.joinDate,
                isVerified: user.isVerified,
                performance: user.performance,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('token');
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('performance.taskHistory.taskId', 'title');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateUserProfile = async (req, res) => {
    try {
        const { name, phone, notificationPreferences } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                name: name || req.user.name,
                phone: phone || req.user.phone,
                notificationPreferences: notificationPreferences || req.user.notificationPreferences,
            },
            { new: true, runValidators: true }
        ).select('-password');
        return res.status(200).json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
// No email link — just verify the email exists, then let the frontend
// call resetPassword directly with the email + new password.
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "No account found with that email" });
        }

        // Return success — frontend will show the new-password form
        return res.status(200).json({
            success: true,
            message: "Email verified. You can now set a new password.",
            email: user.email,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── RESET PASSWORD (direct — no token needed) ───────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        // Accept either /reset-password/:token (legacy) or body-only
        const { email, password, confirmPassword } = req.body;

        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        if (!password) return res.status(400).json({ success: false, message: "Password is required" });
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.password = password;          // pre-save hook hashes it
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.clearCookie('token');
        return res.status(200).json({
            success: true,
            message: "Password updated successfully. You can now log in.",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both passwords are required" });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, message: "New passwords do not match" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
        res.clearCookie('token');
        return res.status(200).json({ success: true, message: "Password changed. Please log in again." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─── VERIFY RESET TOKEN (stub — kept for router compatibility) ────────────────
export const verifyResetToken = async (req, res) => {
    res.status(200).json({ success: true, message: "Direct reset is enabled." });
};

export const getAllExecutors = async (req, res) => {
    try {
        const executors = await User.find({ role: 'executor' }).select('-password');
        return res.status(200).json({ success: true, count: executors.length, executors });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
