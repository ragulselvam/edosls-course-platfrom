"use client";

import React, { useState } from 'react';
import { Play, RotateCcw, Terminal, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { SandboxRunResult } from '@/types';
import { useToast } from '@/context/ToastContext';

interface CodeEditorProps {
  initialCode?: string;
  expectedOutput?: string;
  testCases?: Array<{ name: string; input?: string; expected?: string }>;
  onRunComplete?: (result: SandboxRunResult) => void;
  height?: string;
  className?: string;
}

const DEFAULT_PYTHON_DEMO = `# NVIDIA JetBot Autonomous Vision Pipeline Demo
import math

class JetBotVisionNav:
    def __init__(self, target_angle=0.0):
        self.target_angle = target_angle
        self.detected_obstacles = [0.15, 0.42, 0.88] # distances in meters
        
    def calculate_steering(self, threshold=0.25):
        min_dist = min(self.detected_obstacles)
        if min_dist < threshold:
            steer = 45.0 # Evasive maneuver right
            status = "CRITICAL_AVOID"
        else:
            steer = self.target_angle
            status = "NORMAL_CRUISE"
        return {"steer_angle_deg": steer, "min_dist_m": min_dist, "status": status}

bot = JetBotVisionNav(target_angle=0.0)
telemetry = bot.calculate_steering()
print("=" * 45)
print("🚀 JETBOT TELEMETRY RUNTIME REPORT")
print(f"Status:        {telemetry['status']}")
print(f"Min Obstacle:  {telemetry['min_dist_m']} m")
print(f"Steer Vector:  {telemetry['steer_angle_deg']} deg")
print("=" * 45)
`;

export function CodeEditor({
  initialCode = DEFAULT_PYTHON_DEMO,
  testCases,
  onRunComplete,
  height = 'flex-1 min-h-[220px]',
  className = '',
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<SandboxRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await api.post<SandboxRunResult>('/api/sandbox/run', {
        code,
        language: 'python',
        timeout_seconds: 5,
        test_cases: testCases,
      });
      setOutput(res);
      if (res.status === 'success') {
        toast('Code executed successfully!', 'success');
      } else {
        toast('Execution finished with errors.', 'warning');
      }
      onRunComplete?.(res);
    } catch (err: any) {
      toast(err.message || 'Failed to execute sandbox script', 'error');
      setOutput({
        stdout: '',
        stderr: err.message || 'Execution error',
        exit_code: 1,
        execution_time_ms: 0,
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(null);
  };

  return (
    <div className={`rounded-2xl border border-[var(--border-color)] bg-[#0f172a] text-slate-100 overflow-hidden shadow-2xl flex flex-col justify-between ${className}`}>
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090d16] border-b border-slate-800 text-xs shrink-0">
        <div className="flex items-center gap-2 font-mono">
          <div className="flex gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-semibold">main.py</span>
          <span className="text-slate-600 hidden sm:inline">· Python 3.12 Isolated Sandbox</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Text Area */}
      <div className={`relative ${height}`}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-full p-4 bg-transparent font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-blue-600 selection:text-white"
        />
      </div>

      {/* Terminal Output Terminal */}
      <div className="border-t border-slate-800 bg-[#060911] p-3.5 font-mono text-xs shrink-0">
        <div className="flex items-center justify-between text-slate-400 mb-1.5 font-semibold">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Console Output</span>
          </div>
          {output && (
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" /> {output.execution_time_ms} ms
              </span>
              {output.exit_code === 0 ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Exit 0
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle className="w-3 h-3" /> Exit {output.exit_code}
                </span>
              )}
            </div>
          )}
        </div>

        <pre className="h-16 overflow-y-auto text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
          {output ? (
            output.stdout || output.stderr ? (
              <>
                {output.stdout && <span className="text-emerald-400">{output.stdout}</span>}
                {output.stderr && <span className="text-rose-400">{output.stderr}</span>}
              </>
            ) : (
              <span className="text-slate-500">[Process finished with no standard output]</span>
            )
          ) : (
            <span className="text-slate-600">Click &quot;Run Code&quot; above to execute in isolated Python container...</span>
          )}
        </pre>
      </div>
    </div>
  );
}

export default CodeEditor;
