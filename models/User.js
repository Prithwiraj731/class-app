const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypto = require("crypto"); // for generating tokens

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [30, "Username cannot exceed 30 characters."],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: "Username can only contain letters, numbers, and underscores.",
      },
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters."],
    },
    role: {
      type: String,
      required: [true, "User role is required."],
      enum: ["admin", "teacher", "student"],
      default: "student",
    },

    // NEW: email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Replace spaces with underscores before validation (sanitizing username)
userSchema.pre("validate", function (next) {
  if (this.username) {
    this.username = this.username.replace(/\s+/g, "_");
  }
  next();
});

// Generate verification token when new user is created (if not verified)
userSchema.pre("save", function (next) {
  if (this.isNew && !this.isVerified) {
    this.verificationToken = crypto.randomBytes(32).toString("hex");
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(12); // Increased salt rounds for stronger security
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    throw new Error("Error comparing password");
  }
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
