const mongoose = require("mongoose");

const departmentConfigSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true },
    allowedEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { _id: false }
);

const signupConfigSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      unique: true,
    },
    departments: [departmentConfigSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SignupConfig", signupConfigSchema);
