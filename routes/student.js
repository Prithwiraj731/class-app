// routes/student.js
const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

router.get('/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'student') return res.redirect('/login');
  const classes = await Class.find();
  res.render('student/dashboard', { classes });
});

module.exports = router;