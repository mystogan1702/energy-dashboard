import React, { useState, useMemo, useEffect, useRef } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { sendPushNotification } from "../lib/sendPush";   // new
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faChevronLeft,
  faChevronRight,
  faTrashAlt,
  faArchive,
} from "@fortawesome/free-solid-svg-icons";

const ITEMS_PER_PAGE = 20;

/* ---------- Swipeable card wrapper (unchanged) ---------- */
function SwipeableCard({ children, onSwipeRight, onSwipeLeft }) {
  const cardRef = useRef(null);
  const startX = useRef(0);
  const latestX = useRef(0);
  const [offset, setOffset] = useState(0);
  const swiping = useRef(false);

  const handleStart = (clientX) => {
    startX.current = clientX;
    latestX.current = clientX;
    swiping.current = true;
    setOffset(0);
  };

  const handleMove = (clientX) => {
    if (!swiping.current) return;
    latestX.current = clientX;
    setOffset(clientX - startX.current);
  };

  const handleEnd = () => {
    if (!swiping.current) return;
    swiping.current = false;
    const diff = latestX.current - startX.current;
    setOffset(0);
    if (diff > 80) {
      onSwipeRight?.();
    } else if (diff < -80) {
      onSwipeLeft?.();
    }
  };

  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = handleEnd;

  const onMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX);
    const onMouseMove = (ev) => handleMove(ev.clientX);
    const onMouseUp = () => {
      handleEnd();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="relative overflow-hidden rounded-r-xl">
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 text-white bg-green-500 rounded-l-xl"
        style={{
          width: "80px",
          opacity: offset > 0 ? Math.min(offset / 80, 1) : 0,
          transition: "opacity 0.2s",
        }}
      >
        <FontAwesomeIcon icon={faTrashAlt} />
      </div>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 text-white bg-gray-500 rounded-r-xl"
        style={{
          width: "80px",
          opacity: offset < 0 ? Math.min(-offset / 80, 1) : 0,
          transition: "opacity 0.2s",
        }}
      >
        <FontAwesomeIcon icon={faArchive} />
      </div>
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-gray-800 transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Main NotificationList ---------- */
export default function NotificationList({ notifications, deviceId }) {
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const listTopRef = useRef(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Track which notification IDs have already been pushed
  const pushedIdsRef = useRef(new Set());

  // Combined filter
  const filtered = useMemo(() => {
    let result = notifications;
    if (statusFilter === "active") {
      result = result.filter((n) => n.status !== "archived");
    } else if (statusFilter === "archived") {
      result = result.filter((n) => n.status === "archived");
    } else if (statusFilter === "all") {
      // keep everything
    }
    if (priorityFilter !== "all") {
      result = result.filter((n) => n.priority === priorityFilter);
    }
    return result;
  }, [notifications, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedNotifications = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const acknowledge = async (notificationId) => {
    await updateDoc(doc(db, "devices", deviceId, "notifications", notificationId), { status: "acknowledged" });
  };

  const archiveNotification = async (notificationId) => {
    await updateDoc(doc(db, "devices", deviceId, "notifications", notificationId), { status: "archived" });
  };

  const deleteNotification = async (notificationId) => {
    await deleteDoc(doc(db, "devices", deviceId, "notifications", notificationId));
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const deletes = notifications.map((n) => deleteDoc(doc(db, "devices", deviceId, "notifications", n.id)));
      await Promise.all(deletes);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
      setShowClearModal(false);
    }
  };

   ---------- Send push for new unread notifications ----------
  useEffect(() => {
    const newUnread = notifications.filter(
      (n) => n.status === "unread" && !pushedIdsRef.current.has(n.id)
    );
    newUnread.forEach((n) => {
      sendPushNotification(
        n.type || "PesoWatt Alert",
        n.message || "An alert was triggered.",
        "/notifications"
      );
      pushedIdsRef.current.add(n.id);
    });
  }, [notifications]);

  // Scroll to absolute top when page/filters change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, statusFilter, priorityFilter]);

  const handleStatusChange = (newVal) => {
    setStatusFilter(newVal);
    setCurrentPage(1);
  };

  const handlePriorityChange = (newVal) => {
    setPriorityFilter(newVal);
    setCurrentPage(1);
  };

  const priorityColors = {
    critical: "border-l-red-500 bg-red-50/60 dark:bg-red-900/20",
    warning: "border-l-yellow-500 bg-yellow-50/60 dark:bg-yellow-900/20",
    info: "border-l-blue-500 bg-blue-50/60 dark:bg-blue-900/20",
  };

  const statusBadge = (status) => {
    if (status === "unread") return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    if (status === "archived") return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  };

  if (!notifications.length) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <FontAwesomeIcon icon={faBell} className="text-4xl mb-3 opacity-30" />
        <p className="text-lg font-medium">No notifications yet.</p>
        <p className="text-sm mt-1">Alerts will appear here when thresholds are exceeded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filter + Clear All */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {[
            { key: "active", label: "Active" },
            { key: "archived", label: "Archived" },
            { key: "all", label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                statusFilter === key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowClearModal(true)}
          className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
        >
          <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
          Clear All
        </button>
      </div>

      {/* Priority filter */}
      <div className="flex gap-2">
        {["all", "critical", "warning", "info"].map((p) => (
          <button
            key={p}
            onClick={() => handlePriorityChange(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              priorityFilter === p
                ? "bg-gray-700 dark:bg-gray-300 text-white dark:text-black shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification cards */}
      <div ref={listTopRef} className="space-y-2">
        {pagedNotifications.map((n) => (
          <SwipeableCard
            key={n.id}
            onSwipeRight={() => deleteNotification(n.id)}
            onSwipeLeft={() => archiveNotification(n.id)}
          >
            <div
              className={`border-l-4 rounded-r-xl p-3 shadow-sm transition-all hover:shadow-md ${
                n.status !== "archived" && n.status !== "acknowledged"
                  ? priorityColors[n.priority] || priorityColors.info
                  : "border-l-gray-300 bg-gray-50/50 dark:bg-gray-800/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {n.priority === "critical" ? (
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xs" />
                    ) : n.priority === "warning" ? (
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xs" />
                    ) : (
                      <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xs" />
                    )}
                    <span className={`text-[10px] font-bold uppercase ${
                      n.priority === "critical" ? "text-red-600" :
                      n.priority === "warning" ? "text-yellow-600" : "text-blue-600"
                    }`}>
                      {n.priority}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(n.status)}`}>
                      {n.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.type}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {n.timestamp?.seconds ? new Date(n.timestamp.seconds * 1000).toLocaleString() : ""}
                  </p>
                </div>
                {n.status === "unread" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); acknowledge(n.id); }}
                    className="shrink-0 px-2 py-1 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                    Ack
                  </button>
                )}
              </div>
            </div>
          </SwipeableCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Next
            <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
          </button>
        </div>
      )}

      {/* Clear confirmation modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClearModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clear All Notifications</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete all notifications for this device. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowClearModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={clearAll}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
