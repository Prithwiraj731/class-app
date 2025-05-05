// routes/teacher.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');  // If you want to validate instructor existence

// Middleware to check authentication & role
function ensureTeacher(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'teacher') {
    return res.redirect('/login');
  }
  next();
}

router.get('/dashboard', ensureTeacher, async (req, res) => {
  try {
    const classes = await Class.find({ createdBy: req.session.user._id }).sort({ scheduledTime: 1 });
    res.render('teacher/dashboard', { classes });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Server error');
  }
});

router.post('/add-class', ensureTeacher, async (req, res) => {
  try {
    const { title, description, jitsiLink, scheduledTime } = req.body;

    // Validate fields
    if (!title || !jitsiLink || !scheduledTime) {
      return res.status(400).send('Title, Jitsi Link, and Scheduled Time are required.');
    }

    // Validate scheduledTime as date
    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).send('Invalid scheduled time.');
    }

    // Optionally validate user existence here:
    // const instructor = await User.findById(req.session.user._id);
    // if (!instructor) return res.status(404).send('Instructor not found.');

    await Class.create({
      title,
      description,
      jitsiLink,
      scheduledTime: scheduledDate,
      createdBy: req.session.user._id,
      instructor: req.session.user._id,  // optional, if your Class model has instructor field
    });

    res.redirect('/teacher/dashboard');
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
