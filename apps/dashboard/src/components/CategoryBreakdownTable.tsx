'use client';

import React, { useState } from 'react';
import { PackageBreakdownItem, AppCategory } from '../lib/types';
import {
  Layers,
  Search,
  BookOpen,
  Briefcase,
  MessageCircle,
  Gamepad2,
  Tv,
  Smartphone,
  AppWindow,
  ArrowUpDown,
  Filter
} from 'lucide-react';

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
    if (bytes > 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryIcon = (category: AppCategory) => {
    switch (category) {
      case 'PRODUCTIVE':
        return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
      case 'EDUCATIONAL':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SOCIAL_MEDIA':
        return <MessageCircle className="w-3.5 h-3.5 text-pink-400" />;
      case 'GAMING':
        return <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'ENTERTAINMENT':
        return <Tv className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-gray-400" />;
    }
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

  const maxDuration = Math.max(...packages.map((p) => p.total_duration_sec), 1);

  const categories = [
    { id: 'ALL', label: 'All Packages', count: packages.length },
    { id: 'EDUCATIONAL', label: 'Educational', count: packages.filter((p) => p.category === 'EDUCATIONAL').length },
    { id: 'PRODUCTIVE', label: 'Productive', count: packages.filter((p) => p.category === 'PRODUCTIVE').length },
    { id: 'SOCIAL_MEDIA', label: 'Social Media', count: packages.filter((p) => p.category === 'SOCIAL_MEDIA').length },
    { id: 'GAMING', label: 'Gaming', count: packages.filter((p) => p.category === 'GAMING').length },
    { id: 'ENTERTAINMENT', label: 'Entertainment', count: packages.filter((p) => p.category === 'ENTERTAINMENT').length },
  ];

  const filtered = packages.filter((pkg) => {
    const matchesSearch =
      pkg.app_name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.package_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'ALL' || pkg.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-gray-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-100">Application Inventory Breakdown</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                {packages.length} Packages Monitored
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Granular session times & network traffic per Android package
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search package or app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="flex flex-wrap gap-2 pt-4 pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterCat === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterCat === cat.id ? 'bg-indigo-700/80 text-white' : 'bg-gray-800 text-gray-500'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-gray-900/60 uppercase font-semibold text-[10px] text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-3 px-3">Application</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 min-w-[160px]">Foreground Usage</th>
              <th className="py-3 px-3">Download (Rx)</th>
              <th className="py-3 px-3">Upload (Tx)</th>
              <th className="py-3 px-3">Intervals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                  No applications matched the filter &quot;{search || filterCat}&quot;
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const percentOfMax = Math.round((item.total_duration_sec / maxDuration) * 100);

                return (
                  <tr key={item.package_name} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 flex-shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-100">{item.app_name}</div>
                          <div className="text-[11px] font-mono text-gray-500 truncate max-w-[200px]">
                            {item.package_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-200 font-bold">{formatSecs(item.total_duration_sec)}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{percentOfMax}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.category === 'EDUCATIONAL' || item.category === 'PRODUCTIVE'
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                                : 'bg-gradient-to-r from-rose-500 to-amber-400'
                            }`}
                            style={{ width: `${percentOfMax}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-mono font-semibold">{formatMB(item.total_bytes_rx)}</td>
                    <td className="py-3 px-3 text-purple-400 font-mono font-semibold">{formatMB(item.total_bytes_tx)}</td>
                    <td className="py-3 px-3 text-gray-400 font-mono">{item.interval_count} cycles</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
