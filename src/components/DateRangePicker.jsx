import React, { useState } from "react";
import ReactDOM from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const presets = [
  { label: "Today", getValue: () => [new Date(), new Date()] },
  {
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return [d, d];
    },
  },
  {
    label: "This Week",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - end.getDay());
      return [start, end];
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return [start, end];
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return [start, end];
    },
  },
];

export default function DateRangePicker({ onApply }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [modalType, setModalType] = useState(null); // "start" | "end" | null

  const handlePreset = (preset) => {
    const [s, e] = preset.getValue();
    setStartDate(s);
    setEndDate(e);
    onApply(s, e);
  };

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  const applyFromModal = () => {
    if (modalType === "start") {
      onApply(startDate, endDate);
    } else if (modalType === "end") {
      onApply(startDate, endDate);
    }
    closeModal();
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-2">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="px-2 py-1 text-[8px] sm:text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date inputs that open the modal */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <button
            type="button"
            onClick={() => openModal("start")}
            className="w-full text-left px-2 py-1.5 text-[8px] sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {formatDate(startDate)}
          </button>
        </div>
        <div>
          <label className="block text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            End Date
          </label>
          <button
            type="button"
            onClick={() => openModal("end")}
            className="w-full text-left px-2 py-1.5 text-[8px] sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {formatDate(endDate)}
          </button>
        </div>
      </div>

      {/* Modal for single calendar – rendered via portal */}
      {modalType &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-[300px] w-full min-h-[400px] flex flex-col z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
                {modalType === "start" ? "Start Date" : "End Date"}
              </h3>

              {/* Scaled calendar container – flex-1 to push buttons down */}
              <div className="flex-1 flex justify-center items-start">
                <div
                  style={{
                    transform: "scale(1.2)",
                    transformOrigin: "top center",
                  }}
                >
                  <DatePicker
                    selected={modalType === "start" ? startDate : endDate}
                    onChange={(date) => {
                      if (modalType === "start") setStartDate(date);
                      else setEndDate(date);
                    }}
                    inline
                    monthsShown={1}
                    minDate={modalType === "end" ? startDate : undefined}
                    maxDate={modalType === "start" ? endDate : undefined}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFromModal}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}