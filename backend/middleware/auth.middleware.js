import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("🔐 protectRoute middleware called");

    let accessToken = req.cookies.accessToken;

    // ✅ CHECK AUTHORIZATION HEADER JIKA TIDAK ADA COOKIE
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      console.log("📨 Authorization header:", authHeader);

      if (authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
        console.log("✅ Token extracted from Authorization header");
      }
    }

    console.log("🔑 Token available:", !!accessToken);

    if (!accessToken) {
      console.log("❌ No access token provided");
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      console.log("✅ Token decoded, userId:", decoded.userId);

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        console.log("❌ User not found for id:", decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      console.log("✅ User authenticated:", user.email, "Role:", user.role);

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.log("❌ Token expired");
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      if (error.name === "JsonWebTokenError") {
        console.log("❌ Invalid token");
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid access token" });
      }
      throw error;
    }
  } catch (error) {
    console.log("❌ Error in protectRoute middleware", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.log("❌ Admin access denied for user:", req.user?.email);
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};
