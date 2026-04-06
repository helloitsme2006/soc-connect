import { useState, useEffect, useMemo } from "react";
import { Instagram, Linkedin, Monitor } from "react-feather";
import GitHubStats from "./GitHubStats";

const Footer = () => {
  const [devs, setDevs] = useState([]);

  // Generate lightweight particles for the animated background
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
    }));
  }, []);

  useEffect(() => {
    const headers = import.meta.env.VITE_GITHUB_TOKEN 
      ? { Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}` } 
      : {};

    fetch("https://api.github.com/repos/dev0302/soc-connect/stats/contributors", {
      headers
    })
      .then(res => {
        if (res.status === 202) {
          return fetch("https://api.github.com/repos/dev0302/soc-connect/stats/contributors").then(r => r.json());
        }
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.warn("GitHub API error or rate limit exceeded.");
          return;
        }
        const processed = data.map(user => {
          let total = 0;
          user.weeks.forEach(w => { total += w.a + w.d; });
          return {
            name: user.author.login,
            img: user.author.avatar_url,
            link: user.author.html_url,
            totalChanges: total
          };
        }).filter(u => u.totalChanges > 0).sort((a, b) => b.totalChanges - a.totalChanges);
        
        if (processed.length > 0) processed[0].isLead = true;
        setDevs(processed.slice(0, 4));
      })
      .catch(err => console.error("Error fetching GitHub devs:", err));
  }, []);

  return (
    <section className="relative text-[#cbd5e1] font-inter px-4 pt-12 pb-10 overflow-hidden bg-[#1b1a29]">
      <style>
        {`
          @keyframes flowingLine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes ambientLight {
            0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
            33% { transform: scale(1.2) translate(30px, -50px); opacity: 0.8; }
            66% { transform: scale(0.9) translate(-40px, 40px); opacity: 0.4; }
            100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          }
          @keyframes floatUp {
            0% { transform: translateY(10vmax) scale(0); opacity: 0; }
            20% { opacity: 0.4; }
            80% { opacity: 0.4; }
            100% { transform: translateY(-100vmax) scale(1.5); opacity: 0; }
          }
        `}
      </style>

      {/* Floating Particles / Sprinkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white mix-blend-overlay"
            style={{
              left: `${p.left}%`,
              bottom: "-20px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
              boxShadow: "0 0 10px 2px rgba(255,255,255,0.3)"
            }}
          ></div>
        ))}
      </div>

      {/* Animated Light Blobs */}
      <div 
        className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full mix-blend-screen pointer-events-none blur-[100px]"
        style={{ 
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0) 70%)",
          animation: "ambientLight 12s ease-in-out infinite alternate" 
        }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full mix-blend-screen pointer-events-none blur-[120px]"
        style={{ 
          background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, rgba(0,0,0,0) 70%)",
          animation: "ambientLight 18s ease-in-out infinite alternate-reverse" 
        }}
      ></div>

      <footer className="max-w-[1200px] mx-auto relative z-10">
        <div className="flex flex-wrap justify-between gap-12 md:gap-16 sm:w-11/12 mx-auto">
          {/* Brand */}
          <div className="flex flex-col gap-4 min-w-[250px] md:ml-20 text-left">
            <div
              className="w-[55px] h-[55px] flex items-center justify-center rounded-xl border border-white/20 text-xl font-bold text-white shadow-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
            >
              S
            </div>
            <h2 className="text-2xl font-bold text-white m-0 tracking-tight">SocConnect</h2>
            <p className="text-[0.95rem] opacity-80 leading-6 text-[#a7a6b4]">
              The next-generation <br />
              society management platform.
            </p>
          </div>

          {/* Contact */}
          <div className="min-w-[250px]">
            <h3 className="text-[#f8fafc] text-2xl font-bold relative inline-block pb-1 mb-4">
              Contact Us
              <span
                className="absolute bottom-0 left-0 w-full h-[3px] rounded-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, #161629, #4ade80, #22c55e, #4ade80, #161629)",
                  backgroundSize: "200% 100%",
                  animation: "flowingLine 3s linear infinite",
                }}
              ></span>
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="flex items-center gap-3 text-indigo-400 hover:text-pink-400 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Monitor size={20} /> Join Discord
              </a>
              <a
                href="#"
                className="flex items-center gap-3 text-indigo-400 hover:text-pink-400 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Instagram size={20} /> @socconnect
              </a>
              <a
                href="#"
                className="flex items-center gap-3 text-indigo-400 hover:text-pink-400 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Linkedin size={20} /> LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* TEAM & CONTRIBUTORS SECTION */}
        <div className="relative z-10 mt-20 pt-16 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-start">
          
          {/* Developed By Section */}
          <div className="flex flex-col items-center gap-8 lg:mt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Core Team</h3>
              <p className="text-sm text-[#797886]">The architects behind SocConnect</p>
            </div>
            
            <div className="flex flex-wrap justify-center items-end gap-8 mt-2">
              {devs.map((person, index) => (
                <a
                  key={index}
                  href={person.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative flex flex-col items-center">
                    {person.isLead && (
                      <span className="absolute -top-6 whitespace-nowrap bg-blue-500/20 text-[#38bdf8] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#38bdf8]/30 uppercase tracking-tighter shadow-lg shadow-blue-500/20">
                        Lead
                      </span>
                    )}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#38bdf8] to-[#7dd3fc] rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                    <img
                      src={person.img}
                      alt={person.name}
                      className="relative h-14 w-14 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl"
                    />
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-[#38bdf8] transition-colors duration-300 tracking-wide">
                    {person.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Project Contributors */}
          <div className="flex flex-col items-center w-full relative">
            <div className="hidden lg:block absolute left-[-2rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            <GitHubStats />
          </div>

        </div>

        <div className="mt-12 pt-8 text-center text-[11px] border-t border-white/5 relative z-10">
          <p className="opacity-40 font-medium">
            &copy; {new Date().getFullYear()} SocConnect. 
            All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
};

export default Footer;

