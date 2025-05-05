const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Class = require("../models/Class");
const { sendWelcomeEmail, sendNewClassAnnouncement } = require("../utils/mailer");

// GET: Login & Register pages
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/register", (req, res) => res.render("auth/register"));

// POST: Register user
router.post("/register", async (req, res) => {
  let { username, name, email, password, role } = req.body;

  username = username?.trim().replace(/\s+/g, "_");
  name = name?.trim();
  email = email?.trim();
  password = password?.trim();
  role = role?.trim();

  if (!username || !name || !email || !password || !role) {
    return res.status(400).send("Please provide all required fields.");
  }

  const validRoles = ["admin", "teacher", "student"];
  if (!validRoles.includes(role)) {
    return res.status(400).send("Invalid user role.");
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res.status(400).send(`${field} already exists.`);
    }

    const user = await User.create({
      username,
      name,
      email,
      password,
      role,
    });

    console.log("✅ User registered:", email);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.username);

    console.log("📨 Welcome email sent to:", user.email);

    res.redirect("/login");
  } catch (error) {
    console.error("❌ Error registering user:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).send(`${duplicateField} already exists.`);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).send(messages.join(", "));
    }

    res.status(500).send("Internal server error.");
  }
});

// POST: Login user
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  if (!email || !password) {
    return res.status(400).send("Please provide both email and password.");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).send("Invalid password.");
    }

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const redirectPath =
      user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    res.redirect(redirectPath);
  } catch (error) {
    console.error("❌ Error logging in user:", error);
    res.status(500).send("Internal server error.");
  }
});

// GET: Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// POST: Create class (by teacher)
router.post("/create", async (req, res) => {
  try {
    const { title, description, jitsiLink, scheduledTime } = req.body;

    if (!req.session.user) {
      console.log("❌ Unauthorized attempt to create class - no session user");
      return res.status(401).send("User is not authenticated.");
    }

    if (!title || !description || !jitsiLink || !scheduledTime) {
      return res.status(400).send("Please provide all required fields.");
    }

    if (
      !req.session.user._id ||
      !req.session.user._id.match(/^[0-9a-fA-F]{24}$/)
    ) {
      console.log("❌ Invalid instructor ID:", req.session.user._id);
      return res.status(400).send("Invalid instructor ID.");
    }

    const newClass = new Class({
      title,
      description,
      jitsiLink,
      scheduledTime: new Date(scheduledTime),
      instructor: req.session.user._id,
      createdBy: req.session.user._id,
    });

    await newClass.save();

    console.log(
      "✅ Class created successfully with instructor:",
      req.session.user._id
    );

    // Send new class announcement to all users
    const users = await User.find({}); // Get all users
    const emails = users.map(user => user.email);

    if (emails.length > 0) {
      await sendNewClassAnnouncement(emails, newClass.title);
      console.log("📨 New class email sent to all users");
    } else {
      console.log("⚠️ No users found to send class email");
    }

    res.redirect("/classes/list");
  } catch (error) {
    console.error("❌ Error creating class:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).send(messages.join(", "));
    }

    res.status(500).send("Failed to create class.");
  }
});

// GET: View class by ID
router.get("/class/:id", async (req, res) => {
  try {
    const course = await Class.findById(req.params.id);
    if (!course) {
      return res.status(404).send("Class not found");
    }
    res.render("class", { course });
  } catch (error) {
    console.error("❌ Error retrieving class:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
