"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Settings,
  ShieldCheck,
  Server,
  Terminal,
  Cpu,
  Database,
  Lock,
  CheckCircle2,
  KeyRound,
  User,
  Save
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Settings mock state
  const [settings, setSettings] = useState({
    platformName: "EDOSLS Autonomous Learning Platform",
    sandboxTimeoutSec: 10,
    maxCodeMemoryMb: 128,
    enablePublicCertificates: true,
    enforcePasswordComplexity: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Platform configurations synchronized successfully", "success");
    }, 600);
  };

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-400" />
            Global Platform Settings & Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System configuration, container sandbox parameters, cryptographic validation keys, and administrator profile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                General System Configuration
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platform Display Brand
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Python Sandbox Max Execution (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={settings.sandboxTimeoutSec}
                    onChange={(e) => setSettings({ ...settings, sandboxTimeoutSec: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sandbox Memory Limit (MB)
                  </label>
                  <input
                    type="number"
                    min={32}
                    max={512}
                    value={settings.maxCodeMemoryMb}
                    onChange={(e) => setSettings({ ...settings, maxCodeMemoryMb: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePublicCertificates}
                    onChange={(e) => setSettings({ ...settings, enablePublicCertificates: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Public QR Verification Registry</span>
                    <p className="text-[11px] text-slate-400">Allow public lookup of issued student diplomas via /verify/:code</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enforcePasswordComplexity}
                    onChange={(e) => setSettings({ ...settings, enforcePasswordComplexity: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Enforce Multi-Factor Password Complexity</span>
                    <p className="text-[11px] text-slate-400">Require uppercase, numbers, and special symbols for all new users</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* System Health & Diagnostics Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Live Node Telemetry
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-400" /> Database Cluster
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                    SQLite3 / WAL Mode
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" /> Python 3.12 Sandbox
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                    Isolated Subprocess
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Cryptographic Signer
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                    HS256 Active
                  </span>
                </div>
              </div>
            </div>

            {/* Current Admin Dossier */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Root Authority Profile
              </h2>
              <div className="text-xs space-y-1 text-slate-300">
                <p className="font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-slate-400">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                  ROLE_SUPER_ADMIN_TIER_0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
