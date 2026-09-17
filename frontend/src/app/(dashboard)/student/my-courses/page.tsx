"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  BookOpen,
  Search,
  Play,
  Award,
  Clock,
  RefreshCw,
  CheckCircle2,
  ExternalLink
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

export default function StudentMyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "in_progress" | "completed">("all");
  const { showToast } = useToast();

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await api.get<Enrollment[]>("/api/enrollments/my-courses");
      setEnrollments(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load enrolled courses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const filtered = enrollments.filter((e) => {
    const matchesSearch =
      e.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.course_code.toLowerCase().includes(searchTerm.toLowerCase());

    const isCompleted = e.status === "completed" || e.progress_percentage >= 100;
    if (filterTab === "in_progress") return matchesSearch && !isCompleted;
    if (filterTab === "completed") return matchesSearch && isCompleted;

    return matchesSearch;
  });

  return (
    <DashboardLayout requiredRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-blue-400" />
              My Enrolled Curriculum Tracks
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track your module completions, code sandbox executions, and certificate milestones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEnrollments}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <Link
              href="/student/browse"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              + Enroll In New Course
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search my courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Tracks" },
              { id: "in_progress", label: "In Progress" },
              { id: "completed", label: "Completed" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterTab === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading courses...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((e) => {
              const isCompleted = e.status === "completed" || e.progress_percentage >= 100;
              return (
                <div
                  key={e.id}
                  className="group rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden hover:border-blue-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                      <img
                        src={e.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600"}
                        alt={e.course_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Certified
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {isCompleted ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                          {e.category || "Autonomous Systems"}
                        </span>
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                          {e.course_title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Course Completion</span>
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
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                            <Award className="w-4 h-4" /> Certificate Ready
                          </span>
                          <Link
                            href={`/verify/${e.certificate_code}`}
                            target="_blank"
                            className="text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                          >
                            Verify <ExternalLink className="w-3 h-3" />
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
                      {isCompleted ? "Review Course Modules" : "Resume Course Player"}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No courses matching criteria.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
