"use client";

import React, { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import CodeEditor from "@/components/sandbox/CodeEditor";
import ConfirmModal from "@/components/ui/ConfirmModal";
import confetti from "canvas-confetti";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  FileCheck2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  question_text: string;
  question_type: "mcq" | "coding";
  options?: string[];
  code_template?: string;
  points: number;
}

interface AssessmentData {
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
  questions: Question[];
}

interface SubmissionResult {
  submission_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  attempt_number: number;
  feedback: Array<{
    question_id: string;
    earned_points: number;
    max_points: number;
    is_correct: boolean;
  }>;
}

export default function TimedExamPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const resolvedParams = use(params);
  const assessmentId = parseInt(resolvedParams.assessmentId);

  const [exam, setExam] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Student Answers state: questionId -> answer string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Timer state
  const [timeLeftSec, setTimeLeftSec] = useState<number>(1800); // default 30 mins
  const [timerActive, setTimerActive] = useState(false);

  // Submit modal & result state
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await api.get<AssessmentData>(`/api/assessments/${assessmentId}`);
        setExam(res);
        setTimeLeftSec((res.time_limit_minutes || 30) * 60);
        setTimerActive(true);

        // Populate initial code templates into answers if any
        const initialAnswers: Record<string, string> = {};
        res.questions?.forEach((q) => {
          if (q.question_type === "coding" && q.code_template) {
            initialAnswers[q.id.toString()] = q.code_template;
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        showToast(err.message || "Failed to load examination", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [assessmentId]);

  // Countdown Ticker
  useEffect(() => {
    if (!timerActive || result || timeLeftSec <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, result, timeLeftSec]);

  const handleAutoSubmit = () => {
    showToast("⏰ Time expired! Submitting examination...", "warning");
    handleSubmitExam();
  };

  const handleSelectOption = (questionId: number, optionText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: optionText
    }));
  };

  const handleCodeChange = (questionId: number, code: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: code
    }));
  };

  const handleSubmitExam = async () => {
    try {
      setSubmitting(true);
      setTimerActive(false);

      const res = await api.post<SubmissionResult>("/api/assessments/submit", {
        assessment_id: assessmentId,
        answers: answers
      });

      setResult(res);
      setConfirmSubmitOpen(false);

      if (res.passed) {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 }
        });
        showToast("🎉 Examination passed successfully!", "success");
      } else {
        showToast("Assessment evaluated. Score recorded.", "info");
      }
    } catch (err: any) {
      showToast(err.message || "Submission failed", "error");
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = exam?.questions ? exam.questions[currentQIndex] : null;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions?.length || 0;

  // RESULT SCREEN VIEW
  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl bg-slate-900/80 border border-slate-800 p-8 backdrop-blur-2xl shadow-2xl text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border ${
              result.passed
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {result.passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.passed
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {result.passed ? "Examination Passed" : "Needs Improvement"}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-3">{exam?.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Course: {exam?.course_title}</p>
          </div>

          {/* Score breakdown card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-medium">Score Earned</p>
              <p className="text-xl font-bold text-white mt-1">
                {result.score} / {result.total_marks}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-medium">Percentage</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  result.passed ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {Math.round(result.percentage)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-medium">Required Pass</p>
              <p className="text-xl font-bold text-slate-300 mt-1">{exam?.passing_percentage}%</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href={`/student/player/${exam?.course_id}`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Return to Course Studio
            </Link>
            <Link
              href="/student/certificates"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              View Credentials Vault →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Examination Top Bar */}
      <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/student/player/${exam?.course_id || ""}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-sm">
              {exam?.title || "Timed Examination"}
            </h1>
            <p className="text-[11px] text-slate-400">
              {exam?.course_code} • Passing Threshold: <span className="text-emerald-400 font-semibold">{exam?.passing_percentage}%</span>
            </p>
          </div>
        </div>

        {/* Live Proctor Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold shadow-inner ${
              timeLeftSec < 300
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                : "bg-blue-500/10 text-blue-300 border-blue-500/30"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeftSec)}</span>
          </div>

          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Examination
          </button>
        </div>
      </header>

      {/* Examination Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Question Navigation Bar */}
        <aside className="w-72 bg-slate-900/60 border-r border-slate-800 backdrop-blur-xl p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Questions Matrix ({answeredCount} / {totalQuestions} answered)
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {exam?.questions?.map((q, idx) => {
                const isSelected = currentQIndex === idx;
                const isAnswered = Boolean(answers[q.id.toString()]);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400"
                        : isAnswered
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600/40 border border-emerald-500/40" />
              <span>Answered & Staged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-800" />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>

        {/* Center Question Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-between max-w-4xl mx-auto w-full">
          {loading ? (
            <div className="py-24 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading exam questions...
            </div>
          ) : currentQ ? (
            <div className="space-y-6 flex-1">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                  Question {currentQIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Points: <span className="text-white font-bold">{currentQ.points}</span>
                </span>
              </div>

              {/* Question Statement */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
                <h2 className="text-base font-bold text-white leading-relaxed">
                  {currentQ.question_text}
                </h2>
              </div>

              {/* MCQ Options */}
              {currentQ.question_type === "mcq" && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id.toString()] === opt;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                            : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Coding Python Question */}
              {currentQ.question_type === "coding" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400">
                    Write your Python solution below. It will be executed and verified against autograding test suites.
                  </p>
                  <div className="min-h-[350px]">
                    <CodeEditor
                      initialCode={answers[currentQ.id.toString()] || currentQ.code_template || "# Write code here\n"}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Bottom Question Navigation Footer */}
          <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Question
            </button>

            {currentQIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmitOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition"
              >
                <Send className="w-3.5 h-3.5" />
                Finish & Submit
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={handleSubmitExam}
        title="Submit Final Examination Answers?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions. Once submitted, your answers will be automatically evaluated.`}
        confirmText="Confirm & Grade My Exam"
        type="info"
      />
    </div>
  );
}
