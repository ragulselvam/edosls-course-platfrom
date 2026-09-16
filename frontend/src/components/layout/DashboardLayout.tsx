"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { RoleName } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
  requiredRoles?: RoleName[];
}

export function DashboardLayout({ children, allowedRoles, requiredRoles }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  const effectiveRoles = requiredRoles || allowedRoles;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && effectiveRoles && role && !effectiveRoles.includes(role)) {
      // Role mismatch - route to proper dashboard
      if (role === 'super_admin') router.push('/super-admin');
      else if (role === 'college_admin' || role === 'trainer') router.push('/college-admin');
      else if (role === 'student') router.push('/student');
    }
  }, [user, role, isLoading, effectiveRoles, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <Sidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
