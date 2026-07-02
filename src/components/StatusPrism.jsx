import React from "react";

const statuses = {
  normal: {
    label: "Normal",
    glassColor: "bg-emerald-500/30 dark:bg-emerald-500/20",
    borderColor: "border-emerald-400/50",
    textColor: "text-emerald-900 dark:text-emerald-200",
    rot: 0,
  },
  warning: {
    label: "Warning",
    glassColor: "bg-amber-500/30 dark:bg-amber-500/20",
    borderColor: "border-amber-400/50",
    textColor: "text-amber-900 dark:text-amber-200",
    rot: 120,
  },
  critical: {
    label: "Critical",
    glassColor: "bg-red-500/30 dark:bg-red-500/20",
    borderColor: "border-red-400/50",
    textColor: "text-red-900 dark:text-red-200",
    rot: 240,
  },
};

export default function StatusPrism({ status = "normal" }) {
  const s = statuses[status] || statuses.normal;
  return (
    <div className="w-10 h-5 sm:w-20 sm:h-7 perspective-[200px]">
      <div
        className="relative w-full h-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${s.rot}deg)`,
        }}
      >
        {Object.values(statuses).map((st, i) => (
          <div
            key={st.label}
            className={`absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-sm border ${st.glassColor} ${st.borderColor} ${st.textColor}`}
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(${i * 120}deg) translateZ(6px)`,
            }}
          >
            <span className="text-[6px] sm:text-[10px] font-bold drop-shadow-sm">
              {st.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}