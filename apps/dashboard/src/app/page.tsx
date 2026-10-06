'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyFocusScore } from '../components/DailyFocusScore';
import { TimelineHeatmap } from '../components/TimelineHeatmap';
import { BandwidthConsumption } from '../components/BandwidthConsumption';
import { TamperAlertIndicator } from '../components/TamperAlertIndicator';
import { StudentSelector } from '../components/StudentSelector';
import { CategoryBreakdownTable } from '../components/CategoryBreakdownTable';
import { LiveTelemetryStream } from '../components/LiveTelemetryStream';
import { fetchStudents, fetchDashboardSummary } from '../lib/api';
import { DashboardSummary, Student } from '../lib/types';
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  Clock,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (studentId?: string) => {
    try {
      const [studentsData, summaryData] = await Promise.all([
        fetchStudents(),
        fetchDashboardSummary(studentId)
      ]);
      setStudents(studentsData);
      setSummary(summaryData);
    } catch (e) {
      console.error('Failed loading dashboard data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedStudentId);
  }, [loadData, selectedStudentId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(selectedStudentId);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-gray-400">Loading student telemetry models...</p>
      </div>
    );
  }

  const formatHours = (sec: number) => {
    return (sec / 3600).toFixed(1);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedStudent
                ? `${selectedStudent.first_name} ${selectedStudent.last_name}'s Session Analytics`
                : 'School-Wide Student Focus & Safety Fleet'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {selectedStudent
              ? `Student Code: ${selectedStudent.student_code} • Device: ${selectedStudent.os_version || 'Android 14'}`
              : 'Aggregated real-time metrics across all active enrolled devices with battery & network diagnostics'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Student Profile Switcher */}
      <StudentSelector
        students={students}
        selectedStudentId={selectedStudentId}
        onSelect={(id) => setSelectedStudentId(id)}
      />

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Efficiency</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-400">{summary.focusScore.score}%</span>
            <span className="text-xs text-gray-400 ml-2">Academic Ratio</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {formatHours(summary.focusScore.productiveSeconds + summary.focusScore.educationalSeconds)} hrs focused work
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Screen Time</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-white">
              {formatHours(summary.focusScore.totalScreenTimeSeconds)}
            </span>
            <span className="text-xs text-gray-400 ml-2">Hours Today</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Across {summary.packages.length} active applications
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Data Volume</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-cyan-400">
              {(summary.bandwidth.classHoursTotalBytes / (1024 * 1024)).toFixed(0)} MB
            </span>
            <span className="text-xs text-gray-400 ml-2">08:00 – 15:00</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.bandwidth.classHourSpikesDetected} streaming/gaming spike(s)
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compliance Flags</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-400">{summary.tamperAlerts.length}</span>
            <span className="text-xs text-gray-400 ml-2">Active Issues</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.tamperAlerts.filter((a) => a.severity === 'CRITICAL').length} critical tamper anomalies
          </p>
        </div>
      </div>

      {/* Row 1: Daily Focus Score & Tamper Alert Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DailyFocusScore data={summary.focusScore} />
        </div>
        <div className="lg:col-span-5">
          <TamperAlertIndicator
            alerts={summary.tamperAlerts}
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        </div>
      </div>

      {/* Row 2: Timeline Heatmap */}
      <div>
        <TimelineHeatmap data={summary.timeline} />
      </div>

      {/* Row 3: Bandwidth Consumption Chart */}
      <div>
        <BandwidthConsumption data={summary.bandwidth} />
      </div>

      {/* Row 4: Application Inventory Table */}
      <div>
        <CategoryBreakdownTable packages={summary.packages} />
      </div>

      {/* Row 5: Live Ingestion Stream & Simulator */}
      <div>
        <LiveTelemetryStream onBatchIngested={() => loadData(selectedStudentId)} />
      </div>
    </div>
  );
}
