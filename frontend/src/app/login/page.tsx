"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Sun,
  Moon,
  ShieldCheck,
  Building2,
  GraduationCap,
  Bot,
  ChevronDown,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, getDashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);

  // Prefetch routes and auto-redirect if already logged in
  useEffect(() => {
    router.prefetch('/super-admin');
    router.prefetch('/college-admin');
    router.prefetch('/student');
    router.prefetch('/trainer');

    if (isAuthenticated && user) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, user, router, getDashboardPath]);

  // Forgot Password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string, rolePassword = 'Password@123') => {
    if (isLoading) return;
    setEmail(roleEmail);
    setPassword(rolePassword);
    setLoadingRole(roleEmail);
    setIsLoading(true);
    try {
      await login(roleEmail, rolePassword);
    } catch {
      setIsLoading(false);
      setLoadingRole(null);
    }
  };

  const handleSocialClick = (provider: string) => {
    toast(`${provider} single sign-on is enabled for institutional authentication.`, 'info');
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
          Compatible with <span className="italic font-medium text-slate-700 dark:text-slate-200">Gmail</span>,{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">Outlook Web</span>,{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">LinkedIn</span> and{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">most web editors</span> for a smooth writing experience anywhere online.
        </>
      ),
    },
    {
      title: 'Learn Better',
      highlight: 'Everywhere',
      desc: (
        <>
          Integrated with <span className="italic font-medium text-slate-700 dark:text-slate-200">Python 3.12</span>,{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">ROS JetBot Robotics</span>,{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">PyTorch AI</span> and{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">Interactive Sandboxes</span> anywhere online.
        </>
      ),
    },
    {
      title: 'Certify Skills',
      highlight: 'Everywhere',
      desc: (
        <>
          Backed by <span className="italic font-medium text-slate-700 dark:text-slate-200">Cryptographic QR Codes</span>,{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">Multi-Tenant Colleges</span>, and{' '}
          <span className="italic font-medium text-slate-700 dark:text-slate-200">Global Verifiable Standards</span> anywhere online.
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#090d16] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#1d63ff] selection:text-white transition-colors duration-300">
      
      {/* Outer Card Window matching exact reference image */}
      <div className="w-full max-w-[1080px] bg-white dark:bg-[#0f172a] rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100/90 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Clean Login Form Container                  */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative bg-white dark:bg-[#0f172a]">
          
          {/* Top Left Branding Logo & Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/edsols-emblem.svg" alt="EDSOLS" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                EDSOLS
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </Link>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Center Form Section */}
          <div className="my-auto py-4 max-w-[360px] w-full mx-auto">
            
            {/* Blue Door / Arrow Icon with Crisp Background Grid */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3 flex items-center justify-center">
                
                {/* SVG Decorative Grid behind the icon */}
                <div className="absolute w-24 h-24 pointer-events-none opacity-60 dark:opacity-20 flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 20H80M0 40H80M0 60H80M20 0V80M40 0V80M60 0V80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="1 3" />
                  </svg>
                </div>

                {/* Royal Blue Rounded Square Icon Badge */}
                <div className="relative z-10 w-12 h-12 rounded-[14px] bg-[#1d63ff] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(29,99,255,0.35)]">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Login to your account!
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-normal">
                Enter your registered email address and password to login!
              </p>
            </div>

            {/* Login Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="eg. pixelcot@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1d63ff] focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1d63ff] focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password link */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#1d63ff] focus:ring-[#1d63ff] cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-semibold text-[#1d63ff] dark:text-blue-400 hover:underline transition-all"
                >
                  Forgot Password ?
                </button>
              </div>

              {/* Main Solid Blue Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#1d63ff] hover:bg-[#1554e0] text-white font-medium text-sm transition-all shadow-[0_4px_14px_rgba(29,99,255,0.35)] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading && !loadingRole ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating & Redirecting...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* "Or login with" Divider */}
            <div className="flex items-center my-4 gap-3">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-xs text-slate-400 font-normal">Or login with</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Social 3-Button Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Google')}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group cursor-pointer"
                title="Login with Google"
              >
                <svg className="w-4 h-4 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
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
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group cursor-pointer"
                title="Login with Apple"
              >
                <svg className="w-4 h-4 fill-current text-black dark:text-white group-hover:scale-105 transition-transform" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.79-11.7-14.25-5.87-9.24-10.4-19.46-13.58-30.65-3.19-11.19-4.78-22.18-4.78-32.96 0-14.79 3.82-27.17 11.45-37.14 7.63-9.97 17.2-15.06 28.7-15.28 4.8 0 10.19 1.22 16.16 3.66 5.98 2.44 9.94 3.72 11.89 3.84 1.53-.12 5.67-1.46 12.44-4.02 6.76-2.56 12.39-3.72 16.89-3.48 12.52.87 22.42 5.6 29.7 14.19-10.9 6.64-16.23 15.69-16 27.13.22 9.04 3.63 16.59 10.22 22.65 6.6 6.05 14.43 9.49 23.51 10.3-2.29 6.86-5.06 13.55-8.33 20.07zM119.22 31.02c0-7.39 2.68-14.33 8.04-20.81 5.37-6.49 12-10.21 19.89-11.16.22 1.09.33 2.12.33 3.09 0 7.39-2.73 14.39-8.19 21.01-5.46 6.62-12.21 10.37-20.25 11.25-.11-1.09-.18-2.22-.18-3.38z" />
                </svg>
              </button>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={() => handleSocialClick('Microsoft')}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-sm group cursor-pointer"
                title="Login with Microsoft"
              >
                <svg className="w-4 h-4 group-hover:scale-105 transition-transform" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </button>
            </div>

            {/* Quick Demo Credentials Toggle (Convenient Testing Helper) */}
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowDemoProfiles(!showDemoProfiles)}
                className="w-full flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1d63ff]" /> Demo Roles Quick Fill
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoProfiles ? 'rotate-180' : ''}`} />
              </button>

              {showDemoProfiles && (
                <div className="grid grid-cols-2 gap-2 mt-2 animate-in fade-in duration-150">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin('ragul@edsols.in', 'edu_edsols2026')}
                    className="p-1.5 px-2 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 text-left hover:bg-blue-100/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      {loadingRole === 'ragul@edsols.in' ? (
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                      <span>{loadingRole === 'ragul@edsols.in' ? 'Signing in...' : 'Super Admin (Ragul)'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin('karthik_v@edsols.in', 'edu_edsols2026')}
                    className="p-1.5 px-2 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 text-left hover:bg-blue-100/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      {loadingRole === 'karthik_v@edsols.in' ? (
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                      <span>{loadingRole === 'karthik_v@edsols.in' ? 'Signing in...' : 'Super Admin (Karthik)'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin('admin@ait.edu')}
                    className="p-1.5 px-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 text-left hover:bg-emerald-100/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      {loadingRole === 'admin@ait.edu' ? (
                        <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      <span>{loadingRole === 'admin@ait.edu' ? 'Signing in...' : 'College Admin'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin('dr.arun@platform.edu')}
                    className="p-1.5 px-2 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 text-left hover:bg-amber-100/50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      {loadingRole === 'dr.arun@platform.edu' ? (
                        <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <Bot className="w-3 h-3 text-amber-600 shrink-0" />
                      )}
                      <span>{loadingRole === 'dr.arun@platform.edu' ? 'Signing in...' : 'Trainer'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin('student1@ait.edu')}
                    className="p-1.5 px-2 rounded-lg border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 text-left hover:bg-purple-100/50 transition-all cursor-pointer col-span-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      {loadingRole === 'student1@ait.edu' ? (
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <GraduationCap className="w-3 h-3 text-purple-600 shrink-0" />
                      )}
                      <span>{loadingRole === 'student1@ait.edu' ? 'Signing in...' : 'Student'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

          </div>

          <div className="text-center text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} EDSOLS Innovations Private Limited. All rights reserved.
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Soft Pastel Sky-Blue Orbital Hero Showcase */}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:col-span-6 p-3">
          <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-[#d9ebff] via-[#eaf4ff] to-[#f5f9ff] dark:from-[#0d1a2d] dark:via-[#0c1626] dark:to-[#080f1a] p-8 sm:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden border border-blue-100/60 dark:border-blue-900/20">
            
            {/* Top Heading */}
            <div className="pt-2 z-10">
              <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
                {slides[activeSlide].title}{' '}
                <span className="text-[#1d63ff] dark:text-[#3880ff]">
                  {slides[activeSlide].highlight}
                </span>
              </h2>
            </div>

            {/* Center Orbital Visualization Matching Image Layout */}
            <div className="relative w-[340px] h-[340px] flex items-center justify-center my-auto select-none">
              
              {/* Outer Ring 4 */}
              <div className="absolute w-[290px] h-[290px] rounded-full border border-blue-200/60 dark:border-blue-400/15" />
              
              {/* Middle Ring 3 */}
              <div className="absolute w-[210px] h-[210px] rounded-full border border-blue-200/70 dark:border-blue-400/20" />
              
              {/* Inner Ring 2 */}
              <div className="absolute w-[130px] h-[130px] rounded-full border border-blue-200/80 dark:border-blue-400/25" />

              {/* Glowing Aura behind center */}
              <div className="absolute w-28 h-28 rounded-full bg-blue-500/20 blur-xl animate-pulse" />

              {/* CENTER HUB: Large 3D Blue Elevated Orb with Stylized 'p' Pen Logo */}
              <div className="relative z-20 w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#2b72ff] to-[#1253ea] shadow-[0_12px_30px_rgba(29,99,255,0.45)] border-2 border-white dark:border-slate-800 flex items-center justify-center text-white">
                {/* Exact Stylized Pen 'P' Logo */}
                <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                  <path d="M12 9C9.79086 9 8 10.7909 8 13V27C8 27.5523 8.44772 28 9 28C9.55228 28 10 27.5523 10 27V22H18C22.4183 22 26 18.4183 26 14C26 9.58172 22.4183 9 18 9H12ZM12 13H18C20.2091 13 22 14.7909 22 17C22 19.2091 20.2091 21 18 21H12V13Z" fill="white"/>
                  <circle cx="17" cy="17" r="1.8" fill="white"/>
                  <path d="M17 19.5L17 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SATELLITE ORBITAL ICONS AT EXACT IMAGE POSITIONS     */}
              {/* ---------------------------------------------------- */}

              {/* 1. Microsoft Edge (Track 4 - Top-Right of Center) */}
              <div className="absolute top-4 right-20 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" fill="url(#edge_grad_2)" />
                    <path d="M32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C41.2 52 49 45.8 51.5 37.2C50 39.2 46.2 41 41.5 41C33 41 27.5 34.8 27.5 27.5C27.5 19.8 34.8 16.5 41.2 16.5C46.2 16.5 49.8 18.8 51.8 20.6C49 15.4 41 12 32 12Z" fill="white" fillOpacity="0.9" />
                    <defs>
                      <linearGradient id="edge_grad_2" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0078D7" />
                        <stop offset="1" stopColor="#00C7FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* 2. Android Robot (Track 4 - Top-Left) */}
              <div className="absolute top-16 left-3 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3DDC84">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5518.4482-.9994.9993-.9994.5528 0 1.0005.4476 1.0005.9994 0 .5517-.4477 1.0003-1.0005 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5518.4482-.9994.9993-.9994.5528 0 1.0005.4476 1.0005.9994 0 .5517-.4477 1.0003-1.0005 1.0003m11.4045-6.02l1.996-3.4565c.1356-.2364.0544-.5392-.181-.6754-.2363-.1352-.5381-.054-.6747.1813l-2.023 3.5042C15.3475 8.169 13.7225 7.784 12 7.784c-1.7225 0-3.3475.385-4.9978 1.091L4.9792 5.371c-.1366-.2353-.4384-.3165-.6747-.1813-.2354.1362-.3166.439-.181.6754l1.996 3.4565C2.5117 11.233.0844 14.86.0844 19.062h23.8312c0-4.202-2.4273-7.829-6.0319-9.7406"/>
                  </svg>
                </div>
              </div>

              {/* 3. Google Chrome (Track 4 - Lower-Left) */}
              <div className="absolute bottom-24 left-4 z-10 hover:scale-110 transition-transform cursor-pointer">
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

              {/* 4. Apple Logo (Track 4 - Right-Middle) */}
              <div className="absolute right-3 top-36 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md p-1.5 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-4 h-4 fill-current text-black dark:text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.79-11.7-14.25-5.87-9.24-10.4-19.46-13.58-30.65-3.19-11.19-4.78-22.18-4.78-32.96 0-14.79 3.82-27.17 11.45-37.14 7.63-9.97 17.2-15.06 28.7-15.28 4.8 0 10.19 1.22 16.16 3.66 5.98 2.44 9.94 3.72 11.89 3.84 1.53-.12 5.67-1.46 12.44-4.02 6.76-2.56 12.39-3.72 16.89-3.48 12.52.87 22.42 5.6 29.7 14.19-10.9 6.64-16.23 15.69-16 27.13.22 9.04 3.63 16.59 10.22 22.65 6.6 6.05 14.43 9.49 23.51 10.3-2.29 6.86-5.06 13.55-8.33 20.07zM119.22 31.02c0-7.39 2.68-14.33 8.04-20.81 5.37-6.49 12-10.21 19.89-11.16.22 1.09.33 2.12.33 3.09 0 7.39-2.73 14.39-8.19 21.01-5.46 6.62-12.21 10.37-20.25 11.25-.11-1.09-.18-2.22-.18-3.38z" />
                  </svg>
                </div>
              </div>

              {/* 5. LinkedIn (Track 4 - Bottom-Right) */}
              <div className="absolute bottom-2 right-14 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#0077B5] shadow-md flex items-center justify-center text-white border-2 border-white dark:border-slate-800">
                  <span className="font-bold text-xs tracking-tighter">in</span>
                </div>
              </div>

              {/* 6. Outlook Mail (Track 3 - Top-Left) */}
              <div className="absolute top-16 left-16 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0078D4] to-[#28A8EA] shadow-md flex items-center justify-center text-white p-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
              </div>

              {/* 7. Messenger Chat (Track 3 - Top-Right) */}
              <div className="absolute top-24 right-10 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00B2FF] via-[#006AFF] to-[#9900FF] shadow-md flex items-center justify-center text-white p-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.517 3.737 7.195V22l3.418-1.875c.91.252 1.87.39 2.845.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.066 12.443l-2.56-2.73-5 2.73 5.5-5.843 2.625 2.73 4.935-2.73-5.5 5.843z" />
                  </svg>
                </div>
              </div>

              {/* 8. Yahoo (Track 3/2 - Bottom-Left) */}
              <div className="absolute bottom-12 left-28 z-10 hover:scale-110 transition-transform cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-[#6001d2] shadow-md flex items-center justify-center text-white border border-white dark:border-slate-800">
                  <span className="font-bold text-[10px] tracking-tight">y!</span>
                </div>
              </div>

            </div>

            {/* Bottom Tagline & Exact Carousel Indicator Bars */}
            <div className="space-y-3.5 max-w-xs sm:max-w-sm z-10 pb-1">
              <p className="text-[12px] text-slate-500 dark:text-slate-300 leading-relaxed font-normal">
                {slides[activeSlide].desc}
              </p>

              {/* Indicator Bars */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-[3.5px] rounded-full transition-all duration-300 ${
                      activeSlide === idx
                        ? 'w-6 bg-[#1d63ff] dark:bg-[#3880ff]'
                        : 'w-3.5 bg-[#bfdbfe] dark:bg-slate-700 hover:bg-blue-300'
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#1d63ff]"
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
              className="px-4 py-2 text-xs font-bold text-white bg-[#1d63ff] hover:bg-blue-700 rounded-lg shadow-md disabled:opacity-60"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
