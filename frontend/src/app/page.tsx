"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { Course } from '@/types';
import { CodeEditor } from '@/components/sandbox/CodeEditor';
import { JetBotSimulator } from '@/components/robotics/JetBotSimulator';
import {
  BookOpen,
  Terminal,
  Cpu,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
  LayoutDashboard,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, getDashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.get<{ courses: Course[] }>('/api/courses/public-catalog')
      .then((res) => {
        setCourses(res.courses || []);
      })
      .catch(() => {});
  }, []);

  const categories = ['all', 'Artificial Intelligence & Robotics', 'Edge AI & Embedded Systems', 'Computer Science', 'Cloud Computing'];
  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter((c) => (c.category || '').toLowerCase() === activeCategory.toLowerCase());

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Header (Directly on Main Display without White Box) */}
      <header className="w-full z-40 px-6 sm:px-10 lg:px-16 py-6 flex items-center justify-between">
        {/* Brand Logo (Top Left) */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img src="/edsols-emblem.svg" alt="EDSOLS" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">EDSOLS</span>
            <span className="hidden sm:inline-flex text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">
              EDGE AI & ROBOTICS
            </span>
          </div>
        </Link>

        {/* Action CTAs (Top Right) */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border-color)] shadow-xs"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          {isAuthenticated ? (
            <Link
              href={getDashboardPath()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 whitespace-nowrap"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 whitespace-nowrap"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden flex flex-col items-center text-center">
        {/* Concentric Orbital Background Visualizer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none -z-10 opacity-30 dark:opacity-20">
          <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-spin-slow" />
          <div className="absolute inset-16 rounded-full border border-indigo-500/20 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          <div className="absolute inset-32 rounded-full border border-purple-500/20" />
          <div className="absolute inset-48 rounded-full border border-blue-500/30" />
          <div className="absolute inset-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse-glow" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EDSOLS INNOVATIONS · INTELLIGENCE AT THE EDGE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Edge AI & Robotics <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              for Next-Gen Engineers
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Equipping universities, research labs, and industrial enterprises with NVIDIA Jetson hardware integration, interactive in-browser Python 3.12 coding sandboxes, real-time JetBot physics arenas, and globally recognized Edge AI certifications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => scrollToSection('curriculum')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-xl shadow-blue-600/30 hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Curriculum</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-20 px-4 max-w-6xl w-full mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">EDSOLS ECOSYSTEM</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Turnkey AI Labs & Edge Computing Stack
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Bridging theoretical artificial intelligence and real-world embedded robotics hardware through our cloud-connected multi-tenant platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl shadow-black/5 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 inline-block border border-blue-500/20">
                EDGE COMPUTE RUNTIME
              </div>
              <h3 className="text-xl font-bold">Zero-Setup Python 3.12 Sandbox</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Execute PyTorch neural networks, TensorRT optimizations, and OpenCV computer vision algorithms in isolated sandboxes with millisecond execution feedback.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Isolated execution sandbox</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated test assertion grading</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tensor & NumPy scientific stack</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl shadow-black/5 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#76b900]/10 border border-[#76b900]/20 text-[#76b900] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#76b900]/10 text-[#76b900] inline-block border border-[#76b900]/20">
                NVIDIA JETSON & ROBOTICS
              </div>
              <h3 className="text-xl font-bold">2D JetBot Physics Simulation</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Interactive robotics arena simulating obstacle avoidance, LiDAR raycasting, PID steering algorithms, and autonomous navigation for student coursework.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time telemetry monitoring</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Autonomous avoidance physics</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ultrasonic raycast visualization</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl shadow-black/5 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 inline-block border border-purple-500/20">
                MULTI-UNIVERSITY GOVERNANCE
              </div>
              <h3 className="text-xl font-bold">Institutional Tenant Isolation</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Custom department branding, independent student rosters, institutional course studio builders, and immutable cryptographic audit ledgers.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete multi-tenant privacy</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Bulk CSV batch enrollment</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verifiable QR digital certificates</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Live Interactive Labs Section */}
      <section id="labs" className="py-20 px-4 max-w-6xl w-full mx-auto border-t border-[var(--border-color)]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">HANDS-ON STEM DEMO</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Try the Live Edge AI & Robotics Sandbox
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Experience our in-browser execution sandbox and NVIDIA JetBot robotics arena without logging in.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Lab: Python Sandbox */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono font-bold text-xs">
                  PY
                </div>
                <div>
                  <h4 className="text-sm font-bold">Python 3.12 Deep Learning Sandbox</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Live in-browser interpreter</p>
                </div>
              </div>
            </div>
            <CodeEditor
              initialCode={`# EDSOLS Edge AI Neural Computation Demo\nimport math\n\ndef sigmoid(x):\n    return 1 / (1 + math.exp(-x))\n\nprint("⚡ EDSOLS Edge AI Engine Initialized")\nweights = [0.25, 0.50, 0.75]\ninputs = [1.2, 0.8, 2.5]\ndot_product = sum(w * i for w, i in zip(weights, inputs))\nactivation = sigmoid(dot_product)\n\nprint(f"Dot Product: {dot_product:.4f}")\nprint(f"Sigmoid Activation Output: {activation:.4f}")\nprint("✅ Forward pass inference complete on Edge Tensor!")`}
            />
          </div>

          {/* Right Lab: JetBot Simulator */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#76b900]/10 text-[#76b900] flex items-center justify-center font-mono font-bold text-xs">
                  ROS
                </div>
                <div>
                  <h4 className="text-sm font-bold">NVIDIA JetBot 2D Physics Simulator</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Autonomous obstacle avoidance</p>
                </div>
              </div>
            </div>
            <JetBotSimulator />
          </div>
        </div>
      </section>

      {/* 5. Curriculum Catalog Section */}
      <section id="curriculum" className="py-20 px-4 max-w-6xl w-full mx-auto border-t border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">EDSOLS CURRICULUM</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">
              Curated Edge AI & Robotics Certifications
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Industrial-grade courses designed for academic university cohorts.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
                }`}
              >
                {cat === 'all' ? 'All Tracks' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCourses.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl overflow-hidden card-hover flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-gradient-to-tr from-slate-800 to-slate-900 overflow-hidden">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <BookOpen className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                    {c.level || 'Beginner'}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-[10px] font-bold text-white">
                    {c.code}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                    {c.category || 'Artificial Intelligence'}
                  </span>
                  <h3 className="text-lg font-bold line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {c.description || 'Hands-on training curriculum with interactive coding labs, quizzes, and verified certification.'}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-500 truncate max-w-[140px]">{c.college_name || 'EDSOLS Academy'}</span>
                <Link
                  href={isAuthenticated ? `/student/browse` : `/login`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-blue-600 hover:text-white font-bold text-xs transition-all text-[var(--text-primary)]"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-secondary)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/edsols-emblem.svg" alt="EDSOLS" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">EDSOLS</span>
            <span className="text-[11px] text-[var(--text-secondary)] pl-2 border-l border-[var(--border-color)]">
              Intelligence at the Edge · AI Hardware & Ecosystems
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://www.edsols.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              www.edsols.in
            </a>
            <p>© {new Date().getFullYear()} EDSOLS Innovations Private Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
