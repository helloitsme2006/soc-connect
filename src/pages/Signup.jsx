import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, Building2, Users, UserCog, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { SpinnerCustom } from "../components/SpinnerCustom";
import { OtpInput } from "@/components/OtpInput";
import SearchableDropdown from "../components/registration/SearchableDropdown";
import {
  sendOTP as sendAuthOTP,
  signup as authSignup,
  resolveFacultyByEmail,
  verifySignupOTP,
} from "../services/api";
import {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  searchDatabaseSocieties,
  searchDatabaseDepartments,
} from "../services/registrationApi"; // The extended API I just created

const RESEND_COOLDOWN_SECONDS = 60; // Shorter cooldown for UX

const ROLES = [
  { id: "faculty", label: "Faculty", icon: <UserCog size={32} /> },
  { id: "core", label: "Core", icon: <Building2 size={32} /> },
  { id: "head", label: "Head", icon: <Users size={32} /> },
  { id: "executive", label: "Executive", icon: <UserCheck size={32} /> },
];

const Signup = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  // Faculty-specific states (society/college lookup + allowed departments)
  const [facultyResolveLoading, setFacultyResolveLoading] = useState(false);
  const [facultyResolved, setFacultyResolved] = useState(false);
  const [facultyCollegeName, setFacultyCollegeName] = useState("");
  const [facultyAllowedDepartments, setFacultyAllowedDepartments] = useState([]);
  const [facultySelectedDepartment, setFacultySelectedDepartment] = useState("");

  const [name, setName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const { setUser } = useAuth();
  const cooldownTimerRef = useRef(null);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Faculty flow: resolve society/college by email first, then send auth OTP
    if (selectedRole === "faculty") {
      setFacultyResolveLoading(true);
      try {
        let chosenDepartment = facultySelectedDepartment;
        if (!facultyResolved || !facultySelectedDepartment) {
          const resolved = await resolveFacultyByEmail(email.trim());
          setFacultyCollegeName(resolved.collegeName || "");
          setSocietyName(resolved.societyName || "");
          setFacultyAllowedDepartments(resolved.allowedDepartments || []);

          const chosen =
            (resolved.allowedDepartments || []).length === 1
              ? resolved.allowedDepartments[0]
              : (resolved.allowedDepartments || [])[0] || "";
          setFacultySelectedDepartment(chosen);
          chosenDepartment = chosen;
          setFacultyResolved(true);
        }

        if (!chosenDepartment) {
          toast.error("No allowed department found for this email.");
          return;
        }

        setOtpLoading(true);
        await sendAuthOTP({ email: email.trim(), department: chosenDepartment });
        toast.success("OTP sent to your email!");
        setOtpSent(true);
        startCooldown();
      } catch (err) {
        toast.error(err.message || "Failed to send OTP.");
      } finally {
        setOtpLoading(false);
        setFacultyResolveLoading(false);
      }
      return;
    }

    setOtpLoading(true);
    try {
      await sendRegistrationOTP({ email: email.trim(), role: selectedRole });
      toast.success("OTP sent to your email!");
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpDigits = String(otp || "").replace(/\D/g, "");
    if (otpDigits.length !== 6) {
      toast.error("Please enter a 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      if (selectedRole === "faculty") {
        await verifySignupOTP({ email: email.trim(), otp: otpDigits });
      } else {
        await verifyRegistrationOTP({ email: email.trim(), otp: otpDigits, role: selectedRole });
      }
      toast.success("Email verified successfully!");
      setOtpVerified(true);
    } catch (err) {
      toast.error(err.message || "Invalid or expired OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const validatePassword = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must include at least one number.";
    if (!/[^^A-Za-z0-9]/.test(pass)) return "Password must include at least one special character.";
    return null;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error("You must verify your email with OTP before proceeding.");
      return;
    }
    if (!name.trim()) return toast.error("Name is required.");
    if (selectedRole !== "faculty" && !societyName.trim()) return toast.error("Society Name is required.");

    if (selectedRole === "core" && !position.trim()) return toast.error("Position is required.");
    if (selectedRole === "head" && !department.trim()) return toast.error("Department is required.");
    if (selectedRole === "executive" && !department.trim()) return toast.error("Department is required.");

    if (selectedRole !== "faculty") {
      const pwdErr = validatePassword(password);
      if (pwdErr) return toast.error(pwdErr);
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (selectedRole === "faculty") {
        const otpDigits = String(otp || "").replace(/\D/g, "");
        if (!facultySelectedDepartment) {
          toast.error("No allowed department selected for this email.");
          return;
        }

        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] || "";
        const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

        await authSignup({
          firstName,
          lastName,
          email: email.trim(),
          password,
          confirmPassword,
          accountType: facultySelectedDepartment,
          otp: otpDigits,
        });

        toast.success("Faculty account created successfully!");
        navigate("/", { replace: true });
      } else {
        // Simulate backend POST request for non-faculty roles (existing behavior)
        await new Promise((res) => setTimeout(res, 1500));
        toast.success(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} account created successfully!`);
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error("Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="grid grid-cols-2 gap-4">
      {ROLES.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => {
            setSelectedRole(id);
            setOtpSent(false);
            setOtpVerified(false);
            setOtp("");
            setEmail("");
            setFacultyResolveLoading(false);
            setFacultyResolved(false);
            setFacultyCollegeName("");
            setFacultyAllowedDepartments([]);
            setFacultySelectedDepartment("");
            setSocietyName("");
            // Faculty defaults logic goes here if autofilling was supported natively in one click
          }}
          className="flex flex-col items-center justify-center p-6 bg-[#252536] border border-gray-600/50 hover:border-cyan-500 rounded-2xl cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:-translate-y-1"
        >
          <div className="text-cyan-400 mb-3">{icon}</div>
          <span className="text-gray-200 font-semibold">{label}</span>
        </button>
      ))}
    </div>
  );

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/30 rounded-2xl p-8 shadow-xl">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
            <SpinnerCustom />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {selectedRole && (
              <button
                onClick={() => setSelectedRole(null)}
                className="text-gray-400 hover:text-white text-sm bg-gray-600/30 px-3 py-1 rounded-lg"
              >
                ← Back
              </button>
            )}
            Sign up {selectedRole && `- ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
          </h1>
        </div>

        {!selectedRole ? (
          <>
            <p className="text-gray-400 text-sm mb-6">Select your role to continue registration:</p>
            {renderRoleSelection()}
          </>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            {/* EMAIL + SEND OTP ROW */}
            <div>
              <label className={labelClass}>Email ID *</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  disabled={otpVerified || otpSent}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@domain.edu"
                />
                {!otpVerified && (
                  <button
                    type="button"
                    disabled={otpLoading || resendCooldown > 0 || !email}
                    onClick={handleSendOTP}
                    className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading
                      ? "Wait..."
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : otpSent
                          ? "Resend OTP"
                          : selectedRole === "faculty"
                            ? "Process"
                            : "Send OTP"}
                  </button>
                )}
              </div>
            </div>

            {/* Faculty: show society/college info after resolving the email */}
            {selectedRole === "faculty" && facultyResolved && (
              <div className="rounded-xl border border-gray-600/30 bg-[#252536] p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">College:</span> <span className="text-white">{facultyCollegeName || "-"}</span>
                </p>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">Society:</span> <span className="text-white">{societyName || "-"}</span>
                </p>
                {facultyAllowedDepartments.length > 0 && (
                  <p className="text-[12px] text-gray-500 mt-2">
                    Department: <span className="text-gray-300">{facultySelectedDepartment || facultyAllowedDepartments[0]}</span>
                  </p>
                )}
              </div>
            )}

            {/* OTP VERIFICATION ROW */}
            {otpSent && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <label className={labelClass}>OTP Verification *</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      disabled={otpLoading || otpVerified}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={otpLoading || otpVerified || String(otp || "").replace(/\D/g, "").length !== 6}
                    onClick={handleVerifyOTP}
                    className={`whitespace-nowrap px-5 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors ${
                      otpVerified
                        ? "bg-green-600/20 text-green-400 border border-green-500"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                    }`}
                  >
                    {otpVerified ? (
                      <>
                        <CheckCircle2 size={18} /> Verified
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SHARED NAME FIELD */}
            {(selectedRole !== "faculty" || otpVerified) && (
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            )}

            {/* DYNAMIC MIDDLE FIELDS */}
            {selectedRole === "faculty" && (
              <div>
                <label className={labelClass}>Society Name</label>
                <input
                  type="text"
                  value={societyName || ""}
                  disabled
                  className={inputClass}
                />
              </div>
            )}

            {(selectedRole === "core" || selectedRole === "head" || selectedRole === "executive") && (
              <SearchableDropdown
                id="societySearch"
                label="Society Name"
                placeholder="Search registered societies..."
                required
                value={societyName}
                onChange={setSocietyName}
                fetchOptions={searchDatabaseSocieties}
                fetchOnEmpty={true}
              />
            )}

            {selectedRole === "core" && (
              <div>
                <label className={labelClass}>Position *</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Technical Lead"
                />
              </div>
            )}

            {(selectedRole === "head" || selectedRole === "executive") && (
              <SearchableDropdown
                id="departmentSearch"
                label="Department"
                placeholder={societyName ? "Search departments..." : "Select a society first..."}
                required
                value={department}
                onChange={setDepartment}
                fetchOptions={async () => (societyName ? await searchDatabaseDepartments(societyName) : [])}
                fetchOnEmpty={true}
              />
            )}

            {/* SHARED PASSWORD FIELDS */}
            {(selectedRole !== "faculty" || otpVerified) && (
              <>
                <div>
                  <label className={labelClass}>Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass + " pr-11"}
                      placeholder="Enter your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass + " pr-11"}
                      placeholder="Retype password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                otpVerified
                  ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:scale-[1.02]"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
