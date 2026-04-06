import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

// OTP inputs that keep a fixed 6-slot layout (using '_' placeholders),
// so users can backspace without digits shifting positions.
export const OtpInput = ({ value, onChange, disabled }) => {
  const inputs = useRef([]);

  const otpArray = useMemo(() => {
    const str = String(value || "");
    const padded = str.padEnd(6, "_").slice(0, 6);
    return padded.split("");
  }, [value]);

  const firstEmptyIndex = useMemo(() => otpArray.findIndex((c) => c === "_"), [otpArray]);

  useEffect(() => {
    if (inputs.current[0] && !disabled) inputs.current[0].focus();
  }, [disabled]);

  const emitOtp = (arr) => {
    // arr is always length 6 containing digits or '_' placeholders.
    onChange(arr.join(""));
  };

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow only digits (or empty).
    if (!/^\d*$/.test(val)) return;

    const next = [...otpArray];
    next[index] = val ? val.slice(-1) : "_";
    emitOtp(next);

    // Move focus forward on digit entry.
    if (val && index < 5 && !disabled) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key !== "Backspace") return;

    const current = otpArray[index];
    const isEmpty = !current || current === "_";
    if (isEmpty && index > 0 && !disabled) inputs.current[index - 1]?.focus();
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3 py-4">
      {Array.from({ length: 6 }).map((_, i) => {
        const char = otpArray[i];
        const isFilled = char !== "_" && char !== undefined && char !== null;
        const displayVal = isFilled ? char : "";

        return (
          <div key={i} className="relative flex-1">
            <motion.input
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="\\d*"
              maxLength={1}
              value={displayVal}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={disabled}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileFocus={{
                scale: 1.1,
                y: -4,
                borderColor: "#06b6d4", // cyan-500
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-full aspect-square text-center text-2xl font-bold rounded-2xl bg-[#252536]/50 border-2 outline-none transition-all
                ${
                  isFilled
                    ? "border-cyan-500 text-white"
                    : "border-gray-500/30 text-gray-400 focus:bg-[#252536]"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}`}
            />

            {/* Animated Indicator for first empty slot */}
            {firstEmptyIndex === i && !disabled && (
              <motion.div
                layoutId="cursor"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-1 bg-cyan-500 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};