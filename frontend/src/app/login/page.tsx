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
  LogIn,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Building2,
  Bot,
  GraduationCap,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showDemoProfiles, setShowDemoProfiles] = useState(true);

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

  const handleQuickLogin = async (roleEmail: string, roleName?: string) => {
    setEmail(roleEmail);
    setPassword('Password@123');
    setIsLoading(true);
    try {
      await login(roleEmail, 'Password@123');
      toast(`Signed in as ${roleName || 'demo user'}`, 'success');
    } catch {
      // Toast shown in login
    } finally {
      setIsLoading(false);
    }
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

  const slides = [
    {
      headline: 'Write Better Everywhere',
      highlight: 'Everywhere',
      caption: (
        <>
          Compatible with <em>Gmail, Outlook Web, LinkedIn</em> and most web editors for a smooth writing experience anywhere online.
        </>
      ),
    },
    {
      headline: 'Code & Master AI Everywhere',
      highlight: 'Everywhere',
      caption: (
        <>
          Integrated with <em>Python 3.12, PyTorch, NVIDIA JetBot</em> and cloud sandboxes for seamless hands-on learning.
        </>
      ),
    },
    {
      headline: 'Assess & Certify Everywhere',
      highlight: 'Everywhere',
      caption: (
        <>
          Equipped with <em>Timed Exams, Anti-Cheating Monitors</em> and verifiable QR digital certificates.
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#eef3f9] dark:bg-[#070b13] flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Outer Floating Window Card */}
      <div className="w-full max-w-[1080px] bg-white dark:bg-[#0e1626] border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] sm:rounded-[38px] shadow-[0_20px_60px_-15px_rgba(37,99,235,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 min-h-[660px] relative overflow-hidden">
        
        {/* Top-Left Subtle Brand Accent */}
        <div className="absolute top-6 left-8 z-20 flex items-center justify-between w-[calc(100%-4rem)] lg:w-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <span className="font-extrabold text-sm tracking-tighter">N</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
              NEXUS
            </span>
          </Link>

          {/* Theme Toggle Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/60 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: Login Form Area                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-6 flex flex-col justify-between px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pt-16 lg:pt-10">
          <div className="w-full max-w-sm mx-auto my-auto space-y-6">
            
            {/* Header Icon with Blueprint Grid Effect */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2 flex items-center justify-center">
                {/* Background Blueprint Grid Box */}
                <div className="absolute -inset-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] opacity-60 rounded-2xl pointer-events-none" />
                
                {/* Blue Squircle Icon */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  <LogIn className="w-5 h-5 translate-x-0.5" strokeWidth={2.4} />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Login to your account!
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Enter your registered email address and password to login!
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="eg. pixelcot@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot Password ?
                </button>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#1a56db] hover:bg-[#1648ba] active:bg-[#123ca0] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-[#0e1626] px-3 text-[11px] text-slate-400 uppercase tracking-wider font-medium shrink-0">
                Or login with
              </span>
            </div>

            {/* Social SSO Buttons Row (Google, Apple, Microsoft) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('student1@ait.edu')}
                className="h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all group"
                title="Login with Google SSO"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@platform.edu')}
                className="h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all group"
                title="Login with Apple ID"
              >
                <svg className="w-4 h-4 fill-slate-900 dark:fill-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.83-11.92-14.36-5.65-8.67-10.15-18.45-13.5-29.34-3.34-10.9-5.02-21.36-5.02-31.39 0-14.77 3.81-26.65 11.43-35.63 7.62-8.99 17.1-13.56 28.43-13.72 4.79 0 10.12 1.25 15.98 3.75 5.86 2.5 9.74 3.79 11.64 3.86 1.54 0 5.66-1.42 12.38-4.26 6.72-2.83 12.43-4.04 17.12-3.62 12.63.63 22.86 5.39 30.69 14.28-11.03 6.67-16.4 15.82-16.12 27.46.28 9.38 3.91 17.17 10.9 23.36 6.99 6.19 15.24 9.69 24.77 10.51-2.12 6.53-4.79 13.06-8.01 19.59zM119.22 33.61c0-7.39 2.65-14.37 7.95-20.93 5.3-6.56 11.96-10.74 19.98-12.54 1.09 7.82-1.27 15.11-7.07 21.87-5.8 6.76-12.76 10.74-20.86 11.6z" />
                </svg>
              </button>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@ait.edu')}
                className="h-11 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all group"
                title="Login with Microsoft SSO"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </button>
            </div>

            {/* Quick Demo Profiles Accordion */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pre-Seeded Demo Logins
                </span>
                <span className="text-[10px] font-mono text-slate-400">PWD: Password@123</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin@platform.edu', 'Super Admin')}
                  className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    Super Admin
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">superadmin@platform.edu</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@ait.edu', 'College Admin (AIT)')}
                  className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    College Admin
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">admin@ait.edu</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('dr.arun@platform.edu', 'Faculty Trainer')}
                  className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600">
                    <Bot className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Trainer
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">dr.arun@platform.edu</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('student1@ait.edu', 'Student (AIT)')}
                  className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-all group shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    Student
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">student1@ait.edu</div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Desktop Theme Toggle */}
          <div className="hidden lg:flex items-center justify-between text-xs text-slate-400 pt-4">
            <span>&copy; {new Date().getFullYear()} NEXUS Platform</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Hero Visual with Orbiting Satellite Ecosystem   */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden lg:flex lg:col-span-6 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#edf5fe] via-[#dbeafe] to-[#eaf2fd] dark:from-[#111a2e] dark:via-[#0e1628] dark:to-[#121c32] p-8 sm:p-10 flex-col justify-between relative overflow-hidden text-slate-900 dark:text-white border border-blue-100/60 dark:border-slate-800/60 shadow-inner select-none">
          
          {/* Top Headline */}
          <div className="text-center pt-2 relative z-10">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
              {slides[activeSlide].headline.split(slides[activeSlide].highlight)[0]}
              <span className="text-blue-600 dark:text-blue-400">{slides[activeSlide].highlight}</span>
            </h2>
          </div>

          {/* Central Orbit Ecosystem Canvas */}
          <div className="relative w-full h-[320px] flex items-center justify-center my-auto">
            {/* Concentric Orbit Rings */}
            {/* Ring 1 (Outer) */}
            <div className="absolute w-[290px] h-[290px] rounded-full border border-blue-300/40 dark:border-blue-500/20 pointer-events-none" />
            
            {/* Ring 2 (Middle) */}
            <div className="absolute w-[210px] h-[210px] rounded-full border border-blue-300/50 dark:border-blue-500/25 pointer-events-none" />
            
            {/* Ring 3 (Inner) */}
            <div className="absolute w-[130px] h-[130px] rounded-full border border-blue-300/60 dark:border-blue-500/30 pointer-events-none" />

            {/* Central Main Orb ("P" / Platform Icon Badge) */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] shadow-[0_10px_25px_-4px_rgba(37,99,235,0.5)] flex items-center justify-center text-white border-2 border-white/80 dark:border-white/20">
              <span className="font-extrabold text-2xl tracking-tighter drop-shadow-sm font-sans">
                P
              </span>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Orbiting Satellite Badges (Positioned exactly per image)    */}
            {/* ----------------------------------------------------------- */}

            {/* 1. Microsoft Edge (Top Outer Ring, right of center) */}
            <div
              className="absolute top-[12px] left-[68%] -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-blue-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700 animate-bounce"
              style={{ animationDuration: '4s' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0c80df" />
                    <stop offset="100%" stopColor="#00c853" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="url(#edgeGrad)" />
                <path d="M50 24c14 0 26 11 26 26s-11 26-26 26c-9 0-17-5-22-12 5 2 11 3 16 3 10 0 18-8 18-18s-6-17-15-18c1-4 3-7 3-7z" fill="#ffffff" />
              </svg>
            </div>

            {/* 2. Android Robot (Upper Left Middle Orbit) */}
            <div
              className="absolute top-[80px] left-[18%] -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-emerald-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700 animate-pulse"
              style={{ animationDuration: '3.5s' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#3DDC84"
                  d="M17.523 15.341c-.551 0-1-.449-1-1 0-.55.449-1 1-1 .55 0 1 .45 1 1 0 .551-.45 1-1 1m-11.046 0c-.55 0-1-.449-1-1 0-.55.45-1 1-1s1 .45 1 1c0 .551-.45 1-1 1m11.405-6.02l1.997-3.46a.416.416 0 0 0-.152-.569.416.416 0 0 0-.569.153l-2.023 3.504c-1.542-.703-3.27-.1.096-5.135-.1.096-1.865 0-3.593.393-5.135 1.096L4.976 5.445a.418.418 0 0 0-.569-.153.416.416 0 0 0-.152.569l1.997 3.46C2.688 11.286.377 15.42.001 20.25h23.998c-.376-4.83-2.687-8.964-6.117-10.929"
                />
              </svg>
            </div>

            {/* 3. Microsoft Outlook (Upper Inner Orbit) */}
            <div
              className="absolute top-[85px] left-[42%] -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-blue-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              <div className="w-5 h-5 rounded-md bg-[#0078d4] flex items-center justify-center text-white text-[9px] font-bold">
                O
              </div>
            </div>

            {/* 4. Facebook Messenger (Upper Right Middle Orbit) */}
            <div
              className="absolute top-[96px] right-[18%] translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-blue-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#0084FF"
                  d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.303 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.8 8.243l3.127 3.26 5.891-3.26-6.627 6.72z"
                />
              </svg>
            </div>

            {/* 5. Google Chrome (Lower Left Outer Orbit) */}
            <div
              className="absolute bottom-[96px] left-[24%] -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-amber-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700 animate-bounce"
              style={{ animationDuration: '5s' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#EA4335" />
                <path d="M12 12l8.66-5A10 10 0 0 0 3.34 7L12 12z" fill="#FBBC05" />
                <path d="M12 12L3.34 7a10 10 0 0 0 8.66 15V12z" fill="#34A853" />
                <circle cx="12" cy="12" r="4.5" fill="#ffffff" />
                <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
              </svg>
            </div>

            {/* 6. Yahoo (Lower Inner Orbit) */}
            <div
              className="absolute bottom-[80px] left-[44%] -translate-x-1/2 w-7 h-7 rounded-full bg-[#6001d2] shadow-md shadow-purple-500/10 flex items-center justify-center text-white text-[10px] font-extrabold"
            >
              y!
            </div>

            {/* 7. Apple (Middle Right Outer Orbit) */}
            <div
              className="absolute top-[138px] right-[10%] translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md shadow-slate-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700"
            >
              <svg className="w-4 h-4 fill-slate-900 dark:fill-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.83-11.92-14.36-5.65-8.67-10.15-18.45-13.5-29.34-3.34-10.9-5.02-21.36-5.02-31.39 0-14.77 3.81-26.65 11.43-35.63 7.62-8.99 17.1-13.56 28.43-13.72 4.79 0 10.12 1.25 15.98 3.75 5.86 2.5 9.74 3.79 11.64 3.86 1.54 0 5.66-1.42 12.38-4.26 6.72-2.83 12.43-4.04 17.12-3.62 12.63.63 22.86 5.39 30.69 14.28-11.03 6.67-16.4 15.82-16.12 27.46.28 9.38 3.91 17.17 10.9 23.36 6.99 6.19 15.24 9.69 24.77 10.51-2.12 6.53-4.79 13.06-8.01 19.59zM119.22 33.61c0-7.39 2.65-14.37 7.95-20.93 5.3-6.56 11.96-10.74 19.98-12.54 1.09 7.82-1.27 15.11-7.07 21.87-5.8 6.76-12.76 10.74-20.86 11.6z" />
              </svg>
            </div>

            {/* 8. LinkedIn (Bottom Outer Orbit) */}
            <div
              className="absolute bottom-[20px] left-[68%] -translate-x-1/2 w-8 h-8 rounded-full bg-[#0077b5] shadow-md shadow-blue-500/20 flex items-center justify-center text-white"
            >
              <span className="font-bold text-xs">in</span>
            </div>
          </div>

          {/* Bottom Caption & Carousel Dots */}
          <div className="space-y-4 text-center relative z-10">
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              {slides[activeSlide].caption}
            </p>

            {/* 3-Dot Carousel Pagination */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    activeSlide === i
                      ? 'w-5 bg-blue-600 dark:bg-blue-400'
                      : 'w-2 bg-blue-200 dark:bg-slate-700 hover:bg-blue-300'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Account Password" maxWidth="sm">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Enter your registered email and we will dispatch a password reset link to your inbox.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Email</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="eg. user@platform.edu"
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
