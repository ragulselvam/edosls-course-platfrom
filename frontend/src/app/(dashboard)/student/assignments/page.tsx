"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Calendar,
  BookOpen,
  Send,
  Upload
} from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Assignment {
  id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  title: string;
  description: string;
  due_date?: string;
  total_points: number;
  submission_status: "submitted" | "pending";
  score?: number;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get<Assignment[]>("/api/assignments");
      setAssignments(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load practical assignments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionContent.trim()) {
      showToast("Please provide your assignment response or code link", "warning");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/assignments/submit", {
        assignment_id: selectedAssignment.id,
        code_submission: submissionContent.trim()
      });
      showToast("Assignment submitted successfully for instructor review", "success");
      setSubmitModalOpen(false);
      setSelectedAssignment(null);
      setSubmissionContent("");
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.course_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout requiredRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-400" />
              Practical Lab Assignments & Projects
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Submit hands-on robotics control algorithms, kinematic derivations, and lab milestones.
            </p>
          </div>
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading assignments...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((asgn) => {
              const isDone = asgn.submission_status === "submitted";
              return (
                <div
                  key={asgn.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-blue-500/40 transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
                        {asgn.course_code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{asgn.course_title}</span>
                    </div>

                    <h3 className="text-base font-bold text-white">{asgn.title}</h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      {asgn.description || "Implement the differential steering PID controller and test against the 2D JetBot simulator obstacle course."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Due: {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString() : "Flexible Deadline"}
                      </span>
                      <span>Points: {asgn.total_points || 100}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAssignment(asgn);
                          setSubmitModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition"
                      >
                        <Upload className="w-4 h-4" />
                        Submit Solution
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
              No lab assignments due at this time.
            </div>
          )}
        </div>

        {/* Modal: Submit Assignment */}
        <Modal
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          title={`Submit: ${selectedAssignment?.title}`}
          subtitle="Paste your Python script or laboratory repository link"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Solution Code / GitHub URL / Written Report <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={8}
                required
                placeholder="Paste Python script implementation or repository URL..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Submitting..." : "Submit for Evaluation"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
