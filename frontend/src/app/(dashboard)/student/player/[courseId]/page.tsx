"use client";

import React, { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import CodeEditor from "@/components/sandbox/CodeEditor";
import JetBotSimulator from "@/components/robotics/JetBotSimulator";
import confetti from "canvas-confetti";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Code2,
  Bot,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  Maximize2,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Layers,
  ArrowLeft,
  Terminal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ContentItem {
  id: number;
  module_id: number;
  title: string;
  content_type: "video" | "document" | "code_snippet" | "quiz";
  content_body?: string;
  video_url?: string;
  resource_url?: string;
  is_mandatory?: number;
  sort_order: number;
}

interface ModuleItem {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  contents: ContentItem[];
}

interface CourseData {
  course: {
    id: number;
    title: string;
    code: string;
    description: string;
    passing_percentage: number;
    certificate_enabled: number;
    trainer_name?: string;
  };
  modules: ModuleItem[];
  enrollment?: {
    id: number;
    progress_percentage: number;
    status: string;
    certificate_id?: number;
    certificate_code?: string;
  };
  assessments?: Array<{ id: number; title: string; time_limit_minutes: number }>;
}

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);

  const [data, setData] = useState<CourseData | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [activeContent, setActiveContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<"lesson" | "sandbox" | "simulator">("lesson");
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, progressRes] = await Promise.all([
        api.get<CourseData>(`/api/courses/${courseId}`),
        api.get<any>(`/api/progress/course/${courseId}`).catch(() => null)
      ]);

      setData(courseRes);

      // Map progress
      if (progressRes && progressRes.completed_items) {
        const compMap: Record<number, boolean> = {};
        Object.keys(progressRes.completed_items).forEach((k) => {
          compMap[parseInt(k)] = true;
        });
        setCompletedItems(compMap);
      }

      // Default active content to first lesson
      if (courseRes.modules && courseRes.modules.length > 0 && courseRes.modules[0].contents.length > 0) {
        setActiveContent(courseRes.modules[0].contents[0]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load course player", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const allContents: ContentItem[] = [];
  data?.modules?.forEach((m) => {
    m.contents?.forEach((c) => {
      allContents.push(c);
    });
  });

  const currentIndex = allContents.findIndex((c) => c.id === activeContent?.id);
  const prevContent = currentIndex > 0 ? allContents[currentIndex - 1] : null;
  const nextContent = currentIndex < allContents.length - 1 ? allContents[currentIndex + 1] : null;

  const handleMarkComplete = async () => {
    if (!activeContent) return;

    try {
      setMarkingComplete(true);
      const res = await api.post<any>("/api/progress/mark-complete", {
        content_id: activeContent.id,
        is_completed: true,
        time_spent_seconds: 60
      });

      setCompletedItems((prev) => ({ ...prev, [activeContent.id]: true }));
      showToast("Lesson completed! Progress saved.", "success");

      // Check if course reached 100% or generated certificate
      if (res.is_course_completed || (res.progress_percentage && res.progress_percentage >= 100)) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast("🎓 Congratulations! You completed this curriculum track!", "success");
      }

      // Advance to next lesson if available
      if (nextContent) {
        setActiveContent(nextContent);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save progress", "error");
    } finally {
      setMarkingComplete(false);
    }
  };

  const totalLessons = allContents.length;
  const completedCount = Object.keys(completedItems).length;
  const calculatedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/student"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight truncate max-w-md">
              {data?.course?.title || "Course Studio Player"}
            </h1>
            <p className="text-[11px] font-mono text-blue-400">
              {data?.course?.code} • {data?.course?.trainer_name || "Faculty Instructor"}
            </p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-36 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, calculatedProgress))}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-200">{calculatedProgress}%</span>
          </div>

          {data?.enrollment?.certificate_code && (
            <Link
              href={`/verify/${data.enrollment.certificate_code}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
            >
              <Award className="w-3.5 h-3.5" />
              Certificate Ready
            </Link>
          )}
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Modules & Lessons Tree */}
        <aside className="w-80 bg-slate-900/60 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Syllabus Outline
            </span>
            <span className="text-[11px] text-slate-500">
              {completedCount} of {totalLessons} done
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {data?.modules?.map((mod, mIdx) => (
              <div key={mod.id} className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  {mod.title}
                </p>
                <div className="space-y-1">
                  {mod.contents?.map((cnt) => {
                    const isSelected = activeContent?.id === cnt.id;
                    const isDone = completedItems[cnt.id];
                    return (
                      <button
                        key={cnt.id}
                        onClick={() => {
                          setActiveContent(cnt);
                          setActiveTab("lesson");
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-medium transition flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {cnt.content_type === "video" ? (
                            <Play className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                          ) : cnt.content_type === "code_snippet" ? (
                            <Code2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          )}
                          <span className="truncate">{cnt.title}</span>
                        </div>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Connected Assessment Link */}
          {data?.assessments && data.assessments.length > 0 && (
            <div className="p-3 border-t border-slate-800">
              <Link
                href={`/student/exam/${data.assessments[0].id}`}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition"
              >
                <Award className="w-4 h-4" />
                Take Course Examination
              </Link>
            </div>
          )}
        </aside>

        {/* Center/Right Content Workspace */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {/* Content Sub-Header & Studio Tabs */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                Current Lesson
              </span>
              <h2 className="text-lg font-bold text-white">
                {activeContent?.title || "Lesson Overview"}
              </h2>
            </div>

            {/* Interactive Workspace Switcher */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("lesson")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "lesson"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Lesson Content
              </button>
              <button
                onClick={() => setActiveTab("sandbox")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "sandbox"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Python 3.12 Sandbox
              </button>
              <button
                onClick={() => setActiveTab("simulator")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "simulator"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                JetBot 2D Simulator
              </button>
            </div>
          </div>

          {/* Tab 1: Lesson Material (Video / Markdown Notes) */}
          {activeTab === "lesson" && (
            <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full flex-1">
              {activeContent?.content_type === "video" || activeContent?.video_url ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video shadow-2xl">
                  {activeContent.video_url?.includes("youtube.com") || activeContent.video_url?.includes("youtu.be") ? (
                    <iframe
                      src={activeContent.video_url.replace("watch?v=", "embed/")}
                      title={activeContent.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900 to-indigo-950/40">
                      <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-lg">
                        <Play className="w-8 h-8 fill-current translate-x-0.5" />
                      </div>
                      <h3 className="text-base font-bold text-white">{activeContent?.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        Video stream active. Watch the lecture or open the Python Sandbox to write the autonomous navigation code.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Lesson Text / Notes */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 prose prose-invert max-w-none text-xs leading-relaxed space-y-4">
                <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
                  Lesson Synopsis & Laboratory Objectives
                </h3>
                <p className="text-slate-300">
                  {activeContent?.content_body ||
                    `In this module, we examine the mathematical foundations of autonomous JetBot navigation. 
The system operates via differential drive kinematics, converting target chassis velocity vectors (v, ω) into discrete pulse-width modulation (PWM) commands dispatched to the left and right motor drivers.`}
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                  <pre className="overflow-x-auto">{`# Differential Kinematic Transform Formula:
v_left  = v - (omega * wheel_separation / 2)
v_right = v + (omega * wheel_separation / 2)`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Python 3.12 Code Sandbox */}
          {activeTab === "sandbox" && (
            <div className="p-6 flex-1 flex flex-col max-w-5xl mx-auto w-full">
              <div className="flex-1 min-h-[500px]">
                <CodeEditor
                  initialCode={`# Autonomous JetBot Kinematics Controller
import math

def compute_wheel_rpms(linear_v, angular_omega, track_width=0.15, wheel_radius=0.03):
    """
    Computes left and right wheel angular velocity (rad/s) and RPM.
    """
    v_l = linear_v - (angular_omega * track_width / 2.0)
    v_r = linear_v + (angular_omega * track_width / 2.0)
    
    rpm_l = (v_l / (2 * math.pi * wheel_radius)) * 60
    rpm_r = (v_r / (2 * math.pi * wheel_radius)) * 60
    
    return {"left_rpm": round(rpm_l, 2), "right_rpm": round(rpm_r, 2)}

# Test run with forward velocity = 0.5 m/s, turn rate = 0.2 rad/s
result = compute_wheel_rpms(0.5, 0.2)
print("Calculated Wheel Actuation Parameters:")
print(f"  Left Wheel Motor : {result['left_rpm']} RPM")
print(f"  Right Wheel Motor: {result['right_rpm']} RPM")
`}
                />
              </div>
            </div>
          )}

          {/* Tab 3: 2D JetBot Robotics Physics Simulator */}
          {activeTab === "simulator" && (
            <div className="p-6 flex-1 flex flex-col max-w-5xl mx-auto w-full">
              <div className="flex-1 min-h-[500px]">
                <JetBotSimulator />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="h-16 px-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-4 sticky bottom-0 z-20 backdrop-blur-xl">
            <button
              onClick={() => prevContent && setActiveContent(prevContent)}
              disabled={!prevContent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Lesson
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {markingComplete ? "Saving..." : "Mark as Completed & Advance"}
            </button>

            <button
              onClick={() => nextContent && setActiveContent(nextContent)}
              disabled={!nextContent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-30 transition"
            >
              Next Lesson
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
