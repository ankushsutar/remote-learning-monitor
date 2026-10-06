'use client';

import React, { useState } from 'react';
import { simulateTelemetryBatch } from '../lib/api';
import { Radio, RefreshCw, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LiveTelemetryStreamProps {
  onBatchIngested?: () => void;
}

export const LiveTelemetryStream: React.FC<LiveTelemetryStreamProps> = ({ onBatchIngested }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; text: string; time: string; type: 'success' | 'info' }>>([
    {
      id: '1',
      text: 'Background WorkManager worker completed periodic cycle: 4 intervals synced.',
      time: '12:00:15',
      type: 'success'
    },
    {
      id: '2',
      text: 'Redis deduplication filter evicted 2 duplicate intervals (idempotency enforced).',
      time: '11:45:20',
      type: 'info'
    }
  ]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateTelemetryBatch();
      const timeStr = new Date().toLocaleTimeString();
      const newEvent = {
        id: Date.now().toString(),
        text: `Batch ingested via POST /api/v1/telemetry/batch: ${res.insertedCount} records inserted, ${res.duplicateCount} deduplicated.`,
        time: timeStr,
        type: 'success' as const
      };
      setEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
      if (onBatchIngested) onBatchIngested();
    } catch (err: any) {
      const timeStr = new Date().toLocaleTimeString();
      setEvents((prev) => [
        {
          id: Date.now().toString(),
          text: `Simulation error: ${err.message}`,
          time: timeStr,
          type: 'info'
        },
        ...prev
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-100">Live Ingestion Telemetry Stream</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Low-latency Fastify ingestion with Redis deduplication and TimescaleDB hypertable
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
        >
          {isSimulating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Simulate Client Batch Push</span>
        </button>
      </div>

      <div className="mt-4 space-y-2 font-mono text-xs">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-2.5 rounded-lg bg-gray-900/70 border border-gray-800/80 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2">
              {evt.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-gray-300 leading-relaxed">{evt.text}</span>
            </div>
            <span className="text-gray-500 text-[10px] whitespace-nowrap">{evt.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
