import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  User,
  Mail,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  Search,
  LogOut,
  UserCircle,
  School,
  Landmark,
  CheckCircle2,
  Library,
  ListPlus
} from "lucide-react";

/* ─── Sample Data ─────────────────────────────────────────────────────── */
const INITIAL_UNIVERSITY = {
  universityName: "Savitribai Phule Pune University",
  location: "Pune, Maharashtra, India",
  adminName: "Dr. Aditi Sharma",
  adminEmail: "admin@sppu.ac.in",
};

const INITIAL_CONNECTED_COLLEGES = [
  { id: "COL101", name: "Bharati Vidyapeeth College of Engineering" },
  { id: "COL102", name: "Pune Institute of Computer Technology" },
];

const INITIAL_PENDING_COLLEGES = [
  { id: "COL103", name: "MIT World Peace University" },
  { id: "COL104", name: "Vishwakarma Institute of Technology" },
  { id: "COL105", name: "Symbiosis Institute of Technology" },
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
function DashboardNav({ adminName, universityName }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Colleges", icon: Library },
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
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
          <Landmark className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden sm:inline truncate max-w-[200px]">
          {universityName}
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
                    <p className="text-xs text-gray-500">University Admin</p>
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
export default function UniversityLevelAdminDashboard() {
  const [university] = useState(INITIAL_UNIVERSITY);
  const [connectedColleges, setConnectedColleges] = useState(INITIAL_CONNECTED_COLLEGES);
  const [pendingColleges, setPendingColleges] = useState(INITIAL_PENDING_COLLEGES);

  // Manual Add College Form
  const [manualCollegeId, setManualCollegeId] = useState("");
  const [manualCollegeName, setManualCollegeName] = useState("");

  /* ── handlers ── */
  const handleManualAddCollege = (e) => {
    e.preventDefault();
    if (!manualCollegeId.trim() || !manualCollegeName.trim()) {
      toast.error("Please fill in both College ID and College Name");
      return;
    }
    
    // Check if it already exists
    if (connectedColleges.some((c) => c.id === manualCollegeId.trim())) {
      toast.error("A college with this ID is already connected.");
      return;
    }

    const newCollege = {
      id: manualCollegeId.trim().toUpperCase(),
      name: manualCollegeName.trim(),
    };
    
    setConnectedColleges((prev) => [newCollege, ...prev]);
    setManualCollegeId("");
    setManualCollegeName("");
    toast.success(`"${newCollege.name}" added successfully!`);
    
    // Remove from pending if it happened to be there
    setPendingColleges((prev) => prev.filter((c) => c.id !== newCollege.id));
  };

  const handleAddFromList = (college) => {
    setPendingColleges((prev) => prev.filter((c) => c.id !== college.id));
    setConnectedColleges((prev) => [college, ...prev]);
    toast.success(`"${college.name}" connected!`);
  };

  const handleAddAllPending = () => {
    if (pendingColleges.length === 0) return;
    setConnectedColleges((prev) => [...pendingColleges, ...prev]);
    const count = pendingColleges.length;
    setPendingColleges([]);
    toast.success(`Successfully connected ${count} colleges!`);
  };

  const handleRemoveCollege = (id, name) => {
    setConnectedColleges((prev) => prev.filter((c) => c.id !== id));
    toast.success(`Removed "${name}" from connected colleges`);
  };

  /* ── render detail items ── */
  const detailItems = [
    { icon: Landmark, label: "University Name", value: university.universityName },
    { icon: MapPin, label: "Location", value: university.location },
    { icon: User, label: "Admin Name", value: university.adminName },
    { icon: Mail, label: "Admin Email", value: university.adminEmail },
  ];

  /* ── render ── */
  return (
    <div className="min-h-screen bg-[#14141f] text-white">
      {/* Subtle bg texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-[120px]" />
      </div>

      {/* Navbar handled by main App Navbar */}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            University Dashboard,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {university.adminName}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage connected colleges and university operations.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          
          {/* ───────────── UNIVERSITY DETAILS ───────────── */}
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  University Details
                </h2>
              </div>
              <button className="self-start px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.1] text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {detailItems.map((item) => (
                <DetailItem key={item.label} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </GlassCard>

          {/* ───────────── ADD COLLEGE & PENDING LIST ───────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Add College (Manual Form) */}
            <GlassCard className="p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <School className="h-5 w-5 text-emerald-400" />
                Add College Manually
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-medium">Add a college by its unique registry ID.</p>
              
              <form onSubmit={handleManualAddCollege} className="space-y-4 flex-1 flex flex-col justify-end">
                <InputField
                  label="College ID"
                  icon={Search}
                  placeholder="e.g. COL108"
                  value={manualCollegeId}
                  onChange={(e) => setManualCollegeId(e.target.value)}
                />
                <InputField
                  label="College Name"
                  icon={Building2}
                  placeholder="e.g. Pune Institute of Engineering"
                  value={manualCollegeName}
                  onChange={(e) => setManualCollegeName(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Submit College
                </button>
              </form>
            </GlassCard>

            {/* Pending Colleges List */}
            <GlassCard className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-blue-400" />
                  Unregistered Colleges
                </h2>
                {pendingColleges.length > 0 && (
                  <button
                    onClick={handleAddAllPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] text-white hover:bg-white/[0.12] transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Add All
                  </button>
                )}
              </div>

              {pendingColleges.length === 0 ? (
                <div className="flex-1 rounded-2xl border border-dashed border-white/[0.1] py-12 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
                  <p className="text-gray-400 font-medium">No pending colleges</p>
                  <p className="text-gray-500 text-xs mt-1">All known colleges are connected.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {pendingColleges.map((college) => (
                    <div
                      key={college.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-white truncate">{college.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{college.id}</p>
                      </div>
                      <button
                        onClick={() => handleAddFromList(college)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* ───────────── EXISTING COLLEGES LIST ───────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-5 mt-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Library className="h-5 w-5 text-indigo-400" />
                Connected Colleges
                {connectedColleges.length > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/[0.06] text-xs text-gray-400 font-medium">
                    {connectedColleges.length}
                  </span>
                )}
              </h2>
            </div>

            {connectedColleges.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/[0.1] py-20 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-5">
                  <Library className="h-9 w-9 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium mb-1">No colleges connected</p>
                <p className="text-gray-600 text-sm max-w-xs">Add a college manually or securely from the pending list.</p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {connectedColleges.map((c) => (
                  <motion.div
                    key={c.id}
                    variants={fadeUp}
                    whileHover={{ scale: 1.015, boxShadow: "0 8px 36px rgba(0,0,0,0.32)" }}
                    className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#1e1e2f]/80 to-[#27253a]/80 overflow-hidden group cursor-default"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
                  >
                    {/* Accent bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-500/70 via-indigo-500/70 to-purple-500/70 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className="text-base font-semibold text-white leading-tight line-clamp-2">{c.name}</h3>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2.5 text-sm p-2 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                          <Search className="h-4 w-4 text-purple-400 shrink-0" />
                          <span className="text-gray-300 font-mono tracking-wide">{c.id}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/[0.08] hover:bg-cyan-500/[0.15] transition-colors"
                          onClick={() => toast.info(`Viewing details for "${c.name}"`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/[0.08] hover:bg-amber-500/[0.15] transition-colors"
                          onClick={() => toast.info(`Editing "${c.name}"`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          className="flex-[0.5] flex items-center justify-center py-2.5 rounded-lg text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.15] transition-colors"
                          onClick={() => handleRemoveCollege(c.id, c.name)}
                          title="Remove College"
                        >
                          <Trash2 className="h-4 w-4" />
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

    </div>
  );
}
