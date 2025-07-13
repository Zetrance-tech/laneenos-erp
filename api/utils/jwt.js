import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "5h";

// const generateToken = (userId, role) => {
//   return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// };

const generateToken = async(userId, role) => {
  try {
    const payload = { userId, role };
    if (role !== "superadmin") {
      const user = await User.findById(userId).select("branchId");
      if (!user) {
        throw new Error("User not found");
      }
      if (user.branchId) {
        payload.branchId = user.branchId; 
      }
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw new Error("Failed to generate token");
  }
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export { generateToken, verifyToken };