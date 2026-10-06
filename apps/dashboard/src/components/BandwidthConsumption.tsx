'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BandwidthPoint } from '../lib/types';
import { Activity, AlertOctagon, ArrowDown, ArrowUp, Zap } from 'lucide-react';

interface BandwidthConsumptionProps {
  data: {
    points: BandwidthPoint[];
    classHoursTotalBytes: number;
    afterHoursTotalBytes: number;
    classHourSpikesDetected: number;
  };
}

export const BandwidthConsumption: React.FC<BandwidthConsumptionProps> = ({ data }) => {
  const { points, classHoursTotalBytes, afterHoursTotalBytes, classHourSpikesDetected } = data;

  const formatMB = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const chartData = points.map((p) => ({
    time: p.time,
    rxMB: parseFloat((p.rxBytes / (1024 * 1024)).toFixed(1)),
    txMB: parseFloat((p.txBytes / (1024 * 1024)).toFixed(1)),
    totalMB: parseFloat((p.totalBytes / (1024 * 1024)).toFixed(1)),
    isClassHours: p.isClassHours,
    topPackage: p.topPackage,
    topCategory: p.topCategory
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isSpike = point.isClassHours && (point.topCategory === 'GAMING' || point.topCategory === 'ENTERTAINMENT');

      return (
        <div className="bg-gray-900 border border-gray-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
            <span className="font-bold text-gray-200">{label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                point.isClassHours ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {point.isClassHours ? 'Class Hours' : 'After Hours'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-cyan-400">
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Download (Rx):
              </span>
              <span className="font-bold">{point.rxMB} MB</span>
            </div>
            <div className="flex justify-between items-center text-violet-400">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Upload (Tx):
              </span>
              <span className="font-bold">{point.txMB} MB</span>
            </div>
          </div>

          {point.topPackage && (
            <div className="pt-1.5 border-t border-gray-800 text-[11px]">
              <span className="text-gray-400">Top Consumer: </span>
              <span className="font-medium text-gray-200 block truncate">{point.topPackage}</span>
              {point.topCategory && (
                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-800 text-gray-300">
                  {point.topCategory}
                </span>
              )}
            </div>
          )}

          {isSpike && (
            <div className="p-1.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center gap-1 text-[10px] font-bold">
              <AlertOctagon className="w-3 h-3 flex-shrink-0" />
              <span>Bandwidth anomaly during instruction!</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Bandwidth Consumption</h2>
            <p className="text-xs text-gray-400">Network I/O upload/download traffic analysis</p>
          </div>
        </div>

        {classHourSpikesDetected > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>{classHourSpikesDetected} Class-Hour Distraction Spike(s)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span>Standard Traffic Profile</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Class Hours Data</span>
          <p className="text-lg font-bold text-cyan-400 mt-0.5">{formatMB(classHoursTotalBytes)}</p>
        </div>
        <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">After Hours Data</span>
          <p className="text-lg font-bold text-purple-400 mt-0.5">{formatMB(afterHoursTotalBytes)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Day Volume</span>
          <p className="text-lg font-bold text-gray-100 mt-0.5">{formatMB(classHoursTotalBytes + afterHoursTotalBytes)}</p>
        </div>
      </div>

      <div className="h-64 mt-6 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rxGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="txGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="MB" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rxMB"
              name="Download (Rx)"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#rxGradient)"
            />
            <Area
              type="monotone"
              dataKey="txMB"
              name="Upload (Tx)"
              stroke="#8B5CF6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#txGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
