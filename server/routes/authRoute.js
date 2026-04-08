const express = require("express");
const {
  sendOTP,
  allowAutofill,
  getOtpForAutofill,
  signup,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  me,
  logout,
  updateProfile,
  updateAvatar,
  enrichProfile,
  searchPeople,
  getAllUsers,
  getAllPeople,
  sendSignupInvite,
  deleteAccount,
  resolveFacultyByEmail,
  verifySignupOTP,
  getFacultyContext,
  createCollegeSociety,
  updateFacultySocietyDetails,
} = require("../controllers/authController");
const {
  getAllSignupConfigs,
  addEmail,
  removeEmail,
} = require("../controllers/signupConfigController");
const { auth, isAdmin, canAccessDashboard, isCollegeAdmin } = require("../middlewares/AuthZ");

const router = express.Router();

router.post("/sendotp", sendOTP);
router.get("/allow-autofill", allowAutofill);
router.get("/otp-for-autofill", getOtpForAutofill);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/changepassword", auth, changePassword);
router.get("/me", auth, me);
router.get("/search-people", auth, searchPeople);
router.get("/all-users", auth, canAccessDashboard, getAllUsers);
router.get("/all-people", auth, getAllPeople);
router.post("/send-signup-invite", auth, sendSignupInvite);
router.delete("/account", auth, deleteAccount);
router.get("/enrich-profile", auth, enrichProfile);
router.put("/profile", auth, updateProfile);
router.post("/profile/avatar", auth, updateAvatar);

// Faculty signup helpers (used by the "Sign up - Faculty" UI).
router.post("/faculty/resolve", resolveFacultyByEmail);
router.post("/verify-otp", verifySignupOTP);
router.get("/faculty/context", auth, getFacultyContext);
router.post("/college/societies", auth, isCollegeAdmin, createCollegeSociety);
router.put("/faculty/society-details", auth, canAccessDashboard, updateFacultySocietyDetails);

router.get("/signup-config", auth, canAccessDashboard, getAllSignupConfigs);
router.post("/signup-config/add", auth, canAccessDashboard, addEmail);
router.post("/signup-config/remove", auth, canAccessDashboard, removeEmail);

module.exports = router;
