import express from "express";
import { 
  createConsentRequest,
  getParentConsents,
  respondToConsent,
  getTeacherConsents,
  getAdminConsents,
  getConsentResponses,
  editConsentRequest,
  deleteConsentRequest,
} from "../controllers/consentController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware(["admin", "teacher"]), createConsentRequest);
router.put("/:consentId", authMiddleware(["admin", "teacher"]), editConsentRequest);
router.delete("/:consentId", authMiddleware(["admin", "teacher"]), deleteConsentRequest);
router.get("/my-consents", authMiddleware(["parent"]), getParentConsents);
router.put("/respond", authMiddleware(["parent"]), respondToConsent);
router.get("/teacher", authMiddleware(["teacher"]), getTeacherConsents);
router.get("/admin", authMiddleware(["admin"]), getAdminConsents);
router.get("/responses/:consentId", authMiddleware(["admin", "teacher"]), getConsentResponses);

export default router;