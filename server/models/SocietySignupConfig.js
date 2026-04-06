const mongoose = require("mongoose");

const societyDepartmentConfigSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
    },
    allowedEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    allowedIds: [
      {
        type: String,
        trim: true,
      },
    ],
    faultyIds: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const societySignupConfigSchema = new mongoose.Schema(
  {
    societyRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyRegistration",
      required: true,
      unique: true,
    },
    societyName: { type: String, default: "" },
    collegeName: { type: String, default: "" },
    departments: [societyDepartmentConfigSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocietySignupConfig", societySignupConfigSchema);

