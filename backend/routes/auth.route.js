import express from "express";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
  createFirstAdmin,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

// ✅ TAMBAHKAN ROUTE BARU UNTUK ADMIN
router.post("/create-admin", createFirstAdmin);

export default router;
