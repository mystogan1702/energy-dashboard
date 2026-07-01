import React from "react";

// Each status definition
const STATUSES = {
  normal: { label: "Normal", color: "bg-emerald-500", rotation: 0 },
  warning: { label: "Warning", color: "bg-amber-500", rotation: 120 },
  critical: { label: "Critical", color: "bg-red-500", rotation: 240 },
};

export default function StatusPrism({ status = "normal" }) {
  const { rotation } = STATUSES[status] || STATUSES.normal;

  return (
    <div className="perspective-[300px] w-20 h-8 inline-block align-middle">
      <div
        className="relative w-full h-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotation}deg)`,
        }}
      >
        {/* Normal face */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white rounded-full bg-emerald-500"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg) translateZ(10px)",
          }}
        >
          Normal
        </div>
        {/* Warning face */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white rounded-full bg-amber-500"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(120deg) translateZ(10px)",
          }}
        >
          Warning
        </div>
        {/* Critical face */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white rounded-full bg-red-500"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(240deg) translateZ(10px)",
          }}
        >
          Critical
        </div>
      </div>
    </div>
  );
}