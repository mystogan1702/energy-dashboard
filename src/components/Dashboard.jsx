import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLatestReading } from "../hooks/useLatestReading";
import { useSelectedDevice } from "../hooks/useSelectedDevice";
import { useDeviceConfig } from "../hooks/useDeviceConfig";
import { useDailyCost } from "../hooks/useDailyCost";
import { useDailySummary } from "../hooks/useDailySummary";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
import DeviceSelector from "./DeviceSelector";
import StatCard from "./StatCard";
import EmptyDashboard from "./EmptyDashboard";
import CreateDashboardWizard from "./CreateDashboardWizard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBatteryFull,
  faWifi,
  faChartBar,
  faMoneyBillWave,
  faMobileAlt,
  faExclamationCircle,
  faPlug,
  faArrowRight,
  faTachometerAlt,
  faTimes,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

/* -------- All available monitoring parameters -------- */
const ALL_CARD_TYPES = [
  {
    key: "voltage",
    label: "Voltage",
    unit: "V",
    icon: faBolt,
    thresholds: (cfg) => ({ min: cfg?.voltageMin || 200, max: cfg?.voltageMax || 250 }),
  },
  {
    key: "current",
    label: "Current",
    unit: "A",
    icon: faPlug,
    thresholds: (cfg) => ({ min: 0, max: cfg?.currentMax || 10 }),
  },
  {
    key: "activePower",
    label: "Active Power",
    unit: "W",
    icon: faBolt,
    thresholds: (cfg) => ({ min: 0, max: cfg?.powerMax || 2000 }),
  },
  {
    key: "energy",
    label: "Energy",
    unit: "kWh",
    icon: faBatteryFull,
    thresholds: (cfg) => ({ min: 0, max: 100 }),
  },
  {
    key: "frequency",
    label: "Frequency",
    unit: "Hz",
    icon: faWifi,
    thresholds: (cfg) => ({
      min: cfg?.frequencyMin || 49.5,
      max: cfg?.frequencyMax || 50.5,
    }),
  },
  {
    key: "powerFactor",
    label: "Power Factor",
    unit: "",
    icon: faChartBar,
    thresholds: (cfg) => ({ min: cfg?.powerFactorMin || 0.8, max: 1.0 }),
  },
  {
    key: "wifiSpeed",
    label: "WiFi Speed",
    unit: "Mbps",
    icon: faTachometerAlt,
    thresholds: () => ({ min: 0, max: 1000 }),
  },
  {
    key: "wifiName",
    label: "WiFi Name",
    unit: "",
    icon: faWifi,
    thresholds: () => ({ min: 0, max: 100 }),
  },
];

/* -------- Sortable Card – whole card draggable -------- */
function SortableCard({ id, children, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Remove button – stopPropagation so it doesn't start a drag */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute top-2 right-2 z-20 p-1 rounded bg-white/70 dark:bg-gray-800/70 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove card"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
      {children}
    </div>
  );
}

/* -------- Add Card Modal -------- */
function AddCardModal({ open, onClose, activeTypes, onAdd }) {
  if (!open) return null;
  const available = ALL_CARD_TYPES.filter((t) => !activeTypes.includes(t.key));

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Add Monitoring Card
        </h3>
        <div className="space-y-2">
          {ALL_CARD_TYPES.map((t) => {
            const disabled = activeTypes.includes(t.key);
            return (
              <button
                key={t.key}
                disabled={disabled}
                onClick={() => {
                  onAdd(t.key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  disabled
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300"
                }`}
              >
                <FontAwesomeIcon icon={t.icon} className="text-gray-400" />
                <span>{t.label}</span>
                {disabled && (
                  <span className="ml-auto text-xs text-gray-400">Already added</span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* -------- Spinner / Error -------- */
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your energy data…</p>
    </div>
  );
}

function DashboardError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-2">
        We couldn't load your energy data. This might be a temporary issue.
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        Try Again
      </button>
    </div>
  );
}

/* -------- Main Dashboard Component -------- */
export default function Dashboard() {
  const { selectedDevice, setSelectedDevice, devices, loading: devicesLoading } =
    useSelectedDevice();
  const { data, loading: readingLoading, error } = useLatestReading(selectedDevice || null);
  const { config } = useDeviceConfig(selectedDevice);
  const { cost, consumption, loading: costLoading } = useDailyCost(selectedDevice);
  const { status } = useDeviceStatus(selectedDevice);

  useDailySummary(selectedDevice);

  const [wizardOpen, setWizardOpen] = useState(false);

  const [activeCards, setActiveCards] = useState(() => {
    const saved = localStorage.getItem("pesowatt_active_cards");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ["voltage", "current", "activePower", "energy", "frequency", "powerFactor"];
      }
    }
    return ["voltage", "current", "activePower", "energy", "frequency", "powerFactor"];
  });

  useEffect(() => {
    localStorage.setItem("pesowatt_active_cards", JSON.stringify(activeCards));
  }, [activeCards]);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setActiveCards((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = (id) => {
    if (activeCards.length <= 1) return;
    setActiveCards((prev) => prev.filter((c) => c !== id));
  };

  const handleAdd = (key) => {
    if (activeCards.length >= 6) return;
    if (!activeCards.includes(key)) {
      setActiveCards((prev) => [...prev, key]);
    }
  };

  if (devicesLoading) return <Spinner />;

  // ----- NO DEVICES: show the modern empty state -----
  if (!devices.length) {
    return (
      <>
        <EmptyDashboard onOpenWizard={() => setWizardOpen(true)} />
        <CreateDashboardWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      </>
    );
  }

  if (readingLoading) return <Spinner />;
  if (error) return <DashboardError message={error} />;

  const safeData = data || {
    voltage: 0,
    current: 0,
    activePower: 0,
    energy: 0,
    frequency: 0,
    powerFactor: 0,
    timestamp: null,
  };

  const cardValues = {
    voltage: {
      value: safeData.voltage,
      unit: "V",
      thresholds: { min: config?.voltageMin || 200, max: config?.voltageMax || 250 },
    },
    current: {
      value: safeData.current,
      unit: "A",
      thresholds: { min: 0, max: config?.currentMax || 10 },
    },
    activePower: {
      value: safeData.activePower,
      unit: "W",
      thresholds: { min: 0, max: config?.powerMax || 2000 },
    },
    energy: { value: safeData.energy, unit: "kWh", thresholds: { min: 0, max: 100 } },
    frequency: {
      value: safeData.frequency,
      unit: "Hz",
      thresholds: { min: config?.frequencyMin || 49.5, max: config?.frequencyMax || 50.5 },
    },
    powerFactor: {
      value: safeData.powerFactor,
      unit: "",
      thresholds: { min: config?.powerFactorMin || 0.8, max: 1.0 },
    },
    wifiSpeed: { value: status?.networkSpeed || 0, unit: "Mbps", thresholds: { min: 0, max: 1000 } },
    wifiName: { value: status?.ssid || "—", unit: "", thresholds: { min: 0, max: 100 } },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header + Device Selector */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Live Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real‑time energy monitoring</p>
        </div>
        <DeviceSelector selectedDevice={selectedDevice} onSelect={setSelectedDevice} />
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faBolt} className="text-base sm:text-lg text-yellow-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Power</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {safeData.activePower.toFixed(0)} W
          </div>
        </div>
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faBatteryFull} className="text-base sm:text-lg text-green-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Energy</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {costLoading ? (
              <div className="animate-pulse h-3 w-10 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
            ) : (
              `${consumption != null ? consumption.toFixed(2) : '0.00'} kWh`
            )}
          </div>
        </div>
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-base sm:text-lg text-green-600 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Cost</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {costLoading ? (
              <div className="animate-pulse h-3 w-10 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
            ) : (
              `₱${cost != null ? cost.toFixed(2) : '0.00'}`
            )}
          </div>
        </div>
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faWifi} className="text-base sm:text-lg text-blue-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">WiFi</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-full">
            {status?.ssid || "—"}
          </div>
        </div>
        <div className="glass-card !p-2 flex flex-col items-center justify-center text-center">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-base sm:text-lg text-purple-500 mb-0.5" />
          <div className="stat-label text-[9px] leading-tight">Speed</div>
          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {status?.networkSpeed || "—"} <span className="text-[9px] font-normal">Mbps</span>
          </div>
        </div>
      </div>

      {/* Flexible monitoring cards – whole card draggable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeCards} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeCards.map((cardKey) => {
              const cardInfo = ALL_CARD_TYPES.find((t) => t.key === cardKey);
              if (!cardInfo) return null;
              const valObj = cardValues[cardKey] || {
                value: 0,
                unit: "",
                thresholds: { min: 0, max: 100 },
              };
              return (
                <SortableCard key={cardKey} id={cardKey} onRemove={handleRemove}>
                  <StatCard
                    title={cardInfo.label}
                    value={valObj.value}
                    unit={valObj.unit}
                    type={cardKey}
                    thresholds={valObj.thresholds}
                    lastUpdated={safeData.timestamp}
                  />
                </SortableCard>
              );
            })}
            {activeCards.length < 6 && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="glass-card flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
              >
                <FontAwesomeIcon icon={faPlus} className="text-3xl text-gray-400 group-hover:text-blue-500 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500">
                  Add Card
                </span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <AddCardModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        activeTypes={activeCards}
        onAdd={handleAdd}
      />
    </div>
  );
}