import { NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Footer from "../components/common/Footer";
import UpcomingEventSection from "../components/UpcomingEventSection";
import Lenis from "lenis";
import { useFeatureFlags } from "../context/FeatureFlags.jsx";

/* ─── Design Tokens (Midnight Indigo) ─────────────────────────────────── */
const T = {
  bg0: "#0b1020",
  bg1: "#121a2f",
  bg2: "#1a2340",
  bg3: "#263055",
  card: "#1f2a49",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  textPrimary: "#eef2ff",
  textMuted: "#b3bfdc",
  textSubtle: "#90a0c7",
};

/* ─── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "👥",
    title: "Member Management",
    desc: "Onboard, manage, and track every member across departments — with role-based access, profiles, and social links.",
    gradient: "from-indigo-500/10 to-violet-500/10",
    border: "rgba(99,102,241,0.2)",
  },
  {
    icon: "📅",
    title: "Event Lifecycle",
    desc: "Create, publish, and archive events with full gallery, speaker, and agenda support — plus smart scheduled cleanup.",
    gradient: "from-sky-500/10 to-cyan-500/10",
    border: "rgba(14,165,233,0.2)",
  },
  {
    icon: "🏢",
    title: "Department Rosters",
    desc: "Each department gets its own roster. Bulk import via Excel, photo uploads, and shareable invite links.",
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "rgba(139,92,246,0.2)",
  },
  {
    icon: "🔗",
    title: "Magic Links",
    desc: "Share a link — anyone can submit events or join teams without needing an account. Secure, token-based, expiring.",
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "rgba(245,158,11,0.2)",
  },
  {
    icon: "🏆",
    title: "Hackathon Scoring",
    desc: "Run competitions with per-judge scoring, real-time leaderboards, and configurable result declarations.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "rgba(16,185,129,0.2)",
  },
  {
    icon: "📊",
    title: "Activity Audit Logs",
    desc: "Every action is tracked. Full transparency with per-user logs, action categories, and searchable history.",
    gradient: "from-rose-500/10 to-pink-500/10",
    border: "rgba(244,63,94,0.2)",
  },
];

/* ─── How it works steps ─────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register Your Society",
    desc: "Sign up and configure your society's profile, departments, and access permissions in minutes.",
  },
  {
    step: "02",
    title: "Invite Your Team",
    desc: "Generate invite links per department. Members self-register — no manual data entry needed.",
  },
  {
    step: "03",
    title: "Run Everything in One Place",
    desc: "Post events, manage rosters, publish results, and track activity — all from one unified dashboard.",
  },
];

/* ══════════════════════════════════════════════════════════════════════════ */
function Home() {
  const { leaderboardEnabled } = useFeatureFlags();
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.05, smoothWheel: true });
    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative overflow-x-hidden" style={{ background: T.bg0 }}>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-28 overflow-hidden"
        style={{ background: T.bg0 }}
      >
        {/* Indigo radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 68%)",
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Badge */}
        <div className="relative z-10 mt-16 mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase"
          style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: "0 0 6px rgba(99,102,241,0.9)" }} />
          The all-in-one society management platform
        </div>

        {/* Heading */}
        <h1 className="relative z-10 text-4xl sm:text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
          <span className="text-white">One Platform for </span>
          <span className="" style={{
            background: "linear-gradient(135deg, #ffffff 20%, #a5b4fc 55%, #c084fc 85%)",
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Every Society</span>
        </h1>

        {/* Subheading */}
        <p className="relative z-10 text-xl sm:text-2xl font-semibold mb-6" style={{
          background: "linear-gradient(90deg, #a5b4fc, #e879f9)",
          backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "-0.01em",
        }}>Manage. Connect. Grow.</p>

        {/* Subtext */}
        <p className="relative z-10 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: T.textSubtle }}>
          SocConnect is a complete ecosystem for college societies — manage members, departments,
          events, teams, and recruitment all from one unified platform.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button onClick={() => navigate("/register")}
            className="px-8 py-3 rounded-full font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
              boxShadow: "0 0 0 1px rgba(99,102,241,0.3), 0 8px 32px rgba(99,102,241,0.25)",
            }}>
            Register ✦
          </button>
          <NavLink to="/signup">
            <button className="px-8 py-3 rounded-full font-semibold text-sm"
              style={{
                background: "linear-gradient(145deg, #ffffff, #e0e0e0)",
                color: "#0a0a0a",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(255,255,255,0.12)",
              }}>
              Start for Free
            </button>
          </NavLink>
          <button onClick={() => navigate("/about")}
            className="px-8 py-3 rounded-full font-medium text-sm text-white/80 hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}>
            Learn More
          </button>
          {leaderboardEnabled && (
            <button onClick={() => navigate("/leaderboard")}
              className="px-8 py-3 rounded-full font-medium text-sm text-white/60 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Leaderboard
            </button>
          )}
        </div>

        {/* Stats Card */}
        <div className="relative z-10 w-full max-w-2xl rounded-2xl p-px"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)" }}>
          <div className="relative rounded-2xl px-8 py-7"
            style={{ background: T.bg2, boxShadow: "0 4px 6px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}>
            {/* Light-leak */}
            <div className="absolute top-0 left-8 right-8 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" }} />
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { val: "30+", label: "Societies" },
                { val: "500+", label: "Members", bordered: true },
                { val: "80+", label: "Events Run" },
              ].map(({ val, label, bordered }) => (
                <div key={label} className="flex flex-col items-center"
                  style={bordered ? { borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` } : {}}>
                  <div className="font-bold text-3xl sm:text-4xl text-white mb-1" style={{ letterSpacing: "-0.03em" }}>{val}</div>
                  <div className="text-xs font-medium uppercase tracking-widest" style={{ color: T.textSubtle }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. UPCOMING EVENTS ═══════════════════════════════════════════════ */}
      <UpcomingEventSection variant="home" />

      {/* ══ 3. FEATURES ══════════════════════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ background: T.bg1 }}>
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-4"
              style={{ border: `1px solid rgba(99,102,241,0.3)`, color: "#a5b4fc", background: "rgba(99,102,241,0.06)" }}>
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
              Everything your society needs
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: T.textSubtle }}>
              Built specifically for the way college societies actually work — dynamic, fast-moving, and people-first.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, title, desc, gradient, border }) => (
              <div key={title}
                className={`group relative rounded-2xl p-6 bg-gradient-to-br ${gradient}`}
                style={{ border: `1px solid ${border}`, background: T.card }}>
                {/* Light leak top */}
                <div className="absolute top-0 left-6 right-6 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ background: T.bg0 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-4"
              style={{ border: `1px solid rgba(255,255,255,0.1)`, color: T.textMuted }}>
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Up and running in minutes
            </h2>
          </div>

          <div className="space-y-4">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="flex gap-6 items-start p-6 rounded-2xl"
                style={{ background: T.bg2, border: `1px solid ${T.border}` }}>
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(192,132,252,0.2))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    color: "#a5b4fc",
                  }}>
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base mb-1">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.textSubtle }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. ABOUT / MISSION ═══════════════════════════════════════════════ */}
      <section className="py-28 px-6 text-center" style={{ background: T.bg1 }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-8"
            style={{ border: `1px solid rgba(255,255,255,0.1)`, color: T.textMuted }}>
            Our Mission
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>
            Built for student communities,{" "}
            <span style={{
              background: "linear-gradient(135deg, #a5b4fc, #c084fc)",
              backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>by student communities</span>
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-10" style={{ color: T.textSubtle }}>
            SocConnect was born from the frustration of managing a society using spreadsheets, WhatsApp groups,
            and disconnected tools. We built the platform we always wished existed — one that understands how
            college societies actually operate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate("/about")}
              className="px-8 py-3 rounded-full font-semibold text-sm"
              style={{
                background: "linear-gradient(145deg, #ffffff, #e0e0e0)",
                color: "#0a0a0a",
                boxShadow: "0 8px 32px rgba(255,255,255,0.1)",
              }}>
              About SocConnect
            </button>
            <button onClick={() => navigate("/team")}
              className="px-8 py-3 rounded-full font-medium text-sm text-white/70 hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              Meet the Team
            </button>
          </div>
        </div>
      </section>

      {/* ══ 6. CTA BANNER ════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: T.bg0 }}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Glow orb */}
          <div className="absolute left-1/2 -translate-x-1/2 w-96 h-96 pointer-events-none -mt-24"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />

          <div className="relative rounded-3xl p-12"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(192,132,252,0.08) 100%)",
              border: `1px solid rgba(99,102,241,0.2)`,
              boxShadow: "0 0 80px rgba(99,102,241,0.08)",
            }}>
            {/* Top light-leak */}
            <div className="absolute top-0 left-16 right-16 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(165,180,252,0.3), transparent)" }} />

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
              Ready to modernise your society?
            </h2>
            <p className="text-base mb-8" style={{ color: T.textSubtle }}>
              Join societies already running on SocConnect. It takes less than 5 minutes to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink to="/signup">
                <button className="px-10 py-3.5 rounded-full font-semibold text-sm"
                  style={{
                    background: "linear-gradient(145deg, #ffffff, #e0e0e0)",
                    color: "#0a0a0a",
                    boxShadow: "0 8px 40px rgba(255,255,255,0.2)",
                  }}>
                  Get Started — It's Free
                </button>
              </NavLink>
              <NavLink to="/events">
                <button className="px-8 py-3.5 rounded-full font-medium text-sm text-white/70 hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                  Browse Events
                </button>
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
