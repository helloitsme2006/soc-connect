const mongoose = require("mongoose");

const registrationOTPSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, required: true, enum: ["university", "college", "society"] },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 10-min TTL
  }
);

// Remove old OTP for same email+role before creating new
registrationOTPSchema.pre("save", async function (next) {
  await this.constructor.deleteMany({ email: this.email, role: this.role });
  next();
});

module.exports = mongoose.model("RegistrationOTP", registrationOTPSchema);
