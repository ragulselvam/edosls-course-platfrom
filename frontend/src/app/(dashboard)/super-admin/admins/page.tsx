"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  ShieldAlert,
  UserCheck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Trash2,
  RefreshCw,
  Lock,
  UserPlus
} from "lucide-react";

interface AdminUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: number | boolean;
  created_at?: string;
  college_id: number;
  college_name: string;
  college_code: string;
  admin_id: number;
  department?: string;
  designation?: string;
}

interface College {
  id: number;
  name: string;
  code: string;
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("all");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    department: "Administration",
    designation: "Dean / Campus Admin"
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsRes, collegesRes] = await Promise.all([
        api.get<AdminUser[]>("/api/admins"),
        api.get<College[]>("/api/colleges")
      ]);
      setAdmins(adminsRes || []);
      setColleges(collegesRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load administrative personnel", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.college_id || !formData.email.trim() || !formData.password.trim()) {
      showToast("Institution, Email, and Password are required", "warning");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/admins", {
        ...formData,
        college_id: parseInt(formData.college_id)
      });
      showToast("College Administrator account created successfully", "success");
      setIsModalOpen(false);
      setFormData({
        college_id: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        department: "Administration",
        designation: "Dean / Campus Admin"
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create administrator", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      await api.del(`/api/admins/${adminToDelete.user_id}`);
      showToast("Administrator account removed successfully", "success");
      setDeleteConfirmOpen(false);
      setAdminToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete account", "error");
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.college_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCollege =
      selectedCollegeFilter === "all" || admin.college_id.toString() === selectedCollegeFilter;

    return matchesSearch && matchesCollege;
  });

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-blue-400" />
              Institutional Administrators
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Provision and audit campus-level authority delegates across all affiliated institutions.
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Provision Admin Account
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search admin by name, email, campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 whitespace-nowrap">Institution:</label>
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Institutions ({colleges.length})</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Admins Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Institution / Campus</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading administrator accounts...
                    </td>
                  </tr>
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.user_id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                            {admin.first_name[0]}
                            {admin.last_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {admin.first_name} {admin.last_name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <div>
                            <span className="font-medium text-slate-200">{admin.college_name}</span>
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                              {admin.college_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="text-slate-200 font-medium">{admin.designation || "Campus Admin"}</p>
                        <p className="text-slate-400 text-[11px]">{admin.department || "Faculty Affairs"}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {admin.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{admin.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Not provided</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdminToDelete(admin);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                          title="Revoke Administrator Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No administrators found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Provision Admin */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Provision Institutional Administrator"
          subtitle="Assign an authorized campus dean or department head"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Designated Campus <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select target institution...</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Last Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vance"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. admin.dean@campus.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Temporary Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {saving ? "Provisioning..." : "Create Administrator"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteAdmin}
          title="Are you sure you want to delete this Administrator?"
          itemName={adminToDelete ? `${adminToDelete.first_name} ${adminToDelete.last_name}` : ""}
          resourceType="administrator name"
          impactedResources={[
            `Campus Administration Rights (${adminToDelete?.college_name || "Institution"})`,
            "Administrative login credentials & session tokens",
            "Delegated campus permissions",
            "Tenant management audit history"
          ]}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}
