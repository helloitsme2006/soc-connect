const mongoose = require("mongoose");

const societySchema = new mongoose.Schema(
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
    category: { type: String, enum: ["tech", "non-tech", ""], default: "" },
    description: { type: String, default: "" },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Society", societySchema);
