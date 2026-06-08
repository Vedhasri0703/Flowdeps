import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    console.log("\n=== AUTH MIDDLEWARE START ===");
    
    let token;
    
    // Method 1: Check Authorization header (recommended for APIs)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log("✓ Token from Authorization header");
    }
    // Method 2: Check cookies (for browser requests)
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log("✓ Token from cookie");
    }
    // Method 3: Parse cookie header manually (fallback)
    else if (req.headers.cookie) {
        console.log("Parsing cookie header...");
        const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
        for (const cookie of cookies) {
            if (cookie.startsWith('token=')) {
                token = cookie.substring(6);
                console.log("✓ Token extracted from cookie header");
                break;
            }
        }
    }
    
    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({ 
            success: false,
            message: "Unauthorized: No token provided" 
        });
    }
    
    try {
        console.log("Verifying JWT...");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("JWT decoded. User ID:", decoded.id);
        
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            console.log("❌ User not found in database");
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized: User not found" 
            });
        }
        
        console.log("✅ User authenticated:", req.user.email, "Role:", req.user.role);
        next();
    } catch (error) {
        console.error("❌ JWT Error:", error.message);
        return res.status(401).json({ 
            success: false,
            message: "Unauthorized: Invalid token" 
        });
    }
};

export const creatorMiddleware = (req, res, next) => {
    console.log("\n=== CREATOR MIDDLEWARE ===");
    console.log("User role:", req.user?.role);
    
    if (req.user && req.user.role === 'creator') {
        console.log("✓ Creator access granted");
        next();
    } else {
        console.log("❌ Creator access denied");
        return res.status(403).json({ 
            success: false,
            message: "Forbidden: Creators only" 
        });
    }
};

export const executorMiddleware = (req, res, next) => {
    console.log("\n=== EXECUTOR MIDDLEWARE ===");
    console.log("User role:", req.user?.role);
    
    if (req.user && req.user.role === 'executor') {
        console.log("✓ Executor access granted");
        next();
    } else {
        console.log("❌ Executor access denied");
        return res.status(403).json({ 
            success: false,
            message: "Forbidden: Executors only" 
        });
    }
};