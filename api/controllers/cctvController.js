import CCTV from "../models/cctv.js";
import Branch from "../models/branch.js";
import User from "../models/user.js";
// Create a new CCTV
export const createCCTV = async (req, res) => {
  try {
    const { cctvId, cctvName, cctvLink, photoUrl, description, status } = req.body;
    
    // Get branchId from req.user (from token)
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(403).json({ message: "Branch ID not found in user token" });
    }

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Verify createdBy user exists
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newCCTV = new CCTV({
      branchId,
      cctvId,
      cctvName,
      cctvLink,
      photoUrl,
      description,
      status,
      createdBy: req.user.userId,
    });

    const savedCCTV = await newCCTV.save();
    res.status(201).json(savedCCTV);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all CCTVs
export const getAllCCTVs = async (req, res) => {
  try {
    console.log("User Info:", req.user); // 👈 Add this
    const branchId = req.user.branchId;

    const cctvs = await CCTV.find({ branchId })
      .populate("branchId", "branchId name")
      .populate("createdBy", "name email");

    res.status(200).json(cctvs);
  } catch (error) {
    console.error("Error fetching CCTVs:", error); // 👈 Log full error
    res.status(500).json({ message: error.message });
  }
};


// Get CCTV by ID
export const getCCTVById = async (req, res) => {
  try {
    const branchId = req.user.branchId
    const cctv = await CCTV.findOne({_id:req.params.id, branchId})
      .populate("branchId", "branchId name")
      .populate("createdBy", "name email");
    if (!cctv) {
      return res.status(404).json({ message: "CCTV not found" });
    }
    res.status(200).json(cctv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update CCTV
export const updateCCTV = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { cctvId, cctvName, cctvLink, photoUrl, description, status } = req.body;

    const cctv = await CCTV.findOne({_id:req.params.id, branchId});
    if (!cctv) {
      return res.status(404).json({ message: "CCTV not found" });
    }

    // Use branchId from req.user
    if (!branchId) {
      return res.status(403).json({ message: "Branch ID not found in user token" });
    }

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const updatedCCTV = await CCTV.findByIdAndUpdate(
      req.params.id,
      { branchId, cctvId, cctvName, cctvLink, photoUrl, description, status },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCCTV);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete CCTV
export const deleteCCTV = async (req, res) => {
  try {
    const cctv = await CCTV.findOne({ _id: req.params.id, branchId: req.user.branchId });   
    if (!cctv) {
      return res.status(404).json({ message: "CCTV not found" });
    }
    await CCTV.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "CCTV deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get CCTVs by Branch ID
export const getCCTVsByBranchId = async (req, res) => {
  try {
    // Use branchId from req.user instead of req.params
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(403).json({ message: "Branch ID not found in user token" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const cctvs = await CCTV.find({ branchId })
      .populate("branchId", "branchId name")
      .populate("createdBy", "name email");
    res.status(200).json(cctvs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCCTVCount = async (req, res) => {
  try {
    const { branchId } = req.user;
    const total = await CCTV.countDocuments({ branchId });
    const active = await CCTV.countDocuments({ branchId, status: "active" });
    res.status(200).json({ total, active, inactive:total-active });
  } catch (error) {
    console.error("Error counting CCTVs:", error.message);
    res.status(500).json({ message: error.message });
  }
};
