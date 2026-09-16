"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  CheckSquare,
  Trophy,
  Award,
  BarChart3,
  Bell,
  Settings,
  User as UserIcon,
  PlayCircle,
  FileText,
  Bot,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, role } = useAuth();

  const getNavLinks = () => {
    if (role === 'super_admin') {
      return [
        { section: 'GLOBAL PLATFORM' },
        { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
        { label: 'Institutions', href: '/super-admin/colleges', icon: Building2 },
        { label: 'College Admins', href: '/super-admin/admins', icon: Users },
        { label: 'Student Directory', href: '/super-admin/students', icon: GraduationCap },
        { label: 'Course Studio', href: '/super-admin/courses', icon: BookOpen },
        { label: 'Trainer Allocation', href: '/super-admin/trainers', icon: Bot },
        { label: 'Reports & Audits', href: '/super-admin/reports', icon: BarChart3 },
        { label: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
      ];
    }

    if (role === 'college_admin' || role === 'trainer') {
      return [
        { section: 'COLLEGE PORTAL' },
        { label: 'Dashboard', href: '/college-admin', icon: LayoutDashboard },
        { label: 'Students Roster', href: '/college-admin/students', icon: GraduationCap },
        { label: 'Curriculum & Classes', href: '/college-admin/courses', icon: BookOpen },
        { label: 'Examinations', href: '/college-admin/assessments', icon: CheckSquare },
        { label: 'Results & Grading', href: '/college-admin/results', icon: Trophy },
        { label: 'Certificates', href: '/college-admin/certificates', icon: Award },
        { label: 'Announcements', href: '/college-admin/notifications', icon: Bell },
        { label: 'College Settings', href: '/college-admin/settings', icon: Settings },
      ];
    }

    // Default to student
    return [
      { section: 'LEARNER PORTAL' },
      { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
      { label: 'My Courses', href: '/student/my-courses', icon: PlayCircle },
      { label: 'Course Catalog', href: '/student/browse', icon: BookOpen },
      { label: 'Assignments', href: '/student/assignments', icon: FileText },
      { label: 'Examinations', href: '/student/assessments', icon: CheckSquare },
      { label: 'Results & Grades', href: '/student/results', icon: Trophy },
      { label: 'Certificates', href: '/student/certificates', icon: Award },
      { label: 'Notifications', href: '/student/notifications', icon: Bell },
      { label: 'My Profile', href: '/student/profile', icon: UserIcon },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border-color)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <img src="/logo.png" alt="NEXUS" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">NEXUS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">LMS</span>
              </div>
              <p className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider">AI & ROBOTICS</p>
            </div>
          </Link>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* College Badge */}
        {user?.college_name && (
          <div className="mx-3.5 mt-3.5 px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <div className="text-xs font-bold text-blue-500 truncate">{user.college_name}</div>
            <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              {(user.role_name || 'Member').replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navLinks.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={idx}
                  className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest px-3 pt-3 pb-1"
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href || (item.href !== '/super-admin' && item.href !== '/college-admin' && item.href !== '/student' && pathname?.startsWith(item.href!));

            return (
              <Link
                key={idx}
                href={item.href!}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Mini Bar */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/40">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {(user?.first_name?.[0] || 'U') + (user?.last_name?.[0] || '')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                {user ? `${user.first_name} ${user.last_name}` : 'Demo User'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
