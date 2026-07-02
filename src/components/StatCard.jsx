import React, { useMemo } from "react";
import { useAnimatedValue } from "../hooks/useAnimatedValue";
import StatusPrism from "./StatusPrism";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faPlug,
  faLightbulb,
  faBatteryFull,
  faWaveSquare,
  faChartBar,
  faTachometerAlt,
  faWifi,
} from "@fortawesome/free-solid-svg-icons";

// All possible icons
const icons = {
  voltage: faBolt,
  current: faPlug,
  activePower: faLightbulb,
  energy: faBatteryFull,
  frequency: faWaveSquare,
  powerFactor: faChartBar,
  wifiSpeed: faTachometerAlt,
  wifiName: faWifi,
};

// Simple counter to guarantee unique SVG ids across all gauge instances
let uniqueCounter = 0;

function SemiCircleGauge({ value, min, max, unit, type }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Glass‑inspired semi‑transparent colours
  let colorStart, colorEnd;
  if (percentage > 90) {
    colorStart = "rgba(248, 113, 113, 0.75)";
    colorEnd = "rgba(239, 68, 68, 0.75)";
  } else if (percentage > 75) {
    colorStart = "rgba(251, 146, 60, 0.75)";
    colorEnd = "rgba(249, 115, 22, 0.75)";
  } else {
    colorStart = "rgba(74, 222, 128, 0.75)";
    colorEnd = "rgba(34, 197, 94, 0.75)";
  }

  // Unique ID for this specific gauge instance – prevents any colour bleeding
  const uid = useMemo(() => {
    uniqueCounter += 1;
    return `${type}-${uniqueCounter}`;
  }, [type]);

  const gradId = `gaugeGrad-${uid}`;
  const topHalfId = `topHalf-${uid}`;
  const wiperClipId = `wiperClip-${uid}`;

  const wiperX = 12;
  const wiperWidth = 106;

  return (
    <div className="relative w-[130px] h-[75px]">
      <svg width="130" height="75" viewBox="0 0 130 75" className="absolute inset-0">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>

          {/* Top semicircle clip – hides bottom half */}
          <clipPath id={topHalfId}>
            <rect x="0" y="0" width="130" height="65" />
          </clipPath>

          {/* Wiper clip – reveals the arc from left to right */}
          <clipPath id={wiperClipId}>
            <rect
              x={wiperX}
              y="0"
              width={wiperWidth}
              height="75"
              style={{
                transform: `scaleX(${percentage / 100})`,
                transformOrigin: `${wiperX}px 0px`,
                transition: "transform 0.7s ease-out",
              }}
            />
          </clipPath>
        </defs>

        {/* Background track */}
        <path
          d="M 15 65 A 42 42 0 0 1 115 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="butt"
          className="text-gray-200 dark:text-gray-700"
          clipPath={`url(#${topHalfId})`}
        />

        {/* Progress arc – apply topHalf clip on a group, then wiper clip on the arc */}
        <g clipPath={`url(#${topHalfId})`}>
          <path
            d="M 15 65 A 42 42 0 0 1 115 65"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="6"
            strokeLinecap="butt"
            clipPath={`url(#${wiperClipId})`}
            className="transition-all duration-700 ease-out"
          />
        </g>
      </svg>

      {/* Reading value – inside the gauge, aligned at bottom centre */}
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-center">
        <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">
          {typeof value === "number" ? value.toFixed(2) : value}
        </div>
        {unit && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{unit}</div>
        )}
      </div>
    </div>
  );
}

export default function StatCard({ title, value: rawValue, unit, type, lastUpdated, thresholds }) {
  const min = thresholds?.min || 0;
  const max = thresholds?.max || 300;

  const numericValue = typeof rawValue === "number" ? rawValue : 0;
  const animatedValue = useAnimatedValue(numericValue, 600);
  const percentage = Math.min(100, Math.max(0, ((animatedValue - min) / (max - min)) * 100));

  let status = "normal";
  if (percentage > 90) status = "critical";
  else if (percentage > 75) status = "warning";

  return (
    <div className="glass-card flex flex-col items-center !p-2 relative">
      {/* Top‑left icon */}
      <div className="absolute top-3 left-3 text-1xl leading-none text-gray-500 dark:text-gray-400">
        <FontAwesomeIcon icon={icons[type] || faChartBar} />
      </div>
      {/* Top‑right glass status prism */}
      <div className="absolute top-3 right-3">
        <StatusPrism status={status} />
      </div>

      <SemiCircleGauge value={animatedValue} min={min} max={max} unit={unit} type={type} />

      <h3 className="mt-5 text-xl font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {lastUpdated && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 self-end">
          {new Date(lastUpdated.seconds * 1000).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}