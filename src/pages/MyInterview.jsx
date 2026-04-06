import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getStudentInterview } from "../services/api";

/* ── animation ───────────────────────────────────────────────────────── */
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

/* ── status config ── */
const STATUS_CONFIG = {
  scheduled: { icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Scheduled" },
  completed: { icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Completed" },
  selected: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Selected 🎉" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Not Selected" },
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE — MyInterview (Student View)
   ═══════════════════════════════════════════════════════════════════ */
export default function MyInterview() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getStudentInterview(user._id);
        setInterviews(res.data || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

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

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Interview
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">View your assigned interview schedule and status.</p>
        </motion.div>

        {interviews.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Info className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No Interview Scheduled</p>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              You don't have any interviews assigned yet. You'll be notified once your interview is scheduled.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {interviews.map((iv, idx) => {
              const cfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.scheduled;
              const StatusIcon = cfg.icon;

              return (
                <GlassCard key={idx} className="p-6 sm:p-8">
                  {/* Status banner */}
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg} border ${cfg.border} mb-6`}>
                    <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                    <div>
                      <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {iv.status === "selected"
                          ? "Congratulations! You've been selected."
                          : iv.status === "rejected"
                          ? "Thank you for your time. Keep going!"
                          : iv.status === "completed"
                          ? "Your interview is completed. Results will be announced soon."
                          : "Your interview is scheduled. Please be on time."}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem icon={Calendar} label="Interview" value={iv.title} />
                    <DetailItem icon={Calendar} label="Date" value={new Date(iv.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
                    <DetailItem icon={Clock} label="Time Slot" value={iv.time} />
                    <DetailItem icon={Users} label="Panel" value={`Panel ${iv.panelId}`} />
                  </div>

                  {/* Interviewers */}
                  {iv.interviewers?.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06]">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Interviewers</p>
                      <div className="flex flex-wrap gap-2">
                        {iv.interviewers.map((name, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-[#252536] border border-white/[0.08] text-sm text-gray-300"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── detail item (reused from FacultyDashboard pattern) ── */
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
