import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  User,
  Mail,
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  BookOpen,
  Search,
  LogOut,
  UserCircle,
  Link2,
  School,
  Landmark,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ─── Sample Data ─────────────────────────────────────────────────────── */
const INITIAL_COLLEGE = {
  collegeName: "Bharati Vidyapeeth College of Engineering",
  universityName: "Savitribai Phule Pune University", // set to "" or null to hide
  location: "Pune, Maharashtra, India",
  adminName: "Dr. Rajesh Kumar",
  adminEmail: "admin@bvcoe.ac.in",
};

const INITIAL_SOCIETIES = [
  { id: "gfg-connect", name: "GFG", facultyName: "Dr. Arvind Singh", facultyEmail: "gfg@bvcoe.ac.in", link: "http://localhost:5174/" },
  { id: 1, name: "Robotics Club", facultyName: "Dr. Meena Sharma", facultyEmail: "meena.sharma@bvcoe.ac.in" },
  { id: 2, name: "Literary Society", facultyName: "Prof. Anil Verma", facultyEmail: "anil.verma@bvcoe.ac.in" },
  { id: 3, name: "Coding Club", facultyName: "Dr. Priya Patel", facultyEmail: "priya.patel@bvcoe.ac.in" },
  { id: 4, name: "Music Society", facultyName: "Prof. Suresh Iyer", facultyEmail: "suresh.iyer@bvcoe.ac.in" },
];

/* ─── Animation Variants ──────────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 260 } },
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 26, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.18 } },
};

/* ─── Reusable Pieces ─────────────────────────────────────────────────── */
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

function InputField({ label, icon: Icon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">{label}</label>}
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
function DashboardNav({ adminName }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Societies", icon: BookOpen },
    { label: "Students", icon: Users },
    { label: "Settings", icon: Settings },
  ];

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        <span className="text-base font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden sm:inline">
          CollegeAdmin
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

      {/* Right — search + profile */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden">
          <LayoutDashboard className="h-5 w-5" />
        </button>
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
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
                    <p className="text-sm font-medium text-white">{adminName}</p>
                    <p className="text-xs text-gray-500">College Administrator</p>
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
export default function UniversityAdminDashboard() {
  const { user } = useAuth();
  const college = useMemo(() => {
    const ctx = user?.collegeContext || {};
    const adminNameFromUser = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return {
      collegeName: ctx.collegeName || INITIAL_COLLEGE.collegeName,
      universityName: ctx.universityName || INITIAL_COLLEGE.universityName,
      location: ctx.location || INITIAL_COLLEGE.location,
      adminName: ctx.adminName || adminNameFromUser || INITIAL_COLLEGE.adminName,
      adminEmail: ctx.adminEmail || user?.email || INITIAL_COLLEGE.adminEmail,
    };
  }, [user]);
  const [societies, setSocieties] = useState(INITIAL_SOCIETIES);

  // Create society form
  const [facultyName, setFacultyName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [societyName, setSocietyName] = useState("");

  // Isolated society modal
  const [isoModalOpen, setIsoModalOpen] = useState(false);
  const [isoName, setIsoName] = useState("");
  const [isoDesc, setIsoDesc] = useState("");

  const hasUniversity = Boolean(college.universityName && college.universityName.trim());

  /* ── handlers ── */
  const handleCreateSociety = (e) => {
    e.preventDefault();
    if (!facultyName.trim() || !facultyEmail.trim() || !societyName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    const newSociety = {
      id: Date.now(),
      name: societyName.trim(),
      facultyName: facultyName.trim(),
      facultyEmail: facultyEmail.trim(),
    };
    setSocieties((prev) => [newSociety, ...prev]);
    setFacultyName("");
    setFacultyEmail("");
    setSocietyName("");
    toast.success(`"${newSociety.name}" society created successfully!`);
  };

  const handleAddIsolated = (e) => {
    e.preventDefault();
    if (!isoName.trim()) {
      toast.error("Society name is required");
      return;
    }
    const newSociety = {
      id: Date.now(),
      name: isoName.trim(),
      facultyName: "—",
      facultyEmail: "—",
    };
    setSocieties((prev) => [newSociety, ...prev]);
    setIsoName("");
    setIsoDesc("");
    setIsoModalOpen(false);
    toast.success(`"${newSociety.name}" added as isolated society!`);
  };

  const handleDeleteSociety = (id, name) => {
    setSocieties((prev) => prev.filter((s) => s.id !== id));
    toast.success(`"${name}" deleted`);
  };

  /* ── build detail items dynamically ── */
  const detailItems = [
    { icon: School, label: "College Name", value: college.collegeName },
    ...(hasUniversity
      ? [{ icon: Landmark, label: "University Name", value: college.universityName }]
      : []),
    { icon: MapPin, label: "Location", value: college.location },
    { icon: User, label: "Admin Name", value: college.adminName },
    { icon: Mail, label: "Admin Email", value: college.adminEmail },
  ];

  /* ── render ── */
  return (
    <div className="min-h-screen bg-[#14141f] text-white">
      {/* Subtle bg texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.05] blur-[120px]" />
      </div>

      {/* Navbar handled by main App Navbar */}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {college.adminName}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your college, societies, and faculty — all in one place.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          {/* ───────────── COLLEGE & UNIVERSITY DETAILS ───────────── */}
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  College Details
                </h2>
                {hasUniversity && (
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    Associated with <span className="text-indigo-400 font-medium">{college.universityName}</span>
                  </p>
                )}
              </div>
              <button className="self-start px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.1] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Details
              </button>
            </div>

            {/* Use a responsive grid — 2 cols on sm, 3 cols on lg when university is shown */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasUniversity ? "lg:grid-cols-3" : ""} gap-4`}>
              {detailItems.map((item) => (
                <DetailItem key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </GlassCard>

          {/* ───────────── CREATE SOCIETY + ADD ISOLATED ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Create Society */}
            <GlassCard className="lg:col-span-3 p-6 sm:p-8">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <GraduationCap className="h-5 w-5 text-indigo-400" />
                Create New Society
              </h2>
              <form onSubmit={handleCreateSociety} className="space-y-4">
                <InputField
                  label="Faculty Name"
                  icon={User}
                  placeholder="e.g. Dr. John Smith"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                />
                <InputField
                  label="Faculty Email"
                  icon={Mail}
                  type="email"
                  placeholder="e.g. john.smith@college.ac.in"
                  value={facultyEmail}
                  onChange={(e) => setFacultyEmail(e.target.value)}
                />
                <InputField
                  label="Society Name"
                  icon={BookOpen}
                  placeholder="e.g. Robotics Club"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Society
                </button>
              </form>
            </GlassCard>

            {/* Add Isolated Society */}
            <GlassCard className="lg:col-span-2 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <Link2 className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold mb-2">Add Existing Society</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-[240px] leading-relaxed">
                Link an existing or isolated society that was set up independently.
              </p>
              <button
                onClick={() => setIsoModalOpen(true)}
                className="px-6 py-3 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-medium text-sm hover:bg-indigo-500/20 hover:border-indigo-500/60 active:scale-[0.97] transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Isolated Society
              </button>
            </GlassCard>
          </div>

          {/* ───────────── EXISTING SOCIETIES ───────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                Existing Societies
                {societies.length > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/[0.06] text-xs text-gray-400 font-medium">
                    {societies.length}
                  </span>
                )}
              </h2>
            </div>

            {societies.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/[0.1] py-20 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-5">
                  <BookOpen className="h-9 w-9 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium mb-1">No societies yet</p>
                <p className="text-gray-600 text-sm max-w-xs">Create a new society above or add an existing one to get started.</p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {societies.map((s) => (
                  <motion.div
                    key={s.id}
                    variants={fadeUp}
                    whileHover={{ scale: 1.015, boxShadow: "0 8px 36px rgba(0,0,0,0.32)" }}
                    className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#1e1e2f]/80 to-[#27253a]/80 overflow-hidden group ${s.link ? "cursor-pointer ring-1 ring-cyan-500/0 hover:ring-cyan-500/50" : "cursor-default"}`}
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
                    onClick={() => {
                      if (s.link) window.open(s.link, "_blank", "noopener,noreferrer");
                    }}
                    title={s.link ? "Open Society Page" : undefined}
                  >
                    {/* Accent bar */}
                    <div className="h-1 bg-gradient-to-r from-cyan-500/70 via-indigo-500/70 to-purple-500/70 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-white truncate">{s.name}</h3>
                        {s.link && <ExternalLink className="h-4 w-4 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />}
                      </div>

                      <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-400 truncate">{s.facultyName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span className="text-gray-400 truncate">{s.facultyEmail}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/[0.08] hover:bg-cyan-500/[0.15] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(`Viewing "${s.name}"`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/[0.08] hover:bg-amber-500/[0.15] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(`Editing "${s.name}"`);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.15] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSociety(s.id, s.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* ───────────── ISOLATED SOCIETY MODAL ───────────── */}
      <AnimatePresence>
        {isoModalOpen && (
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsoModalOpen(false)}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#1e1e2f]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Link2 className="h-4.5 w-4.5 text-indigo-400" />
                  Add Isolated Society
                </h2>
                <button
                  onClick={() => setIsoModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleAddIsolated} className="px-6 py-5 space-y-4">
                <InputField
                  label="Society Name"
                  icon={BookOpen}
                  placeholder="e.g. Photography Club"
                  value={isoName}
                  onChange={(e) => setIsoName(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
                    Description <span className="text-gray-600">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the society..."
                    value={isoDesc}
                    onChange={(e) => setIsoDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#252536] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsoModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/[0.1] text-gray-400 font-medium text-sm hover:bg-white/[0.04] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Society
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
