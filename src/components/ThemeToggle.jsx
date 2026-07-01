import React from "react";
import { useTheme } from "../lib/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  const buttonSize = 30;             // tiny circle
  const discHeight = buttonSize * 2; // 60px

  return (
    <button
      onClick={toggleDarkMode}
      className="relative overflow-hidden focus:outline-none group shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
      style={{
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: "50%",
        clipPath: "circle(50%)",
        // Light mode: solid white, Dark mode: dark gradient
        background: darkMode
          ? "linear-gradient(180deg, #0b0b1a 0%, #1a1a3e 100%)"
          : "#ffffff",
        border: darkMode
          ? "1.5px solid rgba(148, 163, 255, 0.4)"
          : "1.5px solid rgba(0, 0, 0, 0.15)",
        boxShadow: darkMode
          ? "0 4px 10px -3px rgba(99, 102, 241, 0.3), inset 0 0 5px rgba(99, 102, 241, 0.2)"
          : "0 4px 10px -3px rgba(0, 0, 0, 0.1), inset 0 0 5px rgba(0, 0, 0, 0.05)",
      }}
      aria-label="Toggle dark mode"
    >
      {/* Rotating disc */}
      <div
        className="absolute top-0 left-0 w-full transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)] duration-1000"
        style={{
          height: `${discHeight}px`,
          transformOrigin: "50% 50%",
          transform: `rotate(${darkMode ? 180 : 0}deg)`,
        }}
      >
        {/* ☀️ SUN – top half */}
        <div
          className="absolute left-1/2 flex items-center justify-center"
          style={{
            width: "100%",
            height: "50%",
            top: "0%",
            transform: "translateX(-50%)",
          }}
        >
          <FontAwesomeIcon
            icon={faSun}
            className="text-yellow-500 text-lg drop-shadow-md"
          />
        </div>

        {/* 🌙 MOON – bottom half */}
        <div
          className="absolute left-1/2 flex items-center justify-center"
          style={{
            width: "100%",
            height: "50%",
            top: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <FontAwesomeIcon
            icon={faMoon}
            className="text-gray-200 text-lg drop-shadow-md"
          />
        </div>
      </div>
    </button>
  );
}