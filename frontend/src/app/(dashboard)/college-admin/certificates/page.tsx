"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Award,
  Search,
  RefreshCw,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Building2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Users
} from "lucide-react";
import Link from "next/link";

interface Certificate {
  id: number;
  certificate_code: string;
  student_id: number;
  course_id: number;
  course_title: string;
  course_code: string;
  course_duration?: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
  department: string;
  college_name: string;
  college_code: string;
  issue_date: string;
  signature_name: string;
  signature_title: string;
}

export default function CollegeAdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { showToast } = useToast();

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get<Certificate[]>("/api/certificates");
      setCertificates(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load issued credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const filteredCerts = certificates.filter((c) =>
    c.certificate_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              Verifiable Credentials & Certificate Vault
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographically signed diplomas with QR verification issued to students who passed all coursework & examinations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCertificates}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <Link
              href="/verify"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Public Verification Hub
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by certificate code (e.g. EDOSLS-...), student, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
              Loading credentials vault...
            </div>
          ) : filteredCerts.length > 0 ? (
            filteredCerts.map((c) => (
              <div
                key={c.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  <p className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                    {c.certificate_code}
                  </p>
                  <h3 className="text-base font-bold text-white mt-1">
                    {c.first_name} {c.last_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Roll: <span className="font-mono text-blue-400">{c.roll_number}</span> • {c.department}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                    <p className="text-slate-300 font-semibold">{c.course_title}</p>
                    <p className="text-slate-500 text-[11px]">
                      Issued: {new Date(c.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{c.signature_name}</span>
                  <Link
                    href={`/verify/${c.certificate_code}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Certificate
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">
              No certificates issued yet. Certificates are issued automatically upon student course completion.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
