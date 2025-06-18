import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const generateToken = (userId, role, email) => {
  const payload = { userId, role, email};
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log("Generated token payload:", payload); 
  return token;
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export { generateToken, verifyToken };
