import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faChartLine,
  faBell,
  faClipboardList,
  faCog,
  faMobileAlt,
  faHeartbeat,
} from "@fortawesome/free-solid-svg-icons";

const tabs = [
  { path: "/", label: "Live", icon: faChartSimple },
  { path: "/history", label: "History", icon: faChartLine },
  { path: "/notifications", label: "Alerts", icon: faBell },
  { path: "/event-logs", label: "Logs", icon: faClipboardList },
  { path: "/settings", label: "Settings", icon: faCog },
  { path: "/device-setup", label: "Setup", icon: faMobileAlt },
  { path: "/system-health", label: "Health", icon: faHeartbeat },
];

export default function MobileNav({ unreadNotifCount = 0, newLogsCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Underline position (slide animation)
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // Ripple state – which indices are currently scaling up
  const [rippleIndices, setRippleIndices] = useState([]);
  const [animating, setAnimating] = useState(false);
  const rippleTimer = useRef(null);

  // Cache icon positions relative to the nav container
  const iconPositionsRef = useRef({});

  // Measure all icons and cache their positions
  const measureAllLinks = useCallback(() => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const positions = {};
    tabs.forEach((tab) => {
      const el = document.querySelector(`[data-mobile-nav="${tab.path}"]`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        positions[tab.path] = {
          left: elRect.left - navRect.left,
          width: elRect.width,
        };
      }
    });
    iconPositionsRef.current = positions;
    if (!animating && positions[location.pathname]) {
      setUnderlineStyle(positions[location.pathname]);
    }
  }, [location.pathname, animating]);

  useEffect(() => {
    measureAllLinks();
    window.addEventListener("resize", measureAllLinks);
    return () => window.removeEventListener("resize", measureAllLinks);
  }, [measureAllLinks]);

  // Keep underline on active page when route changes (if not animating)
  useEffect(() => {
    if (animating) return;
    const style = iconPositionsRef.current[location.pathname];
    if (style) setUnderlineStyle(style);
  }, [location.pathname, animating]);

  // Helper: get index of a path
  const getIndex = (path) => tabs.findIndex((t) => t.path === path);

  // Click handler – same animation as desktop
  const handleClick = (e, targetPath) => {
    e.preventDefault();
    if (animating) return;
    const currentPath = location.pathname;
    if (currentPath === targetPath) return;

    const fromIndex = getIndex(currentPath);
    const toIndex = getIndex(targetPath);
    if (fromIndex === -1 || toIndex === -1) {
      navigate(targetPath);
      return;
    }

    const positions = iconPositionsRef.current;
    if (!positions[currentPath] || !positions[targetPath]) {
      navigate(targetPath);
      return;
    }

    // Start animation
    setAnimating(true);

    // Move underline to target position
    setUnderlineStyle(positions[targetPath]);

    // Determine the sequence of indices the underline passes over
    const step = fromIndex < toIndex ? 1 : -1;
    const indicesBetween = [];
    for (let i = fromIndex; i !== toIndex + step; i += step) {
      indicesBetween.push(i);
    }

    const totalDuration = 300; // matches CSS transition
    const delayPerIcon = totalDuration / (indicesBetween.length - 1 || 1);

    let accumulatedDelay = 0;
    indicesBetween.forEach((idx) => {
      const timer = setTimeout(() => {
        setRippleIndices((prev) => [...prev, idx]);
        setTimeout(() => {
          setRippleIndices((prev) => prev.filter((i) => i !== idx));
        }, 150);
      }, accumulatedDelay);
      accumulatedDelay += delayPerIcon;
    });

    // Instant navigation
    navigate(targetPath);

    // Reset animating after transition
    rippleTimer.current = setTimeout(() => {
      setAnimating(false);
      setRippleIndices([]);
    }, totalDuration + 50);
  };

  useEffect(() => {
    return () => {
      if (rippleTimer.current) clearTimeout(rippleTimer.current);
    };
  }, []);

  return (
    <div className="fixed bottom-3 left-3 right-3 md:hidden z-50">
      <nav
        ref={navRef}
        className="glass rounded-2xl border border-white/30 dark:border-gray-700/50 shadow-2xl p-1.5 flex justify-around items-center backdrop-blur-xl relative overflow-hidden"
      >
        {/* Sliding underline – positioned at the bottom of the nav */}
        <span
          className="absolute bottom-1 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
          style={{
            left: `${underlineStyle.left + 4}px`,
            width: `${underlineStyle.width - 8}px`,
          }}
        />

        {tabs.map((tab, idx) => {
          const active = location.pathname === tab.path;
          const isRippling = rippleIndices.includes(idx);
          const scaleClass = active || isRippling ? "scale-110" : "scale-100";

          return (
            <Link
              key={tab.path}
              to={tab.path}
              data-mobile-nav={tab.path}
              onClick={(e) => handleClick(e, tab.path)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-lg text-[8px] font-medium transition-all duration-300 ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <span className="relative inline-block">
                <FontAwesomeIcon
                  icon={tab.icon}
                  className={`text-lg transition-all duration-300 ease-out ${scaleClass}`}
                />
                {/* Badge for Alerts */}
                {tab.path === "/notifications" && unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                    {unreadNotifCount}
                  </span>
                )}
                {/* Badge for Logs */}
                {tab.path === "/event-logs" && newLogsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                    {newLogsCount}
                  </span>
                )}
              </span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
