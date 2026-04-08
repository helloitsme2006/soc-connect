const OTP = require("../models/OTP");
const PasswordReset = require("../models/PasswordReset");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const SignupConfig = require("../models/SignupConfig");
const SocietyRegistration = require("../models/SocietyRegistration");
const SocietySignupConfig = require("../models/SocietySignupConfig");
const SocietyFaculty = require("../models/SocietyFaculty");
const Society = require("../models/Society");
const College = require("../models/College");
const University = require("../models/University");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const { emailVerificationTemplate, passwordResetTemplate, passwordChangedTemplate, signupInviteTemplate } = require("../mail/templates");
const { imageUpload, uploadImageFromUrl } = require("../config/cloudinary");
const { getTeamMemberModel } = require("../models/TeamMember");
const { getEventUploadAllowedList } = require("./eventController");
const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";
const cryptoRandomPassword = () => crypto.randomBytes(24).toString("hex");

function findSocietyDepartmentAllowed(societySignupConfig, department, emailNorm) {
  if (!societySignupConfig || !Array.isArray(societySignupConfig.departments)) return false;
  const entry = societySignupConfig.departments.find((d) => (d.department || "").trim() === (department || "").trim());
  if (!entry) return false;
  return Array.isArray(entry.allowedEmails) ? entry.allowedEmails.includes(emailNorm) : false;
}

async function getAllowedDepartmentsFromGlobalSignupConfig(emailNorm) {
  const mapped = await SocietyFaculty.findOne({ email: emailNorm }).lean().catch(() => null);
  if (mapped) {
    const society = await Society.findOne({ name: (mapped.societyName || "").trim() }).lean().catch(() => null);
    if (society?.signupconfigs) {
      const cfg = await SignupConfig.findById(society.signupconfigs).lean().catch(() => null);
      if (cfg?.departments?.length) {
        return cfg.departments
          .filter((d) => Array.isArray(d.allowedEmails) && d.allowedEmails.includes(emailNorm))
          .map((d) => (d.department || "").trim())
          .filter(Boolean);
      }
    }
  }
  return [];
}

async function getFacultyContextByEmail(emailNorm) {
  // Prefer explicit mapping created at faculty signup.
  const mapped = await SocietyFaculty.findOne({ email: emailNorm }).lean().catch(() => null);
  if (mapped) {
    const societyDoc = await Society.findOne({
      name: (mapped.societyName || "").trim(),
    })
      .select("logoUrl category description")
      .lean()
      .catch(() => null);
    let logoUrl = societyDoc?.logoUrl || "";
    if (!logoUrl && mapped.societyRegistration) {
      const reg = await SocietyRegistration.findById(mapped.societyRegistration).select("logoUrl").lean().catch(() => null);
      logoUrl = reg?.logoUrl || "";
    }
    return {
      societyName: mapped.societyName || "",
      collegeName: mapped.collegeName || "",
      accountType: mapped.accountType || "ADMIN",
      logoUrl,
      category: societyDoc?.category || "",
      description: societyDoc?.description || "",
    };
  }

  // Fallback: use isolated society registration (email is faculty email there).
  const societyReg = await SocietyRegistration.findOne({ email: emailNorm }).lean().catch(() => null);
  if (societyReg) {
    return {
      societyName: societyReg.societyName || "",
      collegeName: societyReg.collegeName || "",
      accountType: "ADMIN",
      logoUrl: societyReg.logoUrl || "",
    };
  }
  return null;
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || "-" };
}

async function resolveRequesterSocietyByUser(userLike) {
  const emailNorm = (userLike?.email || "").trim().toLowerCase();
  if (!emailNorm) return null;
  const mapped = await SocietyFaculty.findOne({ email: emailNorm }).lean().catch(() => null);
  if (mapped) {
    const societyByMap = await Society.findOne({ name: (mapped.societyName || "").trim() }).catch(() => null);
    if (societyByMap) return societyByMap;
  }
  return Society.findOne({ email: emailNorm }).catch(() => null);
}

async function getPreferredDashboardByEmail(emailNorm, accountType) {
  if (accountType === "CollegeAdmin") return "/college-admin";
  if (accountType === "UniversityAdmin") return "/university-admin";

  const facultyCtx = await getFacultyContextByEmail(emailNorm);
  if (facultyCtx) return "/faculty-dashboard";

  const college = await College.findOne({ email: emailNorm }).select("_id").lean().catch(() => null);
  if (college) return "/college-admin";

  const university = await University.findOne({ email: emailNorm }).select("_id").lean().catch(() => null);
  if (university) return "/university-admin";

  return "/";
}

async function getCollegeContextByEmail(emailNorm, userLike) {
  const college = await College.findOne({ email: emailNorm })
    .populate("university", "name")
    .populate("societies.societyId", "name email")
    .lean()
    .catch(() => null);
  if (!college) return null;

  const addr = college.address || {};
  const location = [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  const activeSocieties = Array.isArray(college.societies)
    ? college.societies
        .map((s, index) => ({
          id: String(s?.societyId || s?._id || `${index}`),
          name: (s?.societyName || s?.societyId?.name || "").trim(),
          facultyEmail: (s?.societyId?.email || "").trim().toLowerCase(),
          status: "active",
        }))
        .filter((s) => s.name)
    : [];
  const pendingIds = Array.isArray(college.societies_signup) ? college.societies_signup.filter(Boolean) : [];
  const pendingConfigs = await SocietySignupConfig.find({ _id: { $in: pendingIds } })
    .select("_id societyName facultyEmail")
    .lean()
    .catch(() => []);
  const activeNames = new Set(activeSocieties.map((s) => s.name.toLowerCase()));
  const pendingSocieties = (pendingConfigs || [])
    .map((cfg) => ({
      id: String(cfg?._id || ""),
      name: (cfg?.societyName || "").trim(),
      facultyEmail: (cfg?.facultyEmail || "").trim().toLowerCase(),
      status: "pending",
    }))
    .filter((s) => s.name && !activeNames.has(s.name.toLowerCase()));
  const societies = [...activeSocieties, ...pendingSocieties];
  return {
    collegeName: college.name || "",
    universityName: college.university?.name || "",
    location: location || "",
    adminName: [userLike?.firstName, userLike?.lastName].filter(Boolean).join(" ").trim() || "College Admin",
    adminEmail: emailNorm,
    societies,
  };
}

/** Find PredefinedProfile by email (case-insensitive) so stored casing never causes "not found". */
function findPredefinedByEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return null;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return PredefinedProfile.findOne({ email: { $regex: new RegExp(`^${escaped}$`, "i") } }).lean();
}

exports.sendOTP = async (req, res) => {
  try {
    const { email, department } = req.body;
    if (!email || !department) {
      return res.status(400).json({
        success: false,
        message: "Email and department are required.",
      });
    }

    const emailNorm = email.trim().toLowerCase();
    const deptTrim = (department || "").trim();

    // First check: if this email belongs to an isolated society, prefer society-scoped config.
    const societyReg = await SocietyRegistration.findOne({ email: emailNorm }).lean().catch(() => null);
    if (societyReg) {
      const socCfg = await SocietySignupConfig.findOne({ societyRegistrationId: societyReg._id }).lean().catch(() => null);
      if (socCfg) {
        const allowed = findSocietyDepartmentAllowed(socCfg, deptTrim, emailNorm);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "This email is not allowed to sign up for the selected department.",
          });
        }
      } else {
        // Fallback: if society-specific config isn't created yet, use global signup config.
        const allowedFromCfg = await getAllowedDepartmentsFromGlobalSignupConfig(emailNorm);
        if (!allowedFromCfg.includes(deptTrim)) {
          return res.status(403).json({
            success: false,
            message: "This email is not allowed to sign up for the selected department.",
          });
        }
      }
    } else {
      // Fallback: global signup config
      const allowedFromCfg = await getAllowedDepartmentsFromGlobalSignupConfig(emailNorm);
      if (!allowedFromCfg.includes(deptTrim)) {
        return res.status(403).json({
          success: false,
          message: "This email is not allowed to sign up for the selected department.",
        });
      }
    }

    const checkUserPresent = await User.findOne({ email: emailNorm });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered.",
      });
    }

    await OTP.collection.createIndex({ otp: 1 }, { unique: true }).catch(() => { });

    let otp;
    let otpBody;

    const pollToken = crypto.randomBytes(24).toString("hex");
    while (true) {
      try {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        otpBody = await OTP.create({ email: emailNorm, otp, pollToken });
        break;
      } catch (err) {
        if (err.code === 11000) continue;
        throw err;
      }
    }

    // Link hits backend to mark "user allowed autofill" - no redirect to frontend
    // console.log(process.env.API_URL);
    
    const apiUrl = (process.env.API_URL || `http://localhost:${process.env.PORT || 8080}`).replace(/\/$/, "");
    const autofillUrl = `${apiUrl}/api/v1/auth/allow-autofill?token=${encodeURIComponent(pollToken)}`;
    const htmlContent = emailVerificationTemplate(otp, autofillUrl);

    await mailSender(emailNorm, "GFGxBVCOE – Signup OTP", htmlContent);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      pollToken,
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

/** Called when user clicks "Autofill OTP" link in email. Marks that user allowed autofill. */
exports.allowAutofill = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).send("Invalid request.");
    }
    const updated = await OTP.findOneAndUpdate(
      { pollToken: token.trim() },
      { $set: { autofillAllowed: true } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).send("Link expired or already used.");
    }
    return res.status(200).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>OTP Autofill</title></head>
      <body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;">
        <div style="text-align:center;padding:2rem;">
          <p style="font-size:1.25rem;">✓ Check your signup tab — OTP will autofill there.</p>
          <p style="color:#94a3b8;font-size:0.875rem;">You can close this tab.</p>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error("allowAutofill error:", error);
    return res.status(500).send("Something went wrong.");
  }
};

/** Polled by signup page: returns OTP only when user clicked allow-autofill link, then clears. */
exports.getOtpForAutofill = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Token required." });
    }
    const doc = await OTP.findOne({ pollToken: token.trim(), autofillAllowed: true }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Not yet allowed or already used." });
    }
    await OTP.updateOne({ _id: doc._id }, { $unset: { pollToken: 1, autofillAllowed: 1 } });
    return res.status(200).json({ success: true, otp: doc.otp });
  } catch (error) {
    console.error("getOtpForAutofill error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp || !accountType) {
      return res.status(403).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const emailNorm = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Validate allowed email for the chosen accountType (department).
    const societyReg = await SocietyRegistration.findOne({ email: emailNorm }).lean().catch(() => null);
    if (societyReg) {
      const socCfg = await SocietySignupConfig.findOne({ societyRegistrationId: societyReg._id }).lean().catch(() => null);
      if (socCfg) {
        const allowed = findSocietyDepartmentAllowed(socCfg, accountType.trim(), emailNorm);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "This email is not allowed to sign up for the selected department.",
          });
        }
      } else {
        const allowedFromCfg = await getAllowedDepartmentsFromGlobalSignupConfig(emailNorm);
        if (!allowedFromCfg.includes(accountType.trim())) {
          return res.status(403).json({
            success: false,
            message: "This email is not allowed to sign up for the selected department.",
          });
        }
      }
    } else {
      const allowedFromCfg = await getAllowedDepartmentsFromGlobalSignupConfig(emailNorm);
      if (!allowedFromCfg.includes(accountType.trim())) {
        return res.status(403).json({
          success: false,
          message: "This email is not allowed to sign up for the selected department.",
        });
      }
    }

    const recentOTP = await OTP.find({ email: emailNorm }).sort({ createdAt: -1 }).limit(1);
    if (!recentOTP.length || recentOTP[0].otp.toString() !== otp.toString()) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dob: null,
      about: null,
      phoneNumber: null,
    });

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailNorm,
      password: hashPassword,
      contact: "",
      accountType: accountType.trim(),
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
    });

    const payload = {
      email: newUser.email,
      id: newUser._id,
      accountType: newUser.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1y" });

    let userObj = newUser.toObject();
    userObj.token = token;
    userObj.password = undefined;

    // If this is a faculty signup coming from a SocietyRegistration,
    // store mapping and promote pending config to active society.
    if (societyReg) {
      const pendingConfig = await SocietySignupConfig.findOne({ societyRegistrationId: societyReg._id })
        .select("_id departments")
        .lean()
        .catch(() => null);

      await SocietyFaculty.create({
        societyRegistration: societyReg._id,
        societyName: societyReg.societyName || "",
        collegeName: societyReg.collegeName || "",
        accountType: accountType.trim(),
        user: newUser._id,
        email: emailNorm,
        facultyId: "",
      }).catch(() => { });

      const parentCollege = await College.findOne({ name: societyReg.collegeName.trim() }).catch(() => null);
      if (parentCollege) {
        const existingSociety = await Society.findOne({
          college: parentCollege._id,
          name: societyReg.societyName.trim(),
        }).lean().catch(() => null);

        if (!existingSociety) {
          const seededPassword = await bcrypt.hash(cryptoRandomPassword(), 10);
          const promoted = await Society.create({
            name: societyReg.societyName.trim(),
            address: {
              state: parentCollege.address?.state || "NA",
              city: parentCollege.address?.city || "NA",
              pincode: parentCollege.address?.pincode || "NA",
              fullAddress: parentCollege.address?.fullAddress || "NA",
            },
            logoUrl: societyReg.logoUrl || "",
            college: parentCollege._id,
            email: emailNorm,
            password: seededPassword,
            verified: true,
            status: "approved",
          });

          let signupCfg = null;
          if (pendingConfig?.departments?.length) {
            signupCfg = await SignupConfig.create({
              society: promoted._id,
              departments: pendingConfig.departments.map((d) => ({
                department: (d.department || "").trim(),
                allowedEmails: Array.isArray(d.allowedEmails) ? d.allowedEmails : [],
              })),
            }).catch(() => null);
          } else {
            signupCfg = await SignupConfig.create({
              society: promoted._id,
              departments: [],
            }).catch(() => null);
          }
          if (signupCfg?._id) {
            promoted.signupconfigs = signupCfg._id;
            await promoted.save();
          }

          parentCollege.societies = Array.isArray(parentCollege.societies) ? parentCollege.societies : [];
          const alreadyLinked = parentCollege.societies.some(
            (s) => String(s?.societyId) === String(promoted._id) || (s?.societyName || "").trim().toLowerCase() === promoted.name.toLowerCase()
          );
          if (!alreadyLinked) {
            parentCollege.societies.push({ societyId: promoted._id, societyName: promoted.name });
          }
        }

        if (pendingConfig?._id) {
          parentCollege.societies_signup = Array.isArray(parentCollege.societies_signup)
            ? parentCollege.societies_signup.filter((id) => String(id) !== String(pendingConfig._id))
            : [];
        }
        await parentCollege.save();
      }

      await SocietySignupConfig.deleteOne({ societyRegistrationId: societyReg._id }).catch(() => { });
      await SocietyRegistration.deleteOne({ _id: societyReg._id }).catch(() => { });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // "none" for cross-site in production, "lax" for same-site in dev
      path: "/",
    };
    res.cookie("Token", token, options);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: userObj,
    });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating the entry in database.",
      error: error.message,
    });
  }
};

exports.createCollegeSociety = async (req, res) => {
  try {
    const { societyName, facultyEmail } = req.body || {};
    const emailNorm = String(facultyEmail || "").trim().toLowerCase();
    const nameTrim = String(societyName || "").trim();
    if (!nameTrim || !emailNorm) {
      return res.status(400).json({ success: false, message: "Society name and faculty email are required." });
    }

    const college = await College.findOne({ email: (req.user?.email || "").trim().toLowerCase() });
    if (!college) return res.status(404).json({ success: false, message: "College context not found." });

    const activeExists = (college.societies || []).some(
      (s) => (s?.societyName || "").trim().toLowerCase() === nameTrim.toLowerCase()
    );
    if (activeExists) {
      return res.status(409).json({ success: false, message: "Society already exists in this college." });
    }

    const pendingIds = Array.isArray(college.societies_signup) ? college.societies_signup.filter(Boolean) : [];
    const existingPending = await SocietySignupConfig.findOne({
      _id: { $in: pendingIds },
      societyName: nameTrim,
    }).lean();
    if (existingPending) {
      return res.status(409).json({ success: false, message: "Pending society already exists for this college." });
    }

    const existingUser = await User.findOne({ email: emailNorm }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Faculty email is already registered as a user." });
    }

    const existingSocietyEmail = await Society.findOne({ email: emailNorm }).select("_id").lean();
    if (existingSocietyEmail) {
      return res.status(409).json({ success: false, message: "Faculty email already linked to an active society." });
    }

    const regPassword = await bcrypt.hash(cryptoRandomPassword(), 10);
    const registration = await SocietyRegistration.create({
      societyName: nameTrim,
      collegeName: college.name,
      logoUrl: "",
      email: emailNorm,
      password: regPassword,
      verified: true,
      status: "pending",
    });

    const createdConfig = await SocietySignupConfig.create({
      societyRegistrationId: registration._id,
      societyName: nameTrim,
      collegeName: college.name,
      facultyEmail: emailNorm,
      source: "college-admin",
      departments: [
        {
          department: "ADMIN",
          allowedEmails: [emailNorm],
          allowedIds: [],
          faultyIds: [],
        },
      ],
    });

    college.societies_signup = Array.isArray(college.societies_signup) ? college.societies_signup : [];
    college.societies_signup.push(createdConfig._id);
    await college.save();

    return res.status(201).json({
      success: true,
      message: "Society draft created. It will become active after faculty signup.",
      data: {
        id: String(registration._id),
        name: nameTrim,
        facultyEmail: emailNorm,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("createCollegeSociety error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create society draft." });
  }
};

exports.updateFacultySocietyDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("email firstName lastName");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const emailNorm = (user.email || "").trim().toLowerCase();
    const mapped = await SocietyFaculty.findOne({ email: emailNorm });
    if (!mapped) {
      return res.status(404).json({ success: false, message: "Faculty-society mapping not found." });
    }

    const incomingSocietyName = String(req.body?.societyName || "").trim();
    const incomingCategory = String(req.body?.category || "").trim();
    const incomingDescription = String(req.body?.description || "").trim();
    const incomingFacultyName = String(req.body?.facultyName || "").trim();

    if (!incomingSocietyName) {
      return res.status(400).json({ success: false, message: "Society name is required." });
    }
    if (!["tech", "non-tech"].includes(incomingCategory)) {
      return res.status(400).json({ success: false, message: "Valid category is required." });
    }

    let nextLogoUrl = "";
    const previousSocietyName = (mapped.societyName || "").trim();
    const existingSoc = await Society.findOne({
      name: previousSocietyName,
      college: { $exists: true },
    }).select("logoUrl").lean().catch(() => null);
    nextLogoUrl = existingSoc?.logoUrl || "";

    if (req.files?.logo) {
      const upload = await imageUpload(req.files.logo, "soc-connect-logos");
      nextLogoUrl = upload?.secure_url || nextLogoUrl;
    }

    const college = await College.findOne({ name: (mapped.collegeName || "").trim() });
    if (!college) return res.status(404).json({ success: false, message: "College not found for this society." });

    let societyDoc = await Society.findOne({
      college: college._id,
      name: previousSocietyName,
    });
    if (!societyDoc) {
      return res.status(404).json({ success: false, message: "Active society not found." });
    }

    societyDoc.name = incomingSocietyName;
    societyDoc.category = incomingCategory;
    societyDoc.description = incomingDescription;
    if (nextLogoUrl) societyDoc.logoUrl = nextLogoUrl;
    await societyDoc.save();

    mapped.societyName = incomingSocietyName;
    await mapped.save();

    if (incomingFacultyName) {
      const { firstName, lastName } = splitName(incomingFacultyName);
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      await user.save();
    }

    college.societies = Array.isArray(college.societies) ? college.societies : [];
    college.societies = college.societies.map((s) => {
      if (
        String(s?.societyId) === String(societyDoc._id) ||
        (s?.societyName || "").trim().toLowerCase() === previousSocietyName.toLowerCase()
      ) {
        return { ...s, societyName: incomingSocietyName, societyId: societyDoc._id };
      }
      return s;
    });
    await college.save();

    const freshCtx = await getFacultyContextByEmail(emailNorm);
    return res.status(200).json({
      success: true,
      message: "Society details updated successfully.",
      data: {
        facultyName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        context: freshCtx,
      },
    });
  } catch (error) {
    console.error("updateFacultySocietyDetails error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update society details." });
  }
};

exports.getFacultyCoreMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email").lean();
    const society = await resolveRequesterSocietyByUser(user);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });
    const positions = Array.isArray(society.positions) ? society.positions.map((p) => String(p || "").trim()).filter(Boolean) : [];
    const cfg = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs).lean().catch(() => null) : null;
    const byDept = new Map((cfg?.departments || []).map((d) => [(d.department || "").trim(), d.allowedEmails || []]));
    const rows = positions.map((position) => ({
      id: position,
      position,
      email: (byDept.get(position) || [])[0] || "",
    }));
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("getFacultyCoreMembers error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch core members." });
  }
};

exports.addFacultyCoreMember = async (req, res) => {
  try {
    const { position, email } = req.body || {};
    const pos = String(position || "").trim();
    const emailNorm = String(email || "").trim().toLowerCase();
    if (!pos || !emailNorm) {
      return res.status(400).json({ success: false, message: "Position and email are required." });
    }
    const user = await User.findById(req.user.id).select("email").lean();
    const society = await resolveRequesterSocietyByUser(user);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });

    society.positions = Array.isArray(society.positions) ? society.positions.map((p) => String(p || "").trim()).filter(Boolean) : [];
    const duplicate = society.positions.some((p) => p.toLowerCase() === pos.toLowerCase());
    if (duplicate) return res.status(409).json({ success: false, message: "This core member already exists." });
    society.positions.push(pos);
    await society.save();

    let cfg = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs) : null;
    if (!cfg) {
      cfg = await SignupConfig.create({ society: society._id, departments: [] });
      society.signupconfigs = cfg._id;
      await society.save();
    }
    let dept = cfg.departments.find((d) => (d.department || "").trim() === pos);
    if (!dept) {
      cfg.departments.push({ department: pos, allowedEmails: [emailNorm] });
    } else if (!dept.allowedEmails.includes(emailNorm)) {
      dept.allowedEmails.push(emailNorm);
    }
    await cfg.save();

    const refreshed = await SignupConfig.findById(cfg._id).lean().catch(() => null);
    const rows = (society.positions || []).map((position) => ({
      id: position,
      position,
      email: ((refreshed?.departments || []).find((d) => (d.department || "").trim() === position)?.allowedEmails || [])[0] || "",
    }));
    return res.status(201).json({ success: true, message: "Core member added.", data: rows });
  } catch (error) {
    console.error("addFacultyCoreMember error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add core member." });
  }
};

exports.updateFacultyCoreMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, email } = req.body || {};
    const pos = String(position || "").trim();
    const emailNorm = String(email || "").trim().toLowerCase();
    if (!id || !pos || !emailNorm) {
      return res.status(400).json({ success: false, message: "Id, position and email are required." });
    }
    const user = await User.findById(req.user.id).select("email").lean();
    const society = await resolveRequesterSocietyByUser(user);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });

    const oldPos = String(id || "").trim();
    const hasOld = (society.positions || []).some((p) => String(p || "").trim() === oldPos);
    if (!hasOld) return res.status(404).json({ success: false, message: "Core member not found." });
    society.positions = (society.positions || []).map((p) => {
      const v = String(p || "").trim();
      return v === oldPos ? pos : v;
    });
    await society.save();

    const cfg = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs) : null;
    if (cfg) {
      const oldDept = cfg.departments.find((d) => (d.department || "").trim() === oldPos);
      const oldEmail = (oldDept?.allowedEmails || [])[0] || "";
      if (oldDept) oldDept.allowedEmails = (oldDept.allowedEmails || []).filter((e) => e !== oldEmail);
      let newDept = cfg.departments.find((d) => (d.department || "").trim() === pos);
      if (!newDept) {
        cfg.departments.push({ department: pos, allowedEmails: [emailNorm] });
      } else if (!newDept.allowedEmails.includes(emailNorm)) {
        newDept.allowedEmails.push(emailNorm);
      }
      await cfg.save();
    }

    const refreshed = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs).lean().catch(() => null) : null;
    const rows = (society.positions || []).map((positionItem) => ({
      id: positionItem,
      position: positionItem,
      email: ((refreshed?.departments || []).find((d) => (d.department || "").trim() === positionItem)?.allowedEmails || [])[0] || "",
    }));
    return res.status(200).json({ success: true, message: "Core member updated.", data: rows });
  } catch (error) {
    console.error("updateFacultyCoreMember error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update core member." });
  }
};

exports.deleteFacultyCoreMember = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id).select("email").lean();
    const society = await resolveRequesterSocietyByUser(user);
    if (!society) return res.status(404).json({ success: false, message: "Society not found." });

    const oldPos = String(id || "").trim();
    const exists = (society.positions || []).some((p) => String(p || "").trim() === oldPos);
    if (!exists) return res.status(404).json({ success: false, message: "Core member not found." });
    society.positions = (society.positions || []).map((p) => String(p || "").trim()).filter((p) => p && p !== oldPos);
    await society.save();

    const cfg = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs) : null;
    if (cfg) {
      const oldDept = cfg.departments.find((d) => (d.department || "").trim() === oldPos);
      if (oldDept) {
        const oldEmail = (oldDept.allowedEmails || [])[0] || "";
        oldDept.allowedEmails = (oldDept.allowedEmails || []).filter((e) => e !== oldEmail);
      }
      await cfg.save();
    }

    const refreshed = society.signupconfigs ? await SignupConfig.findById(society.signupconfigs).lean().catch(() => null) : null;
    const rows = (society.positions || []).map((positionItem) => ({
      id: positionItem,
      position: positionItem,
      email: ((refreshed?.departments || []).find((d) => (d.department || "").trim() === positionItem)?.allowedEmails || [])[0] || "",
    }));
    return res.status(200).json({ success: true, message: "Core member removed.", data: rows });
  } catch (error) {
    console.error("deleteFacultyCoreMember error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete core member." });
  }
};

// Faculty UI: resolve society/college by email + return allowed departments.
exports.resolveFacultyByEmail = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const emailNorm = String(email).trim().toLowerCase();

    const societyReg = await SocietyRegistration.findOne({ email: emailNorm }).lean();
    if (!societyReg) {
      return res.status(404).json({ success: false, message: "Email not found in society registrations." });
    }

    const socCfg = await SocietySignupConfig.findOne({ societyRegistrationId: societyReg._id }).lean().catch(() => null);

    let allowedDepartments = [];
    if (socCfg && Array.isArray(socCfg.departments) && socCfg.departments.length) {
      allowedDepartments = socCfg.departments
        .filter((d) => Array.isArray(d.allowedEmails) && d.allowedEmails.includes(emailNorm))
        .map((d) => (d.department || "").trim())
        .filter(Boolean);
    }

    // If society-specific config isn't created yet, fallback to global signup config.
    if (!socCfg) {
      allowedDepartments = await getAllowedDepartmentsFromGlobalSignupConfig(emailNorm);
    }

    if (!allowedDepartments.length) {
      return res.status(403).json({ success: false, message: "No allowed departments found for this email." });
    }

    return res.status(200).json({
      success: true,
      data: {
        societyName: societyReg.societyName,
        collegeName: societyReg.collegeName,
        logoUrl: societyReg.logoUrl || "",
        allowedDepartments,
      },
    });
  } catch (error) {
    console.error("resolveFacultyByEmail error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to resolve faculty email." });
  }
};

// Used by the faculty signup UI "Verify OTP" step.
exports.verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and otp are required." });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const otpStr = String(otp).trim();

    const recentOTP = await OTP.find({ email: emailNorm }).sort({ createdAt: -1 }).limit(1);
    if (!recentOTP.length || recentOTP[0].otp.toString() !== otpStr) {
      return res.status(401).json({ success: false, message: "Invalid OTP." });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("verifySignupOTP error:", error);
    return res.status(500).json({ success: false, message: error.message || "OTP verification failed." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const emailNorm = email.trim().toLowerCase();
    let user = await User.findOne({ email: emailNorm }).populate("additionalDetails");

    // If a User is not present yet, allow direct login via registration credentials.
    if (!user) {
      const societyReg = await SocietyRegistration.findOne({ email: emailNorm });
      if (societyReg) {
        const matchesSocietyPassword = await bcrypt.compare(password, societyReg.password);
        if (!matchesSocietyPassword) {
          return res.status(403).json({
            success: false,
            message: "Password incorrect.",
          });
        }

        // Auto-provision a real faculty user on first direct login.
        const profileDetails = await Profile.create({
          gender: null,
          dob: null,
          about: null,
          phoneNumber: null,
        });

        user = await User.create({
          firstName: "Faculty",
          lastName: "Incharge",
          email: emailNorm,
          password: societyReg.password, // reuse existing hash from society registration
          contact: "",
          accountType: "ADMIN",
          additionalDetails: profileDetails._id,
          image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent("Faculty Incharge")}`,
        });

        await SocietyFaculty.findOneAndUpdate(
          { email: emailNorm, societyRegistration: societyReg._id, accountType: "ADMIN" },
          {
            $setOnInsert: {
              societyRegistration: societyReg._id,
              societyName: societyReg.societyName || "",
              collegeName: societyReg.collegeName || "",
              accountType: "ADMIN",
              email: emailNorm,
              facultyId: "",
            },
            $set: { user: user._id },
          },
          { upsert: true, new: true }
        );

        user = await User.findById(user._id).populate("additionalDetails");
      } else {
        const collegeReg = await College.findOne({ email: emailNorm }).lean();
        if (!collegeReg) {
          return res.status(401).json({
            success: false,
            message: "User not registered.",
          });
        }

        const matchesCollegePassword = await bcrypt.compare(password, collegeReg.password);
        if (!matchesCollegePassword) {
          return res.status(403).json({
            success: false,
            message: "Password incorrect.",
          });
        }

        // Auto-provision a college admin user on first direct login.
        const profileDetails = await Profile.create({
          gender: null,
          dob: null,
          about: null,
          phoneNumber: null,
        });

        user = await User.create({
          firstName: "College",
          lastName: "Admin",
          email: emailNorm,
          password: collegeReg.password, // reuse existing hash from college registration
          contact: "",
          accountType: "CollegeAdmin",
          additionalDetails: profileDetails._id,
          image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(collegeReg.name || "College Admin")}`,
        });

        user = await User.findById(user._id).populate("additionalDetails");
      }
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({
        success: false,
        message: "Password incorrect.",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1y" });

    user = user.toObject();
    user.token = token;
    user.password = undefined;
    const eventUploadAllowed = await getEventUploadAllowedList();
    user.canManageEvents = eventUploadAllowed.includes(user.accountType);
    const facultyContext = await getFacultyContextByEmail(emailNorm);
    if (facultyContext) user.facultyContext = facultyContext;
    const collegeContext = await getCollegeContextByEmail(emailNorm, user);
    if (collegeContext) user.collegeContext = collegeContext;
    user.preferredDashboard = await getPreferredDashboardByEmail(emailNorm, user.accountType);

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // "none" for cross-site in production, "lax" for same-site in dev
      path: "/",
    };
    res.cookie("Token", token, options).status(200).json({
      success: true,
      token,
      user,
      message: "User logged in successfully.",
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = email?.trim()?.toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const token = PasswordReset.generateToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await PasswordReset.deleteMany({ email: emailNorm });
    await PasswordReset.create({ email: emailNorm, token, expiresAt });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log("forgot pass base url:" + process.env.FRONTEND_URL );
    
    const resetLink = `${baseUrl}/reset-password/${token}`;
    const htmlContent = passwordResetTemplate(resetLink);

    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
      await mailSender(user.email, "Reset your password – GFGxBVCOE", htmlContent);
    } else {
      console.log("[forgotPassword] No mail config. Reset link:", resetLink);
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, password and confirm password are required.",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match.",
      });
    }

    const resetDoc = await PasswordReset.findOne({ token });
    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }
    if (new Date() > resetDoc.expiresAt) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: "Reset link has expired.",
      });
    }

    const user = await User.findOne({ email: resetDoc.email });
    if (!user) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordReset.deleteOne({ token });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
      const htmlContent = passwordChangedTemplate();
      await mailSender(user.email, "Password Changed – GFGxBVCOE", htmlContent);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating password.",
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).populate("additionalDetails").select("-password");
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const user = userDoc.toObject();
    const eventUploadAllowed = await getEventUploadAllowedList();
    user.canManageEvents = eventUploadAllowed.includes(user.accountType);
    const facultyContext = await getFacultyContextByEmail((user.email || "").trim().toLowerCase());
    if (facultyContext) user.facultyContext = facultyContext;
    const collegeContext = await getCollegeContextByEmail((user.email || "").trim().toLowerCase(), user);
    if (collegeContext) user.collegeContext = collegeContext;
    user.preferredDashboard = await getPreferredDashboardByEmail((user.email || "").trim().toLowerCase(), user.accountType);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Authenticated faculty data for dashboard rendering.
exports.getFacultyContext = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email accountType").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const ctx = await getFacultyContextByEmail((user.email || "").trim().toLowerCase());
    if (!ctx) return res.status(404).json({ success: false, message: "Faculty context not found." });
    return res.status(200).json({ success: true, data: ctx });
  } catch (error) {
    console.error("getFacultyContext error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch faculty context." });
  }
};

exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res
    .clearCookie("Token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // Must match the options used when setting the cookie
      path: "/",
    })
    .status(200)
    .json({ success: true, message: "Logged out." });
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      gender,
      dob,
      about,
      contact,
      yearOfStudy,
      section,
      non_tech_society,
      position,
      instagram,
      linkedin,
      github,
    } = req.body;

    const user = await User.findById(userId).populate("additionalDetails");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (contact !== undefined) user.contact = (contact || "").trim();
    await user.save();

    let profile = user.additionalDetails;
    if (!profile) {
      profile = await Profile.create({
        gender: gender || null,
        dob: dob || null,
        about: about || null,
        phoneNumber: contact || null,
        yearOfStudy: yearOfStudy || null,
        section: section || null,
        non_tech_society: non_tech_society || null,
        position: position || null,
        socials: {
          instagram: instagram || null,
          linkedin: linkedin || null,
          github: github || null,
        },
      });
      user.additionalDetails = profile._id;
      await user.save();
    } else {
      if (gender !== undefined) profile.gender = gender || null;
      if (dob !== undefined) profile.dob = dob || null;
      if (about !== undefined) profile.about = about || null;
      if (contact !== undefined) profile.phoneNumber = (contact || "").trim() || null;
      if (yearOfStudy !== undefined) profile.yearOfStudy = yearOfStudy || null;
      if (section !== undefined) profile.section = section || null;
      if (non_tech_society !== undefined) profile.non_tech_society = non_tech_society || null;
      if (position !== undefined) profile.position = position || null;
      if (instagram !== undefined || linkedin !== undefined || github !== undefined) {
        profile.socials = profile.socials || {};
        if (instagram !== undefined) profile.socials.instagram = instagram || null;
        if (linkedin !== undefined) profile.socials.linkedin = linkedin || null;
        if (github !== undefined) profile.socials.github = github || null;
      }
      await profile.save();
    }

    const updated = await User.findById(userId).populate("additionalDetails").select("-password");
    return res.status(200).json({ success: true, message: "Profile updated.", data: updated });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.files?.avatar) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }
    const file = req.files.avatar;
    const result = await imageUpload(file, "gfg-avatars");
    const user = await User.findByIdAndUpdate(
      userId,
      { image: result.secure_url },
      { new: true }
    )
      .populate("additionalDetails")
      .select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Display picture updated.",
      data: user,
    });
  } catch (error) {
    console.error("updateAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update avatar.",
    });
  }
};

function sendSSE(res, event, message) {
  res.write(`data: ${JSON.stringify({ event, message })}\n\n`);
}

exports.enrichProfile = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      sendSSE(res, "error", "Not authenticated.");
      sendSSE(res, "done", "");
      return res.end();
    }

    sendSSE(res, "checking_predefined", "Fetching details…");
    const predefined = await findPredefinedByEmail(userEmail);

    if (!predefined) {
      console.log("No predefined profile found");

      sendSSE(res, "no_predefined", "No predefined profile found.");
      sendSSE(res, "done", "");
      return res.end();
    }

    sendSSE(res, "details_found", "Your details found, updating…");
    const user = await User.findById(req.user.id).populate("additionalDetails");
    if (!user) {
      sendSSE(res, "error", "User not found.");
      sendSSE(res, "done", "");
      return res.end();
    }

    const nameParts = (predefined.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || user.firstName;
    const lastName = nameParts.slice(1).join(" ") || user.lastName;
    user.firstName = firstName;
    user.lastName = lastName;
    await user.save();

    const profile = user.additionalDetails;
    if (profile) {
      if (predefined.branch) profile.branch = predefined.branch;
      if (predefined.year) {
        profile.year = predefined.year;
        profile.yearOfStudy = predefined.year;
      }
      if (predefined.position) profile.position = predefined.position;
      if (predefined.p0 !== undefined && predefined.p0 !== "") profile.p0 = predefined.p0;
      if (predefined.p1 !== undefined && predefined.p1 !== "") profile.p1 = predefined.p1;
      if (predefined.p2 !== undefined && predefined.p2 !== "") profile.p2 = predefined.p2;
      if (profile.socials) {
        if (predefined.instaLink && predefined.instaLink !== "nil") profile.socials.instagram = predefined.instaLink;
        if (predefined.linkedinLink) profile.socials.linkedin = predefined.linkedinLink;
      } else {
        profile.socials = {
          instagram: predefined.instaLink && predefined.instaLink !== "nil" ? predefined.instaLink : null,
          linkedin: predefined.linkedinLink || null,
          github: null,
        };
      }
      if (Array.isArray(predefined.timeline) && predefined.timeline.length) {
        profile.timeline = predefined.timeline;
      }
      await profile.save();
    }

    console.log("profile populated?", !!user.additionalDetails);
    console.log("profile type:", typeof user.additionalDetails);
    console.log("profile id:", user.additionalDetails?._id);


    const imagePath = (predefined.image || "").trim();
    if (imagePath) {
      sendSSE(res, "uploading_image", "Uploading image…");
      const imageUrl = imagePath.startsWith("http") ? imagePath : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
      try {
        const upload = await uploadImageFromUrl(imageUrl, "gfg-avatars");
        user.image = upload.secure_url;
        await user.save();
      } catch (err) {
        console.error("enrichProfile image upload error:", err);
      }
    }

    console.log("All fineeeeee");


    sendSSE(res, "done", "Profile updated.");
    res.end();
  } catch (error) {
    console.error("enrichProfile error:", error);
    sendSSE(res, "error", error.message || "Something went wrong.");
    sendSSE(res, "done", "");
    res.end();
  }
};

/**
 * Search people: team members (department-scoped) + users (with profile and predefinedProfile).
 * GET /api/v1/auth/search-people?q=...
 */
exports.searchPeople = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const department = req.user?.accountType;
    let teamMembers = [];
    let users = [];
    let predefinedOnly = [];

    if (department && !SOCIETY_ROLES.includes(department)) {
      const TeamModel = getTeamMemberModel(department);
      const all = await TeamModel.find({}).sort({ createdAt: -1 }).lean();
      if (q.length >= 2) {
        const lower = q.toLowerCase();
        teamMembers = all.filter(
          (m) =>
            (m.name && m.name.toLowerCase().includes(lower)) ||
            (m.email && m.email.toLowerCase().includes(lower)) ||
            (m.branch && m.branch.toLowerCase().includes(lower)) ||
            (m.year && String(m.year).toLowerCase().includes(lower)) ||
            (m.section && m.section.toLowerCase().includes(lower)) ||
            (m.non_tech_society && m.non_tech_society.toLowerCase().includes(lower)) ||
            (m.contact && String(m.contact).includes(q))
        );
      } else {
        teamMembers = all;
      }
      teamMembers = teamMembers.slice(0, 20);
    }

    if (q.length >= 2) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      const qLower = q.toLowerCase();
      let userDocs = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { accountType: regex },
        ],
      })
        .select("-password")
        .populate("additionalDetails")
        .limit(20)
        .lean();

      if (q.includes(" ")) {
        const firstToken = q.split(/\s+/)[0];
        if (firstToken.length >= 1) {
          const firstRegex = new RegExp(firstToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          const byFirst = await User.find({ firstName: firstRegex })
            .select("-password")
            .populate("additionalDetails")
            .limit(50)
            .lean();
          const seen = new Set(userDocs.map((u) => u._id.toString()));
          for (const u of byFirst) {
            if (seen.has(u._id.toString())) continue;
            const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
            if (fullName.includes(qLower) || fullName.startsWith(qLower)) {
              userDocs.push(u);
              seen.add(u._id.toString());
            }
          }
          userDocs = userDocs.slice(0, 20);
        }
      }

      for (const u of userDocs) {
        const predefined = await PredefinedProfile.findOne({ email: u.email }).lean();
        u.predefinedProfile = predefined || null;
      }
      users = userDocs;

      // Predefined profiles that have no registered user (not signed up yet)
      const predefinedMatching = await PredefinedProfile.find({
        $or: [
          { name: regex },
          { email: regex },
        ],
      })
        .limit(30)
        .lean();
      const preEmails = predefinedMatching.map((p) => (p.email || "").toLowerCase()).filter(Boolean);
      const registeredFromPre = preEmails.length
        ? await User.find({ email: { $in: preEmails } }).select("email").lean()
        : [];
      const registeredEmails = new Set(registeredFromPre.map((u) => (u.email || "").toLowerCase()));
      for (const pre of predefinedMatching) {
        const emailLower = (pre.email || "").toLowerCase();
        if (emailLower && !registeredEmails.has(emailLower)) {
          predefinedOnly.push({
            ...pre,
            registered: false,
          });
        }
      }
      predefinedOnly = predefinedOnly.slice(0, 20);
    }

    return res.status(200).json({
      success: true,
      teamMembers,
      users,
      predefinedOnly: predefinedOnly || [],
    });
  } catch (error) {
    console.error("searchPeople error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Search failed.",
    });
  }
};

const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
  "Sponsorship and Marketing",
];

/**
 * Get all users (society role only). For Manage Society "Show list".
 * GET /api/v1/auth/all-users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("additionalDetails")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users.",
    });
  }
};

/**
 * Get all people: users + predefined-only (not registered) + team members. Sorted: users, then predefinedOnly, then members.
 * Society role only. GET /api/v1/auth/all-people
 */
exports.getAllPeople = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("additionalDetails")
      .sort({ createdAt: -1 })
      .lean();
    const userEmails = new Set(users.map((u) => (u.email || "").toLowerCase()).filter(Boolean));

    const allPredefined = await PredefinedProfile.find({}).lean();
    const predefinedOnly = allPredefined.filter((p) => {
      const email = (p.email || "").toLowerCase();
      return email && !userEmails.has(email);
    });

    const teamMembers = [];
    for (const dept of TEAM_DEPARTMENTS) {
      const Model = getTeamMemberModel(dept);
      const members = await Model.find({}).sort({ createdAt: -1 }).lean();
      for (const m of members) {
        teamMembers.push({ type: "teamMember", data: m, department: dept });
      }
    }

    const list = [
      ...users.map((u) => ({ type: "user", data: u })),
      ...predefinedOnly.map((p) => ({ type: "predefinedOnly", data: p })),
      ...teamMembers,
    ];
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("getAllPeople error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch people.",
    });
  }
};

/**
 * Send signup invite email to a predefined profile (not yet registered).
 * POST /api/v1/auth/send-signup-invite
 * Body: { email }
 */
exports.sendSignupInvite = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = (email || "").trim().toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const predefined = await findPredefinedByEmail(emailNorm);
    if (!predefined) {
      return res.status(404).json({ success: false, message: "No predefined profile found for this email." });
    }

    const existingUser = await User.findOne({ email: emailNorm }).lean();
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This person is already registered." });
    }

    console.log(process.env.FRONTEND_URL);
    

    const baseUrl =
      process.env.FRONTEND_URL ||
      req.get("origin") ||
      req.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://gfg-bvcoe.vercel.app";
    const signupLink = `${baseUrl.replace(/\/$/, "")}/signup`;

    const htmlContent = signupInviteTemplate(predefined, signupLink);
    await mailSender(emailNorm, "You're invited to sign up – GFGxBVCOE", htmlContent);

    return res.status(200).json({
      success: true,
      message: "Invite email sent successfully.",
    });
  } catch (error) {
    console.error("sendSignupInvite error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send invite email.",
    });
  }
};

/**
 * Delete own account and linked Profile (additionalDetails).
 * DELETE /api/v1/auth/account or POST /api/v1/auth/delete-account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const userDoc = await User.findById(userId).select("additionalDetails").lean();
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (userDoc.additionalDetails) {
      await Profile.findByIdAndDelete(userDoc.additionalDetails);
    }
    await User.findByIdAndDelete(userId);

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("Token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // Must match the options used when setting the cookie
      path: "/",
    });
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account.",
    });
  }
};
