import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getInterviews,
  updateInterviewSlotStatus,
  isSocietyRole,
} from "../services/api";

/* ── animation variants ───────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 260 } },
};

function GlassCard({ children, className = "", ...props }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#1e1e2f]/90 to-[#27253a]/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.18)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── status badge ── */
const STATUS_STYLES = {
  available: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  scheduled: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  selected: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || STATUS_STYLES.available}`}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE — InterviewDashboard
   ═══════════════════════════════════════════════════════════════════ */
export default function InterviewDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterPanel, setFilterPanel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingIdx, setUpdatingIdx] = useState(null);

  // ── guard ──
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user && !isSocietyRole(user.accountType)) navigate("/");
  }, [user, authLoading, navigate]);

  // ── fetch interviews ──
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await getInterviews();
      const data = res.data || [];
      setInterviews(data);
      if (data.length && !selectedId) setSelectedId(data[0]._id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchInterviews();
  }, [authLoading, user]);

  const selected = interviews.find((i) => i._id === selectedId);

  // ── filtered slots ──
  const filteredSlots = (selected?.slots || [])
    .map((s, idx) => ({ ...s, _idx: idx }))
    .filter((s) => filterPanel === "all" || s.panelId === Number(filterPanel))
    .filter((s) => filterStatus === "all" || s.status === filterStatus);

  // ── update status ──
  const handleStatusChange = async (slotIndex, newStatus) => {
    setUpdatingIdx(slotIndex);
    try {
      const res = await updateInterviewSlotStatus(selectedId, slotIndex, newStatus);
      setInterviews((prev) => prev.map((i) => (i._id === selectedId ? res.data : i)));
      toast.success("Status updated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingIdx(null);
    }
  };

  // ── stats ──
  const stats = selected
    ? {
        total: selected.slots.length,
        available: selected.slots.filter((s) => s.status === "available").length,
        scheduled: selected.slots.filter((s) => s.status === "scheduled").length,
        completed: selected.slots.filter((s) => s.status === "completed").length,
        selected_: selected.slots.filter((s) => s.status === "selected").length,
        rejected: selected.slots.filter((s) => s.status === "rejected").length,
      }
    : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#14141f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14141f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Interview{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage interview slots and update candidate statuses.</p>
          </div>
          <button
            onClick={fetchInterviews}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-gray-400 hover:text-white hover:bg-white/[0.04] text-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </motion.div>

        {interviews.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <LayoutDashboard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No interviews created yet.</p>
            <p className="text-gray-500 text-sm mt-1">
              Go to{" "}
              <button onClick={() => navigate("/interview-setup")} className="text-cyan-400 hover:underline">
                Interview Setup
              </button>{" "}
              to create one.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {/* ── Interview selector + filters ── */}
            <GlassCard className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Selector */}
              <div className="flex-1 min-w-0">
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium block mb-1.5">Interview</label>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => { setSelectedId(e.target.value); setFilterPanel("all"); setFilterStatus("all"); }}
                    className="w-full pr-10 py-2.5 pl-4 rounded-xl bg-[#252536] border border-white/[0.08] text-white text-sm focus:border-cyan-500/60 outline-none transition-all appearance-none truncate"
                  >
                    {interviews.map((iv) => (
                      <option key={iv._id} value={iv._id}>
                        {iv.title} — {new Date(iv.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Panel filter */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium block mb-1.5">Panel</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                  <select
                    value={filterPanel}
                    onChange={(e) => setFilterPanel(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl bg-[#252536] border border-white/[0.08] text-white text-sm focus:border-cyan-500/60 outline-none transition-all appearance-none"
                  >
                    <option value="all">All Panels</option>
                    {(selected?.panels || []).map((p) => (
                      <option key={p.panelId} value={p.panelId}>Panel {p.panelId}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium block mb-1.5">Status</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-8 pr-8 py-2.5 rounded-xl bg-[#252536] border border-white/[0.08] text-white text-sm focus:border-cyan-500/60 outline-none transition-all appearance-none"
                  >
                    <option value="all">All Status</option>
                    {["available", "scheduled", "completed", "selected", "rejected"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </GlassCard>

            {/* ── Stats Row ── */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total", val: stats.total, color: "text-white" },
                  { label: "Available", val: stats.available, color: "text-gray-400" },
                  { label: "Scheduled", val: stats.scheduled, color: "text-cyan-400" },
                  { label: "Completed", val: stats.completed, color: "text-amber-400" },
                  { label: "Selected", val: stats.selected_, color: "text-emerald-400" },
                  { label: "Rejected", val: stats.rejected, color: "text-red-400" },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-white/[0.06] bg-[#1e1e2f]/80 p-3 text-center"
                  >
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">{s.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── Slots Table ── */}
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Time
                      </th>
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Users className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Panel
                      </th>
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate</th>
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlots.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                          No slots match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredSlots.map((slot) => (
                        <tr key={slot._idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">{slot._idx + 1}</td>
                          <td className="px-5 py-3.5 text-white font-medium">{slot.time}</td>
                          <td className="px-5 py-3.5 text-gray-300">Panel {slot.panelId}</td>
                          <td className="px-5 py-3.5">
                            {slot.candidateName ? (
                              <div>
                                <p className="text-white text-sm">{slot.candidateName}</p>
                                <p className="text-gray-500 text-xs">{slot.candidateEmail}</p>
                              </div>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge status={slot.status} /></td>
                          <td className="px-5 py-3.5">
                            {slot.status !== "available" && slot.candidateId && (
                              <div className="relative">
                                <select
                                  value={slot.status}
                                  disabled={updatingIdx === slot._idx}
                                  onChange={(e) => handleStatusChange(slot._idx, e.target.value)}
                                  className="pl-3 pr-7 py-1.5 rounded-lg bg-[#252536] border border-white/[0.08] text-white text-xs focus:border-cyan-500/60 outline-none transition-all appearance-none disabled:opacity-50"
                                >
                                  {["scheduled", "completed", "selected", "rejected"].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}
