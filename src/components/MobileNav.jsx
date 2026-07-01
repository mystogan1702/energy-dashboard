import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faChartLine,
  faBell,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

const tabs = [
  { path: "/", label: "Live", icon: faChartSimple },
  { path: "/history", label: "History", icon: faChartLine },
  { path: "/notifications", label: "Alerts", icon: faBell },
  { path: "/settings", label: "Settings", icon: faCog },
];

export default function MobileNav({ unreadNotifCount = 0, newLogsCount = 0 }) {
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="glass-card !p-1.5 flex justify-around items-center">
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                active ? "text-white scale-105" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {active && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-md shadow-blue-500/30" />
              )}
              <span className="relative z-10 text-lg">
                <FontAwesomeIcon icon={tab.icon} />
                {/* Badge for Alerts */}
                {tab.path === "/notifications" && unreadNotifCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadNotifCount}
                  </span>
                )}
                {/* Badge for Logs? Logs tab not in mobile nav, but we can ignore */}
              </span>
              <span className="relative z-10 mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}