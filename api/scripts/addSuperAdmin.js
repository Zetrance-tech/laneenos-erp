import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
await mongoose.connect(process.env.MONGODB_URI);


const name = "Super Admin"
const email = "superadmin@gmail.com"
const password = "superadmin";

const hashedPassword = await bcrypt.hash(password, 10);

await User.create({
  role: "superadmin",
  name: name,
  email: email,
  password: hashedPassword,
  phone: "9999999999",
  status: "active",
  lastLogin: new Date(),
});

console.log("Superadmin added!");
mongoose.disconnect();
