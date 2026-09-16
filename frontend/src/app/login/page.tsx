"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Sparkles,
  Bot,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orbitSlide, setOrbitSlide] = useState(0);

  // Forgot Password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      // Toast shown in login
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password@123');
    login(roleEmail, 'Password@123');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail });
      toast('If an account exists, a password reset link has been dispatched.', 'success');
      setIsForgotOpen(false);
      setForgotEmail('');
    } catch (err: any) {
      toast(err.message || 'Failed to request reset', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const orbitSlides = [
    {
      title: 'Train & Deploy Everywhere',
      desc: 'Unified multi-tenant cloud sandbox, real-time ROS & JetBot robotics simulations, and certified credentials.',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Autonomous Systems & Edge AI',
      desc: 'Master PyTorch vision pipelines, LiDAR obstacle avoidance, and high-performance neural computing.',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Verifiable Digital Accreditation',
      desc: 'Instant QR code verification for institutional degrees, test performance, and practical coursework.',
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Centered Login Card Window */}
      <div className="w-full max-w-5xl bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          {/* Top Bar inside Form */}
          <div className="flex items-center justify-between pb-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white p-1 shadow-md shadow-blue-500/20">
                <img src="/logo.png" alt="NEXUS" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">NEXUS</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Home
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="space-y-6 my-auto">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Welcome back!
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                Enter your registered credentials or select a 1-click demo role below.
              </p>
            </div>

            {/* 1-Click Role Switchers */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
                1-Click Demo Profiles (Password: Password@123)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin@platform.edu')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 hover:bg-blue-600/10 hover:border-blue-500/30 text-left transition-all group"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-blue-500 truncate">Super Admin</div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">superadmin@platform.edu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@ait.edu')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 hover:bg-emerald-600/10 hover:border-emerald-500/30 text-left transition-all group"
                >
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-emerald-500 truncate">College Admin</div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">admin@ait.edu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('dr.arun@platform.edu')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 hover:bg-amber-600/10 hover:border-amber-500/30 text-left transition-all group"
                >
                  <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-amber-500 truncate">Faculty Trainer</div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">dr.arun@platform.edu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('student1@ait.edu')}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 hover:bg-purple-600/10 hover:border-purple-500/30 text-left transition-all group"
                >
                  <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-purple-500 truncate">Student Learner</div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">student1@ait.edu</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. user@platform.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-semibold text-blue-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="text-center pt-6 text-xs text-[var(--text-muted)]">
            Powered by NEXUS Multi-Tenant Architecture &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right Column: Planetary Orbit Showcase */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-[#0b1120] via-[#0f172a] to-[#1e1b4b] p-12 flex-col justify-between relative overflow-hidden text-white">
          {/* Orbital Background Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] pointer-events-none">
            <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-spin-slow" />
            <div className="absolute inset-12 rounded-full border border-indigo-500/20 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
            <div className="absolute inset-24 rounded-full border border-purple-500/20" />
            <div className="absolute inset-36 rounded-full bg-blue-600/10 blur-2xl animate-pulse-glow" />

            {/* Orbiting Tech Nodes */}
            <div className="absolute top-12 left-24 p-2.5 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-blue-950">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> PyTorch 2.4
            </div>
            <div className="absolute bottom-20 right-16 p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-400/30 backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-950">
              <Bot className="w-3.5 h-3.5 text-emerald-400" /> Jetson Nano
            </div>
            <div className="absolute top-44 right-12 p-2.5 rounded-xl bg-purple-900/60 border border-purple-400/30 backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-purple-950">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> QR Ledger
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20">
              Multi-College Platform
            </span>
          </div>

          <div className="relative z-10 space-y-4 max-w-md">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              {orbitSlides[orbitSlide].title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {orbitSlides[orbitSlide].desc}
            </p>

            {/* Carousel Indicators */}
            <div className="flex items-center gap-2 pt-4">
              {orbitSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setOrbitSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    orbitSlide === i ? 'w-8 bg-blue-400' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            Enterprise End-to-End Encryption · ISO 27001 Ready
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Account Password" maxWidth="sm">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Enter your email and we will dispatch password reset instructions to your inbox.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Email</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="e.g. user@platform.edu"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={forgotLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md disabled:opacity-60"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
