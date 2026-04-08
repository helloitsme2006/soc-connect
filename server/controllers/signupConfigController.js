const SignupConfig = require("../models/SignupConfig");
const Society = require("../models/Society");
const SocietyFaculty = require("../models/SocietyFaculty");
const { logActivity } = require("../utils/activityLog");

async function getRequesterSociety(req) {
  const emailNorm = (req.user?.email || "").trim().toLowerCase();
  if (!emailNorm) return null;

  const mapped = await SocietyFaculty.findOne({ email: emailNorm }).lean().catch(() => null);
  if (mapped) {
    const society = await Society.findOne({
      name: (mapped.societyName || "").trim(),
    }).catch(() => null);
    if (society) return society;
  }
  return Society.findOne({ email: emailNorm }).catch(() => null);
}

exports.getAllSignupConfigs = async (req, res) => {
  try {
    const society = await getRequesterSociety(req);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });
    const configDoc = await SignupConfig.findOne({ society: society._id }).lean();
    const dynamicDepartments = Array.isArray(society.positions)
      ? society.positions.map((p) => String(p || "").trim()).filter(Boolean)
      : [];
    const ordered = Array.from(new Set(dynamicDepartments));
    const byDept = new Map((configDoc?.departments || []).map((d) => [(d.department || "").trim(), d.allowedEmails || []]));
    const data = ordered.map((department) => ({
      department,
      allowedEmails: byDept.get(department) || [],
    }));
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllSignupConfigs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch signup config.",
      error: error.message,
    });
  }
};

exports.addEmail = async (req, res) => {
  try {
    const { department, email } = req.body;
    const deptTrim = department ? department.trim() : "";
    if (!deptTrim || !email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and email are required.",
      });
    }
    const society = await getRequesterSociety(req);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });
    const positionExists = (society.positions || []).some(
      (p) => String(p || "").trim().toLowerCase() === deptTrim.toLowerCase()
    );
    if (!positionExists) {
      return res.status(400).json({
        success: false,
        message: "Position not found in society core members.",
      });
    }
    const emailNorm = email.trim().toLowerCase();

    let config = await SignupConfig.findOne({ society: society._id });
    if (!config) {
      config = await SignupConfig.create({ society: society._id, departments: [] });
      society.signupconfigs = config._id;
      await society.save();
    }
    let deptEntry = config.departments.find((d) => (d.department || "").trim() === deptTrim);
    if (!deptEntry) {
      config.departments.push({ department: deptTrim, allowedEmails: [] });
      deptEntry = config.departments[config.departments.length - 1];
    }
    if ((deptEntry.allowedEmails || []).includes(emailNorm)) {
      return res.status(400).json({
        success: false,
        message: "Email already in list.",
      });
    }
    deptEntry.allowedEmails = deptEntry.allowedEmails || [];
    deptEntry.allowedEmails.push(emailNorm);
    await config.save();
    if (req.user?.id) {
      await logActivity(req.user.id, "signup_config_add", "signup_config", { department: deptTrim, email: emailNorm }, "", "SignupConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Email added.",
      data: config,
    });
  } catch (error) {
    console.error("addEmail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add email.",
    });
  }
};

exports.removeEmail = async (req, res) => {
  try {
    const { department, email } = req.body;
    const deptTrim = department ? department.trim() : "";
    if (!deptTrim || !email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and email are required.",
      });
    }
    const emailNorm = email.trim().toLowerCase();
    const society = await getRequesterSociety(req);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });
    const config = await SignupConfig.findOne({ society: society._id });
    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Email removed.",
        data: [],
      });
    }
    const deptEntry = config.departments.find((d) => (d.department || "").trim() === deptTrim);
    if (deptEntry) {
      deptEntry.allowedEmails = (deptEntry.allowedEmails || []).filter((e) => e !== emailNorm);
    }
    await config.save();
    if (req.user?.id) {
      await logActivity(req.user.id, "signup_config_remove", "signup_config", { department: deptTrim, email: emailNorm }, "", "SignupConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Email removed.",
      data: config,
    });
  } catch (error) {
    console.error("removeEmail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove email.",
    });
  }
};
