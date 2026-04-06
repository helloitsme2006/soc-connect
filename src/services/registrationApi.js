// Registration-specific API functions for university, college, and society flows
const BASE = import.meta.env.VITE_API_BASE_URL;

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/** Send OTP to email for the given role (university | college | society) */
export async function sendRegistrationOTP({ email, role }) {
  return request("/api/v1/register/otp/send", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

/** Verify OTP */
export async function verifyRegistrationOTP({ email, otp, role }) {
  return request("/api/v1/register/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp, role }),
  });
}

/** Upload logo to Cloudinary — returns { url } */
export async function uploadRegistrationLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await fetch(`${BASE}/api/v1/register/upload-logo`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
}

/** Register university */
export async function registerUniversity(body) {
  return request("/api/v1/register/university", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Register college */
export async function registerCollege(body) {
  return request("/api/v1/register/college", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Register society */
export async function registerSociety(body) {
  return request("/api/v1/register/society", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ─── College & University Search (server proxy) ──────────────────────── */
async function requestArray(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data.records || data.options || [];
}

let universitiesAllCache = null; // cached full list from the server
let universitiesAllLoaded = false;
let universitiesAllPromise = null;

let collegesAllCache = null; // cached full list from the server
let collegesAllLoaded = false;
let collegesAllPromise = null;
let collegesQuickCache = null; // cached quick list for fast modal open
let collegesQuickLoaded = false;
let collegesQuickPromise = null;

const COLLEGE_DROPDOWN_MAX = 300;
const COLLEGE_SEARCH_MAX = 150;

export async function searchIndianColleges(query) {
  try {
    const q = String(query || "");

    // Load full list once, then filter locally while typing.
    if (q.trim().length === 0) {
      if (collegesAllLoaded && Array.isArray(collegesAllCache)) {
        return collegesAllCache.slice(0, COLLEGE_DROPDOWN_MAX);
      }

      // Kick off full load in background (accuracy for later typing).
      if (!collegesAllPromise && !collegesAllLoaded) {
        const urlFull = `${BASE}/api/v1/register/search/colleges?query=&mode=full`;
        collegesAllPromise = requestArray(urlFull).then((all) => {
          collegesAllCache = all;
          collegesAllLoaded = true;
          collegesAllPromise = null;
          return all;
        }).catch((e) => {
          collegesAllPromise = null;
          throw e;
        });
      }

      // Use quick list for immediate dropdown suggestions.
      if (collegesQuickLoaded && Array.isArray(collegesQuickCache)) {
        return collegesQuickCache.slice(0, COLLEGE_DROPDOWN_MAX);
      }

      if (!collegesQuickPromise) {
        const urlQuick = `${BASE}/api/v1/register/search/colleges?query=&mode=quick`;
        collegesQuickPromise = requestArray(urlQuick).then((quick) => {
          collegesQuickCache = quick;
          collegesQuickLoaded = true;
          collegesQuickPromise = null;
          return quick;
        }).catch((e) => {
          collegesQuickPromise = null;
          throw e;
        });
      }

      const quick = await collegesQuickPromise;
      return Array.isArray(quick) ? quick.slice(0, COLLEGE_DROPDOWN_MAX) : [];
    }

    const qq = q.trim().toLowerCase();
    if (!qq) return [];

    if (collegesAllLoaded && Array.isArray(collegesAllCache)) {
      return collegesAllCache
        .filter((c) => String(c).toLowerCase().includes(qq))
        .slice(0, COLLEGE_SEARCH_MAX);
    }

    // If full cache isn't ready yet, try quick cache first.
    if (collegesQuickLoaded && Array.isArray(collegesQuickCache)) {
      return collegesQuickCache
        .filter((c) => String(c).toLowerCase().includes(qq))
        .slice(0, COLLEGE_SEARCH_MAX);
    }

    // Ensure quick cache exists (fast). Start full load in background for later.
    if (!collegesAllPromise && !collegesAllLoaded) {
      const urlFull = `${BASE}/api/v1/register/search/colleges?query=&mode=full`;
      collegesAllPromise = requestArray(urlFull).then((all) => {
        collegesAllCache = all;
        collegesAllLoaded = true;
        collegesAllPromise = null;
        return all;
      }).catch((e) => {
        collegesAllPromise = null;
        throw e;
      });
    }

    if (!collegesQuickPromise) {
      const urlQuick = `${BASE}/api/v1/register/search/colleges?query=&mode=quick`;
      collegesQuickPromise = requestArray(urlQuick).then((quick) => {
        collegesQuickCache = quick;
        collegesQuickLoaded = true;
        collegesQuickPromise = null;
        return quick;
      }).catch((e) => {
        collegesQuickPromise = null;
        throw e;
      });
    }

    const quick = await collegesQuickPromise;
    return Array.isArray(quick)
      ? quick.filter((c) => String(c).toLowerCase().includes(qq)).slice(0, COLLEGE_SEARCH_MAX)
      : [];
  } catch {
    return [];
  }
}

export async function searchIndianUniversities(query) {
  try {
    const q = String(query || "");

    // Load full list once (triggered by dropdown open with empty input), then filter locally.
    if (q.trim().length === 0) {
      if (universitiesAllLoaded && Array.isArray(universitiesAllCache)) return universitiesAllCache;
      if (!universitiesAllPromise) {
        const url = `${BASE}/api/v1/register/search/universities?query=`;
        universitiesAllPromise = requestArray(url).then((all) => {
          universitiesAllCache = all;
          universitiesAllLoaded = true;
          universitiesAllPromise = null;
          return all;
        }).catch((e) => {
          universitiesAllPromise = null;
          throw e;
        });
      }
      return await universitiesAllPromise;
    }

    if (universitiesAllLoaded && Array.isArray(universitiesAllCache)) {
      const qq = q.trim().toLowerCase();
      if (!qq) return universitiesAllCache;
      // Keep server-provided order (already sorted) by filtering without resorting.
      return universitiesAllCache.filter((u) => String(u).toLowerCase().includes(qq));
    }

    // If cache isn't ready yet, load full list then filter locally.
    if (!universitiesAllPromise) {
      const url = `${BASE}/api/v1/register/search/universities?query=`;
      universitiesAllPromise = requestArray(url).then((all) => {
        universitiesAllCache = all;
        universitiesAllLoaded = true;
        universitiesAllPromise = null;
        return all;
      }).catch((e) => {
        universitiesAllPromise = null;
        throw e;
      });
    }

    const all = await universitiesAllPromise;
    const qq = q.trim().toLowerCase();
    if (!qq) return all;
    return all.filter((u) => String(u).toLowerCase().includes(qq));
  } catch {
    return [];
  }
}

export async function searchDatabaseSocieties(query) {
  try {
    const q = String(query || "");
    const url = `${BASE}/api/v1/register/search/database-societies`;
    const records = await requestArray(url);
    const qq = q.trim().toLowerCase();
    if (!qq) return records;
    return records.filter((s) => String(s).toLowerCase().includes(qq));
  } catch {
    return [];
  }
}

export async function searchDatabaseDepartments(societyName) {
  try {
    if (!societyName) return [];
    const url = `${BASE}/api/v1/register/search/database-departments?societyName=${encodeURIComponent(societyName)}`;
    return await requestArray(url);
  } catch {
    return [];
  }
}
