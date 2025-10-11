import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"; // ✅ IMPORT CORS
import path from "path";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// ✅ CORS CONFIGURATION YANG LEBIH LENGKAP
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // ✅ INI SUDAH BENAR
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ✅ TAMBAHKAN INI UNTUK HANDLE PREFLIGHT REQUESTS
app.options(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Test endpoint untuk debug CORS
app.get("/api/test-cors", (req, res) => {
  res.json({
    message: "CORS is working!",
    cookies: req.cookies,
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});
