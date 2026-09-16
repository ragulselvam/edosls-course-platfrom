"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Award,
  ExternalLink,
  ShieldCheck,
  Download,
  Calendar,
  Building2,
  BookOpen,
  RefreshCw,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface Certificate {
  id: number;
  certificate_code: string;
  course_id: number;
  course_title: string;
  course_code: string;
  course_duration?: string;
  college_name: string;
  college_code: string;
  issue_date: string;
  signature_name: string;
  signature_title: string;
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get<Certificate[]>("/api/certificates");
      setCertificates(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load certificates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <DashboardLayout requiredRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              Verified Credentials & Diplomas Vault
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your official, cryptographically verifiable certificates for completed autonomous robotics tracks.
            </p>
          </div>
          <button
            onClick={fetchCertificates}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
              Loading your credentials...
            </div>
          ) : certificates.length > 0 ? (
            certificates.map((cert) => (
              <div
                key={cert.id}
                className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 p-6 backdrop-blur-xl shadow-2xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Cryptographically Signed
                    </span>
                  </div>

                  <p className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                    {cert.certificate_code}
                  </p>

                  <h3 className="text-lg font-extrabold text-white mt-2 leading-tight">
                    {cert.course_title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {cert.college_name}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px]">
                    <p className="text-slate-400">{cert.signature_name}</p>
                    <p className="text-slate-500 text-[10px]">{cert.signature_title}</p>
                  </div>
                  <Link
                    href={`/verify/${cert.certificate_code}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Certificate
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Certificates Earned Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Complete all modules in an enrolled course track and pass the final examination to receive an official verifiable diploma.
                </p>
              </div>
              <Link
                href="/student/my-courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
              >
                Go to My Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
