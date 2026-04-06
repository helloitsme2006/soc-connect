const express = require("express");
const router = express.Router();
const { auth, canAccessDashboard } = require("../middlewares/AuthZ");
const {
  createInterview,
  generateSlots,
  assignCandidates,
  updateSlotStatus,
  getStudentInterview,
  getInterviews,
} = require("../controllers/interviewController");

// Admin routes (society roles: Faculty Incharge, Chairperson, Vice-Chairperson)
router.get("/", auth, canAccessDashboard, getInterviews);
router.post("/", auth, canAccessDashboard, createInterview);
router.post("/generate-slots", auth, canAccessDashboard, generateSlots);
router.post("/assign", auth, canAccessDashboard, assignCandidates);
router.patch("/status", auth, canAccessDashboard, updateSlotStatus);

// Student route (any authenticated user)
router.get("/student/:userId", auth, getStudentInterview);

module.exports = router;
