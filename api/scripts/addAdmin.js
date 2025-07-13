import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const ObjectId = mongoose.Types.ObjectId;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
await mongoose.connect(process.env.MONGODB_URI);



const name = "admin1";
const email = "admin1@gmail.com";
const password = "admin1";


const hashedPassword = await bcrypt.hash(password, 10);


await User.create({
  role: "admin",
  name: name,
  email: email,
  password: hashedPassword,
  phone: "9999999999",
  status: "active",
  lastLogin: new Date(),
});

console.log("admin added!");
mongoose.disconnect();
