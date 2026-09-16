"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Certificate } from '@/types';
import {
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Share2,
  Printer,
  ArrowLeft,
  XCircle,
} from 'lucide-react';

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    api.get<Certificate>(`/api/certificates/verify/${code}`)
      .then((res) => {
        setCert(res);
      })
      .catch((err) => {
        setError(err.message || 'Certificate verification failed');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Verifying Ledger Record...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Invalid Certificate Code</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            No active certificate matches identifier <strong className="font-mono text-rose-500">{code}</strong>. The credential may have been revoked or typed incorrectly.
          </p>
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Try Another Code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-8 flex flex-col justify-between">
      {/* Top Header Controls */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/verify"
          className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> Search Again
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </header>

      {/* Main Certificate Showcase Window */}
      <main className="max-w-4xl w-full mx-auto my-auto overflow-x-auto p-4 flex justify-center">
        {/* Luxury Gold Guilloche Certificate Card */}
        <div className="w-[820px] min-h-[580px] bg-gradient-to-b from-[#ffffff] to-[#faf8f4] border-[10px] border-double border-[#b45309] p-12 relative shadow-2xl flex flex-col items-center justify-between text-center rounded-sm text-slate-900 selection:bg-amber-200">
          {/* Inner Filigree Border */}
          <div className="absolute inset-3 border border-amber-600/60 pointer-events-none" />
          <div className="absolute inset-4 border border-dashed border-amber-500/40 pointer-events-none" />

          {/* Crest & College Name */}
          <div className="space-y-1 relative z-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-900/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-700 font-sans">
              {cert.college_name || 'Autonomous Engineering Institute'}
            </div>
            <h1 className="text-3xl font-extrabold tracking-wider text-slate-900 font-serif uppercase pt-1">
              Certificate of Completion
            </h1>
          </div>

          {/* Body Content */}
          <div className="space-y-4 my-6 relative z-10 max-w-xl">
            <p className="text-xs font-medium text-slate-500 italic">This is to officially certify that</p>
            <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight font-serif border-b-2 border-amber-500/30 pb-2 px-6 inline-block">
              {cert.student_name}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              has successfully fulfilled all required modular coursework, practical lab implementations, and continuous autograded examination standards in:
            </p>
            <div className="text-lg font-bold text-slate-900 bg-amber-50 border border-amber-200/80 py-2.5 px-6 rounded-xl font-sans">
              {cert.course_title} ({cert.course_code})
            </div>
          </div>

          {/* Footer Ledger Signatures */}
          <div className="w-full grid grid-cols-3 gap-6 pt-6 border-t border-amber-900/20 text-xs relative z-10 items-end">
            <div className="space-y-1 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date of Award</div>
              <div className="font-bold font-mono text-slate-800">
                {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'Official Record'}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-amber-600/60 p-1 flex items-center justify-center bg-amber-50/50 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-[9px] uppercase tracking-widest font-extrabold text-amber-800 mt-1">
                SEAL OF EXCELLENCE
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Digital Hash ID</div>
              <div className="font-bold font-mono text-amber-800 text-[11px] break-all">
                {cert.certificate_code}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Verification Status Pill */}
      <footer className="max-w-md mx-auto text-center mt-6 print:hidden">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Authentic & Cryptographically Verified via NEXUS Registry</span>
        </div>
      </footer>
    </div>
  );
}
