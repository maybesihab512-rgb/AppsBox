import React, { useState } from 'react';
import { ScreenshotSpec } from '../types/app';
import { Smartphone, CheckCircle, Activity, Shield, Terminal, Zap } from 'lucide-react';

interface ScreenshotsViewerProps {
  screenshots: ScreenshotSpec[];
  appName: string;
}

export const ScreenshotsViewer: React.FC<ScreenshotsViewerProps> = ({
  screenshots,
  appName,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeScreenshot = screenshots[activeIndex] || screenshots[0];

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0a0b10] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Interface Previews & HUD</span>
            <span className="text-xs text-red-500 font-mono font-normal">[{screenshots.length} Screens]</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Interactive high-fidelity application modules designed for AMOLED displays.
          </p>
        </div>

        {/* Screen selector tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-x-auto">
          {screenshots.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                activeIndex === idx
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {s.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black/90 p-5 lg:p-7">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* Simulated Mobile Device Frame */}
          <div className="w-full max-w-[280px] sm:max-w-[300px] rounded-[32px] border-4 border-zinc-700/80 bg-zinc-950 p-3 shadow-2xl shadow-red-950/30 shrink-0">
            {/* Phone Speaker Notch */}
            <div className="mx-auto h-4 w-28 rounded-full bg-zinc-800 mb-3 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500/80 mr-2" />
              <div className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            {/* Screen Content */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#07080d] p-4 text-xs space-y-4 min-h-[380px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <span className="font-bold text-white tracking-wide truncate">{appName}</span>
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">{activeScreenshot.badge}</span>
                </div>

                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 space-y-1.5">
                  <div className="text-[11px] font-medium text-zinc-300">
                    {activeScreenshot.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    {activeScreenshot.caption}
                  </div>
                </div>

                {/* Cyber HUD Graphic Simulation */}
                <div className="rounded-lg bg-black/80 border border-red-950/80 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 text-red-400">
                      <Activity size={11} />
                      <span>TELEMETRY</span>
                    </span>
                    <span className="text-zinc-400">RUNNING</span>
                  </div>

                  {/* Mock pulse bars */}
                  <div className="h-12 w-full flex items-end gap-1 pt-2">
                    {[40, 65, 30, 85, 95, 45, 60, 75, 50, 90, 70, 85, 35, 90, 80].map((val, i) => (
                      <div
                        key={i}
                        style={{ height: `${val}%` }}
                        className={`flex-1 rounded-t-xs ${
                          i % 3 === 0 ? 'bg-red-500' : 'bg-red-950 border-t border-red-500/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Screen Navigation */}
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-around text-zinc-400 text-[10px]">
                <span className="text-red-400 font-semibold">Active</span>
                <span>Settings</span>
                <span>Logs</span>
              </div>
            </div>

            {/* Home indicator bar */}
            <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-zinc-700" />
          </div>

          {/* Screenshot details & Metrics Breakdown */}
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-red-500 font-mono font-semibold">
                Feature Focus · {activeScreenshot.badge}
              </span>
              <h4 className="text-xl font-bold text-white">
                {activeScreenshot.title}
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {activeScreenshot.caption}
              </p>
            </div>

            {/* Metrics cards if available */}
            {activeScreenshot.metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {activeScreenshot.metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-1"
                  >
                    <div className="text-[11px] text-zinc-400">{metric.label}</div>
                    <div className="text-sm font-bold text-white font-mono tabular-nums">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle size={14} className="text-red-500 shrink-0" />
              <span>Optimized for Android 14+ Predictive Back & iOS 17 Dynamic Island</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
