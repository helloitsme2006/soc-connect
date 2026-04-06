import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import UniversityRegister from "./UniversityRegister";
import CollegeRegister from "./CollegeRegister";
import SocietyRegister from "./SocietyRegister";

const ROLES = [
  {
    id: "university",
    icon: "🎓",
    title: "University",
    desc: "Register your university on SocConnect. Manage affiliated colleges and societies at scale.",
    gradient: "from-indigo-500/10 to-purple-500/10",
    border: "rgba(99,102,241,0.25)",
    hoverBorder: "rgba(99,102,241,0.55)",
    accent: "#a5b4fc",
  },
  {
    id: "college",
    icon: "🏫",
    title: "College",
    desc: "Register your college and connect with your university. Empower societies under your banner.",
    gradient: "from-sky-500/10 to-cyan-500/10",
    border: "rgba(14,165,233,0.25)",
    hoverBorder: "rgba(14,165,233,0.55)",
    accent: "#7dd3fc",
  },
  {
    id: "society",
    icon: "🎭",
    title: "Society",
    desc: "Register your student society. Get tools for events, teams, recruitment, and more.",
    gradient: "from-violet-500/10 to-pink-500/10",
    border: "rgba(168,85,247,0.25)",
    hoverBorder: "rgba(168,85,247,0.55)",
    accent: "#d8b4fe",
  },
];

const TITLES = {
  university: "University Registration",
  college: "College Registration",
  society: "Society Registration",
};

export default function RoleSelectModal({ onClose }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
      <AnimatePresence mode="wait">
        {!selected ? (
          /* ── Role selector ── */
          <motion.div
            key="selector"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1a1929, #22212d)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 120px rgba(99,102,241,0.06)",
            }}
          >
            {/* Top light leak */}
            <div className="absolute top-0 left-16 right-16 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(165,180,252,0.25),transparent)" }} />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all z-10">
              <X size={16} />
            </button>

            <div className="p-8 pb-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest mb-4"
                  style={{ border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", background: "rgba(99,102,241,0.07)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                    style={{ boxShadow: "0 0 6px rgba(99,102,241,0.9)" }} />
                  New Registration
                </div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
                  Who are you registering as?
                </h2>
                <p className="text-sm text-gray-500">Choose your role to get started with the right setup.</p>
              </div>

              {/* Role cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ROLES.map(({ id, icon, title, desc, gradient, border, hoverBorder, accent }) => (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    className={`group relative rounded-2xl p-5 text-left transition-all duration-200 bg-gradient-to-br ${gradient} hover:scale-[1.03] active:scale-[0.98]`}
                    style={{
                      border: `1px solid ${border}`,
                      background: "#1e1d2b",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = hoverBorder; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; }}
                  >
                    {/* Light leak */}
                    <div className="absolute top-0 left-4 right-4 h-px opacity-60"
                      style={{ background: `linear-gradient(90deg,transparent,${accent}40,transparent)` }} />
                    <div className="text-3xl mb-3">{icon}</div>
                    <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium transition-all duration-200"
                      style={{ color: accent }}>
                      Register →
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-600 mt-6">
                Already have an account?{" "}
                <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Log in</a>
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── Registration form modal ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1a1929, #22212d)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.05)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="absolute top-0 left-16 right-16 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(165,180,252,0.2),transparent)" }} />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all z-10">
              <X size={16} />
            </button>

            {/* Back to role select */}
            <button onClick={() => setSelected(null)}
              className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors z-10">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5m0 0l7 7M5 12l7-7" />
              </svg>
              Back
            </button>

            <div className="p-8 pt-14">
              <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                {TITLES[selected]}
              </h2>
              <p className="text-xs text-gray-500 mb-6">Fill in the details below to complete your registration.</p>

              {selected === "university" && <UniversityRegister onClose={onClose} />}
              {selected === "college" && <CollegeRegister onClose={onClose} />}
              {selected === "society" && <SocietyRegister onClose={onClose} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
