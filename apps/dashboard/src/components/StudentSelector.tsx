'use client';

import React from 'react';
import { Student } from '../lib/types';
import { Users, Smartphone, ShieldCheck, ShieldAlert } from 'lucide-react';

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
  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Enrolled Students ({students.length})
        </span>
        <button
          onClick={() => onSelect(undefined)}
          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
            !selectedStudentId
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-gray-400 hover:text-white bg-gray-800/60'
          }`}
        >
          Aggregated Fleet View
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {students.map((student) => {
          const isSelected = selectedStudentId === student.id;
          const isHealthy =
            student.battery_optimization_disabled === true &&
            student.last_sync_at &&
            Date.now() - new Date(student.last_sync_at).getTime() < 2 * 3600 * 1000;

          return (
            <button
              key={student.id}
              onClick={() => onSelect(student.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-100 truncate">
                  {student.first_name} {student.last_name}
                </span>
                {isHealthy ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                <span className="font-mono">{student.student_code}</span>
                <span className="flex items-center gap-1 text-[10px]">
                  <Smartphone className="w-3 h-3 text-gray-500" />
                  {student.os_version?.includes('14') ? 'A14' : 'A13'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
