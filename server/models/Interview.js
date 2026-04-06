const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    panelId: { type: Number, required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    candidateName: { type: String, default: "" },
    candidateEmail: { type: String, default: "" },
    status: {
      type: String,
      enum: ["available", "scheduled", "completed", "selected", "rejected"],
      default: "available",
    },
  },
  { _id: false }
);

const panelSchema = new mongoose.Schema(
  {
    panelId: { type: Number, required: true },
    interviewers: [{ type: String, trim: true }],
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, required: true }, // minutes
    panels: [panelSchema],
    slots: [slotSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

interviewSchema.index({ date: 1 });
interviewSchema.index({ "slots.candidateId": 1 });

module.exports = mongoose.model("Interview", interviewSchema);
