"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { Course, College } from '@/types';
import { CodeEditor } from '@/components/sandbox/CodeEditor';
import { JetBotSimulator } from '@/components/robotics/JetBotSimulator';
import {
  BookOpen,
  Terminal,
  Cpu,
  Building2,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
  ShieldCheck,
  Play,
  Users,
  Clock,
  LayoutDashboard,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated, getDashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.get<{ courses: Course[]; stats: any; colleges: College[] }>('/api/courses/public-catalog')
      .then((res) => {
        setCourses(res.courses || []);
        setStats(res.stats || null);
        setColleges(res.colleges || []);
      })
      .catch(() => {});
  }, []);

  const categories = ['all', 'Artificial Intelligence & Robotics', 'Computer Science', 'Cloud Computing'];
  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter((c) => (c.category || '').toLowerCase() === activeCategory.toLowerCase());

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Floating Pill Header Navbar */}
      <header className="sticky top-4 z-40 px-4 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between p-2.5 sm:px-5 rounded-2xl bg-[var(--bg-secondary)]/80 backdrop-blur-xl border border-[var(--border-color)] shadow-xl shadow-black/5">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md p-1 overflow-hidden">
              <img src="/logo.png" alt="NEXUS" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">NEXUS</span>
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                AI & ROBOTICS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[var(--text-secondary)]">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-500 transition-colors">Features</button>
            <button onClick={() => scrollToSection('labs')} className="hover:text-blue-500 transition-colors">Interactive Labs</button>
            <button onClick={() => scrollToSection('curriculum')} className="hover:text-blue-500 transition-colors">Curriculum</button>
            <Link href="/verify" className="hover:text-blue-500 transition-colors">Verify Certificate</Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link
                href={getDashboardPath()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard ({user?.role_name?.replace('_', ' ')})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25"
              >
                <span>Sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Concentric Rings */}
      <section className="relative pt-20 pb-28 px-4 overflow-hidden flex flex-col items-center text-center">
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
            <span>ENTERPRISE MULTI-TENANT DEEP TECH SUITE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            AI & Robotics Training <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              for Next-Gen Engineers
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            From interactive in-browser Python sandboxes to real-time NVIDIA JetBot simulations and tamper-proof QR certificates, empower universities and students to master autonomous systems.
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

          {/* Quick Metrics Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] backdrop-blur-md">
                <div className="text-2xl font-extrabold text-blue-500">{stats.colleges}+</div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Institutions</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] backdrop-blur-md">
                <div className="text-2xl font-extrabold text-emerald-500">{stats.students?.toLocaleString()}+</div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Learners Trained</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] backdrop-blur-md">
                <div className="text-2xl font-extrabold text-purple-500">{stats.courses}+</div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Deep Tech Courses</div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] backdrop-blur-md">
                <div className="text-2xl font-extrabold text-amber-500">{stats.satisfaction_rate || '99.4%'}</div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Satisfaction Score</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-20 px-4 max-w-6xl w-full mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">PLATFORM CAPABILITIES</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Everything modern engineering colleges need to teach deep tech
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            A unified stack combining cloud coding sandboxes, autonomous hardware robotics, and university governance.
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
                ZERO-SETUP RUNTIME
              </div>
              <h3 className="text-xl font-bold">Zero-Install Python Sandbox</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Execute Python 3.12 scripts, PyTorch neural networks, and OpenCV vision pipelines in secure isolated containers with millisecond feedback.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Isolated container runtime</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated test assertion grading</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time stderr & debug traces</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl shadow-black/5 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#76b900]/10 border border-[#76b900]/20 text-[#76b900] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#76b900]/10 text-[#76b900] inline-block border border-[#76b900]/20">
                HARDWARE IN THE LOOP
              </div>
              <h3 className="text-xl font-bold">NVIDIA JetBot Simulation</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Interactive 2D robotics arena simulating obstacle avoidance, LiDAR raycasting, PID steering algorithms, and edge inference.
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
                ENTERPRISE SCALE
              </div>
              <h3 className="text-xl font-bold">Multi-Tenant Portals</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Complete administrative autonomy for colleges with dedicated branding, faculty trainer allocations, batch cohort segregation, and accreditation reports.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strict SQL tenant data isolation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> CSV batch student onboarding</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Faculty workload management</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Interactive Labs (Live Demos) */}
      <section id="labs" className="py-20 px-4 bg-[var(--bg-tertiary)]/50 border-y border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">HANDS-ON ENVIRONMENTS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Test-drive the interactive engineering labs right now
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              No registration or setup needed. Run real Python code or test autonomous navigation physics in live browser viewports.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" /> Python 3.12 Live Sandbox
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <CodeEditor />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#76b900]" /> JetBot Autonomous Telemetry
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  REAL-TIME CANVAS
                </span>
              </div>
              <JetBotSimulator />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Curriculum & Catalog */}
      <section id="curriculum" className="py-20 px-4 max-w-6xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">COURSE CATALOG</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Featured Engineering Programs</h2>
            <p className="text-sm text-[var(--text-secondary)]">Industry-aligned curriculums structured with modular lessons and verifiable certifications.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat === 'all' ? 'All Programs' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden shadow-xl shadow-black/5 flex flex-col justify-between card-hover group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {c.level || 'Beginner'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 backdrop-blur-md text-white font-mono">
                      {c.code}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="font-extrabold text-lg leading-snug text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {c.description || 'Structured academic curriculum with hands-on live labs and continuous autograded assessments.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {c.module_count || 4} Modules</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.duration || '6 Weeks'}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {c.enrollment_count || 120}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-500 truncate max-w-[140px]">{c.college_name || 'Global Academy'}</span>
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
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm p-1">
              <img src="/logo.png" alt="NEXUS" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">NEXUS</span>
            <span className="text-[11px] text-[var(--text-secondary)] pl-2 border-l border-[var(--border-color)]">
              Multi-Tenant Autonomous Robotics & AI Learning Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} NEXUS Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
