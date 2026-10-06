'use client';

import React from 'react';
import { TamperAlert } from '../lib/types';
import { AlertTriangle, BatteryWarning, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TamperAlertIndicatorProps {
  alerts: TamperAlert[];
  onSelectStudent?: (studentId: string) => void;
}

export const TamperAlertIndicator: React.FC<TamperAlertIndicatorProps> = ({
  alerts,
  onSelectStudent
}) => {
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min ago`;
    const hrs = (minutes / 60).toFixed(1);
    return `${hrs} hrs ago`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Tamper & Compliance Alerts</h2>
            <p className="text-xs text-gray-400">
              Students with inactive sync (&gt;2 hrs) or re-enabled battery optimization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{alerts.length} Flagged Device(s)</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="py-8 text-center bg-gray-900/40 rounded-xl border border-gray-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-gray-200">Zero Compliance Violations</p>
            <p className="text-xs text-gray-500 mt-1">
              All enrolled student devices are actively reporting within tolerance and have battery optimization disabled.
            </p>
          </div>
        ) : (
          alerts.map((item) => {
            const isTimeout = item.alertType === 'SYNC_TIMEOUT' || item.alertType === 'MULTIPLE_ANOMALIES';
            const isBatteryOpt = item.alertType === 'BATTERY_OP_RE_ENABLED' || item.alertType === 'MULTIPLE_ANOMALIES';

            return (
              <div
                key={item.deviceId}
                className="p-4 rounded-xl bg-gray-900/80 border border-rose-500/20 hover:border-rose-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100 text-sm">{item.studentName}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-800 text-gray-300">
                      {item.studentCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-0.5">
                    {isTimeout && (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Sync Delayed: {formatDelay(item.syncDelayMinutes)}
                      </span>
                    )}

                    {isBatteryOpt && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <BatteryWarning className="w-3.5 h-3.5" />
                        Battery Optimization Re-Enabled (Doze Active)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {onSelectStudent && (
                    <button
                      onClick={() => onSelectStudent(item.studentId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
                    >
                      Inspect Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.alert(`Direct push alert transmitted to guardian of ${item.studentName}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition"
                  >
                    Send Guardian Warning
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
