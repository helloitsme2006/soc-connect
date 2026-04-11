import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  getFacultyContext,
  updateFacultySocietyDetails,
  getFacultyCoreMembers,
  addFacultyCoreMember,
  updateFacultyCoreMember,
  deleteFacultyCoreMember,
  getFacultyHeadMembers,
  addFacultyHeadMember,
  updateFacultyHeadMember,
  deleteFacultyHeadMember,
} from "../services/api";

const DEFAULT_CORE_POSITION_OPTIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Joint Secretary",
  "Treasurer",
  "Secretary",
];

const DEFAULT_HEAD_POSITION_OPTIONS = [
  "Technical Lead",
  "Technical Head",
  "Event Lead",
  "Event Head",
  "Design Lead",
  "Design Head",
  "Content Lead",
  "Content Head",
  "PR Lead",
  "PR Head",
  "Marketing Lead",
  "Marketing Head",
  "Outreach Lead",
  "Outreach Head",
  "Operations Lead",
  "Operations Head",
];

function MIcon({ name, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}

function headRowIcon(position) {
  const p = position.toLowerCase();
  if (p.includes("technical") || p.includes("dev")) return "code";
  if (p.includes("event")) return "celebration";
  if (p.includes("market") || p.includes("pr") || p.includes("outreach")) return "campaign";
  if (p.includes("design")) return "palette";
  if (p.includes("content")) return "article";
  return "groups";
}

function fieldClass(disabled) {
  return `w-full rounded-xl border border-[#484847]/80 bg-[#131313] px-4 py-3 text-sm text-white placeholder-[#767575] outline-none transition focus:border-[#89acff]/50 ${
    disabled ? "opacity-60 cursor-not-allowed" : ""
  }`;
}

/** Core role card — no decorative icons on the role header (per product request). */
function CoreLeadershipCard({ position, member, isExtra, compact, onAssign, onEdit, onRemove }) {
  const filled = Boolean(member?.email);
  const pad = compact ? "p-3" : "p-4 sm:p-5";
  const ring = isExtra ? "border-[#cb7bff]/25" : filled ? "border-[#89acff]/30" : "border-[#484847]/15";
  const bg = isExtra
    ? "bg-gradient-to-br from-[#1a1919] to-[#cb7bff]/[0.07]"
    : filled
      ? "bg-gradient-to-br from-[#1a1919] to-[#89acff]/[0.06]"
      : "bg-[#1a1919]";
  const titleCls = isExtra ? "text-[#cb7bff]" : "text-[#adaaaa]";
  const av = compact ? "w-9 h-9 min-w-[2.25rem] text-xs" : "w-11 h-11 min-w-[2.75rem] text-sm";
  const borderAv = isExtra ? "border-[#cb7bff] text-[#cb7bff]" : "border-[#89acff] text-[#89acff]";
  const titleSize = compact ? "text-[9px] tracking-[0.12em]" : "text-[10px] tracking-[0.15em]";

  return (
    <div className={`rounded-xl border transition-colors ${pad} ${ring} ${bg} ${!filled && !isExtra ? "hover:border-[#89acff]/35" : ""}`}>
      <h4 className={`${titleCls} uppercase font-black ${titleSize} mb-2 sm:mb-3 leading-tight`}>{position}</h4>
      {filled ? (
        <div className={`flex items-center gap-2 ${compact ? "" : "gap-3"}`}>
          <div
            className={`rounded-full bg-[#262626] border-2 flex items-center justify-center font-bold ${av} ${borderAv}`}
          >
            {(member.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-white truncate ${compact ? "text-[11px]" : "text-sm"}`}>{member.email}</p>
            <p className={`text-[#adaaaa] truncate ${compact ? "text-[9px]" : "text-xs"}`}>
              {isExtra ? "Additional role" : "Configured"}
            </p>
          </div>
          <div className={`flex shrink-0 ${compact ? "gap-0.5" : "gap-1"}`}>
            <button
              type="button"
              onClick={() => onEdit(member)}
              className={`rounded-full hover:bg-[#2c2c2c] text-[#adaaaa] hover:text-white transition-colors ${compact ? "p-1.5" : "p-2"}`}
              title="Edit"
            >
              <MIcon name="edit" className={compact ? "text-base" : "text-lg"} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className={`rounded-full hover:bg-[#a70138]/15 text-[#ff6e84] transition-colors ${compact ? "p-1.5" : "p-2"}`}
              title="Remove"
            >
              <MIcon name="delete" className={compact ? "text-base" : "text-lg"} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAssign(position)}
          className="w-full flex items-center gap-2 text-left group rounded-lg hover:bg-white/[0.03] -m-1 p-1 transition-colors"
        >
          <div
            className={`rounded-full bg-[#262626] border-2 border-dashed border-[#484847] flex items-center justify-center group-hover:border-[#739eff] transition-colors shrink-0 ${av}`}
          >
            <MIcon name="add" className="text-[#adaaaa] text-lg" />
          </div>
          <div className="min-w-0">
            <p className={`text-[#adaaaa] ${compact ? "text-[11px]" : "text-sm"}`}>Assign</p>
            <p className={`text-[#767575] italic ${compact ? "text-[9px]" : "text-xs"}`}>No email yet</p>
          </div>
        </button>
      )}
    </div>
  );
}

export default function FacultyDashboard() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const societyFormRef = useRef(null);

  const [facultyContext, setFacultyContext] = useState({
    societyName: user?.facultyContext?.societyName || "",
    collegeName: user?.facultyContext?.collegeName || "",
    logoUrl: user?.facultyContext?.logoUrl || "",
    category: user?.facultyContext?.category || "",
    description: user?.facultyContext?.description || "",
  });
  const [contextLoading, setContextLoading] = useState(false);

  const [facultyName, setFacultyName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Faculty Incharge"
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [societyNameInput, setSocietyNameInput] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const fileInputRef = useRef(null);

  const [coreMembers, setCoreMembers] = useState([]);
  const [coreLoading, setCoreLoading] = useState(false);
  const [memberPosition, setMemberPosition] = useState("");
  const [positionQuery, setPositionQuery] = useState("");
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);

  const [headMembers, setHeadMembers] = useState([]);
  const [headLoading, setHeadLoading] = useState(false);
  const [headPosition, setHeadPosition] = useState("");
  const [headPositionQuery, setHeadPositionQuery] = useState("");
  const [showHeadPositionDropdown, setShowHeadPositionDropdown] = useState(false);
  const [headEmail, setHeadEmail] = useState("");
  const [editingHeadMemberId, setEditingHeadMemberId] = useState(null);
  const [coreModalOpen, setCoreModalOpen] = useState(false);

  const societyName = facultyContext.societyName || "—";
  const collegeName = facultyContext.collegeName || "—";
  const facultyEmail = user?.email || "—";

  useEffect(() => {
    if (!logoPreview && facultyContext.logoUrl) {
      setLogoPreview(facultyContext.logoUrl);
    }
  }, [facultyContext.logoUrl, logoPreview]);

  useEffect(() => {
    if (!description) setDescription(facultyContext.description || "");
    if (!category) setCategory(facultyContext.category || "");
    if (!societyNameInput) setSocietyNameInput(facultyContext.societyName || "");
  }, [facultyContext.description, facultyContext.category, facultyContext.societyName, description, category, societyNameInput]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setContextLoading(true);
        const data = await getFacultyContext();
        if (!cancelled) {
          setFacultyContext({
            societyName: data?.societyName || "",
            collegeName: data?.collegeName || "",
            logoUrl: data?.logoUrl || "",
            category: data?.category || "",
            description: data?.description || "",
          });
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCore = async () => {
      try {
        setCoreLoading(true);
        const res = await getFacultyCoreMembers();
        if (!cancelled) {
          const rows = Array.isArray(res?.data) ? res.data : [];
          setCoreMembers(
            rows.map((m, idx) => ({
              id: String(m?.id || m?.position || idx),
              position: m?.position || "",
              email: m?.email || "",
            }))
          );
        }
      } catch {
        if (!cancelled) setCoreMembers([]);
      } finally {
        if (!cancelled) setCoreLoading(false);
      }
    };
    loadCore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadHeads = async () => {
      try {
        setHeadLoading(true);
        const res = await getFacultyHeadMembers();
        if (!cancelled) {
          const rows = Array.isArray(res?.data) ? res.data : [];
          setHeadMembers(
            rows.map((m, idx) => ({
              id: String(m?.id || m?.position || idx),
              position: m?.position || "",
              email: m?.email || "",
            }))
          );
        }
      } catch {
        if (!cancelled) setHeadMembers([]);
      } finally {
        if (!cancelled) setHeadLoading(false);
      }
    };
    loadHeads();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogoUpload = (file) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file.");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSocietyDetails = async (e) => {
    e.preventDefault();
    if (!isEditingDetails) return;
    if (!category) {
      toast.error("Please select a Society Category.");
      return;
    }
    if (!logoPreview) {
      toast.error("Please upload a Society Logo.");
      return;
    }
    if (!facultyName.trim()) {
      toast.error("Faculty name is required.");
      return;
    }
    if (!societyNameInput.trim()) {
      toast.error("Society name is missing.");
      return;
    }
    try {
      setIsSavingDetails(true);
      const res = await updateFacultySocietyDetails({
        societyName: societyNameInput.trim(),
        category,
        description: description.trim(),
        facultyName: facultyName.trim(),
        logoFile,
      });
      const ctx = res?.data?.context || {};
      setFacultyContext((prev) => ({
        ...prev,
        societyName: ctx.societyName || prev.societyName,
        collegeName: ctx.collegeName || prev.collegeName,
        logoUrl: ctx.logoUrl || prev.logoUrl,
        category: ctx.category || category,
        description: ctx.description || description,
      }));
      setLogoPreview(ctx.logoUrl || logoPreview);
      setSocietyNameInput(ctx.societyName || societyNameInput);
      setLogoFile(null);
      setUser((prev) => {
        if (!prev) return prev;
        const fullName = (res?.data?.facultyName || facultyName).trim();
        const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
        return {
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: rest.join(" ") || prev.lastName,
          facultyContext: {
            ...(prev.facultyContext || {}),
            ...ctx,
          },
        };
      });
      setIsEditingDetails(false);
      toast.success("Society details saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to save details.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberPosition.trim() || !memberEmail.trim()) {
      toast.error("Please provide both position and email to add a member.");
      return;
    }

    try {
      if (editingMemberId) {
        const res = await updateFacultyCoreMember(editingMemberId, {
          position: memberPosition.trim(),
          email: memberEmail.trim(),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setCoreMembers(
          rows.map((m, idx) => ({
            id: String(m?.id || m?.position || idx),
            position: m?.position || "",
            email: m?.email || "",
          }))
        );
        toast.success("Member updated successfully!");
        setEditingMemberId(null);
      } else {
        const res = await addFacultyCoreMember({
          position: memberPosition.trim(),
          email: memberEmail.trim(),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setCoreMembers(
          rows.map((m, idx) => ({
            id: String(m?.id || m?.position || idx),
            position: m?.position || "",
            email: m?.email || "",
          }))
        );
        toast.success(`Added ${memberPosition.trim()} successfully!`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save core member.");
      return;
    }

    setMemberPosition("");
    setPositionQuery("");
    setMemberEmail("");
  };

  const handleEditMember = (member) => {
    setMemberPosition(member.position);
    setPositionQuery(member.position);
    setMemberEmail(member.email);
    setEditingMemberId(member.id);
    document.getElementById("core-assign-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRemoveMember = async (id) => {
    try {
      const res = await deleteFacultyCoreMember(id);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setCoreMembers(
        rows.map((m, idx) => ({
          id: String(m?.id || m?.position || idx),
          position: m?.position || "",
          email: m?.email || "",
        }))
      );
      toast.success("Member removed.");
      if (editingMemberId === id) {
        setEditingMemberId(null);
        setMemberPosition("");
        setPositionQuery("");
        setMemberEmail("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove member.");
    }
  };

  const handleAddHeadMember = async (e) => {
    e.preventDefault();
    if (!headPosition.trim() || !headEmail.trim()) {
      toast.error("Please provide both position and email to add a head member.");
      return;
    }

    try {
      if (editingHeadMemberId) {
        const res = await updateFacultyHeadMember(editingHeadMemberId, {
          position: headPosition.trim(),
          email: headEmail.trim(),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setHeadMembers(
          rows.map((m, idx) => ({
            id: String(m?.id || m?.position || idx),
            position: m?.position || "",
            email: m?.email || "",
          }))
        );
        toast.success("Head member updated successfully!");
        setEditingHeadMemberId(null);
      } else {
        const res = await addFacultyHeadMember({
          position: headPosition.trim(),
          email: headEmail.trim(),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setHeadMembers(
          rows.map((m, idx) => ({
            id: String(m?.id || m?.position || idx),
            position: m?.position || "",
            email: m?.email || "",
          }))
        );
        toast.success(`Added ${headPosition.trim()} successfully!`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save head member.");
      return;
    }

    setHeadPosition("");
    setHeadPositionQuery("");
    setHeadEmail("");
  };

  const handleEditHeadMember = (member) => {
    setHeadPosition(member.position);
    setHeadPositionQuery(member.position);
    setHeadEmail(member.email);
    setEditingHeadMemberId(member.id);
    document.getElementById("head-assign-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRemoveHeadMember = async (id) => {
    try {
      const res = await deleteFacultyHeadMember(id);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setHeadMembers(
        rows.map((m, idx) => ({
          id: String(m?.id || m?.position || idx),
          position: m?.position || "",
          email: m?.email || "",
        }))
      );
      toast.success("Head member removed.");
      if (editingHeadMemberId === id) {
        setEditingHeadMemberId(null);
        setHeadPosition("");
        setHeadPositionQuery("");
        setHeadEmail("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to remove head member.");
    }
  };

  const availablePositionOptions = Array.from(
    new Set([...DEFAULT_CORE_POSITION_OPTIONS, ...coreMembers.map((m) => m.position).filter(Boolean)])
  );

  const filteredPositions = availablePositionOptions.filter((position) =>
    position.toLowerCase().includes(positionQuery.trim().toLowerCase())
  );

  const availableHeadPositionOptions = Array.from(
    new Set([...DEFAULT_HEAD_POSITION_OPTIONS, ...headMembers.map((m) => m.position).filter(Boolean)])
  );

  const filteredHeadPositions = availableHeadPositionOptions.filter((position) =>
    position.toLowerCase().includes(headPositionQuery.trim().toLowerCase())
  );

  const restoreSocietyDetailsForm = () => {
    setSocietyNameInput(facultyContext.societyName || "");
    setCategory(facultyContext.category || "");
    setDescription(facultyContext.description || "");
    setFacultyName(
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Faculty Incharge"
    );
    setLogoPreview(facultyContext.logoUrl || null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const categoryDisplayLabel =
    category === "tech" ? "Technical" : category === "non-tech" ? "Non-technical" : "—";

  const handleToggleEditDetails = () => {
    if (isEditingDetails) {
      restoreSocietyDetailsForm();
      setIsEditingDetails(false);
    } else {
      restoreSocietyDetailsForm();
      setIsEditingDetails(true);
    }
  };

  const assignCoreSlot = (position) => {
    setMemberPosition(position);
    setPositionQuery(position);
    setMemberEmail("");
    setEditingMemberId(null);
    document.getElementById("core-assign-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const coreSlots = DEFAULT_CORE_POSITION_OPTIONS.map((position) => ({
    position,
    member: coreMembers.find((m) => m.position.toLowerCase() === position.toLowerCase()),
  }));

  const extraCoreMembers = coreMembers.filter(
    (m) => !DEFAULT_CORE_POSITION_OPTIONS.some((p) => p.toLowerCase() === m.position.toLowerCase())
  );

  /** Cards only for roles that already have an email — empty slots stay off the strip. */
  const assignedCoreCardItems = [
    ...coreSlots
      .filter(({ member }) => Boolean(member?.email))
      .map(({ position, member }) => ({
        key: `slot-${position}`,
        position,
        member,
        isExtra: false,
      })),
    ...extraCoreMembers
      .filter((m) => Boolean(m?.email))
      .map((member) => ({
        key: member.id,
        position: member.position,
        member,
        isExtra: true,
      })),
  ];

  const navLink = (to, icon, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[#adaaaa] hover:bg-[#201f1f] hover:text-white transition-all duration-200 ${
          active ? "bg-[#89acff]/10 text-[#89acff] border-r-4 border-[#89acff] rounded-l-xl rounded-r-none font-bold" : ""
        }`}
      >
        <MIcon name={icon} className={active ? "text-[#89acff]" : ""} filled={active} />
        <span>{label}</span>
      </Link>
    );
  };

  const handleFabClick = () => {
    if (isEditingDetails) {
      societyFormRef.current?.requestSubmit();
    } else {
      setIsEditingDetails(true);
      document.getElementById("society-identity")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const displaySocietyName = (societyNameInput || facultyContext.societyName || "").trim() || "Your society";
  const subtitle =
    (description || facultyContext.description || "").trim().slice(0, 120) ||
    "Configure identity, core leadership, and department heads.";

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-manrope antialiased selection:bg-[#89acff]/30">
      <aside className="hidden md:flex fixed left-0 top-[5.25rem] bottom-0 w-64 z-40 flex-col py-8 bg-[#131313] font-faculty text-sm border-r border-[#262626]/80">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#739eff] rounded-lg flex items-center justify-center">
            <MIcon name="dataset" className="text-[#002053] text-[22px] leading-none" filled />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">SocConnect</h2>
            <p className="text-[10px] uppercase tracking-widest text-[#adaaaa] mt-0.5">Faculty console</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navLink("/faculty-dashboard", "dashboard", "Society setup")}
          {navLink("/", "home", "Home")}
          {navLink("/manage-society", "group", "Members")}
          {navLink("/events", "calendar_month", "Events")}
          {navLink("/uploadevent/upload", "upload", "Upload event")}
        </nav>
        <div className="px-3 mt-auto">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 text-[#adaaaa] hover:bg-[#201f1f] hover:text-white rounded-xl transition-all"
          >
            <MIcon name="person" />
            <span>Profile</span>
          </Link>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen bg-[#0e0e0e]">
        <header className="sticky top-[4.75rem] z-30 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#484847]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between gap-4 font-faculty">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#89acff] truncate">Society setup</h1>
              <span className="hidden sm:inline h-6 w-px bg-[#484847]/40" />
              <p className="hidden sm:block text-xs text-[#adaaaa] truncate">
                {contextLoading ? "Syncing…" : societyName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleEditDetails}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-[#484847]/60 text-xs font-bold text-white hover:bg-[#2c2c2c] transition-colors active:scale-[0.98]"
            >
              <MIcon name={isEditingDetails ? "close" : "edit"} className="text-base" />
              {isEditingDetails ? "Cancel edit" : "Edit identity"}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-10 pb-32">
          {/* Society identity */}
          <section id="society-identity" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 className="font-faculty text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                    Society identity
                  </h2>
                  <p className="text-[#adaaaa] text-sm mt-1">{subtitle}</p>
                </div>
                <span className="self-start px-4 py-1.5 bg-[#3fff8b]/15 text-[#b5ffc2] text-xs font-bold rounded-full uppercase tracking-widest border border-[#3fff8b]/20">
                  Active
                </span>
              </div>

              {!isEditingDetails ? (
                <div className="bg-[#1a1919] rounded-2xl p-6 sm:p-8 border border-[#484847]/15 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#89acff]/5 rounded-full blur-3xl group-hover:bg-[#89acff]/10 transition-colors duration-500 pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-[#201f1f] border border-[#484847]/50 flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview || facultyContext.logoUrl ? (
                        <img src={logoPreview || facultyContext.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <MIcon name="apartment" className="text-5xl text-[#89acff]" filled />
                      )}
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div>
                        <h3 className="font-faculty text-3xl sm:text-4xl font-extrabold text-white">{displaySocietyName}</h3>
                        <p className="text-[#739eff] font-medium mt-1 text-sm">{collegeName}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-[#484847]/15">
                          <p className="text-xs text-[#adaaaa] uppercase tracking-wider mb-1">Affiliation</p>
                          <p className="text-sm font-semibold">{collegeName}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-[#484847]/15">
                          <p className="text-xs text-[#adaaaa] uppercase tracking-wider mb-1">Category</p>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#89acff]/15 text-[#739eff] text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#89acff]" />
                            {categoryDisplayLabel}
                          </span>
                        </div>
                      </div>
                      {(description || facultyContext.description || "").trim() ? (
                        <p className="text-sm text-[#adaaaa] leading-relaxed whitespace-pre-wrap">
                          {(description || facultyContext.description).trim()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  ref={societyFormRef}
                  onSubmit={handleSaveSocietyDetails}
                  className="bg-[#1a1919] rounded-2xl p-6 sm:p-8 border border-[#484847]/15 space-y-5"
                >
                  <div>
                    <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Society name</label>
                    <input
                      className={`mt-1 ${fieldClass(false)}`}
                      value={societyNameInput}
                      onChange={(e) => setSocietyNameInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Logo</label>
                      <div
                        className={`mt-1 flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                          isDragOver ? "border-[#89acff] bg-[#89acff]/5" : "border-[#484847]/40 bg-[#131313]"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          handleLogoUpload(e.dataTransfer.files?.[0]);
                        }}
                      >
                        <div className="w-16 h-16 rounded-lg bg-[#201f1f] border border-[#484847]/50 overflow-hidden shrink-0 relative group">
                          {logoPreview ? (
                            <>
                              <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={clearLogo}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#767575]">
                              <MIcon name="image" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-lg text-xs font-bold border border-[#89acff]/40 text-[#89acff] hover:bg-[#89acff]/10 transition-colors"
                          >
                            Choose file
                          </button>
                          <p className="text-[10px] text-[#767575] mt-1">Or drop an image here</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Category</label>
                      <select
                        className={`mt-1 ${fieldClass(false)} appearance-none`}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        <option value="tech">Tech</option>
                        <option value="non-tech">Non-tech</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Faculty name</label>
                    <input
                      className={`mt-1 ${fieldClass(false)}`}
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Description</label>
                    <textarea
                      className={`mt-1 ${fieldClass(false)} resize-none min-h-[100px]`}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingDetails}
                    className="w-full py-3.5 rounded-xl bg-[#89acff] text-[#002b6a] font-bold text-sm hover:bg-[#739eff] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSavingDetails ? (
                      <>
                        <span className="h-4 w-4 border-2 border-[#002b6a]/30 border-t-[#002b6a] rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <MIcon name="save" />
                        Save identity
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-[#131313] rounded-2xl p-6 border border-[#484847]/15 flex flex-col h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#cb7bff]/15 flex items-center justify-center">
                  <MIcon name="school" className="text-[#cb7bff]" />
                </div>
                <h3 className="font-faculty font-bold text-lg">Faculty in-charge</h3>
              </div>
              <div className="space-y-4 flex-1">
                <div className="p-4 bg-[#262626]/40 rounded-xl border border-[#484847]/10">
                  <p className="text-xs text-[#adaaaa] mb-1">Official email</p>
                  <p className="text-sm font-medium break-all">{facultyEmail}</p>
                </div>
                <div className="p-4 bg-[#262626]/40 rounded-xl border border-[#484847]/10">
                  <p className="text-xs text-[#adaaaa] mb-1">Display name</p>
                  <p className="text-sm font-medium">{facultyName || "—"}</p>
                </div>
              </div>
              <p className="text-[10px] text-[#767575] mt-4 leading-relaxed">
                {contextLoading ? "Refreshing context…" : "Details stay in sync with your faculty registration."}
              </p>
            </div>
          </section>

          {/* Core leadership — one bordered panel; form left, assigned roles right (one card per row) */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#484847]/35 bg-[#131313] overflow-hidden">
              <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-[#484847]/25">
                <h2 className="font-faculty text-2xl sm:text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                  Core leadership
                </h2>
                <p className="text-[#adaaaa] text-sm mt-1">
                  Manage assignments on the left; assigned roles are listed on the right.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-stretch">
                <div
                  id="core-assign-form"
                  className="w-full lg:w-[42%] lg:max-w-md xl:max-w-lg shrink-0 p-5 sm:p-8 lg:border-r border-[#484847]/25 bg-[#1a1919]/50"
                >
                  <h3 className="font-faculty font-bold text-lg mb-1 flex items-center gap-2 text-white">
                    <MIcon name="person_add" className="text-[#89acff]" />
                    {editingMemberId ? "Update core assignment" : "Add core assignment"}
                  </h3>
                  <p className="text-xs text-[#adaaaa] mb-4">Position must match a core role. Email must be allowed for signup.</p>
                  <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Position</label>
                      <input
                        className={`mt-1 ${fieldClass(false)}`}
                        placeholder="Search or type…"
                        value={positionQuery}
                        onFocus={() => setShowPositionDropdown(true)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPositionQuery(v);
                          setMemberPosition(v);
                          setShowPositionDropdown(true);
                        }}
                      />
                      {showPositionDropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowPositionDropdown(false)} />
                          <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-[#484847]/40 bg-[#131313] shadow-xl custom-scrollbar">
                            {filteredPositions.map((position) => (
                              <button
                                key={position}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#201f1f] text-white"
                                onClick={() => {
                                  setMemberPosition(position);
                                  setPositionQuery(position);
                                  setShowPositionDropdown(false);
                                }}
                              >
                                {position}
                              </button>
                            ))}
                            {positionQuery.trim() &&
                              !availablePositionOptions.some((p) => p.toLowerCase() === positionQuery.trim().toLowerCase()) && (
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm border-t border-[#484847]/30 text-[#89acff] hover:bg-[#201f1f]"
                                  onClick={() => {
                                    const c = positionQuery.trim();
                                    setMemberPosition(c);
                                    setPositionQuery(c);
                                    setShowPositionDropdown(false);
                                  }}
                                >
                                  Use &quot;{positionQuery.trim()}&quot;
                                </button>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        className={`mt-1 ${fieldClass(false)}`}
                        placeholder="member@college.edu"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#89acff] text-[#002b6a] font-bold text-sm hover:bg-[#739eff] transition-colors flex items-center justify-center gap-2"
                      >
                        <MIcon name="check_circle" />
                        {editingMemberId ? "Update" : "Save assignment"}
                      </button>
                      {editingMemberId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemberId(null);
                            setMemberPosition("");
                            setPositionQuery("");
                            setMemberEmail("");
                          }}
                          className="px-6 py-3 rounded-xl border border-[#484847] text-sm font-bold hover:bg-[#2c2c2c] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="flex-1 min-w-0 p-5 sm:p-8 space-y-4">
                  {coreLoading ? (
                    <p className="text-sm text-[#adaaaa]">Loading core roles…</p>
                  ) : assignedCoreCardItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#484847]/40 bg-[#1a1919]/40 px-4 py-10 text-center">
                      <p className="text-sm text-[#adaaaa]">No core roles assigned yet.</p>
                      <p className="text-xs text-[#767575] mt-2">Add a position and email using the form on the left.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        {assignedCoreCardItems.slice(0, 3).map((item) => (
                          <CoreLeadershipCard
                            key={item.key}
                            position={item.position}
                            member={item.member}
                            isExtra={item.isExtra}
                            compact={false}
                            onAssign={assignCoreSlot}
                            onEdit={handleEditMember}
                            onRemove={handleRemoveMember}
                          />
                        ))}
                      </div>
                      {assignedCoreCardItems.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setCoreModalOpen(true)}
                          className="text-sm font-bold text-[#89acff] hover:text-[#739eff] underline-offset-2 hover:underline"
                        >
                          View all ({assignedCoreCardItems.length})
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {coreModalOpen && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="core-modal-title"
              onClick={() => setCoreModalOpen(false)}
            >
              <div
                className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-[#484847]/40 bg-[#131313] shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#484847]/30 shrink-0">
                  <h3 id="core-modal-title" className="font-faculty font-bold text-lg text-white">
                    All assigned core roles ({assignedCoreCardItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCoreModalOpen(false)}
                    className="p-2 rounded-xl text-[#adaaaa] hover:bg-[#2c2c2c] hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <MIcon name="close" className="text-xl" />
                  </button>
                </div>
                <div className="overflow-y-auto p-5 custom-scrollbar">
                  <div className="flex flex-col gap-3">
                    {assignedCoreCardItems.map((item) => (
                      <CoreLeadershipCard
                        key={item.key}
                        position={item.position}
                        member={item.member}
                        isExtra={item.isExtra}
                        compact={false}
                        onAssign={(pos) => {
                          assignCoreSlot(pos);
                          setCoreModalOpen(false);
                        }}
                        onEdit={(m) => {
                          handleEditMember(m);
                          setCoreModalOpen(false);
                        }}
                        onRemove={handleRemoveMember}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Department heads — one panel; form left 40%, table right 60% */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#484847]/35 bg-[#131313] overflow-hidden">
              <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-[#484847]/25">
                <h2 className="font-faculty text-2xl sm:text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                  Department heads
                </h2>
                <p className="text-[#adaaaa] text-sm mt-1">
                  Leads and heads for verticals (must include “Lead” or “Head”). Add on the left; assignments appear in the table on
                  the right.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-stretch">
                <div
                  id="head-assign-form"
                  className="w-full lg:w-[40%] shrink-0 p-5 sm:p-8 lg:border-r border-[#484847]/25 bg-[#1a1919]/50"
                >
                  <h3 className="font-faculty font-bold text-lg mb-1 flex items-center gap-2 text-white">
                    <MIcon name="groups" className="text-[#cb7bff]" />
                    {editingHeadMemberId ? "Update department head" : "Add department head"}
                  </h3>
                  <p className="text-xs text-[#adaaaa] mb-4">Position must include “Lead” or “Head”.</p>
                  <form onSubmit={handleAddHeadMember} className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Position</label>
                      <input
                        className={`mt-1 ${fieldClass(false)}`}
                        value={headPositionQuery}
                        onFocus={() => setShowHeadPositionDropdown(true)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setHeadPositionQuery(v);
                          setHeadPosition(v);
                          setShowHeadPositionDropdown(true);
                        }}
                        placeholder='e.g. "Technical Lead"'
                      />
                      {showHeadPositionDropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowHeadPositionDropdown(false)} />
                          <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-[#484847]/40 bg-[#131313] shadow-xl custom-scrollbar">
                            {filteredHeadPositions.map((position) => (
                              <button
                                key={position}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#201f1f] text-white"
                                onClick={() => {
                                  setHeadPosition(position);
                                  setHeadPositionQuery(position);
                                  setShowHeadPositionDropdown(false);
                                }}
                              >
                                {position}
                              </button>
                            ))}
                            {headPositionQuery.trim() &&
                              !availableHeadPositionOptions.some((p) => p.toLowerCase() === headPositionQuery.trim().toLowerCase()) && (
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm border-t border-[#484847]/30 text-[#cb7bff] hover:bg-[#201f1f]"
                                  onClick={() => {
                                    const c = headPositionQuery.trim();
                                    setHeadPosition(c);
                                    setHeadPositionQuery(c);
                                    setShowHeadPositionDropdown(false);
                                  }}
                                >
                                  Use &quot;{headPositionQuery.trim()}&quot;
                                </button>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#adaaaa] uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        className={`mt-1 ${fieldClass(false)}`}
                        value={headEmail}
                        onChange={(e) => setHeadEmail(e.target.value)}
                        placeholder="lead@college.edu"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#cb7bff] text-[#360055] font-bold text-sm hover:brightness-110 transition-colors flex items-center justify-center gap-2"
                      >
                        <MIcon name="save" />
                        {editingHeadMemberId ? "Update" : "Save"}
                      </button>
                      {editingHeadMemberId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHeadMemberId(null);
                            setHeadPosition("");
                            setHeadPositionQuery("");
                            setHeadEmail("");
                          }}
                          className="px-6 py-3 rounded-xl border border-[#484847] text-sm font-bold hover:bg-[#2c2c2c] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="w-full lg:w-[60%] min-w-0 p-5 sm:p-8 flex flex-col">
                  <div className="flex-1 rounded-xl border border-[#484847]/15 bg-[#131313] min-h-[12rem] overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 bg-[#262626]/20 border-b border-[#484847]/15 min-w-[520px]">
                      <div className="col-span-5 text-xs font-bold uppercase tracking-widest text-[#767575]">Role</div>
                      <div className="col-span-4 text-xs font-bold uppercase tracking-widest text-[#767575]">Assigned email</div>
                      <div className="col-span-3 text-right text-xs font-bold uppercase tracking-widest text-[#767575]">Actions</div>
                    </div>
                    {headLoading ? (
                      <div className="px-6 py-12 text-center text-[#adaaaa] text-sm">Loading…</div>
                    ) : headMembers.length === 0 ? (
                      <div className="px-6 py-12 text-center text-[#767575] text-sm">
                        No department heads yet. Add a role using the form on the left.
                      </div>
                    ) : (
                      headMembers.map((member) => (
                        <div
                          key={member.id}
                          className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-5 items-center border-b border-[#484847]/10 last:border-0 hover:bg-[#2c2c2c]/30 transition-colors min-w-[520px]"
                        >
                          <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#0f6df3]/10 flex items-center justify-center shrink-0">
                              <MIcon name={headRowIcon(member.position)} className="text-[#5a90ff] text-2xl" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white">{member.position}</p>
                              <p className="text-xs text-[#adaaaa]">Department lead</p>
                            </div>
                          </div>
                          <div className="col-span-12 sm:col-span-4 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#262626] border border-[#484847]/40 flex items-center justify-center text-xs font-bold text-[#89acff] shrink-0">
                              {(member.email || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium truncate">{member.email || "—"}</span>
                          </div>
                          <div className="col-span-12 sm:col-span-3 flex justify-end gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditHeadMember(member)}
                              className="px-4 py-1.5 text-xs font-bold text-[#89acff] hover:bg-[#89acff]/10 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveHeadMember(member.id)}
                              className="p-2 text-[#ff6e84] hover:bg-[#a70138]/10 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <MIcon name="delete" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FAB */}
        <div className="fixed bottom-6 right-4 md:right-10 z-40 flex justify-end pointer-events-none max-w-[calc(100vw-2rem)]">
          <button
            type="button"
            onClick={handleFabClick}
            disabled={isSavingDetails}
            className="pointer-events-auto group relative flex items-center gap-3 bg-white text-black px-6 sm:px-8 py-3.5 rounded-full font-bold shadow-2xl hover:bg-[#739eff] hover:text-[#002966] transition-all duration-300 active:scale-95 disabled:opacity-60 border border-white/20"
          >
            <MIcon name={isEditingDetails ? "rocket_launch" : "edit_calendar"} className="text-xl" />
            <span className="relative z-10 text-sm sm:text-base">
              {isEditingDetails ? (isSavingDetails ? "Saving…" : "Save configuration") : "Edit configuration"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
