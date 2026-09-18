"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Building2,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Activity,
  ShieldCheck,
  GraduationCap,
  ArrowUpRight,
  ExternalLink,
  Search,
  Sparkles,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  metrics: {
    total_colleges: number;
    active_colleges: number;
    total_students: number;
    total_courses: number;
    published_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    total_certificates: number;
    global_completion_rate: number;
  };
  colleges_breakdown: Array<{
    id: number;
    name: string;
    code: string;
    is_active: number;
    student_count: number;
    course_count: number;
    enrollment_count: number;
    certificate_count: number;
  }>;
  recent_audits: Array<{
    id: number;
    action: string;
    resource_type: string;
    resource_id: string;
    first_name: string;
    last_name: string;
    user_email: string;
    college_name: string;
    created_at: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<DashboardData>("/api/reports/super-admin-dashboard");
      setData(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load super admin telemetry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredColleges = data?.colleges_breakdown?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 border border-blue-500/20 p-8 shadow-xl text-white">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white mb-3 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                Multi-Tenant Governance Console
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Global Platform Executive Overview
              </h1>
              <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                Real-time governance telemetry across connected institutions, student cohorts, AI/robotics studios, and tamper-proof certificate verifications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition shadow-sm backdrop-blur-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Telemetry
              </button>
              <Link
                href="/super-admin/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 text-sm font-semibold shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                Course Studio
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Colleges */}
          <div className="group relative rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md dark:shadow-lg hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                {data?.metrics?.active_colleges || 0} Active
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Institutions Connected</h3>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loading ? "..." : data?.metrics?.total_colleges || 0}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Managed Campuses</span>
              <Link href="/super-admin/colleges" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 font-semibold">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Students */}
          <div className="group relative rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md dark:shadow-lg hover:border-emerald-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                100% Isolated
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Enrolled Students</h3>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loading ? "..." : (data?.metrics?.total_students || 0).toLocaleString()}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Active Cohorts</span>
              <Link href="/super-admin/students" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 font-semibold">
                Directory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Courses */}
          <div className="group relative rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md dark:shadow-lg hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200/80 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                {data?.metrics?.published_courses || 0} Published
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Curriculum Catalog</h3>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loading ? "..." : data?.metrics?.total_courses || 0}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Robotics & AI tracks</span>
              <Link href="/super-admin/courses" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center gap-1 font-semibold">
                Studio <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Certificates */}
          <div className="group relative rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-md dark:shadow-lg hover:border-amber-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                {data?.metrics?.global_completion_rate || 0}% Completion
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifiable Certificates</h3>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loading ? "..." : (data?.metrics?.total_certificates || 0).toLocaleString()}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Cryptographic QR</span>
              <Link href="/verify" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 inline-flex items-center gap-1 font-semibold">
                Verify Hub <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Institutional Breakdown Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Institutions & Campus Allocations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Isolated tenant databases, allocated faculty trainers, and student capacity.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition w-56"
                />
              </div>
              <Link
                href="/super-admin/colleges"
                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30 text-xs font-semibold border border-blue-200 dark:border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                + Add College
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Issued Certs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Loading institution records...
                    </td>
                  </tr>
                ) : filteredColleges && filteredColleges.length > 0 ? (
                  filteredColleges.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {c.code.slice(0, 2)}
                        </div>
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs border border-slate-200 dark:border-slate-700">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {c.student_count?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.course_count || 0} Courses
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {c.certificate_count || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/super-admin/colleges`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition inline-flex items-center"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No institutions match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Immutable Platform Audit Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every administrative mutation, course publishing, and grading action is cryptographically signed.
              </p>
            </div>
            <Link
              href="/super-admin/reports"
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
            >
              View Full Logs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Loading audit events...</p>
            ) : data?.recent_audits && data.recent_audits.length > 0 ? (
              data.recent_audits.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:border-slate-700 transition flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-mono font-bold text-[10px]">
                      {log.action}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {log.first_name || "System"} {log.last_name || "Admin"}
                        <span className="text-slate-500 dark:text-slate-400 font-normal"> ({log.user_email || "system"})</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        Target: <span className="text-slate-700 dark:text-slate-300 font-medium">{log.resource_type} #{log.resource_id}</span> • Campus: <span className="text-blue-600 dark:text-blue-400 font-medium">{log.college_name || "Platform Global"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No recent audit records found.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
