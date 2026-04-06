import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Search, X } from "lucide-react";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Searchable dropdown with async suggestions.
 * Props:
 *   value (string) - current input value
 *   onChange (fn) - called with selected string
 *   fetchOptions (async fn) - receives query string, returns string[]
 *   placeholder (string)
 *   label (string)
 *   id (string)
 *   required (bool)
 */
export default function SearchableDropdown({
  value,
  onChange,
  fetchOptions,
  placeholder = "Search or type…",
  label,
  id,
  required = false,
  minChars = 2,
  fetchOnEmpty = false,
  maxOptions = 500,
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(inputValue, 350);
  const ref = useRef(null);

  // Sync external value change
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Fetch on debounced change
  useEffect(() => {
    if (!debouncedQuery) {
      if (!fetchOnEmpty) {
        setOptions([]);
        return;
      }
    } else if (debouncedQuery.length < minChars) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOptions(debouncedQuery)
      .then((res) => { if (!cancelled) setOptions((res || []).slice(0, maxOptions)); })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, fetchOptions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = useCallback(
    (opt) => {
      setInputValue(opt);
      onChange(opt);
      setOpen(false);
    },
    [onChange]
  );

  const clear = (e) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
    setOptions([]);
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label} {required && "*"}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Search size={15} />
        </div>
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => {
            if (fetchOnEmpty && inputValue.length === 0) setOpen(true);
            else if (inputValue.length >= minChars) setOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#1e1e30] border border-white/10 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="w-3.5 h-3.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
          )}
          {inputValue && !loading && (
            <button type="button" onClick={clear} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X size={14} />
            </button>
          )}
          {!inputValue && <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </div>

      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ background: "#1e1e30" }}>
          <ul className="max-h-56 overflow-y-auto divide-y divide-white/5">
            {options.map((opt, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => select(opt)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-indigo-500/15 hover:text-white transition-colors"
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && !loading && (
        (inputValue.length >= minChars && options.length === 0) ||
        (fetchOnEmpty && inputValue.length === 0 && options.length === 0)
      ) && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-500 shadow-2xl"
          style={{ background: "#1e1e30" }}>
          No results found — you can still type a custom value.
        </div>
      )}
    </div>
  );
}
