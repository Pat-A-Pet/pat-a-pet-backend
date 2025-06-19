import { Router } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/user.js";
import "dotenv/config";

const router = Router();

router.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const payload = { sub: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "36",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      refreshToken,
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "No token provided" });

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });

    const newToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET, {
      expiresIn: "6h",
    });

    res.json({ token: newToken });
  });
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const userWithoutPassword = { ...req.user.toObject() };
    delete userWithoutPassword.password;
    res.json({ user: userWithoutPassword });
  },
);

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    // Generate temporary token
    const resetToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      resetToken, // Client will need to include this in reset request
      message: "Proceed to reset password",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    const salt = await genSalt(10);
    user.password = await hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("JWT verf err:", err.message);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});
export default router;
