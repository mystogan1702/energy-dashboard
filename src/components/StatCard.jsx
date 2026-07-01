import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";

const icons = {
  voltage: faBolt,
  current: faPlug,
  activePower: faLightbulb,
  energy: faBatteryFull,
  frequency: faWaveSquare,
  powerFactor: faChartBar,
};

function SemiCircleGauge({ value, min, max, unit, type }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  let colorStart, colorEnd;
  if (percentage > 90) { colorStart = "#f87171"; colorEnd = "#ef4444"; }
  else if (percentage > 75) { colorStart = "#fb923c"; colorEnd = "#f97316"; }
  else { colorStart = "#4ade80"; colorEnd = "#22c55e"; }

  // The arc’s path is drawn from x=15 to x=115, stroke width = 6.
  // The stroke extends 3 px beyond the path – left edge is at 12, right edge at 118.
  const wiperX = 12;          // covers the left edge of the stroke
  const wiperWidth = 106;     // covers the full width (118 - 12 = 106)

  return (
    <div className="relative w-[130px] h-[75px]">
      <svg width="130" height="75" viewBox="0 0 130 75" className="absolute inset-0">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>

          {/* Wiper clip – reveals the green arc from left to right */}
          <clipPath id="wiperClip">
            <rect
              x={wiperX}
              y="0"
              width={wiperWidth}
              height="75"
              style={{
                transform: `scaleX(${percentage / 100})`,
                transformOrigin: `${wiperX}px 0px`,   // scale from left edge
                transition: "transform 0.7s ease-out",
              }}
            />
          </clipPath>

          {/* Clip to the top semicircle (hides bottom half) */}
          <clipPath id="topHalf">
            <rect x="0" y="0" width="130" height="65" />
          </clipPath>
        </defs>

        {/* Background track (full semicircle, butt cap to avoid rounding) */}
        <path
          d="M 15 65 A 42 42 0 0 1 115 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="butt"
          className="text-gray-200 dark:text-gray-700"
          clipPath="url(#topHalf)"
        />

        {/* Green progress arc – always drawn, but hidden by wiper */}
        <path
          d="M 15 65 A 42 42 0 0 1 115 65"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="butt"
          clipPath="url(#topHalf)"   /* first clip to semicircle */
          clipPath="url(#wiperClip)" /* then clip by wiper to reveal left portion */
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Reading value – inside the gauge, aligned at bottom centre */}
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 text-center">
        <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">
          {value.toFixed(2)}
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
  const animatedValue = useAnimatedValue(rawValue, 600);
  const percentage = Math.min(100, Math.max(0, ((animatedValue - min) / (max - min)) * 100));

  let status = "normal";
  if (percentage > 90) status = "critical";
  else if (percentage > 75) status = "warning";

  return (
    <div className="glass-card flex flex-col items-center !p-5 relative">
      {/* Top‑left icon */}
      <div className="absolute top-3 left-3 text-3xl leading-none text-gray-500 dark:text-gray-400">
        <FontAwesomeIcon icon={icons[type] || faChartBar} />
      </div>
      {/* Top‑right status prism */}
      <div className="absolute top-3 right-3">
        <StatusPrism status={status} />
      </div>

      <SemiCircleGauge value={animatedValue} min={min} max={max} unit={unit} type={type} />

      <h3 className="mt-5 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {lastUpdated && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 self-end">
          {new Date(lastUpdated.seconds * 1000).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}