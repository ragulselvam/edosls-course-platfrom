"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  FileCheck2,
  Building2,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

interface CollegeDashboardData {
  college: {
    id: number;
    name: string;
    code: string;
    domain?: string;
    contact_email?: string;
  };
  metrics: {
    total_students: number;
    active_students: number;
    total_courses: number;
    published_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    in_progress_enrollments: number;
    total_certificates: number;
    pass_rate: number;
    completion_rate: number;
  };
  course_enrollment_chart?: Array<{
    id: number;
    title: string;
    code: string;
    enrollments_count: number;
    avg_progress: number;
    completed_count: number;
  }>;
  assessment_chart?: Array<{
    id: number;
    title: string;
    assessment_type: string;
    attempts_count: number;
    avg_score: number;
    avg_percentage: number;
    passed_count: number;
  }>;
  recent_registrations?: Array<{
    roll_number: string;
    department: string;
    year_of_study: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
  }>;
}

export default function CollegeAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<CollegeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<CollegeDashboardData>("/api/reports/college-admin-dashboard");
      setData(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load campus dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Campus Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900/80 border border-blue-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3">
                <Building2 className="w-3.5 h-3.5" />
                {data?.college?.name || user?.college_name || "Campus Administration"}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Institutional Executive Dashboard
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                Real-time tracking of departmental cohort enrollments, timed proctored examinations, coding sandbox submissions, and verifiable credentials.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-sm font-medium border border-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
                Refresh
              </button>
              <Link
                href="/college-admin/students"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-sm font-semibold border border-blue-500/30 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Bulk Import
              </Link>
              <Link
                href="/college-admin/assessments"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Students */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {data?.metrics.active_students || 0} Active
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-400">Total Enrolled Students</h3>
            <p className="text-3xl font-extrabold text-white mt-1">
              {loading ? "..." : (data?.metrics.total_students || 0).toLocaleString()}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Department Cohorts</span>
              <Link href="/college-admin/students" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium">
                Directory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Published Courses */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {data?.metrics.published_courses || 0} Live
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-400">Curriculum Tracks</h3>
            <p className="text-3xl font-extrabold text-white mt-1">
              {loading ? "..." : data?.metrics.total_courses || 0}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Robotics & AI tracks</span>
              <Link href="/college-admin/courses" className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-medium">
                Courses <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Pass Rate */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {data?.metrics.completed_enrollments || 0} Finished
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-400">Examination Pass Rate</h3>
            <p className="text-3xl font-extrabold text-white mt-1">
              {loading ? "..." : `${data?.metrics.pass_rate || 0}%`}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Evaluated Tests</span>
              <Link href="/college-admin/results" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium">
                Submissions <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Certificates */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                QR Validated
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-400">Issued Certificates</h3>
            <p className="text-3xl font-extrabold text-white mt-1">
              {loading ? "..." : (data?.metrics.total_certificates || 0).toLocaleString()}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Credentials Vault</span>
              <Link href="/college-admin/certificates" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium">
                Issuance <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Popularity & Progress */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Course Enrollment & Progress Metrics
              </h2>
              <Link href="/college-admin/courses" className="text-xs text-blue-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-slate-500 py-6 text-center">Loading course analytics...</p>
              ) : data?.course_enrollment_chart && data.course_enrollment_chart.length > 0 ? (
                data.course_enrollment_chart.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{c.title}</span>
                      <span className="text-slate-400 font-medium">
                        {c.enrollments_count} Enrolled • {Math.round(c.avg_progress || 0)}% Avg Progress
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, c.avg_progress || 0))}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No enrolled courses data available.</p>
              )}
            </div>
          </div>

          {/* Assessment Performance */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Exam & Test Performance Benchmarks
              </h2>
              <Link href="/college-admin/assessments" className="text-xs text-emerald-400 hover:underline">
                Manage Exams
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-slate-500 py-6 text-center">Loading exam analytics...</p>
              ) : data?.assessment_chart && data.assessment_chart.length > 0 ? (
                data.assessment_chart.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{a.title}</p>
                      <p className="text-[11px] text-slate-400 uppercase font-mono mt-0.5">
                        {a.assessment_type} • {a.attempts_count} Attempts
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                        {Math.round(a.avg_percentage || 0)}% Avg Score
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No examination attempts logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Student Registrations */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Recent Cohort Registrations
            </h2>
            <Link href="/college-admin/students" className="text-xs text-indigo-400 hover:underline">
              View Full Student Roster ↗
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data?.recent_registrations && data.recent_registrations.length > 0 ? (
                  data.recent_registrations.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-medium text-white">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-400 font-semibold">{s.roll_number}</td>
                      <td className="py-2.5 px-3 text-slate-300">{s.department}</td>
                      <td className="py-2.5 px-3 text-slate-400">Year {s.year_of_study}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No recent student registrations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
