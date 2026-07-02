import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlug, faArrowRight } from "@fortawesome/free-solid-svg-icons";

export default function EmptyDashboard({ onOpenWizard }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div className="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8">
        <FontAwesomeIcon icon={faPlug} className="text-6xl text-gray-400 dark:text-gray-500" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        No Device Yet
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        You haven’t created a dashboard or added an energy monitor. Create one to start tracking your electricity usage.
      </p>

      <button
        onClick={onOpenWizard}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition"
      >
        <FontAwesomeIcon icon={faPlug} />
        Create Dashboard
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  );
}