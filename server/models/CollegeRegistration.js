const mongoose = require("mongoose");

const collegeRegistrationSchema = new mongoose.Schema(
  {
    collegeName: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },
    universityName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollegeRegistration", collegeRegistrationSchema);
