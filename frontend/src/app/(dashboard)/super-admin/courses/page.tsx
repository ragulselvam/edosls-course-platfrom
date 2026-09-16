"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  BookOpen,
  Plus,
  Search,
  Building2,
  Users,
  Award,
  Sparkles,
  Layers,
  Video,
  FileCode,
  CheckCircle2,
  Clock,
  UserCheck,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw,
  Edit3,
  Globe
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
  college_id?: number;
  college_name?: string;
  college_code?: string;
  trainer_id?: number;
  trainer_name?: string;
  trainer_email?: string;
  module_count?: number;
  content_count?: number;
  enrollment_count?: number;
  is_published: number | boolean;
  status?: string;
  visibility?: string;
  passing_percentage?: number;
  created_at?: string;
}

interface Trainer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  college_name: string;
  assigned_courses_count: number;
}

interface College {
  id: number;
  name: string;
  code: string;
}

export default function SuperAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 3-Step Course Builder Modal
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
  
  // Step 1 State
  const [step1Data, setStep1Data] = useState({
    title: "",
    code: "",
    description: "",
    category: "Robotics & AI Systems",
    level: "Intermediate",
    duration: "8 Weeks",
    thumbnail_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    college_id: "", // empty = Global / All Colleges
    batch: "All Batches",
    learning_objectives: "Master autonomous navigation, JetBot kinematic modeling, and neural network edge computing."
  });

  // Step 2 State (Curriculum Module & Lesson builder)
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [modulesList, setModulesList] = useState<Array<{ id?: number; title: string; contents: Array<{ title: string; content_type: string }> }>>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "document" | "code_snippet">("video");
  const [lessonUrl, setLessonUrl] = useState("");
  const [activeModuleIdx, setActiveModuleIdx] = useState<number>(0);

  // Step 3 State
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Trainer Assignment Modal
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [selectedCourseForTrainer, setSelectedCourseForTrainer] = useState<Course | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [assigningTrainer, setAssigningTrainer] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, trainersRes, collegesRes] = await Promise.all([
        api.get<Course[]>("/api/courses"),
        api.get<Trainer[]>("/api/courses/trainers"),
        api.get<College[]>("/api/colleges")
      ]);
      setCourses(coursesRes || []);
      setTrainers(trainersRes || []);
      setColleges(collegesRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load course studio telemetry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCourseBuilder = () => {
    setBuilderStep(1);
    setCreatedCourseId(null);
    setStep1Data({
      title: "",
      code: "",
      description: "",
      category: "Robotics & AI Systems",
      level: "Intermediate",
      duration: "8 Weeks",
      thumbnail_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
      college_id: "",
      batch: "All Batches",
      learning_objectives: "Master autonomous navigation, JetBot kinematic modeling, and neural network edge computing."
    });
    setModulesList([{ title: "Module 1: Foundations & Architecture", contents: [] }]);
    setActiveModuleIdx(0);
    setBuilderOpen(true);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Data.title.trim() || !step1Data.code.trim()) {
      showToast("Course Title and Unique Code are required", "warning");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        title: step1Data.title.trim(),
        code: step1Data.code.trim().toUpperCase(),
        description: step1Data.description,
        category: step1Data.category,
        level: step1Data.level,
        duration: step1Data.duration,
        thumbnail_url: step1Data.thumbnail_url,
        batch: step1Data.batch,
        learning_objectives: step1Data.learning_objectives,
        passing_percentage: passingPercentage,
        certificate_enabled: certificateEnabled,
        status: "draft"
      };

      if (step1Data.college_id) {
        payload.college_id = parseInt(step1Data.college_id);
        payload.visibility = "college";
      } else {
        payload.college_id = null;
        payload.visibility = "public";
      }

      const res = await api.post<Course>("/api/courses", payload);
      setCreatedCourseId(res.id);
      showToast("Course base created. Configure syllabus modules.", "success");
      setBuilderStep(2);
    } catch (err: any) {
      showToast(err.message || "Failed to initialize course", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim() || !createdCourseId) return;
    try {
      const res = await api.post<any>("/api/modules", {
        course_id: createdCourseId,
        title: moduleTitle.trim(),
        description: moduleDescription.trim(),
        sort_order: modulesList.length
      });
      setModulesList([...modulesList, { id: res.id, title: moduleTitle.trim(), contents: [] }]);
      setModuleTitle("");
      setModuleDescription("");
      setActiveModuleIdx(modulesList.length);
      showToast("Curriculum module added", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add module", "error");
    }
  };

  const handleAddLesson = async () => {
    if (!lessonTitle.trim() || !createdCourseId) return;
    const targetModule = modulesList[activeModuleIdx];
    try {
      let modId = targetModule.id;
      if (!modId) {
        // Fallback fetch modules
        const modRes = await api.get<any>(`/api/courses/${createdCourseId}`);
        if (modRes.modules && modRes.modules[activeModuleIdx]) {
          modId = modRes.modules[activeModuleIdx].id;
        }
      }

      if (modId) {
        await api.post("/api/content", {
          module_id: modId,
          title: lessonTitle.trim(),
          content_type: lessonType,
          video_url: lessonType === "video" ? lessonUrl : undefined,
          content_body: lessonType !== "video" ? lessonUrl : undefined,
          sort_order: targetModule.contents.length
        });
      }

      const updated = [...modulesList];
      updated[activeModuleIdx].contents.push({
        title: lessonTitle.trim(),
        content_type: lessonType
      });
      setModulesList(updated);
      setLessonTitle("");
      setLessonUrl("");
      showToast("Lesson content attached", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to attach lesson content", "error");
    }
  };

  const handleFinalPublish = async () => {
    if (!createdCourseId) return;
    try {
      setSaving(true);
      await api.put(`/api/courses/${createdCourseId}`, {
        title: step1Data.title,
        code: step1Data.code,
        category: step1Data.category,
        level: step1Data.level,
        duration: step1Data.duration,
        thumbnail_url: step1Data.thumbnail_url,
        passing_percentage: passingPercentage,
        certificate_enabled: certificateEnabled,
        status: isPublished ? "published" : "draft",
        visibility: step1Data.college_id ? "college" : "public"
      });
      showToast(
        isPublished
          ? "🎉 Course successfully published across the network!"
          : "Course saved as draft studio template.",
        "success"
      );
      setBuilderOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to publish course", "error");
    } finally {
      setSaving(false);
    }
  };

  const openTrainerModal = (course: Course) => {
    setSelectedCourseForTrainer(course);
    setSelectedTrainerId(course.trainer_id ? course.trainer_id.toString() : "");
    setTrainerNotes("");
    setTrainerModalOpen(true);
  };

  const handleAssignTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForTrainer) return;

    try {
      setAssigningTrainer(true);
      await api.post(`/api/courses/${selectedCourseForTrainer.id}/assign-trainer`, {
        trainer_id: selectedTrainerId ? parseInt(selectedTrainerId) : null,
        notes: trainerNotes
      });
      showToast("Trainer allocation updated with signed audit record", "success");
      setTrainerModalOpen(false);
      setSelectedCourseForTrainer(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to assign trainer", "error");
    } finally {
      setAssigningTrainer(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.del(`/api/courses/${courseToDelete.id}`);
      showToast("Course removed from studio", "success");
      setDeleteModalOpen(false);
      setCourseToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete course", "error");
    }
  };

  const categories = Array.from(new Set(courses.map((c) => c.category))).filter(Boolean);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.college_name && c.college_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.trainer_name && c.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === "all" || c.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Global Course Studio & Curriculum Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Figma LMS-style curriculum authoring, integrated AI/Python sandboxes, JetBot robotics presets, and faculty assignments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={openCourseBuilder}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Build New Course
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses by title, code, instructor, campus..."
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
              <option value="all">All Domains ({courses.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading curriculum studio...
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((c) => {
              const isPub = c.is_published === 1 || c.is_published === true;
              return (
                <div
                  key={c.id}
                  className="group rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    {/* Thumbnail banner */}
                    <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                      <img
                        src={c.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600"}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-blue-400 text-[11px] font-mono font-bold border border-blue-500/30 shadow-lg">
                          {c.code}
                        </span>
                        {c.college_code && c.college_code !== "ALL" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] font-semibold border border-slate-700">
                            {c.college_code}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 backdrop-blur-md text-blue-300 text-[11px] font-semibold border border-blue-400/30 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Global
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                            isPub
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-800/80 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {isPub ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                          {c.category || "Autonomous Systems"}
                        </span>
                        <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {c.description || "Comprehensive hands-on curriculum with autonomous robotics lab exercises."}
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
                          <p className="text-slate-500 text-[10px] font-medium">Students</p>
                          <p className="font-bold text-emerald-400 mt-0.5">{c.enrollment_count || 0}</p>
                        </div>
                      </div>

                      {/* Assigned Trainer Badge */}
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Faculty Lead</p>
                            <p className="font-semibold text-white truncate max-w-[140px]">
                              {c.trainer_name || "Not Assigned"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openTrainerModal(c)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 transition"
                        >
                          {c.trainer_id ? "Change" : "Assign"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-5 pt-0 flex items-center justify-between">
                    <Link
                      href={`/student/player/${c.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Player
                    </Link>
                    <button
                      onClick={() => {
                        setCourseToDelete(c);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No courses found matching current search.
            </div>
          )}
        </div>

        {/* 3-Step Course Creation Modal */}
        <Modal
          isOpen={builderOpen}
          onClose={() => setBuilderOpen(false)}
          title="Figma LMS-Style Course Studio Builder"
          subtitle={
            builderStep === 1
              ? "Step 1/3: Basic Course Metadata & Scope"
              : builderStep === 2
              ? "Step 2/3: Curriculum Modules & Interactive Lesson Content"
              : "Step 3/3: Certification Threshold & Network Publishing"
          }
          maxWidth="max-w-2xl"
        >
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            {[
              { step: 1, title: "1. Info & Targeting" },
              { step: 2, title: "2. Syllabus Architecture" },
              { step: 3, title: "3. Publish & Cert" }
            ].map((s) => (
              <div
                key={s.step}
                className={`flex items-center gap-2 text-xs font-semibold ${
                  builderStep === s.step
                    ? "text-blue-400"
                    : builderStep > s.step
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    builderStep === s.step
                      ? "bg-blue-600 text-white"
                      : builderStep > s.step
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {s.step}
                </div>
                <span>{s.title}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: Basic Info */}
          {builderStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous JetBot Robotics & Kinematics"
                  value={step1Data.title}
                  onChange={(e) => setStep1Data({ ...step1Data, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Course Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROB-301"
                    value={step1Data.code}
                    onChange={(e) => setStep1Data({ ...step1Data, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Institution
                  </label>
                  <select
                    value={step1Data.college_id}
                    onChange={(e) => setStep1Data({ ...step1Data, college_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Universal (All Colleges - Global)</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Domain / Category
                  </label>
                  <input
                    type="text"
                    value={step1Data.category}
                    onChange={(e) => setStep1Data({ ...step1Data, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Skill Level
                  </label>
                  <select
                    value={step1Data.level}
                    onChange={(e) => setStep1Data({ ...step1Data, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={step1Data.duration}
                    onChange={(e) => setStep1Data({ ...step1Data, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Course Synopsis & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of syllabus, practical labs, and learning outcomes..."
                  value={step1Data.description}
                  onChange={(e) => setStep1Data({ ...step1Data, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {saving ? "Creating..." : "Continue to Step 2"} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Curriculum Structure */}
          {builderStep === 2 && (
            <div className="space-y-5">
              {/* Modules list tab */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {modulesList.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveModuleIdx(idx)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      activeModuleIdx === idx
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.title} ({m.contents.length})
                  </button>
                ))}
              </div>

              {/* Add Module Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> Add New Module Section
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Module 2: Computer Vision & LiDAR Obstacle Avoidance"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    + Add Module
                  </button>
                </div>
              </div>

              {/* Add Lesson to Active Module */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  Attach Lesson to: {modulesList[activeModuleIdx]?.title}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Lesson title e.g. JetBot Motor Controller Script"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="col-span-2 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={lessonType}
                    onChange={(e: any) => setLessonType(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="document">Markdown Reading</option>
                    <option value="code_snippet">Interactive Sandbox</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      lessonType === "video"
                        ? "Video URL or YouTube stream link"
                        : "Markdown content or Python template boilerplate"
                    }
                    value={lessonUrl}
                    onChange={(e) => setLessonUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLesson}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/20 transition"
                  >
                    + Add Lesson
                  </button>
                </div>

                {/* Attached Lessons in Active Module */}
                <div className="space-y-1.5 pt-2">
                  {modulesList[activeModuleIdx]?.contents.map((cnt, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 font-medium">{cnt.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-blue-400 uppercase font-mono">
                        {cnt.content_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBuilderStep(1)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderStep(3)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5"
                >
                  Continue to Publishing <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Certification & Publishing */}
          {builderStep === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      Verifiable Certificate Issuance
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automatically generate tamper-proof certificates with QR validation upon course completion.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={certificateEnabled}
                    onChange={(e) => setCertificateEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Passing Percentage Threshold: <span className="text-blue-400 font-bold">{passingPercentage}%</span>
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Publish Live on Platform
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When enabled, students from designated colleges can instantly enroll and access lessons.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBuilderStep(2)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalPublish}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
                >
                  {saving ? "Finalizing..." : "Complete & Launch Course Studio"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Trainer Assignment */}
        <Modal
          isOpen={trainerModalOpen}
          onClose={() => setTrainerModalOpen(false)}
          title={`Faculty Allocation: ${selectedCourseForTrainer?.title}`}
          subtitle="Assign an authorized subject matter expert or lead instructor"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAssignTrainer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lead Trainer / Faculty
              </label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned (Open pool)</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id.toString()}>
                    {t.first_name} {t.last_name} ({t.college_name}) - {t.assigned_courses_count} Classes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Allocation Audit Notes
              </label>
              <textarea
                rows={2}
                placeholder="Reason or semester schedule notes for audit trail..."
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTrainerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigningTrainer}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
              >
                {assigningTrainer ? "Assigning..." : "Save Trainer Allocation"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteCourse}
          title={`Delete ${courseToDelete?.title}?`}
          message="This will permanently delete this course and all associated modules, contents, and quizzes from the studio."
          confirmText="Delete Course"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}
