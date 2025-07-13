import express from "express";
import Branch from "../models/branch.js";
import User from "../models/user.js";


export const createBranch = async (req, res) => {
  try {
    const {
      branchId,
      name,
      branchType,
      address,
      city,
      state,
      email,
      phoneNumber,
      directorName,
      directorEmail,
      directorPhoneNumber,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !name ||
      !branchType ||
      !address ||
      !city ||
      !state ||
      !email ||
      !phoneNumber ||
      !directorName ||
      !directorEmail ||
      !directorPhoneNumber
    ) {
      return res.status(400).json({ message: "All fields except adminId are required" });
    }

    // Validate branchType
    const validBranchTypes = [
      "Daycare",
      "Daycare Kindergarten",
      "Premium Daycare",
      "Corporate Daycare",
    ];
    if (!validBranchTypes.includes(branchType)) {
      return res.status(400).json({ message: "Invalid branch type" });
    }


    // Check for unique fields
    const existingBranch = await Branch.findOne({
      $or: [{ branchId }, { email }, { directorEmail }],
    });
    if (existingBranch) {
      return res.status(400).json({ message: "Branch ID, email, or director email already exists" });
    }

    const branch = new Branch({
      branchId,
      name,
      branchType,
      address,
      city,
      state,
      email,
      phoneNumber,
      directorName,
      directorEmail,
      directorPhoneNumber,
      status: "active",
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const assignBranch = async(req, res)=>{
    try {
    const { branchId, adminId } = req.body;

    // Validate inputs
    if (!branchId || !adminId) {
      return res.status(400).json({ message: "Branch ID and Admin ID are required" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(400).json({ message: "Invalid admin user" });
    }
    await User.findByIdAndUpdate(adminId, { branchId });

    res.json({ message: "Admin assigned to branch successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// export const getAllBranches = async(req, res)=>{
//   try {
//     const branches = await Branch.find();
//     console.log(branches)
//     res.json(branches);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// }

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();

    const branchesWithAdmin = await Promise.all(
      branches.map(async (branch) => {
        const admin = await User.findOne({ role: "admin", branchId: branch._id }).select("name email");
        return {
          ...branch.toObject(),
          admin, // could be null if not assigned
        };
      })
    );

    res.json(branchesWithAdmin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// export const getBranchById = async (req, res) => {
//   try {
//     const id = req.user.branchId;
//     const role = req.user.role;

//     if (role === 'superadmin') {
//       return res.json({ name: "Branch" });
//     }

//     const branch = await Branch.findById(id);

//     if (!branch) {
//       return res.status(404).json({ message: "Branch not found" });
//     }

//     res.json(branch);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


export const getBranchById = async (req, res) => {
  try {
    const id = req.user.branchId;
    const role = req.user.role;

    if (role === "superadmin") {
      return res.json({ name: "Branch" });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const admin = await User.findOne({ role: "admin", branchId: branch._id }).select("name email");

    res.json({
      ...branch.toObject(),
      admin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const editBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      branchType,
      address,
      city,
      state,
      email,
      phoneNumber,
      directorName,
      directorEmail,
      directorPhoneNumber,
      status,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !branchType ||
      !address ||
      !city ||
      !state ||
      !email ||
      !phoneNumber ||
      !directorName ||
      !directorEmail ||
      !directorPhoneNumber
    ) {
      return res.status(400).json({ message: "All fields except branchId are required" });
    }

    // Validate branchType
    const validBranchTypes = [
      "Daycare",
      "Daycare Kindergarten",
      "Premium Daycare",
      "Corporate Daycare",
    ];
    if (!validBranchTypes.includes(branchType)) {
      return res.status(400).json({ message: "Invalid branch type" });
    }

    // Validate status
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check for unique fields (excluding the current branch)
    const existingBranch = await Branch.findOne({
      $or: [{ email }, { directorEmail }],
      _id: { $ne: id },
    });
    if (existingBranch) {
      return res.status(400).json({ message: "Email or director email already exists" });
    }

    // Find and update the branch
    const branch = await Branch.findByIdAndUpdate(
      id,
      {
        name,
        branchType,
        address,
        city,
        state,
        email,
        phoneNumber,
        directorName,
        directorEmail,
        directorPhoneNumber,
        status: status || "active",
      },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};