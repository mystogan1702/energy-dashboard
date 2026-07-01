import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const presets = [
  { label: "Today", getValue: () => [new Date(), new Date()] },
  { label: "Yesterday", getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return [d, d];
  }},
  { label: "This Week", getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - end.getDay()); // Sunday
      return [start, end];
  }},
  { label: "This Month", getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return [start, end];
  }},
  { label: "This Year", getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return [start, end];
  }},
];

export default function DateRangePicker({ onApply }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [custom, setCustom] = useState(false);

  const handlePreset = (preset) => {
    const [s, e] = preset.getValue();
    setStartDate(s);
    setEndDate(e);
    setCustom(false);
    onApply(s, e);
  };

  const handleCustomApply = () => {
    setCustom(true);
    onApply(startDate, endDate);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs text-gray-500">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={handleCustomApply}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Apply Custom Range
        </button>
      </div>
    </div>
  );
}