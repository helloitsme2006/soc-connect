import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getFacultyContext } from "../services/api";
import {
  Building2,
  User,
  Mail,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  UserCircle,
  School,
  FileText,
  Upload,
  Image as ImageIcon,
  Tag,
  Briefcase,
  Users as UsersIcon,
  CheckCircle2
} from "lucide-react";

/* ─── Animation Variants ──────────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 260 } },
};

/* ─── Reusable Components ─────────────────────────────────────────────── */
function GlassCard({ children, className = "", ...props }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#1e1e2f]/90 to-[#27253a]/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.18)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function InputField({ label, icon: Icon, required, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
        )}
        <input
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl bg-[#252536] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200`}
          {...props}
        />
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:bg-white/[0.05] transition-colors duration-200">
      <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">{label}</p>
        <p className="text-white font-medium mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─── Dashboard Navbar ────────────────────────────────────────────────── */
function DashboardNav({ facultyName, societyName }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Society Details", icon: FileText },
    { label: "Members", icon: Users },
    { label: "Settings", icon: Settings },
  ];

  const initials = facultyName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FA";

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-8 h-16 rounded-2xl mx-3 sm:mx-6 mt-3 border border-white/[0.08]"
      style={{
        background: "rgba(30, 30, 47, 0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
          <School className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden sm:inline truncate max-w-[200px]">
          {societyName}
        </span>
      </div>

      {/* Menu Items — center */}
      <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              item.active
                ? "bg-white/[0.08] text-white shadow-inner"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Right — profile */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden">
          <LayoutDashboard className="h-5 w-5" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20">
              {initials}
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-52 rounded-xl border border-white/[0.08] bg-[#1e1e2f]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white truncate">{facultyName}</p>
                    <p className="text-xs text-gray-500">Faculty Coordinator</p>
                  </div>
                  <div className="py-1">
                    {[
                      { label: "Profile", icon: UserCircle },
                      { label: "Settings", icon: Settings },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/[0.06] py-1">
                    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════════════════ */
export default function FacultyDashboard() {
  const { user } = useAuth();
  const [facultyContext, setFacultyContext] = useState({
    societyName: user?.facultyContext?.societyName || "",
    collegeName: user?.facultyContext?.collegeName || "",
    logoUrl: user?.facultyContext?.logoUrl || "",
  });
  const [contextLoading, setContextLoading] = useState(false);

  // Editable Society Details State
  const [facultyName, setFacultyName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Faculty Incharge"
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Core Members State
  const [coreMembers, setCoreMembers] = useState([]);
  const [memberPosition, setMemberPosition] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);

  const societyName = facultyContext.societyName || "—";
  const collegeName = facultyContext.collegeName || "—";
  const facultyEmail = user?.email || "—";

  useEffect(() => {
    // Pre-fill existing uploaded society logo so user is not forced to upload again.
    if (!logoPreview && facultyContext.logoUrl) {
      setLogoPreview(facultyContext.logoUrl);
    }
  }, [facultyContext.logoUrl, logoPreview]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setContextLoading(true);
        const data = await getFacultyContext();
        if (!cancelled) {
          setFacultyContext({
            societyName: data?.societyName || "",
            collegeName: data?.collegeName || "",
            logoUrl: data?.logoUrl || "",
          });
        }
      } catch {
        // Keep fallback from user.facultyContext if request fails.
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── Handlers ──────────────────────────────────────────────────────── */
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSocietyDetails = (e) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a Society Category.");
      return;
    }
    if (!logoPreview) {
      toast.error("Please upload a Society Logo.");
      return;
    }
    // Perform save logic here
    toast.success("Society details saved successfully!");
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberPosition.trim() || !memberEmail.trim()) {
      toast.error("Please provide both position and email to add a member.");
      return;
    }

    if (editingMemberId) {
      setCoreMembers((prev) =>
        prev.map((m) =>
          m.id === editingMemberId
            ? { ...m, position: memberPosition.trim(), email: memberEmail.trim() }
            : m
        )
      );
      toast.success("Member updated successfully!");
      setEditingMemberId(null);
    } else {
      const newMember = {
        id: Date.now().toString(),
        position: memberPosition.trim(),
        email: memberEmail.trim(),
      };
      setCoreMembers((prev) => [...prev, newMember]);
      toast.success(`Added ${newMember.position} successfully!`);
    }

    setMemberPosition("");
    setMemberEmail("");
  };

  const handleEditMember = (member) => {
    setMemberPosition(member.position);
    setMemberEmail(member.email);
    setEditingMemberId(member.id);
  };

  const handleRemoveMember = (id) => {
    setCoreMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Member removed.");
    if (editingMemberId === id) {
      setEditingMemberId(null);
      setMemberPosition("");
      setMemberEmail("");
    }
  };

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#14141f] text-white">
      {/* Subtle bg texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      {/* Navbar handled by main App Navbar */}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {facultyName || "Faculty"}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Complete your society setup and manage core members.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          
          {/* ───────────── SOCIETY OVERVIEW (READ ONLY) ───────────── */}
          <GlassCard className="p-6 sm:p-8 border-l-4 border-l-cyan-500/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <School className="h-5 w-5 text-cyan-400" />
              Society Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem icon={UsersIcon} label="Assigned Society" value={societyName} />
              <DetailItem icon={Building2} label="College Name" value={collegeName} />
              <DetailItem icon={Mail} label="Faculty Email (Contact)" value={facultyEmail} />
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
              {contextLoading
                ? "Loading faculty context..."
                : "These details are fetched from your registered faculty/society mapping."}
            </p>
          </GlassCard>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* ───────────── SOCIETY DETAILS FORM ───────────── */}
            <GlassCard className="xl:col-span-3 p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-indigo-400" />
                Complete Society Details
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-medium">Please provide the missing details to finalize the society profile.</p>
              
              <form onSubmit={handleSaveSocietyDetails} className="space-y-5 flex-1">
                
                {/* File Upload / Category row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
                      Society Logo <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-xl bg-[#252536] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0 relative group">
                        {logoPreview ? (
                          <>
                            <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={clearLogo} className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg text-xs font-medium border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Choose Image
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#252536] border border-white/[0.08] ${category ? "text-white" : "text-gray-500"} text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 appearance-none`}
                      >
                        <option value="" disabled>Select Tech / Non-Tech</option>
                        <option value="tech">Tech</option>
                        <option value="non-tech">Non-Tech</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <InputField
                  label="Faculty Name"
                  icon={User}
                  placeholder="Update your displayed name..."
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
                    Society Description <span className="text-gray-600">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe what this society does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 rounded-xl bg-[#252536] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 resize-none custom-scrollbar"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Save Details
                  </button>
                </div>
              </form>
            </GlassCard>

            {/* ───────────── CORE MEMBERS ───────────── */}
            <GlassCard className="xl:col-span-2 p-6 sm:p-8 flex flex-col h-[650px] xl:h-auto">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                Core Members
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-medium">Assign core members (e.g., President, Tech Lead) below.</p>

              {/* Dynamic Add Form */}
              <form onSubmit={handleAddMember} className="space-y-4 mb-6">
                <InputField
                  icon={Briefcase}
                  placeholder="Position (e.g. President)"
                  value={memberPosition}
                  onChange={(e) => setMemberPosition(e.target.value)}
                />
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="Member Email ID"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-sm hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {editingMemberId ? "Update Member" : "Add Member"}
                </button>
                {editingMemberId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(null);
                      setMemberPosition("");
                      setMemberEmail("");
                    }}
                    className="w-full text-xs text-gray-400 hover:text-white transition-colors mt-1"
                  >
                    Cancel Editing
                  </button>
                )}
              </form>

              {/* Added Members List */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#252536]/50 rounded-xl border border-white/[0.05] p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/[0.05] mb-2 flex justify-between">
                  <span>Assigned ({coreMembers.length})</span>
                </div>
                
                {coreMembers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <UsersIcon className="h-10 w-10 text-gray-600 mb-3" />
                    <p className="text-gray-400 font-medium text-sm">No members added yet</p>
                    <p className="text-gray-500 text-xs mt-1 max-w-[200px]">Use the form above to add core executives.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    <AnimatePresence>
                      {coreMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.1] transition-colors group"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-medium text-white truncate">{member.position}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditMember(member)}
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Edit Member"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
