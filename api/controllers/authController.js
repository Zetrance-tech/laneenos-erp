// import User from "../models/user.js";
// import { generateToken } from "../utils/jwt.js";
// import bcrypt from "bcryptjs";
// import Student from "../models/student.js";

// export const signup = async (req, res) => {
//   const { name, email, password, phone, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       role,
//     });
//     await user.save();
//     if(role === "student"){
//       const student = new Student({
//         user: user._id,
//         name,
//         email,
//       });
//       await student.save();
//       user.student = student._id;
//       await user.save();
//     }

//     const token = generateToken(user._id.toString(), user.role);

//     res.status(201).json({ user, token });
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ message: error.message });
//   }
// };

// // Login Controller
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
//     const token = generateToken(user._id.toString(), user.role);

//     res.status(200).json({ user, token });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const searchParents = async (req, res) => {
//   const { query } = req.query;

//   try {
//     if (!query || query.length < 2) {
//       return res.status(400).json({ message: "Query must be at least 2 characters" });
//     }

//     const parents = await User.find({
//       role: "parent",
//       $or: [
//         { name: { $regex: query, $options: "i" } },
//         { email: { $regex: query, $options: "i" } },
//       ],
//     })
//       .select("name email")
//       .limit(10);

//     res.status(200).json(parents);
//   } catch (error) {
//     console.error("Error searching parents:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

import User from "../models/user.js";
import { generateToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";
import Student from "../models/student.js";

// Signup Controller (Restricted to Parent and Teacher)
export const signup = async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    await user.save();
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Admin-Only Signup Controller
export const adminSignup = async (req, res) => {
  const { name, email, password, phone, role, parentId } = req.body;

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    await user.save();

    if (role === "student" && parentId) {
      const parent = await User.findOne({ _id: parentId, role: "parent" });
      if (!parent) {
        return res.status(400).json({ message: "Invalid parent ID" });
      }
      // Optionally create Student here if needed, but prefer studentController
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.status === "inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }
    console.log(user.status)
    const isBcryptHash = (storedPassword) => {
      return /^\$2[aby]\$\d{2}\$/.test(storedPassword); // Matches bcrypt hash format
    };

    let isMatch;
    if (isBcryptHash(user.password)) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = await generateToken(user._id.toString(), user.role, user.email);
    console.log(token)
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Search Parents (Added for frontend parent search)
export const searchParents = async (req, res) => {
  const { query } = req.query;
  const {branchId} = req.user;
  try {
    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const parents = await User.find({
      role: "parent",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      branchId
    })
      .select("name email")
      .limit(10);

    res.status(200).json(parents);
  } catch (error) {
    console.error("Error searching parents:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  const {branchId} = req.user;
  try {
    const { role } = req.query;
    const query = role ? { role, branchId } : {branchId};
    const users = await User.find(query)
      .select("name email role phone status lastLogin")
      .lean();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update user password (Admin only)
export const updateUserPassword = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { userId } = req.params;
  const { password } = req.body;
  const {branchId} = req.user;

  // if (!password || password.length < 6) {
  //   return res.status(400).json({ message: "Password must be at least 6 characters" });
  // }

  try {
    const user = await User.findOne({_id:userId, branchId});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAdmins = async(req, res)=>{
  try {
    const admins = await User.find({ role: "admin" }).select("_id name email role phone status");
    console.log(admins);
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Create a new admin
export const createAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      status = "active",
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new User({
      role: "admin",
      name,
      email,
      password: hashedPassword,
      phone,
      status,
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully", admin: { name, email, phone, status } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const editAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      phone,
      status = "active",
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if the user exists and is an admin
    const admin = await User.findOne({ _id: userId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check for email uniqueness (excluding the current admin)
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Update admin fields
    admin.name = name;
    admin.email = email;
    admin.phone = phone || admin.phone; // Keep existing phone if not provided
    admin.status = status;

    await admin.save();

    res.status(200).json({ message: "Admin updated successfully", admin: { name, email, phone, status } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};