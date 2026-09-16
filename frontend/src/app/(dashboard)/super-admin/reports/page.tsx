"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Activity,
  ShieldCheck,
  Search,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle2,
  Lock
} from "lucide-react";

interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  college_name?: string;
  details?: any;
  created_at: string;
}

interface ReportData {
  metrics: {
    total_colleges: number;
    active_colleges: number;
    total_students: number;
    total_courses: number;
    total_certificates: number;
    global_completion_rate: number;
  };
  recent_audits: AuditLog[];
}

export default function SuperAdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<ReportData>("/api/reports/super-admin-dashboard");
      setData(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const actions = Array.from(new Set(data?.recent_audits?.map((a) => a.action) || [])).filter(Boolean);

  const filteredLogs = data?.recent_audits?.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.college_name && log.college_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.resource_type && log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = selectedAction === "all" || log.action === selectedAction;

    return matchesSearch && matchesAction;
  }) || [];

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              Platform Compliance & Cryptographic Audit Trail
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable event log tracking administrative access, schema modifications, trainer assignments, and certificate issuances.
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
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by user, action, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Action Types ({actions.length})</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40">
                  <th className="py-3 px-4">Action Signature</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Campus / Tenant</th>
                  <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Loading cryptographic audit stream...
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px] font-bold">
                          <Lock className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {log.first_name || "System"} {log.last_name || "Admin"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal">{log.user_email || "system@internal"}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                        {log.resource_type} #{log.resource_id}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          {log.college_name || "Platform Global"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No audit events match current filters.
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
