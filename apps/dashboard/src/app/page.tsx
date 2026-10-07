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
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  UserCheck
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
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-semibold text-gray-300">Synchronizing student telemetry models...</p>
        <p className="text-xs text-gray-500">Querying SQLite WorkManager ingestion partitions</p>
      </div>
    );
  }

  const formatHours = (sec: number) => {
    return (sec / 3600).toFixed(1);
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedStudent
                ? `${selectedStudent.first_name} ${selectedStudent.last_name}'s Session Analytics`
                : 'School-Wide Student Focus & Safety Fleet'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {selectedStudent ? 'Student Spotlight' : 'Cohort Fleet'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {selectedStudent
              ? `Student Code: ${selectedStudent.student_code} • Device: ${selectedStudent.os_version || 'Android 14'} • WorkManager SQLite Sync Active`
              : 'Aggregated real-time metrics across all active enrolled devices with battery & network diagnostics'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-200 hover:text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-gray-400'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Models'}</span>
          </button>
        </div>
      </div>

      {/* Hero Student Persona Spotlight */}
      {selectedStudent ? (
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-gray-900/60 to-gray-900/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center font-extrabold text-xl text-white">
                  {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-gray-800 text-gray-300 border border-gray-700">
                    {selectedStudent.student_code}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Telemetric Stream Online
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                    {selectedStudent.os_version || 'Android 14 (OneUI / OxygenOS)'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Battery Optimization: {selectedStudent.battery_optimization_disabled ? 'Exempted' : 'Default'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Class Window: 08:00 – 15:00
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedStudentId(undefined)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-gradient-to-r from-gray-900/80 to-indigo-950/20 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100">Cohort Fleet Telemetry Active</h3>
                <p className="text-xs text-gray-400">
                  Monitoring {students.length} enrolled student devices. Showing combined screen time & academic focus efficiency.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
                <Lock className="w-3 h-3" />
                Zero-PII Privacy Enforced
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Switcher */}
      <StudentSelector
        students={students}
        selectedStudentId={selectedStudentId}
        onSelect={(id) => setSelectedStudentId(id)}
      />

      {/* Modern Bento Grid Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Focus Score */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Efficiency</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{summary.focusScore.score}%</span>
              <span className="text-xs font-bold text-gray-400">Academic Ratio</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            <span className="font-semibold text-gray-200">
              {formatHours(summary.focusScore.productiveSeconds + summary.focusScore.educationalSeconds)} hrs
            </span>{' '}
            focused learning time
          </p>
        </div>

        {/* Card 2: Screen Time */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Screen Time</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatHours(summary.focusScore.totalScreenTimeSeconds)}
              </span>
              <span className="text-xs font-bold text-gray-400">Hours Today</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Across <span className="font-semibold text-gray-200">{summary.packages.length} apps</span> with foreground tracking
          </p>
        </div>

        {/* Card 3: Class Data Volume */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Data Volume</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-400">
                {(summary.bandwidth.classHoursTotalBytes / (1024 * 1024)).toFixed(0)} MB
              </span>
              <span className="text-xs font-bold text-gray-400">08:00 – 15:00</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            <span className="font-semibold text-gray-200">{summary.bandwidth.classHourSpikesDetected}</span> gaming/streaming spike(s)
          </p>
        </div>

        {/* Card 4: Compliance Flags */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compliance Flags</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400">{summary.tamperAlerts.length}</span>
              <span className="text-xs font-bold text-gray-400">Active Issues</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            <span className="font-semibold text-rose-300">
              {summary.tamperAlerts.filter((a) => a.severity === 'CRITICAL').length} critical
            </span>{' '}
            tamper anomalies detected
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
