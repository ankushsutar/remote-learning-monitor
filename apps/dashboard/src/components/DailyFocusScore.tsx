'use client';

import React from 'react';
import { FocusScoreResult } from '../lib/types';
import { Target, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DailyFocusScoreProps {
  data: FocusScoreResult;
}

export const DailyFocusScore: React.FC<DailyFocusScoreProps> = ({ data }) => {
  const {
    score,
    productiveSeconds,
    educationalSeconds,
    socialMediaSeconds,
    gamingSeconds,
    entertainmentSeconds,
    totalScreenTimeSeconds
  } = data;

  const formatHoursMins = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const getScoreStatus = (val: number) => {
    if (val >= 75) return { text: 'Optimal Focus', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (val >= 50) return { text: 'Balanced Learning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: 'High Distraction Risk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const status = getScoreStatus(score);
  const focusedSecs = productiveSeconds + educationalSeconds;
  const distractionSecs = socialMediaSeconds + gamingSeconds + entertainmentSeconds;
  const distractionRatio = totalScreenTimeSeconds > 0 ? Math.round((distractionSecs / totalScreenTimeSeconds) * 100) : 0;

  // SVG circular gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Daily Focus Score</h2>
            <p className="text-xs text-gray-400">Ratio of productive + educational to total screen time</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color} ${status.border} flex items-center gap-1.5`}>
          {score >= 60 ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {status.text}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-center">
        {/* Radial Progress Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-gray-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="url(#focusGradient)"
                fill="transparent"
              />
              <defs>
                <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">{score}%</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Focus Ratio</span>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-400">Total Measured Screen Time</p>
            <p className="text-sm font-bold text-gray-200 flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formatHoursMins(totalScreenTimeSeconds)}
            </p>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="md:col-span-7 space-y-3.5">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Productive Work
              </span>
              <span className="text-gray-300">{formatHoursMins(productiveSeconds)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalScreenTimeSeconds > 0 ? (productiveSeconds / totalScreenTimeSeconds) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Educational Learning
              </span>
              <span className="text-gray-300">{formatHoursMins(educationalSeconds)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalScreenTimeSeconds > 0 ? (educationalSeconds / totalScreenTimeSeconds) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-pink-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> Social Media
              </span>
              <span className="text-gray-300">{formatHoursMins(socialMediaSeconds)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalScreenTimeSeconds > 0 ? (socialMediaSeconds / totalScreenTimeSeconds) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Gaming
              </span>
              <span className="text-gray-300">{formatHoursMins(gamingSeconds)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalScreenTimeSeconds > 0 ? (gamingSeconds / totalScreenTimeSeconds) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Entertainment & Video
              </span>
              <span className="text-gray-300">{formatHoursMins(entertainmentSeconds)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalScreenTimeSeconds > 0 ? (entertainmentSeconds / totalScreenTimeSeconds) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-800/80 text-xs">
            <span className="text-gray-400">Distraction Index:</span>
            <span className="font-bold text-rose-400">{distractionRatio}% non-academic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
