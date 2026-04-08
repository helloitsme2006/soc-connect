import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { SaxHome2Linear } from "@meysam213/iconsax-react";
import { SaxInfoCircleLinear } from "@meysam213/iconsax-react";
import { SaxProfile2UserLinear } from "@meysam213/iconsax-react";
import { SaxCalendarTickTwotone } from "@meysam213/iconsax-react";
import { SaxUserTwotone } from "@meysam213/iconsax-react";
import { SaxGalleryLinear } from "@meysam213/iconsax-react";
import ProfileDropDown from "./ProfileDropDown";
import Search from "../Search";
import { isSocietyRole } from "../../services/api";
import { LayoutDashboard, Users, Settings, BookOpen, FileText, Library, ClipboardList } from "lucide-react";

/* ── Obsidian Silk Navbar ────────────────────────────────────────────────── */

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-white bg-white/12"
        : "text-[#d1d5db] hover:text-white hover:bg-white/5"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ${
      isActive ? "text-white bg-white/12" : "text-[#d1d5db] hover:text-white hover:bg-white/5"
    }`;

  const path = location.pathname;
  let navLinks = [];

  if (path.startsWith("/faculty-dashboard")) {
    navLinks = [
      { to: "/", label: "Home", icon: <SaxHome2Linear className="w-4 h-4" /> },
      { to: "/faculty-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { to: "/faculty-dashboard/society", label: "Society Details", icon: <FileText className="w-4 h-4" /> },
      { to: "/faculty-dashboard/members", label: "Members", icon: <Users className="w-4 h-4" /> },
      { to: "/faculty-dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (path.startsWith("/university-admin")) {
    navLinks = [
      { to: "/university-admin", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { to: "/university-admin/colleges", label: "Colleges", icon: <Library className="w-4 h-4" /> },
      { to: "/university-admin/students", label: "Students", icon: <Users className="w-4 h-4" /> },
      { to: "/university-admin/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (path.startsWith("/college-admin")) {
    navLinks = [
      { to: "/college-admin", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { to: "/college-admin/societies", label: "Societies", icon: <BookOpen className="w-4 h-4" /> },
      { to: "/college-admin/students", label: "Students", icon: <Users className="w-4 h-4" /> },
      { to: "/college-admin/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    ];
  } else {
    navLinks = [
      { to: "/", label: "Home", icon: <SaxHome2Linear className="w-4 h-4" />, exact: true },
      { to: "/about", label: "About", icon: <SaxInfoCircleLinear className="w-4 h-4" /> },
      ...(user ? [
        ...(isSocietyRole(user.accountType)
          ? [{ to: "/faculty-dashboard", label: "Dashboard", icon: <SaxProfile2UserLinear className="w-4 h-4" /> }]
          : [{ to: "/team", label: "Team", icon: <SaxProfile2UserLinear className="w-4 h-4" /> }]),
        { to: "/events", label: "Events", icon: <SaxCalendarTickTwotone className="w-4 h-4" /> },
        { to: "/gallery", label: "Gallery", icon: <SaxGalleryLinear className="w-4 h-4" /> },
      ] : []),
      ...(user ? [
        { to: "/my-interview", label: "Interviews", icon: <ClipboardList className="w-4 h-4" /> },
      ] : []),
      { to: "/contact", label: "Contact", icon: <SaxUserTwotone className="w-4 h-4" /> },
    ];
  }

  return (
    <>
      {/* ── Main Navbar Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-3 sm:px-5 pt-3">
        <div
          className="w-full max-w-screen-xl relative px-4 sm:px-6 h-16 flex items-center justify-between rounded-2xl pointer-events-auto"
          style={{
            background: "linear-gradient(180deg, rgba(34,34,40,0.84), rgba(24,24,30,0.88))",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #ffffff, #e9e9ec)" }}
            >
              S
            </div>
            <span
              className="font-semibold text-base tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffffff, #c6c6c7)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SocConnect
            </span>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-2xl p-1 border border-white/10 bg-black/10">
            {navLinks.map(({ to, label, icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => navLinkClass({ isActive })}
              >
                {({ isActive }) => (
                  <>
                    {icon}
                    <span>{label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/90"
                        style={{ boxShadow: "0 0 6px rgba(255,255,255,0.6)" }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right: Search + Auth */}
          <div className="hidden md:flex  items-center gap-3">
            {user && (
              <Search
                variant="navbar"
                placeholder="Search members…"
                className="shrink-0 w-[100px]"
              />
            )}

            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <ProfileDropDown onLogout={logout} isDarkNavbar={true} />
            ) : (
              <>
                <NavLink to="/login">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    Login
                  </button>
                </NavLink>
                <NavLink to="/signup">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    Signup
                  </button>
                </NavLink>
                <NavLink to="/register">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-100 transition-all duration-200"
                    style={{ boxShadow: "0 0 16px rgba(255,255,255,0.15)" }}
                  >
                    Register
                  </button>
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Right: avatar + hamburger */}
          <div className="md:hidden flex items-center gap-2 z-50">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <ProfileDropDown
                onLogout={logout}
                isDarkNavbar={true}
                avatarOnly
                showChevron
                onBeforeToggle={() => {
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
              />
            ) : null}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9 rounded-lg border border-white/15 bg-white/5 text-[#c4c4cc] hover:text-white hover:bg-white/10 focus:outline-none transition-colors flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Backdrop ── */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── Mobile Slide-in Menu ── */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="ml-auto h-full w-[86%] max-w-sm p-6"
          style={{
            background: "rgba(24, 24, 30, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "-20px 0 40px rgba(0,0,0,0.35)",
          }}>
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-white/50">Menu</div>
          <div className="mt-1 text-lg font-semibold text-white">SocConnect</div>
        </div>
        <ul className="flex flex-col gap-2">
          {navLinks.map(({ to, label, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}

          {/* Auth buttons in mobile menu */}
          <li className="mt-6 flex flex-col gap-3">
            {user ? (
              <>
                {isSocietyRole(user.accountType) && (
                  <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <button
                      className="w-full py-3 px-4 rounded-xl font-medium text-white/80 text-left"
                      style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      Dashboard
                    </button>
                  </NavLink>
                )}
                <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <button
                    className="w-full py-3 px-4 rounded-xl font-medium text-white/80 text-left"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    Profile
                  </button>
                </NavLink>
                <button
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                    navigate("/");
                  }}
                  className="w-full py-3 px-4 rounded-xl font-medium text-white/60 hover:text-white transition-colors text-left"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className="w-fit">
                  <button
                    className="w-full py-3 px-4 rounded-xl font-medium text-white/80 hover:text-white transition-colors text-left"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    Login
                  </button>
                </NavLink>
                <NavLink to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <button
                    className="w-full py-3 px-4 rounded-xl font-medium text-white/80 hover:text-white transition-colors text-left"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    Signup
                  </button>
                </NavLink>
                <NavLink to="/register" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors text-left">
                    Register
                  </button>
                </NavLink>
              </>
            )}
          </li>
        </ul>
        </div>
      </div>
    </>
  );
}

export default Navbar;
