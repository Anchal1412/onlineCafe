const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const AdminProfile = require("../models/AdminProfile");
const authMiddleware = require('../middleware/auth');

// Register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
    });

    await admin.save();

    // Create admin profile
    const adminProfile = new AdminProfile({
      adminId: admin._id,
      name: admin.name,
      email: admin.email
    });

    await adminProfile.save();

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
router.post("/login", (req, res, next) => {
  passport.authenticate(
    "admin-local",
    { session: false },
    async (err, admin, info) => {
      if (err) return next(err);
      if (!admin) {
        return res.status(401).json({ message: info.message });
      }

      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      // Get admin profile
      const profile = await AdminProfile.findOne({ adminId: admin._id });

      res.json({
        token,
        admin: {
          id: admin._id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          expertise: profile.expertise,
          bio: profile.bio,
          rating: profile.rating,
          totalRatings: profile.totalRatings,
          isOnline: profile.isOnline
        },
      });
    }
  )(req, res, next);
});

// Protected routes
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await AdminProfile.findOne({ adminId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const profile = await AdminProfile.findOne({ adminId: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json({name : profile.name});
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, expertise, bio } = req.body;

    // First update admin profile
    const updatedProfile = await AdminProfile.findOneAndUpdate(
      { adminId: req.user._id },
      { name, email, phone, expertise, bio },
      { new: true }
    );

    // If email changed, update it in Admin collection
    if (email && email !== req.user.email) {
      await Admin.findByIdAndUpdate(
        req.user._id,
        { email }
      );
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    
    // If error is duplicate email
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle online status
router.post("/toggle-status", authMiddleware, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const profile = await AdminProfile.findOneAndUpdate(
      { adminId: req.user._id },
      { isOnline },
      { new: true }
    );
    res.json({ isOnline: profile.isOnline });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get active admins
router.get("/activeAdmins", async (req, res) => {
  try {
    const admins = await AdminProfile.find({ isOnline: true });
    const retArray = admins.map(admin => ({
      adminId: admin.adminId,
      name: admin.name,
      expertise: admin.expertise,
      bio: admin.bio,
      rating: admin.rating,
      totalRatings: admin.totalRatings,
      isOnline: admin.isOnline
    }));
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;