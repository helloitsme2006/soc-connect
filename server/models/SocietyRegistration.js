const mongoose = require("mongoose");

const societyRegistrationSchema = new mongoose.Schema(
  {
    societyName: { type: String, required: true, trim: true },
    collegeName: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocietyRegistration", societyRegistrationSchema);
