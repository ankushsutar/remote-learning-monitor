'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TimelinePoint } from '../lib/types';
import { BarChart3, Info, X, Clock, Layers, Sparkles } from 'lucide-react';

interface TimelineHeatmapProps {
  data: TimelinePoint[];
}

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({ data }) => {
  const [selectedHour, setSelectedHour] = useState<TimelinePoint | null>(null);

  // Filter hours to active window 07:00 to 18:00
  const displayData = data.filter((p) => {
    const h = parseInt(p.hour.split(':')[0], 10);
    return h >= 7 && h <= 18;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalMins = payload.reduce((acc: number, p: any) => acc + (p.value || 0), 0);
      const isClassHours = parseInt(label.split(':')[0], 10) >= 8 && parseInt(label.split(':')[0], 10) < 15;

      return (
        <div className="bg-gray-900 border border-gray-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
            <span className="font-bold text-gray-200">{label} Window</span>
            {isClassHours && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-semibold">
                Class Hours
              </span>
            )}
          </div>
          {payload.map((entry: any, index: number) => {
            if (!entry.value) return null;
            return (
              <div key={`item-${index}`} className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}:
                </span>
                <span className="font-bold text-gray-100">{entry.value} min</span>
              </div>
            );
          })}
          <div className="pt-1.5 border-t border-gray-800 flex justify-between font-bold text-gray-300">
            <span>Total Screen Time:</span>
            <span>{totalMins} min</span>
          </div>
          <div className="text-[10px] text-indigo-400 pt-1 text-center font-semibold">
            Click bar to open app drill-down
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-100">Timeline Heatmap</h2>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                Interactive Drill-down
              </span>
            </div>
            <p className="text-xs text-gray-400">Hour-by-hour application category distribution (Click bars for app detail)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 border border-blue-800/40 px-3 py-1 rounded-full">
          <Info className="w-3.5 h-3.5" />
          <span>Core Class Hours: 08:00 – 15:00</span>
        </div>
      </div>

      <div className="h-72 mt-6 w-full cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const point = state.activePayload[0].payload as TimelinePoint;
                setSelectedHour(point);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="m" />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '14px', fontSize: '11px' }}
              iconType="circle"
            />
            <Bar dataKey="productive" name="Productive" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="educational" name="Educational" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="socialMedia" name="Social Media" stackId="a" fill="#EC4899" radius={[0, 0, 0, 0]} />
            <Bar dataKey="gaming" name="Gaming" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="entertainment" name="Entertainment" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Hourly App Drill-down Modal */}
      {selectedHour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedHour.hour} Session Drill-Down
                  </h3>
                  <p className="text-xs text-gray-400">Detailed application foreground duration</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHour(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <span className="text-gray-400 block mb-1">Productive Study</span>
                  <span className="text-base font-bold text-blue-400">{selectedHour.productive + selectedHour.educational} mins</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <span className="text-gray-400 block mb-1">Leisure / Distraction</span>
                  <span className="text-base font-bold text-amber-400">{selectedHour.socialMedia + selectedHour.gaming + selectedHour.entertainment} mins</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Category Breakdown for {selectedHour.hour}</span>
                </h4>

                <div className="space-y-1.5 text-xs">
                  {selectedHour.educational > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="font-semibold text-emerald-400">Educational (Canvas, Khan Academy, Duolingo)</span>
                      <span className="font-bold text-white">{selectedHour.educational} mins</span>
                    </div>
                  )}
                  {selectedHour.productive > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="font-semibold text-blue-400">Productive (Google Docs, Drive, Classroom)</span>
                      <span className="font-bold text-white">{selectedHour.productive} mins</span>
                    </div>
                  )}
                  {selectedHour.socialMedia > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <span className="font-semibold text-pink-400">Social Media (Instagram, TikTok)</span>
                      <span className="font-bold text-white">{selectedHour.socialMedia} mins</span>
                    </div>
                  )}
                  {selectedHour.gaming > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="font-semibold text-amber-400">Gaming (Roblox, Brawl Stars)</span>
                      <span className="font-bold text-white">{selectedHour.gaming} mins</span>
                    </div>
                  )}
                  {selectedHour.entertainment > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <span className="font-semibold text-purple-400">Entertainment (YouTube, Netflix)</span>
                      <span className="font-bold text-white">{selectedHour.entertainment} mins</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedHour(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition"
              >
                Close Drill-Down
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
