"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  BookOpen,
  Award,
  Clock,
  Play,
  FileCheck2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Terminal,
  Bot,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface Enrollment {
  id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  category: string;
  level: string;
  duration: string;
  thumbnail_url: string;
  progress_percentage: number;
  status: string;
  certificate_id?: number;
  certificate_code?: string;
  enrolled_at: string;
}

interface Assessment {
  id: number;
  title: string;
  course_title: string;
  course_code: string;
  time_limit_minutes: number;
  passing_percentage: number;
  status: string; // Passed | Failed | Not Started
  has_attempted: boolean;
}

interface Result {
  id: number;
  assessment_title: string;
  course_title: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: number | boolean;
  evaluated_at: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollRes, assessRes, resultsRes] = await Promise.all([
        api.get<Enrollment[]>("/api/enrollments/my-courses"),
        api.get<Assessment[]>("/api/assessments"),
        api.get<Result[]>("/api/results/my-results")
      ]);
      setEnrollments(enrollRes || []);
      setAssessments(assessRes || []);
      setResults(resultsRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load learning hub", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeCourses = enrollments.filter((e) => e.status !== "completed");
  const completedCourses = enrollments.filter((e) => e.status === "completed" || e.progress_percentage >= 100);
  const earnedCerts = enrollments.filter((e) => e.certificate_code);

  return (
    <DashboardLayout requiredRoles={["student"]}>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Student Learning Center • {user?.college_name || "Campus Cohort"}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Welcome back, {user?.first_name || "Learner"}!
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                Continue your autonomous robotics curriculum, execute edge AI code in live Python 3.12 containers, and earn tamper-proof credentials.
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
                href="/student/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                Explore Courses
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-blue-400">In Progress</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{activeCourses.length}</p>
            <p className="text-xs text-slate-400 mt-1">Active Courses</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">100% Passed</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{completedCourses.length}</p>
            <p className="text-xs text-slate-400 mt-1">Completed Tracks</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-400">Exams</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{results.length}</p>
            <p className="text-xs text-slate-400 mt-1">Tests Evaluated</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-400">QR Validated</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{earnedCerts.length}</p>
            <p className="text-xs text-slate-400 mt-1">Diplomas Earned</p>
          </div>
        </div>

        {/* Continue Learning Active Courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-400" />
              Continue Learning
            </h2>
            <Link href="/student/my-courses" className="text-xs text-blue-400 hover:underline font-semibold">
              View All Enrolled Courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                Loading your enrolled courses...
              </div>
            ) : enrollments.length > 0 ? (
              enrollments.map((e) => (
                <div
                  key={e.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden hover:border-blue-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                      <img
                        src={e.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600"}
                        alt={e.course_title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Enrolled
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                          {e.course_title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Curriculum Progress</span>
                          <span className="text-blue-400 font-bold">{Math.round(e.progress_percentage || 0)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, e.progress_percentage || 0))}%` }}
                          />
                        </div>
                      </div>

                      {e.certificate_code && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                            <Award className="w-4 h-4" /> Certificate Issued
                          </span>
                          <Link
                            href={`/verify/${e.certificate_code}`}
                            target="_blank"
                            className="text-amber-400 hover:underline font-bold text-[11px]"
                          >
                            View ↗
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      href={`/student/player/${e.course_id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Resume Course Studio
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <p className="text-sm text-slate-400">You are not currently enrolled in any course tracks.</p>
                <Link
                  href="/student/browse"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Browse Campus Curriculum
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column: Upcoming Exams & Recent Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Exams */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Available Timed Assessments ({assessments.length})
            </h2>

            <div className="space-y-3">
              {assessments.length > 0 ? (
                assessments.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <h3 className="font-semibold text-white">{a.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {a.course_title} • Duration: <span className="text-blue-400 font-medium">{a.time_limit_minutes} Mins</span>
                      </p>
                    </div>
                    <Link
                      href={`/student/exam/${a.id}`}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md shadow-purple-600/20 shrink-0"
                    >
                      {a.has_attempted ? "Retake" : "Start Test"}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No upcoming examinations scheduled for your courses.
                </p>
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Recent Examination Results ({results.length})
            </h2>

            <div className="space-y-3">
              {results.length > 0 ? (
                results.slice(0, 4).map((r) => {
                  const isPass = r.passed === 1 || r.passed === true;
                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <h3 className="font-semibold text-white">{r.assessment_title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{r.course_title}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPass
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {r.score}/{r.max_score} ({Math.round(r.percentage)}%) • {isPass ? "Passed" : "Failed"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No test results evaluated yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
