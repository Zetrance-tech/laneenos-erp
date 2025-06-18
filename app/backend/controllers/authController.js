import User from "../models/user.js";
import { generateToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log(1);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Use bcrypt.compare if passwords are hashed; otherwise, plain-text comparison
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // If passwords are plain-text in DB, temporarily use this:
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

    const token = generateToken(user._id.toString(), user.role, user.email);
    console.log("Generated token:", token); // Debug
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: error.message });
  }
};