import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faChartLine,
  faBell,
  faClipboardList,
  faCog,
  faMobileAlt,
  faHeartbeat,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { useUserDevices } from "../hooks/useUserDevices";
import { useUnreadNotificationsCount } from "../hooks/useUnreadNotificationsCount";
import { useNewEventLogsCount } from "../hooks/useNewEventLogsCount";
import UserMenu from "./UserMenu";

const navLinks = [
  { path: "/", label: "Live", icon: faChartSimple },
  { path: "/history", label: "History", icon: faChartLine },
  { path: "/notifications", label: "Alerts", icon: faBell },
  { path: "/event-logs", label: "Logs", icon: faClipboardList },
  { path: "/settings", label: "Settings", icon: faCog },
  { path: "/device-setup", label: "Setup", icon: faMobileAlt },
  { path: "/system-health", label: "Health", icon: faHeartbeat },
];

export default function Layout({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Underline position (only active page, no hover)
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // Ripple state – which icon indices are currently enlarged
  const [rippleIndices, setRippleIndices] = useState([]);
  const [animating, setAnimating] = useState(false);
  const rippleTimer = useRef(null);

  // Cached positions of all icons relative to the nav container
  const iconPositionsRef = useRef({});

  // Badge counts
  const { devices } = useUserDevices();
  const primaryDevice = devices.length > 0 ? devices[0].id : null;
  const unreadNotifCount = useUnreadNotificationsCount(primaryDevice);
  const { count: newLogsCount } = useNewEventLogsCount(primaryDevice);

  // Measure all icons and cache their positions
  const measureAllLinks = useCallback(() => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const positions = {};
    navLinks.forEach((link) => {
      const el = document.querySelector(`[data-nav-path="${link.path}"]`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        positions[link.path] = {
          left: elRect.left - navRect.left,
          width: elRect.width,
        };
      }
    });
    iconPositionsRef.current = positions;
    // Immediately set underline to active page (only if not animating)
    if (!animating && positions[location.pathname]) {
      setUnderlineStyle(positions[location.pathname]);
    }
  }, [location.pathname, animating]);

  useEffect(() => {
    measureAllLinks();
    window.addEventListener("resize", measureAllLinks);
    return () => window.removeEventListener("resize", measureAllLinks);
  }, [measureAllLinks]);

  // Keep underline on active page when route changes (and no animation is running)
  useEffect(() => {
    if (animating) return;
    const style = iconPositionsRef.current[location.pathname];
    if (style) setUnderlineStyle(style);
  }, [location.pathname, animating]);

  // Helper: get index of a path
  const getIndex = (path) => navLinks.findIndex((l) => l.path === path);

  // Click handler – instant navigation + smooth underline slide & ripple
  const handleNavClick = (e, targetPath) => {
    e.preventDefault();
    if (animating) return;            // ignore clicks during animation
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

    // Start animation flag
    setAnimating(true);

    // Move underline to target position – CSS transition animates it
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
        // Remove this index after a short dwell
        setTimeout(() => {
          setRippleIndices((prev) => prev.filter((i) => i !== idx));
        }, 150);
      }, accumulatedDelay);
      accumulatedDelay += delayPerIcon;
    });

    // Instant navigation – no delay
    navigate(targetPath);

    // Reset animating after the transition completes (so user can click again)
    rippleTimer.current = setTimeout(() => {
      setAnimating(false);
      setRippleIndices([]);
    }, totalDuration + 10);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (rippleTimer.current) clearTimeout(rippleTimer.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="max-w-8xl mx-auto">
          <div className="glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow group-hover:shadow-md transition-shadow">
                <FontAwesomeIcon icon={faBolt} className="text-white text-lg" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PesoWatt</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Power Monitoring Dashboard</p>
              </div>
            </Link>

            {/* Desktop navigation – increased gap */}
            <nav
              ref={navRef}
              className="relative hidden md:flex px-5 items-center gap-12 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl"
            >
              {/* Animated underline – slides only on click */}
              <span
                className="absolute bottom-1 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
                style={{
                  left: `${underlineStyle.left + 4}px`,
                  width: `${underlineStyle.width - 8}px`,
                }}
              />

              {navLinks.map((link, idx) => {
                const active = location.pathname === link.path;
                const isRippling = rippleIndices.includes(idx);
                const scaleClass = active || isRippling ? "scale-125" : "scale-100";
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    data-nav-path={link.path}
                    onClick={(e) => handleNavClick(e, link.path)}
                    className={`relative flex items-center justify-center w-14 h-14 rounded-lg transition-colors group ${
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    <span className="relative inline-block">
                      <FontAwesomeIcon
                        icon={link.icon}
                        className={`text-4xl transition-all duration-300 ease-out ${scaleClass}`}
                      />
                      {/* Badge for Alerts */}
                      {link.path === "/notifications" && unreadNotifCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                          {unreadNotifCount}
                        </span>
                      )}
                      {/* Badge for Logs */}
                      {link.path === "/event-logs" && newLogsCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                          {newLogsCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side unchanged */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <UserMenu onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-28 md:pb-6">
        <Outlet />
      </main>

      <MobileNav
        unreadNotifCount={unreadNotifCount}
        newLogsCount={newLogsCount}
      />
    </div>
  );
}