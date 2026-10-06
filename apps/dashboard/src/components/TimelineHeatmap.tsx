'use client';

import React from 'react';
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
import { BarChart3, Info } from 'lucide-react';

interface TimelineHeatmapProps {
  data: TimelinePoint[];
}

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({ data }) => {
  // Filter hours to daytime/active window 07:00 to 20:00 or full range
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Timeline Heatmap</h2>
            <p className="text-xs text-gray-400">Hour-by-hour application category distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 border border-blue-800/40 px-3 py-1 rounded-full">
          <Info className="w-3.5 h-3.5" />
          <span>Core Class Hours: 08:00 – 15:00</span>
        </div>
      </div>

      <div className="h-72 mt-6 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
    </div>
  );
};
