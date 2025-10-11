import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalyticsOverview } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAnalyticsOverview);

export default router;
