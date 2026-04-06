const mongoose = require("mongoose");

const universityRegistrationSchema = new mongoose.Schema(
  {
    universityName: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UniversityRegistration", universityRegistrationSchema);
