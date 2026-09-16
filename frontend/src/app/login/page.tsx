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
  ShieldCheck,
  Building2,
  GraduationCap,
  Bot,
  ChevronDown,
  Sparkles,
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
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);

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
      // Toast displayed in login()
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password@123');
    login(roleEmail, 'Password@123');
  };

  const handleSocialClick = (provider: string) => {
    toast(`${provider} authentication is enabled for institutional single sign-on (SSO).`, 'info');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail });
      toast('If an account exists, password reset instructions have been dispatched.', 'success');
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
      title: 'Write Better',
      highlight: 'Everywhere',
      desc: (
        <>
          Compatible with <span className="italic font-medium">Gmail</span>,{' '}
          <span className="italic font-medium">Outlook Web</span>,{' '}
          <span className="italic font-medium">LinkedIn</span> and{' '}
          <span className="italic font-medium">most web editors</span> for a smooth writing experience anywhere online.
        </>
      ),
    },
    {
      title: 'Learn & Code',
      highlight: 'Everywhere',
      desc: (
        <>
          Integrated with <span className="italic font-medium">Python 3.12</span>,{' '}
          <span className="italic font-medium">ROS JetBot Physics</span>,{' '}
          <span className="italic font-medium">PyTorch AI</span> and{' '}
          <span className="italic font-medium">Cloud Sandboxes</span> for high-impact STEM training.
        </>
      ),
    },
    {
      title: 'Certify & Grow',
      highlight: 'Everywhere',
      desc: (
        <>
          Verified with <span className="italic font-medium">Cryptographic QR Codes</span>,{' '}
          <span className="italic font-medium">Institution Dashboards</span>, and{' '}
          <span className="italic font-medium">Global Accreditation</span> standards.
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#0b0f19] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#1a56db] selection:text-white transition-colors duration-300">
      {/* Outer Card Window matching the provided mockup */}
      <div className="w-full max-w-[1040px] bg-white dark:bg-[#111827] rounded-[2rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Clean White Login Form                      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-7 sm:p-11 lg:p-14 flex flex-col justify-between relative bg-white dark:bg-[#111827]">
          {/* Subtle Top Bar: Logo & Theme Switcher */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1a56db] to-[#3b82f6] flex items-center justify-center text-white p-1 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="NEXUS" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">
                NEXUS<span className="text-[#1a56db]">.</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Light / Dark Mode"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Form Content Container */}
          <div className="my-auto py-6 max-w-sm w-full mx-auto">
            {/* Login Badge with subtle grid background */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative p-3 mb-3">
                {/* Subtle Grid Pattern Backdrop */}
                <div 
                  className="absolute inset-0 w-24 h-24 -top-3 -left-3 rounded-2xl opacity-40 dark:opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                  }}
                />
                {/* Blue Icon Square with Door / LogIn */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1a56db] to-[#2563eb] text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <LogIn className="w-5 h-5 ml-0.5" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
                Login to your account!
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-400 dark:text-slate-400 mt-1.5 font-normal">
                Enter your registered email address and password to login!
              </p>
            </div>

            {/* Main Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="eg. pixelcot@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1a56db] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1a56db] focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#1a56db] focus:ring-[#1a56db] cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-semibold text-[#1a56db] dark:text-blue-400 hover:underline transition-all"
                >
                  Forgot Password ?
                </button>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#1a56db] hover:bg-[#1545b5] text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/25 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                <span>{isLoading ? 'Signing In...' : 'Login'}</span>
              </button>
            </form>

            {/* "Or login with" Divider */}
            <div className="flex items-center my-6 gap-3">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs text-slate-400 font-normal">Or login with</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Social / SSO 3-Button Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Google')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group"
                title="Login with Google"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Apple')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group"
                title="Login with Apple"
              >
                <svg className="w-4 h-4 fill-current text-black dark:text-white group-hover:scale-110 transition-transform" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.79-11.7-14.25-5.87-9.24-10.4-19.46-13.58-30.65-3.19-11.19-4.78-22.18-4.78-32.96 0-14.79 3.82-27.17 11.45-37.14 7.63-9.97 17.2-15.06 28.7-15.28 4.8 0 10.19 1.22 16.16 3.66 5.98 2.44 9.94 3.72 11.89 3.84 1.53-.12 5.67-1.46 12.44-4.02 6.76-2.56 12.39-3.72 16.89-3.48 12.52.87 22.42 5.6 29.7 14.19-10.9 6.64-16.23 15.69-16 27.13.22 9.04 3.63 16.59 10.22 22.65 6.6 6.05 14.43 9.49 23.51 10.3-2.29 6.86-5.06 13.55-8.33 20.07zM119.22 31.02c0-7.39 2.68-14.33 8.04-20.81 5.37-6.49 12-10.21 19.89-11.16.22 1.09.33 2.12.33 3.09 0 7.39-2.73 14.39-8.19 21.01-5.46 6.62-12.21 10.37-20.25 11.25-.11-1.09-.18-2.22-.18-3.38z" />
                </svg>
              </button>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Microsoft')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group"
                title="Login with Microsoft"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </button>
            </div>

            {/* Collapsible 1-Click Demo Profiles (For Instant Pair Testing) */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowDemoProfiles(!showDemoProfiles)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1a56db]" /> 1-Click Demo Credentials
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoProfiles ? 'rotate-180' : ''}`} />
              </button>

              {showDemoProfiles && (
                <div className="grid grid-cols-2 gap-2 mt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin@platform.edu')}
                    className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Super Admin
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">superadmin@platform.edu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@ait.edu')}
                    className="p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" /> College Admin
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">admin@ait.edu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('dr.arun@platform.edu')}
                    className="p-2 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <Bot className="w-3.5 h-3.5 text-amber-600" /> Faculty Trainer
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">dr.arun@platform.edu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('student1@ait.edu')}
                    className="p-2 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Student Learner
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">student1@ait.edu</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} NEXUS Platform. All rights reserved.
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Soft Sky-Blue Hero Card with Orbital Visual*/}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:col-span-6 p-4">
          <div className="w-full h-full rounded-[1.75rem] bg-gradient-to-b from-[#e3efff] via-[#ebf4ff] to-[#f4f8ff] dark:from-[#0d1e38] dark:via-[#0f1d33] dark:to-[#091322] p-8 sm:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden border border-blue-100/60 dark:border-blue-900/30 shadow-inner">
            
            {/* Top Heading */}
            <div className="pt-2 z-10">
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
                {slides[activeSlide].title}{' '}
                <span className="text-[#1a56db] dark:text-[#3880ff]">
                  {slides[activeSlide].highlight}
                </span>
              </h2>
            </div>

            {/* Center Orbital Visualization */}
            <div className="relative w-[340px] h-[340px] flex items-center justify-center my-auto select-none">
              
              {/* Outer Orbit Track (Ring 1) */}
              <div className="absolute w-[310px] h-[310px] rounded-full border border-blue-200/70 dark:border-blue-400/20" />
              
              {/* Middle Orbit Track (Ring 2) */}
              <div className="absolute w-[215px] h-[215px] rounded-full border border-blue-200/80 dark:border-blue-400/25" />
              
              {/* Inner Orbit Track (Ring 3) */}
              <div className="absolute w-[125px] h-[125px] rounded-full border border-blue-200/90 dark:border-blue-400/30" />

              {/* Glowing Pulse Aura behind center badge */}
              <div className="absolute w-28 h-28 rounded-full bg-blue-500/15 blur-xl animate-pulse" />

              {/* CENTER BADGE: Stylized Blue 3D Orb with Pencil/Platform 'P' Logo */}
              <div className="relative z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-[#1a56db] via-[#2563eb] to-[#3b82f6] shadow-[0_10px_25px_-5px_rgba(26,86,219,0.5)] border-2 border-white dark:border-slate-800 flex items-center justify-center text-white">
                {/* Stylized 'p' with pen nib shape matching the reference image */}
                <svg className="w-8 h-8 fill-current" viewBox="0 0 40 40">
                  <path d="M16 11C13.24 11 11 13.24 11 16V29C11 29.55 11.45 30 12 30C12.55 30 13 29.55 13 29V25H21C24.87 25 28 21.87 28 18C28 14.13 24.87 11 21 11H16ZM16 15H21C22.66 15 24 16.34 24 18C24 19.66 22.66 21 21 21H16V15Z" />
                  <circle cx="19.5" cy="18" r="1.5" fill="white" />
                  <path d="M19.5 19.5L19.5 22.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SATELLITE ORBITAL ICONS (Positioned on the concentric tracks) */}
              {/* ---------------------------------------------------- */}

              {/* 1. Edge Browser (Outer Track - Top Right) */}
              <div className="absolute top-2 right-24 transform translate-x-1/2 -translate-y-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-md p-1 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-6 h-6" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" fill="url(#edge_grad)" />
                    <path d="M32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C41.2 52 49 45.8 51.5 37.2C50 39.2 46.2 41 41.5 41C33 41 27.5 34.8 27.5 27.5C27.5 19.8 34.8 16.5 41.2 16.5C46.2 16.5 49.8 18.8 51.8 20.6C49 15.4 41 12 32 12Z" fill="white" fillOpacity="0.9" />
                    <defs>
                      <linearGradient id="edge_grad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0078D7" />
                        <stop offset="1" stopColor="#00C7FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* 2. Android Robot (Outer Track - Top Left) */}
              <div className="absolute top-16 left-3 transform -translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3DDC84">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5518.4482-.9994.9993-.9994.5528 0 1.0005.4476 1.0005.9994 0 .5517-.4477 1.0003-1.0005 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5518.4482-.9994.9993-.9994.5528 0 1.0005.4476 1.0005.9994 0 .5517-.4477 1.0003-1.0005 1.0003m11.4045-6.02l1.996-3.4565c.1356-.2364.0544-.5392-.181-.6754-.2363-.1352-.5381-.054-.6747.1813l-2.023 3.5042C15.3475 8.169 13.7225 7.784 12 7.784c-1.7225 0-3.3475.385-4.9978 1.091L4.9792 5.371c-.1366-.2353-.4384-.3165-.6747-.1813-.2354.1362-.3166.439-.181.6754l1.996 3.4565C2.5117 11.233.0844 14.86.0844 19.062h23.8312c0-4.202-2.4273-7.829-6.0319-9.7406"/>
                  </svg>
                </div>
              </div>

              {/* 3. Google Chrome (Outer Track - Left Middle) */}
              <div className="absolute bottom-28 left-0 transform -translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 2C6.48 2 2 6.48 2 12c0 .34.02.68.05 1.01L7.5 12c0-2.48 2.02-4.5 4.5-4.5h8.92A9.975 9.975 0 0 0 12 2z"/>
                    <path fill="#4285F4" d="M12 7.5c2.48 0 4.5 2.02 4.5 4.5 0 .38-.05.74-.14 1.09l4.58 7.93A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10v5.5z"/>
                    <path fill="#FBBC05" d="M12 16.5c-2.48 0-4.5-2.02-4.5-4.5 0-.34.04-.67.11-.99L3.03 8.08A9.96 9.96 0 0 0 2 12c0 5.52 4.48 10 10 10l4.47-7.74c-.7.46-1.55.74-2.47.74z"/>
                    <path fill="#34A853" d="M12 22c4.41 0 8.16-2.86 9.48-6.84L16.9 7.42A4.49 4.49 0 0 0 12 7.5v9h0c-.01 0 0 0 0 0l-4.47 5.5h4.47z"/>
                    <circle cx="12" cy="12" r="3.2" fill="white"/>
                    <circle cx="12" cy="12" r="2.4" fill="#1A73E8"/>
                  </svg>
                </div>
              </div>

              {/* 4. Apple Logo (Outer Track - Right Middle) */}
              <div className="absolute right-0 top-36 transform translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-4 h-4 fill-current text-black dark:text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.79-11.7-14.25-5.87-9.24-10.4-19.46-13.58-30.65-3.19-11.19-4.78-22.18-4.78-32.96 0-14.79 3.82-27.17 11.45-37.14 7.63-9.97 17.2-15.06 28.7-15.28 4.8 0 10.19 1.22 16.16 3.66 5.98 2.44 9.94 3.72 11.89 3.84 1.53-.12 5.67-1.46 12.44-4.02 6.76-2.56 12.39-3.72 16.89-3.48 12.52.87 22.42 5.6 29.7 14.19-10.9 6.64-16.23 15.69-16 27.13.22 9.04 3.63 16.59 10.22 22.65 6.6 6.05 14.43 9.49 23.51 10.3-2.29 6.86-5.06 13.55-8.33 20.07zM119.22 31.02c0-7.39 2.68-14.33 8.04-20.81 5.37-6.49 12-10.21 19.89-11.16.22 1.09.33 2.12.33 3.09 0 7.39-2.73 14.39-8.19 21.01-5.46 6.62-12.21 10.37-20.25 11.25-.11-1.09-.18-2.22-.18-3.38z" />
                  </svg>
                </div>
              </div>

              {/* 5. LinkedIn (Outer Track - Bottom Right) */}
              <div className="absolute bottom-2 right-14 transform translate-y-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#0077B5] shadow-md flex items-center justify-center text-white border-2 border-white dark:border-slate-800">
                  <span className="font-bold text-xs tracking-tighter">in</span>
                </div>
              </div>

              {/* 6. Outlook Mail (Middle Track - Top Left) */}
              <div className="absolute top-16 left-16 transform -translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0078D4] to-[#28A8EA] shadow-md flex items-center justify-center text-white p-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
              </div>

              {/* 7. Messenger Chat (Middle Track - Right) */}
              <div className="absolute top-24 right-10 transform translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00B2FF] via-[#006AFF] to-[#9900FF] shadow-md flex items-center justify-center text-white p-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.517 3.737 7.195V22l3.418-1.875c.91.252 1.87.39 2.845.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.066 12.443l-2.56-2.73-5 2.73 5.5-5.843 2.625 2.73 4.935-2.73-5.5 5.843z" />
                  </svg>
                </div>
              </div>

              {/* 8. Yahoo (Inner/Middle Track - Bottom) */}
              <div className="absolute bottom-12 left-28 transform translate-x-1/2 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-[#6001d2] shadow-md flex items-center justify-center text-white border border-white dark:border-slate-800">
                  <span className="font-bold text-[10px] tracking-tight">y!</span>
                </div>
              </div>

            </div>

            {/* Bottom Tagline & Carousel Indicators */}
            <div className="space-y-4 max-w-sm z-10 pb-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {slides[activeSlide].desc}
              </p>

              {/* Slider Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      activeSlide === idx
                        ? 'w-6 bg-[#1a56db] dark:bg-[#3880ff]'
                        : 'w-2 bg-blue-200 dark:bg-slate-700 hover:bg-blue-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Account Password" maxWidth="sm">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your registered email address and we will dispatch password recovery instructions.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="e.g. user@platform.edu"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1a56db]"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={forgotLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#1a56db] hover:bg-blue-700 rounded-lg shadow-md disabled:opacity-60"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
