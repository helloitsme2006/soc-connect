const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    address: {
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      fullAddress: { type: String, required: true, trim: true },
    },
    logoUrl: { type: String, default: "" },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
    societies: [
      {
        societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },
        societyName: { type: String },
      },
    ],
    societies_signup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocietySignupConfig",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("College", collegeSchema);
