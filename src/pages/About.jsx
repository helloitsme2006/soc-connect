import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useFeatureFlags } from "../context/FeatureFlags.jsx";
import Lenis from "lenis";
import Footer from "../components/common/Footer";

gsap.registerPlugin(ScrollTrigger);

/* ─── Design Tokens (Midnight Indigo) ─────────────────────────────────── */
const T = {
  bg0: "#0b1020",
  bg1: "#121a2f",
  bg2: "#1a2340",
  card: "#1f2a49",
  border: "rgba(255,255,255,0.08)",
  textSubtle: "#90a0c7",
  textMuted: "#b3bfdc",
};

/* ─── Platform capabilities ──────────────────────────────────────────────── */
const PILLARS = [
  {
    icon: "👥",
    title: "Unified Member Management",
    desc: "One place for every member across all departments. Role-based permissions, profile pages, department rosters, and Excel bulk imports — no spreadsheets needed anymore.",
    accent: "#6366f1",
  },
  {
    icon: "🗓️",
    title: "Full Event Lifecycle",
    desc: "Create, publish, archive, and showcase events with speaker lists, agendas, galleries, and links. Scheduled cleanup keeps everything tidy automatically.",
    accent: "#0ea5e9",
  },
  {
    icon: "🔗",
    title: "Magic Invite Links",
    desc: "Share a unique link — members can join departments or submit event entries without needing an account. Token-based, expiring, and completely secure.",
    accent: "#f59e0b",
  },
  {
    icon: "🏆",
    title: "Hackathon & Competition Engine",
    desc: "Run scored competitions with per-judge panels, real-time leaderboards, configurable result declarations, and exportable reports.",
    accent: "#10b981",
  },
  {
    icon: "📊",
    title: "Activity Audit Logs",
    desc: "Every admin and member action is tracked. Complete transparency with searchable logs, action categories, and per-user history.",
    accent: "#e879f9",
  },
  {
    icon: "⚙️",
    title: "Admin Control Panel",
    desc: "Feature flags, signup controls, upload configurators, and OTP-based verification — fine-grained control over every aspect of your society's platform.",
    accent: "#f97316",
  },
];

const TIMELINE = [
  { year: "Why We Built It", desc: "Managing a society with WhatsApp groups, Google Sheets, and random Google Forms is chaotic. SocConnect replaces that entire mess with one coherent system." },
  { year: "Who It's For", desc: "Any college society — technical, cultural, or otherwise. Single-society deployments today, with a multi-tenant architecture on the roadmap for entire universities." },
  { year: "How It Works", desc: "Societies register once, configure departments and roles, then invite members via magic links. Events, teams, and competitions are managed from a single dashboard." },
];

/* ══════════════════════════════════════════════════════════════════════════ */
const About = () => {
  const { leaderboardEnabled, setLeaderboardEnabled } = useFeatureFlags();
  const heroRef = useRef();
  const pillarsRef = useRef();
  const storyRef = useRef();
  const ctaRef = useRef();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.05, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useGSAP(() => {
    const sections = [heroRef.current, storyRef.current, ctaRef.current].filter(Boolean);
    sections.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none none" } }
      );
    });
    gsap.from(pillarsRef.current?.children, {
      y: 50, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.1,
      scrollTrigger: { trigger: pillarsRef.current, start: "top 82%", toggleActions: "play none none none" },
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: T.bg0 }}>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="pt-32 pb-20 px-6 text-center relative overflow-hidden" style={{ background: T.bg0 }}>
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 70%)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-8"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
              style={{ boxShadow: "0 0 6px rgba(99,102,241,0.9)" }} />
            About SocConnect
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ letterSpacing: "-0.025em" }}>
            The platform built for{" "}
            <span style={{
              background: "linear-gradient(135deg, #a5b4fc 30%, #c084fc 80%)",
              backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              college societies
            </span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: T.textSubtle }}>
            SocConnect is an all-in-one society management platform built to replace the chaos of
            spreadsheets, group chats, and scattered tools — with a single, elegant system every
            member can use.
          </p>
        </div>
      </section>

      {/* ══ PLATFORM PILLARS ════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: T.bg1 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-4"
              style={{ border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", background: "rgba(99,102,241,0.06)" }}>
              What We Offer
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Everything your society runs on
            </h2>
          </div>

          <div ref={pillarsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map(({ icon, title, desc, accent }) => (
              <div key={title}
                className="relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: T.card, border: `1px solid rgba(255,255,255,0.06)`, boxShadow: "0 0 0 0 transparent" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}40`}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 transparent"}
              >
                {/* top light leak */}
                <div className="absolute top-0 left-6 right-6 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ OUR STORY / CONTEXT ═════════════════════════════════════════════ */}
      <section ref={storyRef} className="py-24 px-6" style={{ background: T.bg0 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-4"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: T.textMuted }}>
              Context &amp; Vision
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Built from real pain points
            </h2>
          </div>

          <div className="space-y-4">
            {TIMELINE.map(({ year, desc }) => (
              <div key={year} className="flex gap-6 items-start p-6 rounded-2xl"
                style={{ background: T.bg2, border: `1px solid ${T.border}` }}>
                <div className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(192,132,252,0.2))",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#a5b4fc",
                  }}>
                  {year}
                </div>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: T.textSubtle }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VISION & MISSION ════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: T.bg1 }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: "👁️",
              label: "Vision",
              color: "#6366f1",
              text: "A world where every college society — regardless of size or budget — has access to professional-grade tools to organise, grow, and leave a lasting impact on their campus.",
            },
            {
              icon: "⚡",
              label: "Mission",
              color: "#10b981",
              text: "To build the most intuitive, feature-complete society management platform available — so society leads spend less time on administration and more time creating experiences that matter.",
            },
          ].map(({ icon, label, color, text }) => (
            <div key={label} className="rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: T.card, border: `1px solid rgba(255,255,255,0.06)` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                {icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-3">Our {label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="py-24 px-6" style={{ background: T.bg0 }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl p-12"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(192,132,252,0.08) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 0 80px rgba(99,102,241,0.07)",
            }}>
            <div className="absolute top-0 left-16 right-16 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(165,180,252,0.3), transparent)" }} />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
              Ready to run your society better??
            </h2>
            <p className="text-base mb-8" style={{ color: T.textSubtle }}>
              Get started in minutes — no setup fees, no lock-ins.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink to="/signup">
                <button className="px-10 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(145deg, #ffffff, #e0e0e0)",
                    color: "#0a0a0a",
                    boxShadow: "0 8px 40px rgba(255,255,255,0.15)",
                  }}>
                  Get Started — It's Free
                </button>
              </NavLink>
              <NavLink to="/contact">
                <button className="px-8 py-3.5 rounded-full font-medium text-sm text-white/70 hover:text-white transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                  Contact Us
                </button>
              </NavLink>
            </div>
            {/* Dev: leaderboard toggle */}
            <div className="mt-8">
              <button
                onClick={() => setLeaderboardEnabled(!leaderboardEnabled)}
                className="px-6 py-2.5 rounded-full text-xs transition-all"
                style={{
                  background: leaderboardEnabled ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                  border: leaderboardEnabled ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  color: leaderboardEnabled ? "#a5b4fc" : T.textSubtle,
                }}>
                {leaderboardEnabled ? "Disable Leaderboard" : "Enable Leaderboard"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
