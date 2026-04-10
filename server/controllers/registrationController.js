const RegistrationOTP = require("../models/RegistrationOTP");
const University = require("../models/University");
const College = require("../models/College");
const Society = require("../models/Society");
const SocietyRegistration = require("../models/SocietyRegistration");
const SocietySignupConfig = require("../models/SocietySignupConfig");
const mailSender = require("../utils/mailSender");
const { registrationOtpTemplate } = require("../mail/templates");
const { imageUpload } = require("../config/cloudinary");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");

async function createUniversityIfMissing(universityName, state, city, pinCode, address) {
  const nameTrim = universityName.trim();
  let parentUniv = await University.findOne({ name: nameTrim });
  if (parentUniv) return parentUniv;

  const slug = nameTrim
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "university";
  let candidateEmail = `${slug}@autocreated.university.local`;
  let idx = 1;
  while (await University.findOne({ email: candidateEmail })) {
    idx += 1;
    candidateEmail = `${slug}.${idx}@autocreated.university.local`;
  }

  const tempPasswordHash = await bcrypt.hash(`auto-university-${Date.now()}-${Math.random()}`, 10);
  parentUniv = await University.create({
    name: nameTrim,
    address: {
      state: state.trim(),
      city: city.trim(),
      pincode: pinCode.trim(),
      fullAddress: address.trim(),
    },
    email: candidateEmail,
    password: tempPasswordHash,
    verified: true,
    colleges: [],
  });
  return parentUniv;
}

/* ─── Password validation (relaxed) ────────────────────────────────────── */
// The UI requests "no password conditions", so we accept any non-empty password.
function validatePassword(_password) {
  return null;
}

/* ─── Send OTP ───────────────────────────────────────────────────────────── */
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required." });
    }

    const validRoles = ["university", "college", "society", "faculty", "core", "head", "executive"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const emailNorm = email.trim().toLowerCase();

    // Check if already registered
    let existingDoc;
    // We only restrict duplicate emails for the high-level tier entities in this generic OTP route.
    if (role === "university") existingDoc = await University.findOne({ email: emailNorm });
    else if (role === "college") existingDoc = await College.findOne({ email: emailNorm });
    else if (role === "society") existingDoc = await Society.findOne({ email: emailNorm });

    if (existingDoc) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await RegistrationOTP.create({ email: emailNorm, role, otp });

    const htmlContent = registrationOtpTemplate(otp, role);
    await mailSender(emailNorm, `SocConnect – OTP for ${role.charAt(0).toUpperCase() + role.slice(1)} Registration`, htmlContent);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("sendRegistrationOTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP.", error: error.message });
  }
};

/* ─── Verify OTP ─────────────────────────────────────────────────────────── */
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp || !role) {
      return res.status(400).json({ success: false, message: "Email, OTP and role are required." });
    }

    const emailNorm = email.trim().toLowerCase();
    const record = await RegistrationOTP.findOne({ email: emailNorm, role })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!record || record.otp.toString() !== otp.toString()) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Delete OTP once verified (one-time use)
    await RegistrationOTP.deleteMany({ email: emailNorm, role });

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("verifyRegistrationOTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify OTP.", error: error.message });
  }
};

/* ─── Upload Logo ────────────────────────────────────────────────────────── */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.files?.logo) {
      return res.status(400).json({ success: false, message: "No logo file provided." });
    }
    const file = req.files.logo;
    const result = await imageUpload(file, "soc-connect-logos");
    return res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error("uploadLogo error:", error);
    return res.status(500).json({ success: false, message: error.message || "Upload failed." });
  }
};

/* ─── Register University ────────────────────────────────────────────────── */
exports.registerUniversity = async (req, res) => {
  try {
    const { universityName, state, city, pinCode, address, logoUrl, email, password, confirmPassword } = req.body;

    if (!universityName || !state || !city || !pinCode || !address || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ success: false, message: pwErr });

    const emailNorm = email.trim().toLowerCase();
    const existing = await University.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doc = await University.create({
      name: universityName.trim(),
      address: {
        state: state.trim(),
        city: city.trim(),
        pincode: pinCode.trim(),
        fullAddress: address.trim(),
      },
      logoUrl: logoUrl || "",
      email: emailNorm,
      password: hashedPassword,
      verified: true,
      colleges: [],
    });

    return res.status(201).json({
      success: true,
      message: "University registered successfully. Your application is under review.",
      data: { id: doc._id, name: doc.name, email: doc.email },
    });
  } catch (error) {
    console.error("registerUniversity error:", error);
    return res.status(500).json({ success: false, message: error.message || "Registration failed." });
  }
};

/* ─── Register College ───────────────────────────────────────────────────── */
exports.registerCollege = async (req, res) => {
  try {
    const { collegeName, state, city, pinCode, address, logoUrl, universityName, email, password, confirmPassword } = req.body;

    if (!collegeName || !state || !city || !pinCode || !address || !universityName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ success: false, message: pwErr });

    const emailNorm = email.trim().toLowerCase();
    const existing = await College.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    // Parent university no longer needs to pre-exist. Create a placeholder university if missing.
    const parentUniv = await createUniversityIfMissing(universityName, state, city, pinCode, address);

    const hashedPassword = await bcrypt.hash(password, 10);
    const doc = await College.create({
      name: collegeName.trim(),
      address: {
        state: state.trim(),
        city: city.trim(),
        pincode: pinCode.trim(),
        fullAddress: address.trim(),
      },
      logoUrl: logoUrl || "",
      university: parentUniv._id,
      email: emailNorm,
      password: hashedPassword,
      verified: true,
      societies: [],
      societies_signup: [],
    });

    parentUniv.colleges.push({ collegeId: doc._id, collegeName: doc.name });
    await parentUniv.save();

    return res.status(201).json({
      success: true,
      message: "College registered successfully. Your application is under review.",
      data: { id: doc._id, name: doc.name, email: doc.email },
    });
  } catch (error) {
    console.error("registerCollege error:", error);
    return res.status(500).json({ success: false, message: error.message || "Registration failed." });
  }
};

/* ─── Register Society ───────────────────────────────────────────────────── */
exports.registerSociety = async (req, res) => {
  try {
    const { societyName, state, city, pinCode, address, collegeName, logoUrl, email, password, confirmPassword } = req.body;

    // Minimal payload (isolated society registration) expects:
    // - societyName, collegeName, logoUrl (optional), email, password, confirmPassword
    const isMinimal = !state && !city && !pinCode && !address;

    if (!societyName || !collegeName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ success: false, message: pwErr });

    const emailNorm = email.trim().toLowerCase();
    const existing = await Society.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    // Isolated registration: store in SocietyRegistration (no parent College lookup required).
    if (isMinimal) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const doc = await SocietyRegistration.create({
        societyName: societyName.trim(),
        collegeName: collegeName.trim(),
        logoUrl: logoUrl || "",
        email: emailNorm,
        password: hashedPassword,
        verified: true,
      });

      // Auto-create per-society signup config so this faculty email can sign up later.
      const ADMIN_DEPARTMENT = "ADMIN"; // Faculty Incharge
      try {
        let cfg = await SocietySignupConfig.findOne({ societyRegistrationId: doc._id });
        if (!cfg) {
          cfg = await SocietySignupConfig.create({
            societyRegistrationId: doc._id,
            societyName: doc.societyName,
            collegeName: doc.collegeName,
            departments: [
              {
                department: ADMIN_DEPARTMENT,
                allowedEmails: [emailNorm],
                allowedIds: [],
                faultyIds: [],
              },
            ],
          });
        } else {
          let deptEntry = (cfg.departments || []).find(
            (d) => (d.department || "").trim() === ADMIN_DEPARTMENT
          );
          if (!deptEntry) {
            cfg.departments.push({
              department: ADMIN_DEPARTMENT,
              allowedEmails: [emailNorm],
              allowedIds: [],
              faultyIds: [],
            });
          } else if (!deptEntry.allowedEmails.includes(emailNorm)) {
            deptEntry.allowedEmails.push(emailNorm);
          }
          await cfg.save();
        }

      } catch (e) {
        console.error("registerSociety: failed to sync SocietySignupConfig:", e);
      }

      return res.status(201).json({
        success: true,
        message: "Society registered successfully. Your application is under review.",
        data: { id: doc._id, societyName: doc.societyName, email: doc.email },
      });
    }

    // Full registration path: requires address and an existing College document.
    if (!state || !city || !pinCode || !address) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const parentCollege = await College.findOne({ name: collegeName.trim() });
    if (!parentCollege) {
      return res.status(404).json({ success: false, message: "Parent College not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doc = await Society.create({
      name: societyName.trim(),
      address: {
        state: state.trim(),
        city: city.trim(),
        pincode: pinCode.trim(),
        fullAddress: address.trim(),
      },
      logoUrl: logoUrl || "",
      college: parentCollege._id,
      email: emailNorm,
      password: hashedPassword,
      verified: true,
    });

    parentCollege.societies.push({ societyId: doc._id, societyName: doc.name });
    await parentCollege.save();

    return res.status(201).json({
      success: true,
      message: "Society registered successfully. Your application is under review.",
      data: { id: doc._id, name: doc.name, email: doc.email },
    });
  } catch (error) {
    console.error("registerSociety error:", error);
    return res.status(500).json({ success: false, message: error.message || "Registration failed." });
  }
};

/* ─── Search Societies & Departments ─────────────────────────────────────── */
exports.getAllSocieties = async (req, res) => {
  try {
    const societies = await Society.find({}, "name logoUrl");
    return res.status(200).json({ success: true, records: societies.map(s => s.name) });
  } catch (error) {
    console.error("getAllSocieties error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch societies." });
  }
};

exports.getDepartmentsBySociety = async (req, res) => {
  try {
    const { societyName } = req.query;
    if (!societyName) return res.status(400).json({ success: false, message: "Society name is required." });
    
    // Mocking department fetch for the given society since custom departments aren't fully modelled yet.
    // In complete implementation, this would query a Departments collection connected via Society ID.
    const mockDepartments = [
      "Technical",
      "Event Management",
      "Public Relation and Outreach",
      "Design",
      "Content and Documentation",
      "Photography and Videography",
      "Sponsorship and Marketing",
    ];
    return res.status(200).json({ success: true, records: mockDepartments });
  } catch (error) {
    console.error("getDepartments error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch departments." });
  }
};
