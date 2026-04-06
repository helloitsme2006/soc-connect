const ALL_COLLEGES_2011_2012_RESOURCE_ID = "30461d62-f67e-476d-8587-80a7eae062aa";
// Use the dataset you provided: it contains both `college_name` and `university_name`.
const COLLEGE_RESOURCE_ID = ALL_COLLEGES_2011_2012_RESOURCE_ID;

// Use a server-side env var so the browser never sees the API key.
// You can set this in `server/.env` as: DATA_GOV_API_KEY=...
const DATA_GOV_API_KEY_DEFAULT_FALLBACK = "579b464db66ec23bdd000001d03eb0db3e8945a959e8e06dae7a53f7";
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || DATA_GOV_API_KEY_DEFAULT_FALLBACK;

function buildDataGovResourceUrl(resourceId, { limit, offset, filters } = {}) {
  const urlBase = `https://api.data.gov.in/resource/${resourceId}`;
  const query = [
    `api-key=${encodeURIComponent(DATA_GOV_API_KEY)}`,
    "format=json",
    `limit=${Number(limit ?? 15)}`,
    `offset=${Number(offset ?? 0)}`,
  ];

  if (filters && typeof filters === "object") {
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null || String(v).trim() === "") continue;
      query.push(`filters[${k}]=${encodeURIComponent(v)}`);
    }
  }

  return `${urlBase}?${query.join("&")}`;
}

function sortCi(a, b) {
  return String(a).localeCompare(String(b), "en", { sensitivity: "base" });
}

function stripIdSuffix(name) {
  // Data.gov values look like: "Some College Name (Id: C-12345)"
  return String(name || "")
    .replace(/\s*\(Id:\s*[^)]*\)\s*$/, "")
    .replace(/^[,.\s]+/, "")
    .trim();
}

// Tiny in-memory cache to prevent repeated calls for the same searches.
const universitiesCache = new Map(); // key: q.toLowerCase()
const collegesCache = new Map();
let allUniversitiesLoading = null;
let allCollegesLoading = null;
let allCollegesQuickLoading = null;

async function fetchDataGovResource(url) {
  // Prevent long hangs on slow/unreachable networks.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some APIs are pickier without a user agent header.
        "User-Agent": "SocConnect/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

exports.searchIndianColleges = async (req, res) => {
  try {
    const q = String(req.query.query || "").trim();
    const cacheKey = q.toLowerCase();
    const mode = String(req.query.mode || "full").toLowerCase();

    // For empty query we handle mode-specific caching below.
    if (q.length > 0 && collegesCache.has(cacheKey)) return res.json({ records: collegesCache.get(cacheKey) });

    if (q.length === 0) {
      const ALL_KEY = "__ALL__";
      const QUICK_KEY = "__QUICK__";

      if (mode === "quick") {
        if (collegesCache.has(QUICK_KEY)) return res.json({ records: collegesCache.get(QUICK_KEY) });
        if (allCollegesQuickLoading) {
          const result = await allCollegesQuickLoading;
          return res.json({ records: result });
        }

        allCollegesQuickLoading = (async () => {
          // Quick mode: only fetch first chunk (fast enough for modal open).
          const limit = 5000;
          const offset = 0;
          const names = new Set();

          const url = buildDataGovResourceUrl(COLLEGE_RESOURCE_ID, {
            limit,
            offset,
            filters: {},
          });
          const data = await fetchDataGovResource(url);
          const records = data?.records || [];

          for (const r of records) {
            const raw = r.college_name || r.College_Name || "";
            const cleaned = stripIdSuffix(raw);
            if (cleaned) names.add(cleaned);
          }

          return Array.from(names).filter(Boolean).sort(sortCi);
        })();

        const result = await allCollegesQuickLoading;
        collegesCache.set(QUICK_KEY, result);
        allCollegesQuickLoading = null;
        return res.json({ records: result });
      }

      // FULL mode
      if (collegesCache.has(ALL_KEY)) return res.json({ records: collegesCache.get(ALL_KEY) });

      if (allCollegesLoading) {
        const result = await allCollegesLoading;
        return res.json({ records: result });
      }

      allCollegesLoading = (async () => {
        // Fetch entire dataset once, dedupe college names, and cache.
        // First dropdown open may be slower (but UI should use quick mode).
        const limit = 5000;
        let offset = 0;
        const names = new Set();

        const firstUrl = buildDataGovResourceUrl(COLLEGE_RESOURCE_ID, {
          limit,
          offset,
          filters: {},
        });
        const firstData = await fetchDataGovResource(firstUrl);
        const total = Number(firstData?.total ?? firstData?.count ?? 0);
        const firstRecords = firstData?.records || [];

        for (const r of firstRecords) {
          const raw = r.college_name || r.College_Name || "";
          const cleaned = stripIdSuffix(raw);
          if (cleaned) names.add(cleaned);
        }

        while (offset + limit < total) {
          offset += limit;
          const url = buildDataGovResourceUrl(COLLEGE_RESOURCE_ID, {
            limit,
            offset,
            filters: {},
          });
          const data = await fetchDataGovResource(url);
          const records = data?.records || [];

          for (const r of records) {
            const raw = r.college_name || r.College_Name || "";
            const cleaned = stripIdSuffix(raw);
            if (cleaned) names.add(cleaned);
          }

          if (!records.length) break;
          if (records.length < limit) break; // likely last page
        }

        return Array.from(names).filter(Boolean).sort(sortCi);
      })();

      const result = await allCollegesLoading;
      collegesCache.set(ALL_KEY, result);
      allCollegesLoading = null;
      return res.json({ records: result });
    }

    // Avoid expensive calls for tiny inputs.
    if (q.length < 2) return res.json({ records: [] });

    const url = buildDataGovResourceUrl(COLLEGE_RESOURCE_ID, {
      limit: 15,
      offset: 0,
      filters: { college_name: q },
    });

    const data = await fetchDataGovResource(url);
    const records = (data?.records || [])
      .map((r) => stripIdSuffix(r.College_Name || r.college_name || ""))
      .map((s) => String(s).trim())
      .filter(Boolean);

    const result = Array.from(new Set(records)).sort(sortCi);
    collegesCache.set(cacheKey, result);
    return res.json({ records: result });
  } catch (error) {
    console.error("searchIndianColleges error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to search colleges" });
  }
};

exports.searchIndianUniversities = async (req, res) => {
  try {
    const q = String(req.query.query || "").trim();
    const cacheKey = q.toLowerCase();
    if (universitiesCache.has(cacheKey)) return res.json({ records: universitiesCache.get(cacheKey) });

    if (q.length === 0) {
      const ALL_KEY = "__ALL__";
      if (universitiesCache.has(ALL_KEY)) return res.json({ records: universitiesCache.get(ALL_KEY) });

      if (allUniversitiesLoading) {
        const result = await allUniversitiesLoading;
        return res.json({ records: result });
      }

      allUniversitiesLoading = (async () => {
        // Fetch entire dataset once, dedupe university names, and cache.
        // This is heavier than a normal search, but it avoids incomplete lists on dropdown open.
        const limit = 5000;
        let offset = 0;
        const names = new Set();

        // Fetch first page to learn total.
        const firstUrl = buildDataGovResourceUrl(ALL_COLLEGES_2011_2012_RESOURCE_ID, {
          limit,
          offset,
          filters: {},
        });
        const firstData = await fetchDataGovResource(firstUrl);
        const total = Number(firstData?.total ?? firstData?.count ?? 0);
        const firstRecords = firstData?.records || [];
        for (const r of firstRecords) {
          const raw = r.university_name || r.University_Name || "";
          const cleaned = stripIdSuffix(raw);
          if (cleaned) names.add(cleaned);
        }

        while (offset + limit < total && names.size < 5000) {
          offset += limit;
          const url = buildDataGovResourceUrl(ALL_COLLEGES_2011_2012_RESOURCE_ID, {
            limit,
            offset,
            filters: {},
          });
          const data = await fetchDataGovResource(url);
          const records = data?.records || [];
          for (const r of records) {
            const raw = r.university_name || r.University_Name || "";
            const cleaned = stripIdSuffix(raw);
            if (cleaned) names.add(cleaned);
          }
          if (!records.length) break;
        }

        return Array.from(names).filter(Boolean).sort(sortCi);
      })();

      const result = await allUniversitiesLoading;
      universitiesCache.set(ALL_KEY, result);
      universitiesCache.set(cacheKey, result); // keep '' consistent
      allUniversitiesLoading = null;
      return res.json({ records: result });
    }

    // Non-empty query: filter by university_name and return a small suggestion list.
    const limit = 50;
    const url = buildDataGovResourceUrl(ALL_COLLEGES_2011_2012_RESOURCE_ID, {
      limit,
      offset: 0,
      filters: { university_name: q },
    });

    const data = await fetchDataGovResource(url);
    const records = data?.records || [];
    const names = records
      .map((r) => stripIdSuffix(r.university_name || r.University_Name || ""))
      .map((s) => String(s).trim())
      .filter(Boolean);

    const result = Array.from(new Set(names)).sort(sortCi);
    universitiesCache.set(cacheKey, result);
    return res.json({ records: result });
  } catch (error) {
    console.error("searchIndianUniversities error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to search universities" });
  }
};

