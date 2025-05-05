const mongoose = require("mongoose");

// Define the Class schema
const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
    },
    jitsiLink: {
      type: String,
      required: [true, "Jitsi link is required."],
      validate: {
        validator: function (v) {
          // Basic URL validation (you can improve this regex if needed)
          return /^(https?:\/\/)/.test(v);
        },
        message: (props) => `${props.value} is not a valid URL.`,
      },
    },
    scheduledTime: {
      type: Date,
      required: [true, "Scheduled time is required."],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: () => `Scheduled time must be in the future.`,
      },
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required."],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to validate that the instructor exists in the database
classSchema.pre("save", async function (next) {
  try {
    if (!this.instructor) {
      return next(
        new mongoose.Error.ValidationError(this, {
          instructor: { message: "Instructor is required." },
        })
      );
    }

    const user = await mongoose.model("User").findById(this.instructor);
    if (!user) {
      const err = new mongoose.Error.ValidationError(this);
      err.addError(
        "instructor",
        new mongoose.Error.ValidatorError({
          message: "Instructor does not exist.",
        })
      );
      return next(err);
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.models.Class || mongoose.model("Class", classSchema);
