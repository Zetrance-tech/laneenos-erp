// import express from "express";
// import { 
//   createCCTV,
//   getAllCCTVs,
//   getCCTVById,
//   updateCCTV,
//   deleteCCTV,
//   getCCTVsByBranchId,
// } from "../controllers/cctvController.js"
// import authMiddleware from "../middleware/auth.js";

// const router = express.Router();

// router.post("/create", authMiddleware(["admin", "teacher"]), createCCTV);
// router.put("/:id", authMiddleware(["admin", "teacher"]), updateCCTV);
// router.delete("/:id", authMiddleware(["admin", "teacher"]), deleteCCTV);
// router.get("/", authMiddleware(["admin", "teacher", "parent"]), getAllCCTVs);
// router.get("/:id", authMiddleware(["admin", "teacher", "parent"]), getCCTVById);
// router.get("/branch", authMiddleware(["admin", "teacher", "parent"]), getCCTVsByBranchId);

// export default router;

import express from "express";
import { 
  createCCTV,
  getAllCCTVs,
  getCCTVById,
  updateCCTV,
  deleteCCTV,
  getCCTVsByBranchId,
  getCCTVCount,
} from "../controllers/cctvController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();


router.post("/create", authMiddleware(["admin", "superadmin", "teacher"]), createCCTV);
router.get("/count/cctv", authMiddleware(["admin", "superadmin", "teacher", "parent"]), getCCTVCount);
router.get("/branch", authMiddleware(["admin", "superadmin", "teacher", "parent"]), getCCTVsByBranchId);
router.get("/", authMiddleware(["admin", "superadmin", "teacher", "parent"]), getAllCCTVs);


router.get("/:id", authMiddleware(["admin", "superadmin", "teacher", "parent"]), getCCTVById);
router.put("/:id", authMiddleware(["admin", "superadmin", "teacher"]), updateCCTV);
router.delete("/:id", authMiddleware(["admin","superadmin",  "teacher"]), deleteCCTV);

export default router;