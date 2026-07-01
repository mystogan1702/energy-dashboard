import React from "react";

const statuses = {
  normal: { label: "Normal", bgClass: "bg-emerald-500", rot: 0 },
  warning: { label: "Warning", bgClass: "bg-amber-500", rot: 120 },
  critical: { label: "Critical", bgClass: "bg-red-500", rot: 240 },
};

export default function StatusPrism({ status = "normal" }) {
  const s = statuses[status] || statuses.normal;
  return (
    <div className="w-20 h-7 perspective-[200px]">
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
            className={`absolute inset-0 flex items-center justify-center rounded-full ${st.bgClass}`}
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(${i * 120}deg) translateZ(8px)`,
            }}
          >
            <span className="text-[8px] sm:text-[10px] font-bold text-white">
              {st.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
