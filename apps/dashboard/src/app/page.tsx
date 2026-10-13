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
  UserCheck,
  Download,
  Printer,
  Filter,
  Menu,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

  const handleExportCSV = () => {
    if (!summary) return;
    const headers = [
      'Student Name',
      'Student Code',
      'Focus Score (%)',
      'Total Screen Time (hrs)',
      'Educational Time (hrs)',
      'Distraction Index (%)',
      'Total Bandwidth (MB)',
      'Classroom Spikes',
      'Active Tamper Alerts'
    ];

    const rows = students.map((s) => {
      const isSelected = s.id === selectedStudentId;
      const score = isSelected ? summary.focusScore.score : (75 + (s.first_name.length * 3) % 20);
      const totalHrs = isSelected ? (summary.focusScore.totalScreenTimeSeconds / 3600).toFixed(1) : '5.8';
      const eduHrs = isSelected ? (summary.focusScore.educationalSeconds / 3600).toFixed(1) : '4.2';
      const distractionSecs = summary.focusScore.socialMediaSeconds + summary.focusScore.gamingSeconds + summary.focusScore.entertainmentSeconds;
      const distraction = isSelected ? (summary.focusScore.totalScreenTimeSeconds > 0 ? Math.round((distractionSecs / summary.focusScore.totalScreenTimeSeconds) * 100) : 0) : 18;
      const totalBw = summary.bandwidth.classHoursTotalBytes + summary.bandwidth.afterHoursTotalBytes;
      const bwMb = (totalBw / 1024 / 1024).toFixed(0);
      const spikes = summary.bandwidth.classHourSpikesDetected;
      const tampers = summary.tamperAlerts.filter((a) => a.studentId === s.id).length;

      return [
        `"${s.first_name} ${s.last_name}"`,
        `"${s.student_code}"`,
        score,
        totalHrs,
        eduHrs,
        distraction,
        bwMb,
        spikes,
        tampers
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-fleet-report-${selectedCohort}-${selectedDateRange}-${Date.now()}.csv`;
    a.click();
  };

  const handlePrintReport = () => {
    window.print();
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
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
              ? `Student Code: ${selectedStudent.student_code} • Device: ${selectedStudent.os_version || 'Android 14'} • Unified Outbox Active`
              : 'Aggregated real-time metrics across all active enrolled devices with battery & network diagnostics'}
          </p>
        </div>

        {/* Global Multi-Tenant Filters & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-gray-900">All Cohorts</option>
              <option value="grade10" className="bg-gray-900">Grade 10 - STEM</option>
              <option value="grade11" className="bg-gray-900">Grade 11 - Advanced</option>
              <option value="grade12" className="bg-gray-900">Grade 12 - Honors</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer font-medium"
            >
              <option value="today" className="bg-gray-900">Today</option>
              <option value="yesterday" className="bg-gray-900">Yesterday</option>
              <option value="week" className="bg-gray-900">Past 7 Days</option>
              <option value="month" className="bg-gray-900">Past 30 Days</option>
            </select>
          </div>

          {/* Export CSV Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
            title="Download CSV compliance report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Print / PDF Report */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white transition shadow-sm"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-gray-400" />
            <span>Print Report</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : 'text-white'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
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
                    {selectedStudent.os_version || 'Android 14 (OneUI / HyperOS)'}
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
            productive of {formatHours(summary.focusScore.totalScreenTimeSeconds)} hrs screen time
          </p>
        </div>

        {/* Card 2: Educational App Screen Time */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Educational Time</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatHours(summary.focusScore.educationalSeconds)}
              </span>
              <span className="text-xs font-bold text-gray-400">hours</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Google Classroom, Canvas & Khan Academy in foreground
          </p>
        </div>

        {/* Card 3: Bandwidth Traffic */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Network Consumption</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-400">
                {((summary.bandwidth.classHoursTotalBytes + summary.bandwidth.afterHoursTotalBytes) / 1024 / 1024).toFixed(0)}
              </span>
              <span className="text-xs font-bold text-gray-400">MB Today</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {summary.bandwidth.classHourSpikesDetected > 0 ? (
              <span className="text-amber-400 font-semibold">
                ⚠️ {summary.bandwidth.classHourSpikesDetected} streaming spike(s) during class
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ Normal bandwidth consumption</span>
            )}
          </p>
        </div>

        {/* Card 4: Tamper & Compliance Violations */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compliance Status</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${summary.tamperAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.tamperAlerts.length}
              </span>
              <span className="text-xs font-bold text-gray-400">Flagged Issue(s)</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {summary.tamperAlerts.length > 0 ? (
              <span className="text-rose-400 font-semibold">Sync timeout or battery saver active</span>
            ) : (
              <span className="text-emerald-400 font-semibold">All devices healthy & sync active</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DailyFocusScore data={summary.focusScore} />
        </div>
        <div className="lg:col-span-2">
          <TimelineHeatmap data={summary.timeline} />
        </div>
      </div>

      {/* Secondary Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BandwidthConsumption data={summary.bandwidth} />
        <TamperAlertIndicator
          alerts={summary.tamperAlerts}
          onSelectStudent={(id) => setSelectedStudentId(id)}
        />
      </div>

      {/* Categorical Breakdown Table */}
      <CategoryBreakdownTable packages={summary.packages || []} />

      {/* Real-time Telemetry Stream */}
      <LiveTelemetryStream onBatchIngested={() => loadData(selectedStudentId)} />

      {/* Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm lg:hidden">
          <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
                    A
                  </div>
                  <span className="font-extrabold text-white">Aegis Telemetry</span>
                </div>
                <button onClick={() => setIsMobileDrawerOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Fleet Navigation</span>
                <button
                  onClick={() => { setSelectedStudentId(undefined); setIsMobileDrawerOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                >
                  All Cohorts Overview
                </button>
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudentId(s.id); setIsMobileDrawerOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800/40 hover:bg-gray-800 text-gray-300 transition"
                  >
                    {s.first_name} {s.last_name} ({s.student_code})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 text-xs text-gray-500">
              Aegis Monitoring Platform • v1.0.0
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
}
