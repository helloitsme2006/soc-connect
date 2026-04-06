import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StepIndicator from "./StepIndicator";
import LogoUpload from "./LogoUpload";
import PasswordField from "./PasswordField";
import SearchableDropdown from "./SearchableDropdown";
import { OtpInput } from "@/components/OtpInput";
import { sendRegistrationOTP, verifyRegistrationOTP, registerCollege, searchIndianColleges, searchIndianUniversities } from "../../services/registrationApi";

const STEPS = ["Basic Details", "Account", "Verify & Register"];
const ROLE = "college";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[#1e1e30] border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";
const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";

const slide = {
  initial: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  transition: { duration: 0.25, ease: "easeInOut" },
};

export default function CollegeRegister({ onClose }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1
  const [collegeName, setCollegeName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [universityName, setUniversityName] = useState("");

  // Step 2
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3
  const [otp, setOtp] = useState("");

  const fetchColleges = useCallback(searchIndianColleges, []);
  const fetchUniversities = useCallback(searchIndianUniversities, []);

  const go = (next) => { setDir(next > step ? 1 : -1); setStep(next); };

  const validateStep1 = () => {
    if (!collegeName.trim()) { toast.error("College name is required."); return false; }
    if (!universityName.trim()) { toast.error("University name is required."); return false; }
    if (!state.trim()) { toast.error("State is required."); return false; }
    if (!city.trim()) { toast.error("City is required."); return false; }
    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode.trim())) { toast.error("Enter a valid 6-digit PIN code."); return false; }
    if (!address.trim()) { toast.error("Full address is required."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!email.trim()) { toast.error("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Enter a valid email address."); return false; }
    if (!password.trim()) { toast.error("Password is required."); return false; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return false; }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await sendRegistrationOTP({ email: email.trim(), role: ROLE });
      toast.success("OTP sent to your email.");
      go(3);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpDigits = otp.replace(/\D/g, "");
    if (otpDigits.length !== 6) { toast.error("Enter the 6-digit OTP."); return; }
    setVerifying(true);
    try {
      await verifyRegistrationOTP({ email: email.trim(), otp: otpDigits, role: ROLE });
      setOtpVerified(true);
      toast.success("OTP verified!");
    } catch (err) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (!otpVerified) { toast.error("Please verify your OTP first."); return; }
    setLoading(true);
    try {
      await registerCollege({
        collegeName, state, city, pinCode, address, logoUrl,
        universityName, email: email.trim(), password, confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center py-10 px-4 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">College Registered!</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Your college has been registered successfully. Our team will review your application and get in touch.
        </p>
        <button onClick={onClose}
          className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <StepIndicator currentStep={step} steps={STEPS} />

      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 1 && (
            <motion.div key="step1" custom={dir} {...slide} className="space-y-4">
              <SearchableDropdown
                label="College Name" id="college-name" required
                value={collegeName} onChange={setCollegeName}
                fetchOptions={fetchColleges}
                placeholder="Search your college…"
                fetchOnEmpty
              />
              <SearchableDropdown
                label="Affiliated University" id="uni-name" required
                value={universityName} onChange={setUniversityName}
                fetchOptions={fetchUniversities}
                placeholder="Search affiliated university…"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>State *</label>
                  <input className={inputCls} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Maharashtra" />
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Pune" />
                </div>
              </div>
              <div>
                <label className={labelCls}>PIN Code *</label>
                <input className={inputCls} value={pinCode} onChange={e => setPinCode(e.target.value)}
                  placeholder="6-digit PIN" maxLength={6} inputMode="numeric" />
              </div>
              <div>
                <label className={labelCls}>Full Address *</label>
                <textarea className={inputCls + " resize-none"} rows={2} value={address}
                  onChange={e => setAddress(e.target.value)} placeholder="Street, Area, Landmark…" />
              </div>
              <LogoUpload value={logoUrl} onChange={setLogoUrl} label="College Logo (optional)" />
              <button onClick={() => validateStep1() && go(2)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity mt-2">
                Next →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={dir} {...slide} className="space-y-4">
              <div>
                <label className={labelCls}>Email ID *</label>
                <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="college@example.com" required />
              </div>
              <PasswordField id="col-password" label="Create Password" value={password} onChange={setPassword} />
              <PasswordField id="col-confirm" label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => go(1)}
                  className="py-2.5 px-4 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm transition-colors">
                  ← Back
                </button>
                <button onClick={handleSendOTP} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50">
                  {loading ? "Sending OTP…" : "Send OTP & Continue →"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={dir} {...slide} className="space-y-5">
              <div className="text-center py-2">
                <p className="text-sm text-gray-400">OTP sent to <span className="text-indigo-300 font-medium">{email}</span></p>
              </div>
              <div>
                <label className={labelCls}>Enter OTP *</label>
                <OtpInput value={otp} onChange={setOtp} disabled={verifying || otpVerified} />
                {otpVerified && (
                  <p className="text-emerald-400 text-xs mt-2">✓ OTP verified</p>
                )}
              </div>
              <div className="flex gap-2">
                {!otpVerified ? (
                  <button onClick={handleVerifyOTP} disabled={verifying || otp.replace(/\D/g, "").length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold disabled:opacity-40 transition-colors">
                    {verifying ? "Verifying…" : "Verify OTP"}
                  </button>
                ) : (
                  <button onClick={handleRegister} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50 hover:opacity-90">
                    {loading ? "Registering…" : "🏫 Register College"}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => go(2)}
                className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm transition-colors">
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
