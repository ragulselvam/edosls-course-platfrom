"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { NotificationItem } from '@/types';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  Building2,
  GraduationCap,
  X,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface TopNavbarProps {
  onOpenMobileSidebar?: () => void;
}

export function TopNavbar({ onOpenMobileSidebar }: TopNavbarProps) {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get<{ notifications: NotificationItem[] }>('/api/notifications')
      .then((res) => {
        const list = res.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      })
      .catch(() => {});
  }, [user]);

  const markAllNotificationsRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const getRoleBadge = () => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
        </span>
      );
    }
    if (role === 'college_admin' || role === 'trainer') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Building2 className="w-3.5 h-3.5" /> {role === 'trainer' ? 'Faculty Trainer' : 'College Admin'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
        <GraduationCap className="w-3.5 h-3.5" /> Student
      </span>
    );
  };

  const getBreadcrumbTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'Dashboard';
    return last.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const searchItems = [
    { title: 'Global Dashboard', href: '/super-admin', role: 'super_admin' },
    { title: 'Institutions & Colleges', href: '/super-admin/colleges', role: 'super_admin' },
    { title: 'Course Studio Curriculum', href: '/super-admin/courses', role: 'super_admin' },
    { title: 'Trainer Allocation', href: '/super-admin/trainers', role: 'super_admin' },
    { title: 'College Dashboard', href: '/college-admin', role: 'college_admin' },
    { title: 'Student Roster', href: '/college-admin/students', role: 'college_admin' },
    { title: 'Curriculum & Classes', href: '/college-admin/courses', role: 'college_admin' },
    { title: 'Examination Management', href: '/college-admin/assessments', role: 'college_admin' },
    { title: 'Student Learning Hub', href: '/student', role: 'student' },
    { title: 'My Enrolled Courses', href: '/student/my-courses', role: 'student' },
    { title: 'Browse Course Catalog', href: '/student/browse', role: 'student' },
    { title: 'Digital Certificates', href: '/student/certificates', role: 'student' },
    { title: 'Certificate Verifier', href: '/verify', role: 'all' },
  ];

  const filteredSearch = searchItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 px-4 lg:px-8 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Left Side: Mobile Menu + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 truncate">
            {getRoleBadge()}
            <span className="text-sm font-bold text-[var(--text-primary)] truncate">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:border-blue-500/40 hover:text-[var(--text-primary)] transition-all shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Quick search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[10px] font-mono border border-[var(--border-color)] text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)] transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)] transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-secondary)]" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                  <div className="font-bold text-sm text-[var(--text-primary)]">Notifications</div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-500 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)] mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`py-2.5 px-1 ${n.is_read ? 'opacity-70' : 'font-medium'}`}>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{n.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(user?.first_name?.[0] || 'U') + (user?.last_name?.[0] || '')}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[120px]">
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </div>
                <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {(user?.role_name || 'Member').replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95"
                onClick={() => setIsProfileOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</div>
                </div>

                <Link
                  href={role === 'student' ? '/student/profile' : `/${role?.replace('_', '-')}/settings`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </Link>

                <Link
                  href="/verify"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Credential Verifier
                </Link>

                <div className="my-1 border-t border-[var(--border-color)]" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} maxWidth="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platform routes, courses, modules..."
              className="w-full pl-11 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-[var(--border-color)]/30">
            {filteredSearch.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsSearchOpen(false);
                  router.push(item.href);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] text-left transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  {item.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
