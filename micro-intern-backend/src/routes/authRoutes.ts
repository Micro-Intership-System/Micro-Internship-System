import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {User} from "../models/user";

const router = express.Router();

// POST /api/auth/register
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "student"
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: "Role mismatch" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Build user response with role-specific fields
    const userResponse: any = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Include gamification fields for students
    if (user.role === "student") {
      userResponse.gold = user.gold || 0;
      userResponse.xp = user.xp || 0;
      userResponse.starRating = user.starRating || 1;
      userResponse.totalTasksCompleted = user.totalTasksCompleted || 0;
      userResponse.averageCompletionTime = user.averageCompletionTime || 0;
      userResponse.institution = user.institution;
      userResponse.skills = user.skills || [];
      userResponse.bio = user.bio;
      userResponse.profilePicture = user.profilePicture;
    }

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded) return res.status(401).json({ success: false });

    const user = await User.findById((decoded as any).userId).select("-password");
    res.json({ success: true, user });
  } catch {
    res.status(401).json({ success: false });
  }
});


export default router;
