
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/.env is always loaded regardless of working directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Use reliable public DNS servers to resolve MongoDB SRV cluster records
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
}

const mongoUri = process.env.MongDB || process.env.MONGODB_URI || "";
console.log("MongoDB Target URI:", mongoUri ? mongoUri.split("@").pop() : "Not configured in .env");

async function connectiontoDb() {
    try {
        const targetDb = process.env.DB_NAME || "test";
        const connect = await mongoose.connect(mongoUri, {
            dbName: targetDb,
        });

        console.log(`Database connected successfully: ${connect.connection.host} | DB: ${connect.connection.name}`);

    } catch (error) {
        console.error("MongoDB Atlas connection error:", error.message);
        console.warn("⚠️ Node.js server will continue running. To fix MongoDB Atlas, whitelist your IP in Atlas Network Access or add 0.0.0.0/0.");
    }
}

export default connectiontoDb;
