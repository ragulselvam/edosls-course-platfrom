"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  BookOpen,
  Users,
  Award,
  FileCheck2,
  RefreshCw,
  Eye,
  ChevronRight,
  Clock,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: number;
  title: string;
  code: string;
  category: string;
  enrollment_count?: number;
  module_count?: number;
  thumbnail_url?: string;
}

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Course[]>("/api/courses");
      setCourses(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load assigned curriculum", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerData();
  }, []);

  return (
    <DashboardLayout requiredRoles={["trainer", "college_admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-blue-950 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Faculty Trainer Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Welcome, Professor {user?.first_name || "Trainer"}!
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                Manage your allocated course cohorts, supervise live Python sandbox executions, and inspect examination grading streams.
              </p>
            </div>
            <button
              onClick={fetchTrainerData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-sm font-medium border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Courses Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            My Allocated Classes & Course Studio ({courses.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
                Loading your assigned classes...
              </div>
            ) : courses.length > 0 ? (
              courses.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden hover:border-indigo-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                      <img
                        src={c.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600"}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-indigo-300 text-[11px] font-mono font-bold border border-indigo-500/30">
                          {c.code}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 flex items-center justify-between text-xs text-slate-300">
                      <span>{c.module_count || 1} Modules</span>
                      <span className="font-bold text-emerald-400">{c.enrollment_count || 0} Students Enrolled</span>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      href={`/student/player/${c.id}`}
                      target="_blank"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Studio Player
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
                No classes currently allocated to your instructor account.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
