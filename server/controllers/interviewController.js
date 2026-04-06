const Interview = require("../models/Interview");
const User = require("../models/User");

/* ── helpers ───────────────────────────────────────────────────────────── */

/** Parse "HH:MM" → total minutes from midnight. */
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes from midnight → "HH:MM". */
function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   POST /  —  Create a new interview
   Body: { title, date, startTime, endTime, slotDuration, panels: [{ panelId, interviewers }] }
   ══════════════════════════════════════════════════════════════════════ */
exports.createInterview = async (req, res) => {
  try {
    const { title, date, startTime, endTime, slotDuration, panels } = req.body;

    if (!title || !date || !startTime || !endTime || !slotDuration || !panels?.length) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (slotDuration < 5 || slotDuration > 120) {
      return res.status(400).json({ success: false, message: "Slot duration must be between 5 and 120 minutes." });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (endMins <= startMins) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    const interview = await Interview.create({
      title: title.trim(),
      date,
      startTime,
      endTime,
      slotDuration: Number(slotDuration),
      panels: panels.map((p, i) => ({
        panelId: p.panelId ?? i + 1,
        interviewers: p.interviewers || [],
      })),
      slots: [],
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({ success: true, data: interview });
  } catch (err) {
    console.error("createInterview error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   POST /generate-slots  —  Generate time slots for an interview
   Body: { interviewId }
   ══════════════════════════════════════════════════════════════════════ */
exports.generateSlots = async (req, res) => {
  try {
    const { interviewId } = req.body;
    if (!interviewId) {
      return res.status(400).json({ success: false, message: "interviewId is required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    const startMins = timeToMinutes(interview.startTime);
    const endMins = timeToMinutes(interview.endTime);
    const duration = interview.slotDuration;

    const slots = [];
    for (let t = startMins; t + duration <= endMins; t += duration) {
      const time = minutesToTime(t);
      for (const panel of interview.panels) {
        slots.push({
          time,
          panelId: panel.panelId,
          candidateId: null,
          candidateName: "",
          candidateEmail: "",
          status: "available",
        });
      }
    }

    interview.slots = slots;
    await interview.save();

    return res.json({ success: true, data: interview, slotsGenerated: slots.length });
  } catch (err) {
    console.error("generateSlots error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   POST /assign  —  Auto-assign candidates (FIFO) to available slots
   Body: { interviewId, candidateIds: [userId, ...] }
   ══════════════════════════════════════════════════════════════════════ */
exports.assignCandidates = async (req, res) => {
  try {
    const { interviewId, candidateIds } = req.body;
    if (!interviewId || !candidateIds?.length) {
      return res.status(400).json({ success: false, message: "interviewId and candidateIds are required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    // Fetch candidate details
    const candidates = await User.find({ _id: { $in: candidateIds } }).select("firstName lastName email");

    const candidateMap = new Map();
    for (const c of candidates) {
      candidateMap.set(c._id.toString(), c);
    }

    let assigned = 0;
    let candidateIndex = 0;

    for (let i = 0; i < interview.slots.length && candidateIndex < candidateIds.length; i++) {
      const slot = interview.slots[i];
      if (slot.status !== "available") continue;

      const cId = candidateIds[candidateIndex];
      const candidate = candidateMap.get(cId);
      if (!candidate) {
        candidateIndex++;
        continue;
      }

      slot.candidateId = candidate._id;
      slot.candidateName = `${candidate.firstName} ${candidate.lastName}`;
      slot.candidateEmail = candidate.email;
      slot.status = "scheduled";
      assigned++;
      candidateIndex++;
    }

    await interview.save();

    return res.json({
      success: true,
      data: interview,
      assigned,
      unassigned: candidateIds.length - assigned,
    });
  } catch (err) {
    console.error("assignCandidates error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   PATCH /status  —  Update a slot's status
   Body: { interviewId, slotIndex, status }
   ══════════════════════════════════════════════════════════════════════ */
exports.updateSlotStatus = async (req, res) => {
  try {
    const { interviewId, slotIndex, status } = req.body;
    const validStatuses = ["available", "scheduled", "completed", "selected", "rejected"];

    if (!interviewId || slotIndex == null || !status) {
      return res.status(400).json({ success: false, message: "interviewId, slotIndex, and status are required." });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }
    if (slotIndex < 0 || slotIndex >= interview.slots.length) {
      return res.status(400).json({ success: false, message: "Invalid slot index." });
    }

    interview.slots[slotIndex].status = status;
    await interview.save();

    return res.json({ success: true, data: interview });
  } catch (err) {
    console.error("updateSlotStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   GET /student/:userId  —  Get interview slot for a specific student
   ══════════════════════════════════════════════════════════════════════ */
exports.getStudentInterview = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    // Find interviews with a slot assigned to this user
    const interviews = await Interview.find({ "slots.candidateId": userId });

    const results = [];
    for (const interview of interviews) {
      for (const slot of interview.slots) {
        if (slot.candidateId?.toString() === userId) {
          const panel = interview.panels.find((p) => p.panelId === slot.panelId);
          results.push({
            interviewId: interview._id,
            title: interview.title,
            date: interview.date,
            time: slot.time,
            panelId: slot.panelId,
            interviewers: panel?.interviewers || [],
            status: slot.status,
          });
        }
      }
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("getStudentInterview error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   GET /  —  Get all interviews (admin view)
   ══════════════════════════════════════════════════════════════════════ */
exports.getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ date: -1 });
    return res.json({ success: true, data: interviews });
  } catch (err) {
    console.error("getInterviews error:", err);
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};
