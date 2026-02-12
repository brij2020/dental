import { Link, useNavigate } from 'react-router-dom';
import {
  IconChevronLeft,
  IconToolsOff,
  IconArrowRight,
  IconVideo,
} from '@tabler/icons-react';

/**
 * VideoConsultationTimingsPanel Component
 * Under construction page for video consultation timings feature
 */
export default function VideoConsultationTimingsPanel() {
  const navigate = useNavigate();
  return (
    <div>
      <Link
        to="/settings"
        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="rounded-2xl border bg-white p-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Video Consultation Timings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure video consultation availability.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="consultation-type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Consultation Type
            </label>
            <select
              id="consultation-type"
              value="video"
              onChange={(e) => {
                if (e.target.value === 'in_person') {
                  navigate('/settings/timings');
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none 
                         focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
            >
              <option value="in_person">In-person Consultation</option>
              <option value="video">Video Consultation</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[500px]">
          {/* Icon Section */}
          <div className="mb-8 flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
            <IconToolsOff className="h-12 w-12 text-blue-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Coming Soon
          </h1>

          {/* Subheading */}
          <p className="text-lg text-slate-600 mb-6">
            Video Consultation Timings
          </p>

          {/* Description */}
          <p className="text-center text-slate-500 max-w-md mb-8">
            This feature is currently under construction. We're working on bringing you the ability to configure and manage video consultation schedules for your clinic.
          </p>

          {/* Feature List */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 max-w-md w-full mb-8">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <IconVideo className="h-5 w-5 text-blue-600" />
              Upcoming Features
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center text-xs text-blue-700 mt-0.5">
                  ✓
                </span>
                <span>Configure video consultation availability by time slots</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center text-xs text-blue-700 mt-0.5">
                  ✓
                </span>
                <span>Set duration for each video consultation session</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center text-xs text-blue-700 mt-0.5">
                  ✓
                </span>
                <span>Manage multiple video consultation schedules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center text-xs text-blue-700 mt-0.5">
                  ✓
                </span>
                <span>Integration with clinic appointment system</span>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link
              to="/settings"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Back to Settings
            </Link>
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium opacity-60 cursor-not-allowed"
            >
              <IconArrowRight className="h-4 w-4" />
              Coming Soon
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center text-xs text-slate-400">
            <p>Feature Status: In Development</p>
            <p className="mt-1">Expected Release: Q1 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
