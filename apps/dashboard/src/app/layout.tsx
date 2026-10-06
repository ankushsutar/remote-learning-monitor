import type { Metadata } from 'next';
import './globals.css';
import { Shield, Bell, Activity, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Telemetry & Focus Monitoring Platform',
  description:
    'Production-grade privacy-compliant student usage telemetry, distraction tracking, and automated tamper alerts for remote learning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-[#F8FAFC]">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-3.5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-white">
                    AEGIS TELEMETRY
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Production v1.0
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  Remote Learning Focus & Safety Supervisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>WorkManager Ingestion Cluster Online</span>
              </div>
              <button className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
          <p>© 2026 Aegis Telemetry & Learning Systems • Built with Fastify, TimescaleDB, Next.js & Android API 34 WorkManager</p>
        </footer>
      </body>
    </html>
  );
}
