import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

export default function GitHubStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

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
          setLoading(false);
          return;
        }
        const processed = data.map(user => {
          let add = 0, del = 0;
          user.weeks.forEach(w => { add += w.a; del += w.d; });
          return {
            login: user.author.login,
            avatar: user.author.avatar_url,
            url: user.author.html_url,
            commits: user.total,
            additions: add,
            deletions: del,
            totalChanges: add + del
          };
        }).filter(u => u.totalChanges > 0)
          .sort((a, b) => b.totalChanges - a.totalChanges);
        
        const maxChanges = processed[0]?.totalChanges || 1;
        setStats(processed.map(p => ({ ...p, maxChanges })));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Recalculate height whenever stats load
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [stats]);

  useEffect(() => {
    if (isOpen && !loading && stats.length > 0 && containerRef.current) {
      // Trigger bar animation when opened
      const bars = containerRef.current.querySelectorAll(".stat-bar");
      gsap.fromTo(bars, 
        { scaleX: 0 }, 
        { 
          scaleX: 1, 
          duration: 1.2, 
          ease: "power3.out", 
          stagger: 0.05,
          delay: 0.2,
          transformOrigin: "left center",
        }
      );
    }
  }, [isOpen, loading, stats]);

  if (loading || stats.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto px-4 font-inter">
      
      {/* Header & Toggle Button */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Project Contributors</h3>
        <p className="text-sm text-[#797886] mb-6">The community behind SocConnect's development</p>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-2.5 pr-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#f0f0f4] text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95"
        >
          {/* Avatar stack */}
          {stats.length > 0 && (
            <div className="flex -space-x-2 mr-2">
              {stats.slice(0, 3).map((user, i) => (
                <img 
                  key={user.login} 
                  src={user.avatar} 
                  alt={user.login} 
                  className="w-7 h-7 rounded-full border-[1.5px] border-[#1b1a29] relative object-cover bg-[#2a2836]"
                  style={{ zIndex: 10 - i }}
                />
              ))}
              {stats.length > 3 && (
                <div 
                  className="w-7 h-7 rounded-full border-[1.5px] border-[#1b1a29] bg-[#312e40] flex items-center justify-center text-[10px] text-[#f0f0f4] relative font-bold"
                  style={{ zIndex: 0 }}
                >
                  +{stats.length - 3}
                </div>
              )}
            </div>
          )}

          <span>{isOpen ? "Hide Contributors" : "View Graph"}</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Expandable Content Area */}
      <div 
        className="overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.87,0,0.13,1)]"
        style={{ 
          maxHeight: isOpen ? `${contentHeight + 40}px` : "0px",
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden"
        }}
      >
        <div ref={contentRef} className="flex flex-col gap-4 mt-6 pb-4">
          {stats.map((user, i) => (
            <a key={user.login} href={user.url} target="_blank" rel="noreferrer" 
               className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 bg-[#2a2836]/40 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 hover:bg-[#312e40]/60">
              
              {/* Avatar & Info */}
              <div className="flex items-center gap-4 w-full sm:w-[220px] shrink-0">
                <span className="text-xs font-bold text-white/20 w-4 text-center">{i + 1}</span>
                <img src={user.avatar} alt={user.login} className="w-12 h-12 rounded-full border-2 border-white/10" />
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#f0f0f4] group-hover:text-indigo-400 transition-colors">{user.login}</span>
                  <span className="text-[11px] font-medium text-[#797886] tracking-wider uppercase mt-0.5">{user.commits} Commits</span>
                </div>
              </div>
              
              {/* Graph */}
              <div className="flex-1 w-full flex flex-col gap-2 mt-2 sm:mt-0">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-emerald-400 opacity-90">{user.additions.toLocaleString()} ++</span>
                  <span className="text-rose-400 opacity-90">{user.deletions.toLocaleString()} --</span>
                </div>
                <div className="h-2.5 w-full bg-[#1b1a29] rounded-full overflow-hidden flex relative"
                     style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}>
                  <div 
                    className="stat-bar h-full bg-emerald-500 rounded-l-full" 
                    style={{ width: `${(user.additions / user.maxChanges) * 100}%` }}
                  />
                  <div 
                    className="stat-bar h-full bg-rose-500 rounded-r-full" 
                    style={{ width: `${(user.deletions / user.maxChanges) * 100}%` }}
                  />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
