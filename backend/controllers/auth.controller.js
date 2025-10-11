import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ✅ GUNAKAN INI - sudah benar didefinisikan
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// ✅ TAMBAHKAN FUNCTION INI untuk compatibility

const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );
    console.log("Refresh token stored in Redis for user:", userId);
  } catch (error) {
    console.log("Redis store error:", error.message);
    throw new Error("Could not store refresh token");
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    console.log("Signup attempt for:", { name, email, role });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    console.log("User created:", {
      email: user.email,
      role: user.role,
      id: user._id,
    });

    // ✅ PERBAIKI: Gunakan function yang benar
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token in Redis
    await storeRefreshToken(user._id, refreshToken);

    // Set cookies - UNTUK DEVELOPMENT, set secure: false
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // ✅ MUST BE FALSE FOR HTTP
      sameSite: "lax", // ✅ USE "lax" NOT "strict"

      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Return user data
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      cartItems: user.cartItems,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);
    console.log("📝 Password received:", password);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("✅ User found:", user.email);
    console.log("👤 User role:", user.role);
    console.log(
      "🔑 Stored password hash:",
      user.password.substring(0, 20) + "..."
    );
    console.log("\n=== DEBUG PASSWORD CHECK ===");

    // Method 1: User model method
    const isPasswordValid = await user.comparePassword(password);
    console.log("1. user.comparePassword():", isPasswordValid);

    // Method 2: Direct bcrypt compare
    if (!isPasswordValid) {
      const directCompare = await bcrypt.compare(password, user.password);
      console.log("🔑 Direct bcrypt compare:", directCompare);

      if (!directCompare) {
        console.log("❌ Invalid password for:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }
    }

    console.log("🎉 Login successful for:", user.email, "Role:", user.role);

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token in Redis
    await storeRefreshToken(user._id, refreshToken);
    // Set cookies - UNTUK DEVELOPMENT, set secure: false
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // ✅ MUST BE FALSE FOR HTTP
      sameSite: "lax", // ✅ USE "lax" NOT "strict"

      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",

      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Return user data
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      cartItems: user.cartItems,
      accessToken, // ✅ SEND IN RESPONSE
      refreshToken, // ✅ SEND IN RESPONSE
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... (logout, refreshToken, getProfile tetap sama)
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        await redis.del(`refresh_token:${decoded.userId}`);
        console.log(
          `✅ Refresh token deleted from Redis for user: ${decoded.userId}`
        );
      } catch (error) {
        console.log(
          "⚠️ Error deleting refresh token from Redis:",
          error.message
        );
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    console.log("✅ Logout successful");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("❌ Error in logout controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.log("❌ No refresh token provided");
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      console.log("❌ Invalid refresh token for user:", decoded.userId);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Set new access token cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // ← SET FALSE untuk development
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    console.log("✅ Token refreshed successfully for user:", decoded.userId);
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("❌ Error in refreshToken controller", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    // req.user sudah ada dari protectRoute middleware
    console.log(
      "📋 Profile request for user:",
      req.user.email,
      "Role:",
      req.user.role
    );

    res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role, // ← PASTIKAN INI ADA
      cartItems: req.user.cartItems,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ TAMBAHKAN FUNCTION UNTUK DEVELOPMENT - Create first admin user
export const createFirstAdmin = async (req, res) => {
  try {
    const {
      name = "Admin User",
      email = "admin@example.com",
      password = "admin123",
    } = req.body;

    console.log("👑 Creating first admin user...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin user already exists",
        admin: {
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
        user: {
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Create admin user
    const adminUser = new User({
      name,
      email,
      password,
      role: "admin",
    });

    await adminUser.save();

    console.log("🎉 Admin user created successfully:", adminUser.email);

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Create admin error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ TAMBAHKAN FUNCTION untuk check Redis connection
export const checkRedis = async (req, res) => {
  try {
    // Test Redis connection
    await redis.set("test", "Redis is working!");
    const testValue = await redis.get("test");
    await redis.del("test");

    res.json({
      message: "Redis is connected and working",
      test: testValue,
    });
  } catch (error) {
    console.error("❌ Redis connection error:", error);
    res.status(500).json({
      message: "Redis connection failed",
      error: error.message,
    });
  }
};
