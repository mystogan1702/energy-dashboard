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
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [rippleIndices, setRippleIndices] = useState([]);
  const [animating, setAnimating] = useState(false);
  const rippleTimer = useRef(null);

  const { devices, loading: devicesLoading } = useUserDevices();
  const hasDevices = devices && devices.length > 0;

  const primaryDevice = hasDevices ? devices[0].id : null;
  const unreadNotifCount = useUnreadNotificationsCount(primaryDevice);
  const { count: newLogsCount } = useNewEventLogsCount(primaryDevice);

  // Redirect to dashboard when all devices are deleted
  useEffect(() => {
    if (!devicesLoading && devices.length === 0 && location.pathname !== "/") {
      navigate("/");
    }
  }, [devices, devicesLoading, location.pathname, navigate]);

  // ... (rest of the component – underline measurement, ripple, etc. – unchanged)

  const iconPositionsRef = useRef({});

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
    if (!animating && positions[location.pathname]) {
      setUnderlineStyle(positions[location.pathname]);
    }
  }, [location.pathname, animating]);

  useEffect(() => {
    measureAllLinks();
    window.addEventListener("resize", measureAllLinks);
    return () => window.removeEventListener("resize", measureAllLinks);
  }, [measureAllLinks]);

  useEffect(() => {
    if (animating) return;
    const style = iconPositionsRef.current[location.pathname];
    if (style) setUnderlineStyle(style);
  }, [location.pathname, animating]);

  const getIndex = (path) => navLinks.findIndex((l) => l.path === path);

  const handleNavClick = (e, targetPath) => {
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

    setAnimating(true);
    setUnderlineStyle(positions[targetPath]);

    const step = fromIndex < toIndex ? 1 : -1;
    const indicesBetween = [];
    for (let i = fromIndex; i !== toIndex + step; i += step) {
      indicesBetween.push(i);
    }

    const totalDuration = 300;
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

    navigate(targetPath);

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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow group-hover:shadow-md transition-shadow">
                <FontAwesomeIcon icon={faBolt} className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  PesoWatt
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  IoT Energy Monitor
                </p>
              </div>
            </Link>

            {/* Desktop navigation – only shown when devices exist */}
            {hasDevices && (
              <nav
                ref={navRef}
                className="relative hidden md:flex items-center gap-0.5 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl"
              >
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
                      className={`relative flex items-center justify-center w-12 h-12 rounded-lg transition-colors group ${
                        active
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      <span className="relative inline-block">
                        <FontAwesomeIcon icon={link.icon} className={`text-2xl transition-all duration-300 ease-out ${scaleClass}`} />
                        {link.path === "/notifications" && unreadNotifCount > 0 && (
                          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {unreadNotifCount}
                          </span>
                        )}
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
            )}

            {/* Right side */}
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

      {/* Mobile navigation – only when devices exist */}
      {hasDevices && (
        <MobileNav
          unreadNotifCount={unreadNotifCount}
          newLogsCount={newLogsCount}
        />
      )}
    </div>
  );
}