"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  BookOpen,
  Search,
  Users,
  Award,
  Layers,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Globe,
  UserCheck
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: number;
  title: string;
  code: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: string;
  thumbnail_url?: string;
  trainer_name?: string;
  module_count?: number;
  content_count?: number;
  enrollment_count?: number;
  is_published: number | boolean;
  status?: string;
  visibility?: string;
  passing_percentage?: number;
}

export default function CollegeAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get<Course[]>("/api/courses");
      setCourses(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load campus curriculum", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.trainer_name && c.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-blue-400" />
              Campus Academic Curriculum & Tracks
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active autonomous robotics, AI agent architecture, and embedded systems courses available for student cohorts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCourses}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search curriculum tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading courses...
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((c) => (
              <div
                key={c.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden hover:border-blue-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={c.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600"}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-blue-400 text-[11px] font-mono font-bold border border-blue-500/30">
                        {c.code}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                        {c.category || "Robotics & AI"}
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                        {c.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {c.description || "Hands-on autonomous systems curriculum with live Python and JetBot simulator."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                      <div>
                        <p className="text-slate-500 text-[10px] font-medium">Modules</p>
                        <p className="font-bold text-slate-200 mt-0.5">{c.module_count || 1}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] font-medium">Lessons</p>
                        <p className="font-bold text-slate-200 mt-0.5">{c.content_count || 3}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] font-medium">Cohort</p>
                        <p className="font-bold text-emerald-400 mt-0.5">{c.enrollment_count || 0}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2 text-xs">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Faculty Lead</p>
                        <p className="font-semibold text-white truncate max-w-[180px]">
                          {c.trainer_name || "Assigned by Platform"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/60 pt-4">
                  <span className="text-xs text-slate-400 font-medium">{c.duration || "8 Weeks"}</span>
                  <Link
                    href={`/student/player/${c.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Studio
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No curriculum tracks found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
