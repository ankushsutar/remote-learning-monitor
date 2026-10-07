'use client';

import React from 'react';
import { Student } from '../lib/types';
import { Users, Smartphone, ShieldCheck, ShieldAlert, CheckCircle2, BatteryMedium } from 'lucide-react';

interface StudentSelectorProps {
  students: Student[];
  selectedStudentId?: string;
  onSelect: (studentId?: string) => void;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentId,
  onSelect
}) => {
  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Enrolled Student Fleet ({students.length})
          </span>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Select a student to inspect isolated foreground sessions, network spikes, and compliance
          </p>
        </div>

        <button
          onClick={() => onSelect(undefined)}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 self-start sm:self-auto ${
            !selectedStudentId
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
              : 'text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${!selectedStudentId ? 'bg-cyan-300 animate-pulse' : 'bg-gray-500'}`} />
          Aggregated Cohort Fleet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {students.map((student) => {
          const isSelected = selectedStudentId === student.id;
          const isHealthy =
            student.battery_optimization_disabled === true &&
            student.last_sync_at &&
            Date.now() - new Date(student.last_sync_at).getTime() < 24 * 3600 * 1000;

          return (
            <button
              key={student.id}
              onClick={() => onSelect(student.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/80 to-gray-900 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                  : 'bg-gray-900/60 border-gray-800/80 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500" />
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-gray-800 border border-gray-700 text-gray-300'
                  }`}
                >
                  {getInitials(student.first_name, student.last_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-gray-100 truncate">
                      {student.first_name} {student.last_name}
                    </span>
                    {isHealthy ? (
                      <span className="relative flex h-2 w-2 flex-shrink-0 ml-1" title="Telemetry Active">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 ml-1" title="Attention needed" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400 font-mono">
                    <span>{student.student_code}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                      <Smartphone className="w-2.5 h-2.5 text-gray-400" />
                      {student.os_version?.includes('14') ? 'A14' : student.os_version ? 'Android' : 'A14'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
