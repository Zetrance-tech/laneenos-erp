import express from "express";
import { 
  createConsentRequest, 
  getParentConsents,
  respondToConsent 
} from "../controllers/consentController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/create",authMiddleware(["admin", "parent", "teacher"]), createConsentRequest);
router.get("/my-consents",authMiddleware(["admin", "parent", "teacher"]), getParentConsents);
router.put("/respond", authMiddleware(["admin", "parent", "teacher"]), respondToConsent);

export default router;