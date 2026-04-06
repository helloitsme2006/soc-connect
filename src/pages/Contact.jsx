import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import Footer from "../components/common/Footer";
import { NavLink } from "react-router-dom";

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

/* ─── Quick contact channels ─────────────────────────────────────────────── */
const CHANNELS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: "Email",
    value: "hello@socconnect.app",
    href: "mailto:hello@socconnect.app",
    accent: "#6366f1",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
    label: "GitHub",
    value: "github.com/socconnect",
    href: "https://github.com",
    accent: "#e5e7eb",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.114 18.105.133 18.12a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
      </svg>
    ),
    label: "Discord",
    value: "Join our community",
    href: "https://discord.gg",
    accent: "#5865f2",
  },
];

/* ══════════════════════════════════════════════════════════════════════════ */
const Contact = () => {
  const containerRef = useRef();
  const formRef = useRef();
  const infoRef = useRef();

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(""); // "" | "sending" | "sent" | "error"

  /* Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  /* GSAP */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = [formRef.current, infoRef.current].filter(Boolean);
      if (elements.length > 0) {
        gsap.fromTo(elements,
          { opacity: 0, y: 60, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out", stagger: 0.15 }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");
    /* TODO: Wire up EmailJS / your preferred email service here */
    setTimeout(() => {
      setStatus("sent");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1200);
  };

  /* ── Input / Textarea shared styles ── */
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#e5e2e1",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
  };

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden text-white" style={{ background: T.bg0 }}>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden" style={{ background: T.bg0 }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-8"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
              style={{ boxShadow: "0 0 6px rgba(99,102,241,0.9)" }} />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5" style={{ letterSpacing: "-0.025em" }}>
            Let's{" "}
            <span style={{
              background: "linear-gradient(135deg, #a5b4fc 30%, #c084fc 80%)",
              backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>talk</span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: T.textSubtle }}>
            Have a question about the platform, want to request a feature, or just want to say hi?
            We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ══ MAIN GRID ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 pb-28" style={{ background: T.bg0 }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* ── Contact Form (3/5) ── */}
          <div ref={formRef} className="md:col-span-3 rounded-2xl p-8"
            style={{ background: T.bg2, border: `1px solid ${T.border}` }}>
            {/* top light leak */}
            <div className="absolute top-0 left-8 right-8 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

            <h2 className="text-xl font-semibold text-white mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: T.textMuted }}>Full Name</label>
                  <input type="text" name="name" id="contact-name" value={formData.name}
                    onChange={handleChange} required placeholder="Your name"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: T.textMuted }}>Email Address</label>
                  <input type="email" name="email" id="contact-email" value={formData.email}
                    onChange={handleChange} required placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: T.textMuted }}>Subject</label>
                <input type="text" name="subject" id="contact-subject" value={formData.subject}
                  onChange={handleChange} placeholder="What's this about?"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: T.textMuted }}>Message</label>
                <textarea name="message" id="contact-message" rows="5" value={formData.message}
                  onChange={handleChange} required placeholder="Tell us what's on your mind..."
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>

              {/* Submit */}
              <button type="submit" id="contact-submit"
                disabled={status === "sending"}
                className="w-full py-3 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: status === "sent"
                    ? "linear-gradient(145deg, #10b981, #059669)"
                    : "linear-gradient(145deg, #ffffff, #e0e0e0)",
                  color: "#0a0a0a",
                  boxShadow: "0 8px 32px rgba(255,255,255,0.1)",
                }}>
                {status === "sending" ? "Sending…" : status === "sent" ? "✓ Message Sent!" : "Send Message"}
              </button>

              {status === "error" && (
                <p className="text-sm text-center" style={{ color: "#f87171" }}>
                  Something went wrong. Please try again later.
                </p>
              )}
            </form>
          </div>

          {/* ── Info Panel (2/5) ── */}
          <div ref={infoRef} className="md:col-span-2 flex flex-col gap-5">

            {/* About card */}
            <div className="rounded-2xl p-6 flex-1"
              style={{ background: T.bg2, border: `1px solid ${T.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                💬
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">We're here to help</h3>
              <p className="text-xs leading-relaxed" style={{ color: T.textSubtle }}>
                Whether you're setting up your first society, running into a bug, or want to discuss a partnership — our
                team reads every message and responds within 24 hours on weekdays.
              </p>
            </div>

            {/* Channels */}
            <div className="rounded-2xl p-6"
              style={{ background: T.bg2, border: `1px solid ${T.border}` }}>
              <h3 className="font-semibold text-white text-sm mb-4">Other ways to reach us</h3>
              <div className="space-y-3">
                {CHANNELS.map(({ icon, label, value, href, accent }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}30`, color: accent }}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white/60">{label}</div>
                      <div className="text-xs font-semibold" style={{ color: accent }}>{value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Response time badge */}
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
                style={{ boxShadow: "0 0 8px rgba(16,185,129,0.7)" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#6ee7b7" }}>
                Typical response time: <span className="font-semibold">under 24 hours</span> on weekdays.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
