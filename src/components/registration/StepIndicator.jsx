// Reusable step progress indicator
export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center gap-0 mb-8 w-full">
      {steps.map((label, i) => {
        const num = i + 1;
        const isCompleted = num < currentStep;
        const isActive = num === currentStep;
        return (
          <div key={num} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    : isActive
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-[0_0_14px_rgba(99,102,241,0.6)] scale-110"
                    : "bg-white/5 border border-white/15 text-white/30"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wide whitespace-nowrap ${
                  isActive ? "text-indigo-300" : isCompleted ? "text-indigo-400/70" : "text-white/25"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-14px] transition-all duration-500"
                style={{
                  background: isCompleted
                    ? "linear-gradient(90deg,rgba(99,102,241,0.9),rgba(168,85,247,0.5))"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
