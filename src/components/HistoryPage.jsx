import React, { useState, useMemo, useRef, useEffect } from "react";
import { useReadingsRange } from "../hooks/useReadingsRange";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import DateRangePicker from "./DateRangePicker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFileCsv,
  faFileExcel,
  faFilePdf,
  faCheckSquare,
  faSquare,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import DeviceSelector from "./DeviceSelector";

const allParameters = [
  { key: "voltage", label: "Voltage (V)", color: "#8884d8" },
  { key: "current", label: "Current (A)", color: "#82ca9d" },
  { key: "power", label: "Active Power (W)", color: "#ffc658" },
  { key: "energy", label: "Energy (kWh)", color: "#ff7300" },
  { key: "freq", label: "Frequency (Hz)", color: "#ff0000" },
  { key: "pf", label: "Power Factor", color: "#0088FE" },
];

const aggregationOptions = [
  { value: "auto", label: "Auto" },
  { value: "raw", label: "Raw" },
  { value: "1min", label: "1 min" },
  { value: "5min", label: "5 min" },
  { value: "15min", label: "15 min" },
  { value: "30min", label: "30 min" },
  { value: "1hour", label: "1 hour" },
  { value: "1day", label: "1 day" },
  { value: "1week", label: "1 week" },
  { value: "1month", label: "1 month" },
];

export default function HistoryPage() {
  const { selectedDevice, setSelectedDevice, devices, loading: devicesLoading } = useSelectedDevice();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedParams, setSelectedParams] = useState(["power"]);
  const [aggregation, setAggregation] = useState("auto");
  const chartRef = useRef(null);

  // ----- Separate‑charts PDF state -----
  const [isGeneratingSeparatePdf, setIsGeneratingSeparatePdf] = useState(false);
  const [separatePdfParamIndex, setSeparatePdfParamIndex] = useState(0);
  const [separatePdfImages, setSeparatePdfImages] = useState([]);

  const { aggregatedData, rawData, loading, error } = useReadingsRange(
    startDate,
    endDate,
    aggregation,
    selectedDevice || undefined
  );

  // During separate‑PDF generation, show only the current parameter
  const displayParams = isGeneratingSeparatePdf
    ? [selectedParams[separatePdfParamIndex]]
    : selectedParams;

  // Build chart data – always contains all selected params
  const chartData = useMemo(() => {
    return aggregatedData.map((item) => {
      const obj = { time: item.label };
      selectedParams.forEach((paramKey) => {
        obj[paramKey] = item[`${paramKey}Avg`] ?? item[paramKey] ?? 0;
      });
      return obj;
    });
  }, [aggregatedData, selectedParams]);

  // Toggle a single parameter
  const toggleParam = (key) => {
    if (isGeneratingSeparatePdf) return;
    setSelectedParams((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select all / deselect all
  const toggleAll = () => {
    if (isGeneratingSeparatePdf) return;
    if (selectedParams.length === allParameters.length) {
      setSelectedParams([]);
    } else {
      setSelectedParams(allParameters.map((p) => p.key));
    }
  };

  // ----- EXPORT HANDLERS (CSV / Excel / Combined PDF) -----
  const getExportData = () => {
    const dataToExport = aggregation === "raw" ? rawData : aggregatedData;
    if (!dataToExport.length) return [];

    if (aggregation === "raw") {
      return dataToExport.map((reading) => {
        const row = {
          Time: reading.timestamp?.seconds
            ? new Date(reading.timestamp.seconds * 1000).toLocaleString()
            : "",
        };
        selectedParams.forEach((key) => {
          const paramConfig = allParameters.find((p) => p.key === key);
          if (paramConfig) {
            row[paramConfig.label] = reading[key] ?? reading[paramConfig.key] ?? "";
          }
        });
        return row;
      });
    } else {
      return dataToExport.map((item) => {
        const row = { Time: item.label };
        selectedParams.forEach((key) => {
          const paramConfig = allParameters.find((p) => p.key === key);
          if (paramConfig) {
            row[`${paramConfig.label} (Avg)`] = item[`${key}Avg`]?.toFixed(2) ?? "";
            row[`${paramConfig.label} (Min)`] = item[`${key}Min`]?.toFixed(2) ?? "";
            row[`${paramConfig.label} (Max)`] = item[`${key}Max`]?.toFixed(2) ?? "";
          }
        });
        return row;
      });
    }
  };

  const exportCSV = () => {
    const data = getExportData();
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${row[h] ?? ""}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, `energy_history.csv`);
  };

  const exportExcel = () => {
    const data = getExportData();
    if (!data.length) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "History");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, `energy_history.xlsx`);
  };

  // Combined PDF export (all selected params overlaid)
  const exportCombinedPdf = async () => {
    const chartContainer = chartRef.current;
    if (!chartContainer) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = await html2canvas(chartContainer, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const maxWidth = pageWidth - 20;
      const maxHeight = pageHeight - 20;
      const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
      const width = imgProps.width * ratio;
      const height = imgProps.height * ratio;
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;
      pdf.addImage(imgData, "PNG", x, y, width, height);
      pdf.save("energy_history_combined.pdf");
    } catch (err) {
      alert("Failed to generate PDF: " + err.message);
    }
  };

  // ----- Separate PDF export (one chart per parameter) -----
  const startSeparatePdf = () => {
    if (selectedParams.length === 0) return;
    setIsGeneratingSeparatePdf(true);
    setSeparatePdfParamIndex(0);
    setSeparatePdfImages([]);
  };

  // Effect: capture each individual chart sequentially with a delay
  useEffect(() => {
    if (!isGeneratingSeparatePdf) return;

    let timer;
    const capture = async () => {
      const chartContainer = chartRef.current;
      if (!chartContainer) {
        setIsGeneratingSeparatePdf(false);
        return;
      }

      // Wait 1500ms for the chart to fully re‑render after param change
      await new Promise((resolve) => {
        timer = setTimeout(resolve, 1600);
      });

      try {
        const canvas = await html2canvas(chartContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const imgData = canvas.toDataURL("image/png");

        // If this is the last parameter, generate the PDF
        if (separatePdfParamIndex === selectedParams.length - 1) {
          const finalImages = [...separatePdfImages, imgData];
          generateSeparatePdf(finalImages);
        } else {
          setSeparatePdfImages((prev) => [...prev, imgData]);
          setSeparatePdfParamIndex((prev) => prev + 1);
        }
      } catch (err) {
        alert("Failed to capture chart: " + err.message);
        setIsGeneratingSeparatePdf(false);
      }
    };

    capture();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isGeneratingSeparatePdf, separatePdfParamIndex]);

  // ---------- FINAL PDF GENERATION (2 cols, 3 rows, coloured badges) ----------
  const generateSeparatePdf = (images) => {
    if (!images.length) {
      setIsGeneratingSeparatePdf(false);
      return;
    }

    const pdf = new jsPDF("portrait", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 1. Title
    const title = "PesoWatt Analytic Graph";
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, pageWidth / 2, 15, { align: "center" });

    // 2. Parameter badges (rounded, coloured, separated by bullets)
    const badgeY = 24;
    const badgeHeight = 7;
    const badgePadding = 2;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    let totalBadgeWidth = 0;
    const badgeMetrics = selectedParams.map((key) => {
      const param = allParameters.find((p) => p.key === key);
      const label = param?.label || key;
      const textWidth =
        (pdf.getStringUnitWidth(label) * 8) / pdf.internal.scaleFactor;
      const badgeWidth = textWidth + badgePadding * 2;
      return { label, color: param?.color || "#000000", badgeWidth };
    });

    const numBadges = badgeMetrics.length;
    const totalBulletsWidth = numBadges > 1 ? (numBadges - 1) * 4 : 0;
    totalBadgeWidth =
      badgeMetrics.reduce((sum, m) => sum + m.badgeWidth, 0) + totalBulletsWidth;

    let currentX = (pageWidth - totalBadgeWidth) / 2;

    badgeMetrics.forEach((metric, idx) => {
      const { label, color, badgeWidth } = metric;
      const r = 2;
      const rgb = hexToRgb(color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(currentX, badgeY, badgeWidth, badgeHeight, r, r, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.text(label, currentX + badgePadding, badgeY + 5);
      currentX += badgeWidth;
      if (idx < numBadges - 1) {
        currentX += 2;
        pdf.setTextColor(150, 150, 150);
        pdf.text("•", currentX, badgeY + 5);
        currentX += 4;
      }
    });

    // 3. Charts grid (2 columns, 3 rows)
    const margin = 10;
    const topGridY = badgeY + badgeHeight + 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - topGridY - margin;
    const cols = 2;
    const rows = Math.ceil(images.length / cols);
    const cellWidth = usableWidth / cols;
    const cellHeight = usableHeight / rows;

    images.forEach((imgData, i) => {
      const imgProps = pdf.getImageProperties(imgData);
      const scale = Math.min(cellWidth / imgProps.width, cellHeight / imgProps.height) * 0.85;
      const w = imgProps.width * scale;
      const h = imgProps.height * scale;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * cellWidth + (cellWidth - w) / 2;
      const y = topGridY + row * cellHeight + (cellHeight - h) / 2;

      pdf.addImage(imgData, "PNG", x, y, w, h);
    });

    pdf.save("energy_history_separate.pdf");
    setIsGeneratingSeparatePdf(false);
    setSeparatePdfImages([]);
  };

  // Helper: hex to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  // ---- Render ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error loading history</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn-secondary">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header – title and device selector always in one row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Historical Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and export past energy data</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      <div className="glass-card">
        <DateRangePicker onApply={(s, e) => { setStartDate(s); setEndDate(e); }} />
      </div>

      {/* Controls row: parameter toggles + aggregation + export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Parameter toggles – smaller buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={toggleAll}
            disabled={isGeneratingSeparatePdf}
            className={`px-1.5 py-0.5 text-[6px] sm:text-[10px] rounded-full font-medium transition flex items-center gap-0.5 ${
              selectedParams.length === allParameters.length
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <FontAwesomeIcon icon={selectedParams.length === allParameters.length ? faCheckSquare : faSquare} className="text-[7px]" />
            All
          </button>
          {allParameters.map((param) => {
            const active = selectedParams.includes(param.key);
            return (
              <button
                key={param.key}
                onClick={() => toggleParam(param.key)}
                disabled={isGeneratingSeparatePdf}
                className={`px-1.5 py-0.5 text-[6px] sm:text-[10px] rounded-full font-medium transition flex items-center gap-0.5 ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={active ? faCheckSquare : faSquare} className="text-[7px]" />
                {param.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="input-field text-[10px] sm:text-sm py-1 w-24"
          >
            {aggregationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="relative group">
            <button className="btn-primary text-[10px] sm:text-sm py-1 px-2 flex items-center gap-1" disabled={isGeneratingSeparatePdf}>
              <FontAwesomeIcon icon={faDownload} />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hidden group-hover:block z-10">
              <button onClick={exportCSV} className="w-full text-left px-3 py-1.5 text-[10px] sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileCsv} /> CSV
              </button>
              <button onClick={exportExcel} className="w-full text-left px-3 py-1.5 text-[10px] sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileExcel} /> Excel
              </button>
              <button onClick={exportCombinedPdf} className="w-full text-left px-3 py-1.5 text-[10px] sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilePdf} /> PDF (combined)
              </button>
              <button onClick={startSeparatePdf} className="w-full text-left px-3 py-1.5 text-[10px] sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilePdf} /> PDF (separate)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="glass-card p-3 sm:p-6" ref={chartRef}>
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          {displayParams.length === 0
            ? "Select a parameter"
            : displayParams.length === 1
            ? allParameters.find((p) => p.key === displayParams[0])?.label
            : "Multiple Parameters"}
        </h3>
        {isGeneratingSeparatePdf && (
          <span className="text-xs sm:text-sm text-blue-600 animate-pulse">
            Capturing {displayParams[0] && allParameters.find(p => p.key === displayParams[0])?.label}…
          </span>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="h-56 sm:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {displayParams.map((key) => {
                const param = allParameters.find((p) => p.key === key);
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={param?.color || "#000"}
                    strokeWidth={2}
                    dot={false}
                    name={param?.label || key}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">No data for the selected range.</div>
      )}
    </div>
    </div>
  );
}