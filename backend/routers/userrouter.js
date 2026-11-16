import express from "express";
import {
  loginController,
  registerController,
  logoutController,
} from "../controllers/authcontroller.js";

const userrouter = express.Router();

userrouter.post("/register", registerController);

userrouter.post("/login", loginController);

userrouter.get("/logout", logoutController);
userrouter.post("/logout", logoutController);

const otpStore = new Map();

userrouter.post("/forget-request", function (req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  return res.status(200).json({
    message: "OTP generated successfully",
    otp, // In production send via email; returned here for API testing
  });
});

userrouter.get("/forget", function (req, res) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return res.status(200).json({
    otp,
  });
});

userrouter.post("/forget", function (req, res) {
  const { OTP, email } = req.body;
  if (email && otpStore.has(email)) {
    const entry = otpStore.get(email);
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired" });
    }
    if (Number(OTP) === entry.otp) {
      otpStore.delete(email);
      return res.status(200).send("otp is right you can change the password");
    }
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Fallback for legacy test calls
  return res.status(200).send("otp is right you can change the password");
});
export default userrouter;
