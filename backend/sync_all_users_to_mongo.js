import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "./models/userModel.js";
import authLogModel from "./models/authLogModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

async function syncUsers() {
  console.log("=================================================");
  console.log(" VSS AI - MongoDB Atlas User Synchronization");
  console.log("=================================================");

  const mongoUri = process.env.MongDB;
  if (!mongoUri) {
    console.error("ERROR: MongDB environment variable missing in backend/.env");
    process.exit(1);
  }

  const targetDb = process.env.DB_NAME || "test";
  console.log(`Connecting to MongoDB Atlas database: ${targetDb}...`);
  await mongoose.connect(mongoUri, { dbName: targetDb });
  console.log(`Connected to MongoDB Atlas database: ${targetDb}\n`);

  // Read users from SQLite database dump or default enterprise users
  const defaultUsersToSync = [
    {
      name: "hridesh maithani",
      email: "maithanihridesh9012@gmail.com",
      role: "user"
    },
    {
      name: "Enterprise Director",
      email: "demo@vssai.com",
      role: "admin"
    },
    {
      name: "hridesh maithani",
      email: "bj407hm123456789@gmail.com",
      role: "user"
    },
    {
      name: "hridesh maithani",
      email: "maithanihridesh000009012@gmail.com",
      role: "user"
    },
    {
      name: "Dick Vijay",
      email: "maithanihridesh901255@gmail.com",
      role: "user"
    }
  ];

  for (const u of defaultUsersToSync) {
    let existing = await userModel.findOne({ email: u.email });
    if (!existing) {
      existing = await userModel.create({
        name: u.name,
        email: u.email,
        password: "EnterprisePassword123!",
        role: u.role
      });
      console.log(`+ Synced new user to MongoDB: ${u.email} (${u.name})`);

      await authLogModel.create({
        user: existing._id,
        email: existing.email,
        action: "REGISTER",
        ip: "127.0.0.1",
        userAgent: "VSS_AI_Sync_Service"
      });
    } else {
      console.log(`= User already in MongoDB: ${u.email} (ID: ${existing._id})`);
    }
  }

  console.log(`\n--- Current Users in MongoDB Atlas (${targetDb}.users) ---`);
  const allMongoUsers = await userModel.find({});
  allMongoUsers.forEach(u => {
    console.log(` - ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });

  console.log(`\n--- Recent Auth Activity in MongoDB Atlas (${targetDb}.authlogs) ---`);
  const logs = await authLogModel.find({}).sort({ createdAt: -1 }).limit(10);
  logs.forEach(l => {
    console.log(` [${l.createdAt?.toISOString()}] ${l.action} -> ${l.email} (IP: ${l.ip})`);
  });

  console.log("\nSynchronization finished successfully!");
  await mongoose.disconnect();
}

syncUsers().catch(err => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
