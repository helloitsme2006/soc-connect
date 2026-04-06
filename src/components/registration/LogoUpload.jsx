import { useState, useCallback } from "react";
import { uploadRegistrationLogo } from "../../services/registrationApi";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

export default function LogoUpload({ value, onChange, label = "Logo" }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setError("");
      setUploading(true);
      try {
        const data = await uploadRegistrationLogo(file);
        onChange(data.url);
      } catch (err) {
        setError(err.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onInputChange = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${dragging ? "border-indigo-400 bg-indigo-500/10" : value ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/15 bg-white/3 hover:border-white/25 hover:bg-white/5"}`}
        style={{ minHeight: "140px" }}
        onClick={() => document.getElementById("logo-upload-input").click()}
      >
        <input
          id="logo-upload-input"
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs text-gray-400">Uploading…</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="relative">
              <img
                src={value}
                alt="Logo preview"
                className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <span className="text-xs text-gray-400">Click or drag to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-1">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-300 font-medium">Drop your logo here</p>
            <p className="text-xs text-gray-500">or click to browse · PNG, JPG, WebP, SVG</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
