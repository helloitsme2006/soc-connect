const mongoose = require("mongoose");

const societyFacultySchema = new mongoose.Schema(
  {
    societyRegistration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyRegistration",
      required: true,
    },
    societyName: { type: String, required: true, trim: true },
    collegeName: { type: String, required: true, trim: true },

    // Department/accountType this faculty is signing up for
    accountType: { type: String, required: true, trim: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, trim: true, lowercase: true },

    // Optional: store faculty ID if you later add an input field in UI
    facultyId: { type: String, default: "" },
  },
  { timestamps: true }
);

societyFacultySchema.index({ societyRegistration: 1, email: 1, accountType: 1 }, { unique: true });

module.exports = mongoose.model("SocietyFaculty", societyFacultySchema);

