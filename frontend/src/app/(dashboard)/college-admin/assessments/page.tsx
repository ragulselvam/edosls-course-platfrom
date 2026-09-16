"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  FileCheck2,
  Plus,
  Search,
  Clock,
  Award,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  Code2,
  FileQuestion,
  Layers,
  Trash2,
  ChevronRight,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Assessment {
  id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  title: string;
  description?: string;
  assessment_type: string;
  time_limit_minutes: number;
  passing_percentage: number;
  max_attempts: number;
  question_count?: number;
  total_points?: number;
  is_published: number | boolean;
  created_at: string;
}

interface Course {
  id: number;
  title: string;
  code: string;
}

interface QuestionDraft {
  question_text: string;
  question_type: "mcq" | "coding";
  options: string[];
  correct_answers: string[];
  code_template?: string;
  points: number;
}

export default function CollegeAdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState<"quiz" | "exam" | "final">("exam");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [isPublished, setIsPublished] = useState(true);

  // Question Bank Builder in Modal
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: "What is the primary objective of the JetBot differential drive kinematic controller?",
      question_type: "mcq",
      options: [
        "Translate linear and angular velocity commands to individual wheel RPMs",
        "Control battery charging cycle",
        "Regulate Wi-Fi transmission frequency",
        "Process camera raw frames into JPEG"
      ],
      correct_answers: ["Translate linear and angular velocity commands to individual wheel RPMs"],
      points: 10
    }
  ]);

  const [currentQText, setCurrentQText] = useState("");
  const [currentQType, setCurrentQType] = useState<"mcq" | "coding">("mcq");
  const [currentOpt1, setCurrentOpt1] = useState("");
  const [currentOpt2, setCurrentOpt2] = useState("");
  const [currentOpt3, setCurrentOpt3] = useState("");
  const [currentOpt4, setCurrentOpt4] = useState("");
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [currentCodeTemplate, setCurrentCodeTemplate] = useState("def solve_kinematics(v, omega):\n    # Return [left_rpm, right_rpm]\n    pass");
  const [currentPoints, setCurrentPoints] = useState(10);

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assessRes, coursesRes] = await Promise.all([
        api.get<Assessment[]>("/api/assessments"),
        api.get<Course[]>("/api/courses")
      ]);
      setAssessments(assessRes || []);
      setCourses(coursesRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load examination bank", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddQuestionToBank = () => {
    if (!currentQText.trim()) {
      showToast("Question statement is required", "warning");
      return;
    }

    if (currentQType === "mcq") {
      const opts = [currentOpt1, currentOpt2, currentOpt3, currentOpt4].filter(Boolean);
      if (opts.length < 2) {
        showToast("Provide at least 2 multiple choice options", "warning");
        return;
      }
      const correctAns = opts[correctOptionIdx] || opts[0];
      setQuestions([
        ...questions,
        {
          question_text: currentQText.trim(),
          question_type: "mcq",
          options: opts,
          correct_answers: [correctAns],
          points: currentPoints
        }
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          question_text: currentQText.trim(),
          question_type: "coding",
          options: [],
          correct_answers: [],
          code_template: currentCodeTemplate,
          points: currentPoints
        }
      ]);
    }

    // Reset draft fields
    setCurrentQText("");
    setCurrentOpt1("");
    setCurrentOpt2("");
    setCurrentOpt3("");
    setCurrentOpt4("");
    setCurrentPoints(10);
    showToast("Question added to examination draft", "success");
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim()) {
      showToast("Target course and exam title are required", "warning");
      return;
    }
    if (questions.length === 0) {
      showToast("Add at least one question to the examination", "warning");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/assessments", {
        course_id: parseInt(courseId),
        title: title.trim(),
        description,
        assessment_type: assessmentType,
        time_limit_minutes: timeLimitMinutes,
        passing_percentage: passingPercentage,
        max_attempts: maxAttempts,
        is_published: isPublished,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answers: q.correct_answers,
          code_template: q.code_template,
          points: q.points,
          sort_order: idx
        }))
      });

      showToast("Examination and Question Bank published successfully", "success");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to publish exam", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredAssessments = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.course_title && a.course_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <FileCheck2 className="w-6 h-6 text-blue-400" />
              Timed Examination & Assessment Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Author proctored examinations, algorithmic Python sandbox challenges, and automated grading criteria.
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
              onClick={() => {
                if (courses.length > 0 && !courseId) setCourseId(courses[0].id.toString());
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assessments by exam title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading examination bank...
            </div>
          ) : filteredAssessments.length > 0 ? (
            filteredAssessments.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 hover:border-blue-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      {a.course_code || "EXAM"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold capitalize">
                      {a.assessment_type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    Course: <span className="text-slate-200 font-medium">{a.course_title}</span>
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">Time Limit</p>
                      <p className="font-bold text-slate-200 mt-0.5">{a.time_limit_minutes} Mins</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">Pass Mark</p>
                      <p className="font-bold text-emerald-400 mt-0.5">{a.passing_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">Questions</p>
                      <p className="font-bold text-indigo-400 mt-0.5">{a.question_count || 1}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Max: {a.max_attempts} attempts</span>
                  <Link
                    href={`/student/exam/${a.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Runner
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No examination papers found. Click &quot;Create Assessment&quot; to author one.
            </div>
          )}
        </div>

        {/* Modal: Author Assessment */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Author Timed Examination & Question Bank"
          subtitle="Configure proctoring timers, pass thresholds, and autograded questions"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateAssessment} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Curriculum Course <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Exam Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm: JetBot Kinematics & PID Controller"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assessment Category
                </label>
                <select
                  value={assessmentType}
                  onChange={(e: any) => setAssessmentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="quiz">Weekly Quiz</option>
                  <option value="exam">Mid-Semester Exam</option>
                  <option value="final">Final Certification Defense</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pass Mark (%)
                </label>
                <input
                  type="number"
                  min={40}
                  max={100}
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Question Bank Builder */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Question Bank ({questions.length} Questions Configured)
              </h4>

              {/* List of configured questions */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 truncate">
                      <span className="font-bold text-blue-400 mr-2">Q{idx + 1}.</span>
                      <span className="text-slate-200">{q.question_text}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 uppercase font-mono">
                        {q.question_type} ({q.points} pts)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Subform */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Add New Question</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentQType("mcq")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        currentQType === "mcq" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentQType("coding")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        currentQType === "coding" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      Python Sandbox
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Question statement / problem description..."
                  value={currentQText}
                  onChange={(e) => setCurrentQText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                {currentQType === "mcq" ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Option A"
                        value={currentOpt1}
                        onChange={(e) => setCurrentOpt1(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option B"
                        value={currentOpt2}
                        onChange={(e) => setCurrentOpt2(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option C"
                        value={currentOpt3}
                        onChange={(e) => setCurrentOpt3(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Option D"
                        value={currentOpt4}
                        onChange={(e) => setCurrentOpt4(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-slate-400">Correct Option:</label>
                      <select
                        value={correctOptionIdx}
                        onChange={(e) => setCorrectOptionIdx(parseInt(e.target.value))}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Starter Python Code Template
                    </label>
                    <textarea
                      rows={3}
                      value={currentCodeTemplate}
                      onChange={(e) => setCurrentCodeTemplate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddQuestionToBank}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/40 text-xs font-semibold border border-blue-500/30 transition"
                  >
                    + Insert Question
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {saving ? "Publishing Exam..." : "Publish Assessment"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
