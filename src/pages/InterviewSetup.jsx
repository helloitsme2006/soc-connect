import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Timer,
  Layers,
  UserPlus,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  createInterview,
  generateInterviewSlots,
  assignInterviewCandidates,
  getAllUsers,
  isSocietyRole,
} from "../services/api";

/* ── animation variants ───────────────────────────────────────────────── */
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 260 } },
};

/* ── reusable components (match FacultyDashboard) ─────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE — InterviewSetup
   ═══════════════════════════════════════════════════════════════════ */
export default function InterviewSetup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── form state ──
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [slotDuration, setSlotDuration] = useState(15);
  const [panelCount, setPanelCount] = useState(1);
  const [panels, setPanels] = useState([{ panelId: 1, interviewers: [""] }]);

  // ── result state ──
  const [createdInterview, setCreatedInterview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showAssign, setShowAssign] = useState(false);

  // ── guard ──
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && !isSocietyRole(user.accountType)) navigate("/");
  }, [user, authLoading, navigate]);

  // ── sync panel count ──
  useEffect(() => {
    setPanels((prev) => {
      const next = [];
      for (let i = 0; i < panelCount; i++) {
        next.push(prev[i] || { panelId: i + 1, interviewers: [""] });
        next[i].panelId = i + 1;
      }
      return next;
    });
  }, [panelCount]);

  /* ── panel interviewer helpers ── */
  const updateInterviewer = (panelIdx, intIdx, value) => {
    setPanels((prev) => {
      const copy = prev.map((p) => ({ ...p, interviewers: [...p.interviewers] }));
      copy[panelIdx].interviewers[intIdx] = value;
      return copy;
    });
  };
  const addInterviewer = (panelIdx) => {
    setPanels((prev) => {
      const copy = prev.map((p) => ({ ...p, interviewers: [...p.interviewers] }));
      copy[panelIdx].interviewers.push("");
      return copy;
    });
  };
  const removeInterviewer = (panelIdx, intIdx) => {
    setPanels((prev) => {
      const copy = prev.map((p) => ({ ...p, interviewers: [...p.interviewers] }));
      copy[panelIdx].interviewers.splice(intIdx, 1);
      return copy;
    });
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter an interview title.");
    if (!date) return toast.error("Please select a date.");
    if (!startTime || !endTime) return toast.error("Please set start and end time.");

    // validate panels have at least one interviewer each
    for (const p of panels) {
      const filled = p.interviewers.filter((n) => n.trim());
      if (!filled.length) return toast.error(`Panel ${p.panelId} needs at least one interviewer.`);
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        date,
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
        panels: panels.map((p) => ({
          panelId: p.panelId,
          interviewers: p.interviewers.filter((n) => n.trim()),
        })),
      };

      const createRes = await createInterview(payload);
      const interviewId = createRes.data._id;

      const slotsRes = await generateInterviewSlots(interviewId);
      toast.success(`Created interview with ${slotsRes.slotsGenerated} slots!`);
      setCreatedInterview(slotsRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── fetch users for assignment ── */
  const handleShowAssign = async () => {
    setShowAssign(true);
    try {
      const res = await getAllUsers();
      const users = res.data || res.users || [];
      setAllUsers(users);
    } catch (err) {
      toast.error("Failed to load users: " + err.message);
    }
  };

  const toggleCandidate = (id) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedCandidates.length) return toast.error("Select at least one candidate.");
    setAssigning(true);
    try {
      const res = await assignInterviewCandidates(createdInterview._id, selectedCandidates);
      toast.success(`Assigned ${res.assigned} candidates! (${res.unassigned} unassigned)`);
      setCreatedInterview(res.data);
      setShowAssign(false);
      setSelectedCandidates([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#14141f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14141f] text-white">
      {/* bg texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Interview{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Setup
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create an interview schedule, generate slots, and assign candidates.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          {/* ───────── CREATE INTERVIEW FORM ───────── */}
          {!createdInterview && (
            <GlassCard className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-cyan-400" />
                New Interview Schedule
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  label="Interview Title"
                  icon={Layers}
                  placeholder="e.g. Technical Dept Interviews — Spring 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <InputField
                    label="Date"
                    icon={Calendar}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                  <InputField
                    label="Start Time"
                    icon={Clock}
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                  <InputField
                    label="End Time"
                    icon={Clock}
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="Slot Duration (minutes)"
                    icon={Timer}
                    type="number"
                    min="5"
                    max="120"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-400 tracking-wide pl-0.5">
                      Number of Panels <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <select
                        value={panelCount}
                        onChange={(e) => setPanelCount(Number(e.target.value))}
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#252536] border border-white/[0.08] text-white text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n} Panel{n > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* ── Panels ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400" />
                    Panel Interviewers
                  </h3>
                  {panels.map((panel, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-3"
                    >
                      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                        Panel {panel.panelId}
                      </p>
                      {panel.interviewers.map((name, iIdx) => (
                        <div key={iIdx} className="flex items-center gap-2">
                          <input
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#252536] border border-white/[0.08] text-white placeholder-gray-500 text-sm focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200"
                            placeholder={`Interviewer ${iIdx + 1} name / email`}
                            value={name}
                            onChange={(e) => updateInterviewer(pIdx, iIdx, e.target.value)}
                          />
                          {panel.interviewers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInterviewer(pIdx, iIdx)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addInterviewer(pIdx)}
                        className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Interviewer
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {submitting ? "Generating Schedule…" : "Generate Interview Schedule"}
                </button>
              </form>
            </GlassCard>
          )}

          {/* ───────── POST-CREATE: SLOT SUMMARY ───────── */}
          {createdInterview && (
            <>
              <GlassCard className="p-6 sm:p-8 border-l-4 border-l-emerald-500/50">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Interview Created Successfully
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Title", value: createdInterview.title },
                    { label: "Date", value: new Date(createdInterview.date).toLocaleDateString() },
                    { label: "Time", value: `${createdInterview.startTime} — ${createdInterview.endTime}` },
                    { label: "Total Slots", value: createdInterview.slots.length },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">{item.label}</p>
                      <p className="text-white font-medium mt-0.5 text-sm truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Slot preview table */}
                <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Panel</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdInterview.slots.map((slot, idx) => (
                        <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{slot.time}</td>
                          <td className="px-4 py-3 text-gray-300">Panel {slot.panelId}</td>
                          <td className="px-4 py-3 text-gray-400">{slot.candidateName || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              slot.status === "available" ? "bg-gray-500/10 text-gray-400 border border-gray-500/20" :
                              slot.status === "scheduled" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                              slot.status === "selected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              slot.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {slot.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* ── Assign Candidates ── */}
              {!showAssign ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleShowAssign}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Auto-Assign Candidates
                  </button>
                  <button
                    onClick={() => navigate("/interview-dashboard")}
                    className="px-6 py-3.5 rounded-xl border border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.04] font-medium text-sm transition-all duration-200 flex items-center gap-2"
                  >
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <GlassCard className="p-6 sm:p-8">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                    <UserPlus className="h-5 w-5 text-indigo-400" />
                    Select Candidates to Assign
                  </h2>
                  <p className="text-sm text-gray-400 mb-6 font-medium">
                    Candidates will be assigned to available slots in order (FIFO).
                  </p>

                  {allUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Loading users…</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
                        {allUsers.map((u) => {
                          const isSelected = selectedCandidates.includes(u._id);
                          return (
                            <button
                              key={u._id}
                              onClick={() => toggleCandidate(u._id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
                                isSelected
                                  ? "border-cyan-500/40 bg-cyan-500/10"
                                  : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected ? "border-cyan-400 bg-cyan-500" : "border-gray-600"
                              }`}>
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleAssign}
                          disabled={assigning || !selectedCandidates.length}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Assign {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? "s" : ""}
                        </button>
                        <button
                          onClick={() => { setShowAssign(false); setSelectedCandidates([]); }}
                          className="px-5 py-3 rounded-xl border border-white/[0.1] text-gray-400 hover:text-white hover:bg-white/[0.04] text-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </GlassCard>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
