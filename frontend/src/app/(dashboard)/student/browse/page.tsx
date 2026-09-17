"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  BookOpen,
  Search,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

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
}

export default function StudentBrowseCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const router = useRouter();
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, myEnrollments] = await Promise.all([
        api.get<Course[]>("/api/courses"),
        api.get<any[]>("/api/enrollments/my-courses")
      ]);
      setCourses(coursesRes || []);
      const setIds = new Set((myEnrollments || []).map((e) => e.course_id));
      setEnrolledIds(setIds);
    } catch (err: any) {
      showToast(err.message || "Failed to load course catalog", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrollingId(courseId);
      await api.post("/api/enrollments/register", { course_id: courseId });
      showToast("🎉 Enrolled successfully! Launching course studio...", "success");
      setTimeout(() => {
        router.push(`/student/player/${courseId}`);
      }, 600);
    } catch (err: any) {
      showToast(err.message || "Enrollment failed", "error");
      setEnrollingId(null);
    }
  };

  const categories = Array.from(new Set(courses.map((c) => c.category))).filter(Boolean);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === "all" || c.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout requiredRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Academic Curriculum Catalog
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select and self-enroll into cutting-edge autonomous robotics, computer vision, and neural edge computing courses.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog by title, keyword, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Disciplines ({courses.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading curriculum catalog...
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((c) => {
              const isEnrolled = enrolledIds.has(c.id);
              return (
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
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Certificate
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] font-semibold border border-slate-700">
                          {c.level || "Intermediate"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                          {c.category || "Autonomous Robotics"}
                        </span>
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {c.description || "Master autonomous navigation, kinematic models, and neural edge deployment."}
                      </p>

                      <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                        <div>
                          <p className="text-slate-500 text-[10px] font-medium">Duration</p>
                          <p className="font-bold text-slate-200 mt-0.5">{c.duration || "8 Weeks"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-medium">Certification</p>
                          <p className="font-bold text-emerald-400 mt-0.5">Verified</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {isEnrolled ? (
                      <button
                        onClick={() => router.push(`/student/player/${c.id}`)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Continue In Player
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        disabled={enrollingId === c.id}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {enrollingId === c.id ? "Enrolling..." : "Enroll Now (Instant Access)"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No courses found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
