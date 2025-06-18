import express from "express";
import { addMeal, getMealPlan } from "../controllers/mealController.js";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

router.post("/add", authMiddleware(["admin", "parent", "teacher"]), addMeal);
router.get("/plan", authMiddleware(["admin", "parent", "teacher"]), getMealPlan);

export default router;