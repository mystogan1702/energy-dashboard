import React, { useState } from "react";
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

  const handlePreset = (preset) => {
    const [s, e] = preset.getValue();
    setStartDate(s);
    setEndDate(e);
    onApply(s, e);
  };

  const handleCustomApply = () => {
    onApply(startDate, endDate);
  };

  return (
    <div className="space-y-2">
      {/* Preset buttons – small, wrap if needed */}
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="px-2 py-1 text-[10px] sm:text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs – 2 columns on all screens */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[10px] sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">
            End Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[10px] sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Apply button – small */}
      <button
        onClick={handleCustomApply}
        className="w-full py-1.5 text-[10px] sm:text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        Apply Custom Range
      </button>
    </div>
  );
}