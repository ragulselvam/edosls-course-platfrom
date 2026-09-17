"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, ArrowRight, Award, ArrowLeft } from 'lucide-react';

export default function VerifyIndexPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    router.push(`/verify/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white p-1">
            <img src="/logo.png" alt="EDSOLS" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">EDSOLS</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto shadow-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Verify Digital Certificate
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Enter the unique tamper-proof certificate ID or scan the QR code printed on the official credential document.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <Award className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AIT-ROB-401-0001"
              required
              className="w-full pl-11 pr-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-mono uppercase focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Verify Credential Authenticity</span>
          </button>
        </form>

        <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1 text-left">
          <div className="font-bold text-[var(--text-primary)]">Cryptographic Assurance</div>
          <div>All certificates are sealed with unique university identification hashes and immutable completion timestamps.</div>
        </div>
      </main>

      <footer className="text-center text-xs text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} EDSOLS Innovations Private Limited. All rights reserved.
      </footer>
    </div>
  );
}
