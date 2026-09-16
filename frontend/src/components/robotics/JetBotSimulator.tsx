"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, ShieldAlert, Cpu } from 'lucide-react';

export function JetBotSimulator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [obstaclesAvoided, setObstaclesAvoided] = useState(0);
  const [telemetry, setTelemetry] = useState({
    distance: 1.24,
    steerAngle: 0,
    linearVelocity: 0.45,
    state: 'CRUISING',
  });

  // Simulator Physics State
  const stateRef = useRef({
    botX: 200,
    botY: 200,
    botAngle: 0,
    obstacles: [
      { x: 100, y: 80, radius: 24 },
      { x: 320, y: 120, radius: 30 },
      { x: 120, y: 280, radius: 26 },
      { x: 300, y: 270, radius: 28 },
    ],
    avoidCount: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Draw Obstacles
      s.obstacles.forEach((obs) => {
        const grad = ctx.createRadialGradient(obs.x, obs.y, 4, obs.x, obs.y, obs.radius);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#881337');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 4. Update Robot Position if running
      if (isRunning) {
        // Raycasting Distance Check
        let minDistance = 999;
        const forwardVectorX = Math.cos(s.botAngle);
        const forwardVectorY = Math.sin(s.botAngle);

        s.obstacles.forEach((obs) => {
          const dx = obs.x - s.botX;
          const dy = obs.y - s.botY;
          const dist = Math.sqrt(dx * dx + dy * dy) - obs.radius - 16;
          if (dist < minDistance) minDistance = dist;
        });

        // Obstacle avoidance logic
        if (minDistance < 45) {
          s.botAngle += 0.08 * speed;
          setTelemetry({
            distance: Math.max(0.05, +(minDistance / 100).toFixed(2)),
            steerAngle: +((s.botAngle * 180) / Math.PI).toFixed(1),
            linearVelocity: +(0.2 * speed).toFixed(2),
            state: 'AVOIDING_OBSTACLE',
          });
          s.avoidCount++;
          setObstaclesAvoided(s.avoidCount);
        } else {
          s.botX += forwardVectorX * speed;
          s.botY += forwardVectorY * speed;

          // Boundary bounce
          if (s.botX < 30 || s.botX > width - 30) s.botAngle = Math.PI - s.botAngle;
          if (s.botY < 30 || s.botY > height - 30) s.botAngle = -s.botAngle;

          setTelemetry({
            distance: +(minDistance / 100).toFixed(2),
            steerAngle: +((s.botAngle * 180) / Math.PI).toFixed(1),
            linearVelocity: +(0.45 * speed).toFixed(2),
            state: 'AUTONOMOUS_CRUISE',
          });
        }
      }

      // 5. Draw Sensor Vision Cone
      const coneLength = 70;
      const fov = 0.5;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
      ctx.beginPath();
      ctx.moveTo(s.botX, s.botY);
      ctx.arc(s.botX, s.botY, coneLength, s.botAngle - fov, s.botAngle + fov);
      ctx.closePath();
      ctx.fill();

      // 6. Draw JetBot Chassis
      ctx.save();
      ctx.translate(s.botX, s.botY);
      ctx.rotate(s.botAngle);

      // Green Robot Body
      ctx.fillStyle = '#76b900'; // NVIDIA Jetson green
      ctx.fillRect(-16, -12, 32, 24);

      // Black Wheels
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -15, 8, 4);
      ctx.fillRect(4, -15, 8, 4);
      ctx.fillRect(-12, 11, 8, 4);
      ctx.fillRect(4, 11, 8, 4);

      // Camera Lens
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(14, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed]);

  const handleReset = () => {
    stateRef.current.botX = 200;
    stateRef.current.botY = 200;
    stateRef.current.botAngle = 0;
    stateRef.current.avoidCount = 0;
    setObstaclesAvoided(0);
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[#090d16] text-slate-100 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0c121e]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#76b900]/20 border border-[#76b900]/40 flex items-center justify-center text-[#76b900]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-slate-200">
              NVIDIA JetBot Real-Time Physics Arena
            </h4>
            <p className="text-[10px] text-slate-400">ROS 2 Navigation & Computer Vision Obstacle Avoidance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
              isRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Simulate'}</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Arena"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex justify-center bg-[#070a12] p-2">
        <canvas
          ref={canvasRef}
          width={420}
          height={340}
          className="rounded-xl border border-slate-800/80 shadow-inner max-w-full"
        />

        {/* Telemetry Overlay Pill */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 text-[11px] font-mono space-y-1 shadow-lg pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-bold">{telemetry.state}</span>
          </div>
          <div className="text-slate-400">Dist: <span className="text-blue-400 font-bold">{telemetry.distance}m</span></div>
          <div className="text-slate-400">Steer: <span className="text-amber-400">{telemetry.steerAngle}°</span></div>
          <div className="text-slate-400">Avoided: <span className="text-emerald-400 font-bold">{obstaclesAvoided}</span></div>
        </div>
      </div>

      {/* Bottom Telemetry Controls */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-[#090d16] border-t border-slate-800 text-xs text-slate-300">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <Activity className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-bold">Velocity</div>
            <div className="font-bold text-slate-200">{telemetry.linearVelocity} m/s</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-bold">Evasions</div>
            <div className="font-bold text-slate-200">{obstaclesAvoided} Objects</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold">
              <span>Throttle</span>
              <span>{speed}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JetBotSimulator;
