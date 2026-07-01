import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";

export default function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ---- Left panel (image + gradient + diagonal) ---- */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 shadow-2xl">
        {/* Diagonal clip */}
        <div
          className="absolute inset-0 bg-white dark:bg-gray-950"
          style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/80 to-cyan-700/90" />
          {/* Decorative energy illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="350" height="350" viewBox="0 0 350 350" fill="none" className="opacity-80">
              {/* Background circle */}
              <circle cx="175" cy="175" r="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="8 8" />
              <circle cx="175" cy="175" r="110" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              {/* Gauge arc */}
              <path d="M80 260 A120 120 0 0 1 270 260" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="12" strokeLinecap="round" />
              <path d="M100 245 A95 95 0 0 1 250 245" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
              {/* Lightning bolt */}
              <path d="M175 60 L145 160 L180 160 L155 280 L220 170 L185 170 L210 60 Z" fill="#fbbf24" opacity="0.9" />
              {/* Sparkles */}
              <circle cx="120" cy="100" r="3" fill="white" opacity="0.6" />
              <circle cx="280" cy="80" r="2" fill="white" opacity="0.5" />
              <circle cx="300" cy="200" r="3" fill="white" opacity="0.6" />
              <circle cx="60" cy="220" r="2" fill="white" opacity="0.5" />
            </svg>
          </div>
          {/* Text overlay */}
          <div className="absolute bottom-16 left-10 text-white">
            <h2 className="text-8xl font-bold tracking-tight">PesoWatt</h2>
            <p className="mt-2 text-xs text-blue-100 max-w-3xs">
              Power Monitoring Dashboard using ESP32. Track your electricity usage in real-time and optimize your energy consumption.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Right panel (form) ---- */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo – visible only on small screens */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg">
              <FontAwesomeIcon icon={faBolt} className="text-2xl text-white" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">PesoWatt</h1>
          </div>

          {/* Form container */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}