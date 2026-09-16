"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Award,
  Search,
  FileCheck2,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen
} from "lucide-react";

interface Result {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
  department: string;
  assessment_title: string;
  course_title: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: number | boolean;
  attempt_number: number;
  evaluated_at: string;
}

export default function CollegeAdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPassed, setFilterPassed] = useState<"all" | "passed" | "failed">("all");

  const { showToast } = useToast();

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get<Result[]>("/api/results");
      setResults(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load examination results", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.assessment_title && r.assessment_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.course_title && r.course_title.toLowerCase().includes(searchTerm.toLowerCase()));

    const isPass = r.passed === 1 || r.passed === true;
    if (filterPassed === "passed") return matchesSearch && isPass;
    if (filterPassed === "failed") return matchesSearch && !isPass;

    return matchesSearch;
  });

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-blue-400" />
              Examination Submissions & Grade Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated scoring breakdown for MCQs, multi-select, and Python containerized sandbox test executions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchResults}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll number, exam title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "passed", "failed"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterPassed(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  filterPassed === filter
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Course Track</th>
                  <th className="py-3 px-4">Score / Max</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Evaluated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading grade submissions...
                    </td>
                  </tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((r) => {
                    const isPass = r.passed === 1 || r.passed === true;
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                              {r.first_name[0]}
                              {r.last_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {r.first_name} {r.last_name}
                              </p>
                              <p className="text-[11px] font-mono text-blue-400 font-medium">
                                {r.roll_number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-xs font-semibold text-slate-200">{r.assessment_title}</p>
                          <p className="text-[10px] text-slate-400">Attempt #{r.attempt_number}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300 font-medium">
                          {r.course_title}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className="font-bold text-white">{r.score}</span> / {r.max_score}{" "}
                          <span className="text-slate-400">({Math.round(r.percentage)}%)</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              isPass
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isPass ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Failed
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">
                          {new Date(r.evaluated_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No examination results logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
