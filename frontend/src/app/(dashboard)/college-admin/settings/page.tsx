"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Settings,
  Building2,
  Mail,
  Globe,
  ShieldCheck,
  User,
  Save,
  Lock
} from "lucide-react";

export default function CollegeAdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    collegeName: user?.college_name || "Stanford Autonomous Systems Institute",
    contactEmail: "dean.engineering@stanford.edu",
    domain: "stanford.edu",
    allowSelfRegistration: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Campus configurations updated successfully", "success");
    }, 500);
  };

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-400" />
            Campus Profile & Institutional Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage institutional metadata, authorized student email domains, and administrative delegation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Campus Metadata & Identity
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Authorized Email Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dean / Administration Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowSelfRegistration}
                    onChange={(e) => setFormData({ ...formData, allowSelfRegistration: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Allow Student Self-Registration</span>
                    <p className="text-[11px] text-slate-400">Allow students with matching campus email domain to self-register</p>
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

          {/* Admin Profile Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Administrator Dossier
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Name</p>
                <p className="font-semibold text-white">{user?.first_name} {user?.last_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Email</p>
                <p className="font-semibold text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Campus</p>
                <p className="font-semibold text-blue-400">{user?.college_name || "Stanford Autonomous Systems Institute"}</p>
              </div>
              <div className="pt-3">
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px]">
                  ROLE_COLLEGE_ADMIN_DELEGATE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
