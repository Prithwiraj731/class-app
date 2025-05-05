const express = require("express");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const User = require("../models/User");

const router = express.Router();

// Route to create a class
router.post("/class/create", async (req, res) => {
  try {
    const { title, description, jitsiLink, scheduledTime } = req.body;
    const instructor = req.session?.user?._id;

    // Validate required fields
    if (!title || !description || !jitsiLink || !scheduledTime) {
      return res.status(400).send("All fields are required.");
    }

    if (!instructor) {
      return res.status(401).send("User not authenticated.");
    }

    // Validate instructor ID format
    if (!mongoose.Types.ObjectId.isValid(instructor)) {
      return res.status(400).send("Invalid instructor ID.");
    }

    // Check if instructor exists
    const instructorUser = await User.findById(instructor);
    if (!instructorUser) {
      return res.status(404).send("Instructor not found.");
    }

    // Create new class
    const newClass = new Class({
      title,
      description,
      jitsiLink,
      scheduledTime: new Date(scheduledTime),
      instructor: instructorUser._id,
      createdBy: instructorUser._id,
    });

    await newClass.save();

    console.log("✅ Class created successfully.");
    // Redirect user to classes list page (adjust if you have different page)
    res.redirect("/classes/list");
  } catch (error) {
    console.error("❌ Error creating class:", error.message);
    res.status(500).send("Error creating class: " + error.message);
  }
});

// Export router
module.exports = router;
