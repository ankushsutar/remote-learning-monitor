'use client';

import React, { useState } from 'react';
import { PackageBreakdownItem, AppCategory } from '../lib/types';
import { Layers, Search, ArrowUpDown } from 'lucide-react';

interface CategoryBreakdownTableProps {
  packages: PackageBreakdownItem[];
}

export const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({ packages }) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  };

  const formatMB = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadge = (category: AppCategory) => {
    switch (category) {
      case 'PRODUCTIVE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'EDUCATIONAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SOCIAL_MEDIA':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'GAMING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ENTERTAINMENT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filtered = packages.filter((pkg) => {
    const matchesSearch =
      pkg.app_name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.package_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'ALL' || pkg.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Application Inventory Breakdown</h2>
            <p className="text-xs text-gray-400">Granular session times & network traffic per Android package</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="EDUCATIONAL">Educational</option>
            <option value="PRODUCTIVE">Productive</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="GAMING">Gaming</option>
            <option value="ENTERTAINMENT">Entertainment</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-gray-900/60 uppercase font-semibold text-[10px] text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2.5 px-3">Application</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Foreground Time</th>
              <th className="py-2.5 px-3">Download (Rx)</th>
              <th className="py-2.5 px-3">Upload (Tx)</th>
              <th className="py-2.5 px-3">Intervals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {filtered.map((item) => (
              <tr key={item.package_name} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-bold text-gray-100">{item.app_name}</div>
                  <div className="text-[11px] font-mono text-gray-500 truncate max-w-[220px]">
                    {item.package_name}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-200 font-semibold">{formatSecs(item.total_duration_sec)}</td>
                <td className="py-3 px-3 text-cyan-400">{formatMB(item.total_bytes_rx)}</td>
                <td className="py-3 px-3 text-purple-400">{formatMB(item.total_bytes_tx)}</td>
                <td className="py-3 px-3 text-gray-400">{item.interval_count} cycles</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
