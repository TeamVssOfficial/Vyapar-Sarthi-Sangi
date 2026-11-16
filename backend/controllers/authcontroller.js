import userModel from "../models/userModel.js";
import tokenblacklistmodel from "../models/tokenblacklist.js";
import authLogModel from "../models/authLogModel.js";
import jwt from "jsonwebtoken";

export async function registerController(req, res) {
  const { name, email, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const isExists = await userModel.findOne({
      email: email,
    });
    if (isExists) {
      return res.status(422).json({
        message: "user already exists with email",
        status: "failed",
      });
    }

    const user = await userModel.create({
      email,
      password,
      name,
    });

    // Record REGISTER event in MongoDB Audit Logs
    try {
      await authLogModel.create({
        user: user._id,
        email: user.email,
        action: "REGISTER",
        ip: String(ip),
        userAgent: String(userAgent),
      });
    } catch (e) {
      console.warn("Could not write REGISTER auth log:", e.message);
    }

    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });
    res.cookie("token", token);

    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.log("Registration Error:", error);
    res.status(400).json({
      message: "Registration Error:",
    });
  }
}

export async function loginController(req, res) {
  const { email, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    try {
      await authLogModel.create({
        email: email || "unknown",
        action: "LOGIN_FAILED",
        ip: String(ip),
        userAgent: String(userAgent),
        metadata: { reason: "User not found" },
      });
    } catch (e) {}
    return res.status(401).json({
      message: "user is not found",
    });
  }

  const isvalidpassword = await user.comparePassword(password);
  if (!isvalidpassword) {
    try {
      await authLogModel.create({
        user: user._id,
        email: user.email,
        action: "LOGIN_FAILED",
        ip: String(ip),
        userAgent: String(userAgent),
        metadata: { reason: "Invalid password" },
      });
    } catch (e) {}
    return res.status(401).json({
      message: "invalid password",
    });
  }

  // Update lastLogin on user document
  user.lastLogin = new Date();
  await user.save();

  // Record successful LOGIN event in MongoDB Audit Logs
  try {
    await authLogModel.create({
      user: user._id,
      email: user.email,
      action: "LOGIN",
      ip: String(ip),
      userAgent: String(userAgent),
    });
  } catch (e) {
    console.warn("Could not write LOGIN auth log:", e.message);
  }

  const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("token", token);

  res.status(200).json({
    user,
    token,
  });
}

export async function logoutController(req, res) {
  const token = req.cookies?.token || req.header("authorization")?.split(" ")[1];
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";

  if (!token) {
    return res.status(400).json({
      message: "token is not found",
    });
  }

  res.cookie("token", "");

  // Blacklist the token in MongoDB
  await tokenblacklistmodel.create({
    token: token,
  });

  // Extract user info if possible from token to log LOGOUT event
  let userEmail = "unknown";
  let userId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userID;
    const u = await userModel.findById(userId);
    if (u) userEmail = u.email;
  } catch (e) {}

  // Record LOGOUT event in MongoDB Audit Logs
  try {
    await authLogModel.create({
      user: userId,
      email: userEmail,
      action: "LOGOUT",
      ip: String(ip),
      userAgent: String(userAgent),
    });
  } catch (e) {
    console.warn("Could not write LOGOUT auth log:", e.message);
  }

  return res.status(200).json({
    message: "user is logout",
  });
}
