const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema(
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
    colleges: [
      {
        collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
        collegeName: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("University", universitySchema);
