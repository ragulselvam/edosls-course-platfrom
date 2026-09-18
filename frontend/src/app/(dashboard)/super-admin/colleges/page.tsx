"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Building2,
  Plus,
  Search,
  Users,
  BookOpen,
  Edit2,
  CheckCircle2,
  XCircle,
  Mail,
  Globe,
  RefreshCw,
  Power,
  Trash2
} from "lucide-react";

interface College {
  id: number;
  name: string;
  code: string;
  domain?: string;
  contact_email?: string;
  logo_url?: string;
  is_active: number | boolean;
  student_count?: number;
  course_count?: number;
  created_at?: string;
}

export default function SuperAdminCollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    domain: "",
    contact_email: "",
    logo_url: ""
  });
  const [saving, setSaving] = useState(false);

  // Status toggle confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [collegeToDelete, setCollegeToDelete] = useState<College | null>(null);

  const { showToast } = useToast();

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await api.get<College[]>("/api/colleges");
      setColleges(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load colleges", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      domain: "",
      contact_email: "",
      logo_url: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (college: College) => {
    setIsEditing(true);
    setEditingId(college.id);
    setFormData({
      name: college.name,
      code: college.code,
      domain: college.domain || "",
      contact_email: college.contact_email || "",
      logo_url: college.logo_url || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast("Institution Name and Code are required", "warning");
      return;
    }

    try {
      setSaving(true);
      if (isEditing && editingId) {
        await api.put(`/api/colleges/${editingId}`, formData);
        showToast("College details updated successfully", "success");
      } else {
        await api.post("/api/colleges", formData);
        showToast("New institution onboarded successfully", "success");
      }
      setIsModalOpen(false);
      fetchColleges();
    } catch (err: any) {
      showToast(err.message || "Operation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCollege) return;
    const newStatus = selectedCollege.is_active ? false : true;
    try {
      await api.put(`/api/colleges/${selectedCollege.id}/status`, { is_active: newStatus });
      showToast(
        `College ${newStatus ? "activated" : "suspended"} successfully`,
        "success"
      );
      setConfirmOpen(false);
      setSelectedCollege(null);
      fetchColleges();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const handleDeleteCollege = async () => {
    if (!collegeToDelete) return;
    try {
      await api.del(`/api/colleges/${collegeToDelete.id}`);
      showToast(`Institution '${collegeToDelete.name}' deleted successfully`, "success");
      setDeleteConfirmOpen(false);
      setCollegeToDelete(null);
      fetchColleges();
    } catch (err: any) {
      showToast(err.message || "Failed to delete institution", "error");
    }
  };

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterActive === "active") return matchesSearch && (c.is_active === 1 || c.is_active === true);
    if (filterActive === "inactive") return matchesSearch && (c.is_active === 0 || c.is_active === false);
    return matchesSearch;
  });

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Institutions & Campus Directory
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure multi-tenant boundary isolation, student domains, and institutional quotas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchColleges}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Onboard Institution
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by college name, code, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "active", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterActive(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                  filterActive === filter
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Colleges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading institutions...
            </div>
          ) : filteredColleges.length > 0 ? (
            filteredColleges.map((c) => {
              const isActive = c.is_active === 1 || c.is_active === true;
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl bg-white dark:bg-slate-900/60 border ${
                    isActive ? "border-slate-200/90 dark:border-slate-800" : "border-rose-200 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10"
                  } p-5 shadow-xs hover:shadow-md dark:shadow-lg hover:border-blue-500/40 transition duration-300 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-base">
                        {c.code.slice(0, 3)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          "Suspended"
                        )}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{c.name}</h3>
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5">Code: {c.code}</p>

                    <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {c.domain && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{c.domain}</span>
                        </div>
                      )}
                      {c.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{c.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {c.student_count || 0} Students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        {c.course_count || 0} Courses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCollege(c);
                          setConfirmOpen(true);
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isActive
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        }`}
                        title={isActive ? "Suspend College" : "Activate College"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setCollegeToDelete(c);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition cursor-pointer"
                        title="Delete Institution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
              No institutions found matching criteria.
            </div>
          )}
        </div>

        {/* Modal: Create/Edit College */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? "Edit Institution Details" : "Onboard New Institution"}
          subtitle="Configure multi-tenant boundaries and campus credentials"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Institution Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stanford Autonomous Systems Institute"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unique Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STANFORD"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Authorized Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g. stanford.edu"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="e.g. dean.engineering@stanford.edu"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Onboard College"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Status Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleToggleStatus}
          title={
            selectedCollege?.is_active
              ? `Suspend ${selectedCollege?.name}?`
              : `Activate ${selectedCollege?.name}?`
          }
          message={
            selectedCollege?.is_active
              ? "Suspending this institution will prevent students and admins from signing in until re-enabled."
              : "Activating this institution will restore access for students and administrators immediately."
          }
          confirmText={selectedCollege?.is_active ? "Suspend Institution" : "Activate"}
          type={selectedCollege?.is_active ? "danger" : "info"}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteCollege}
          title="Are you sure you want to delete this Institution?"
          itemName={collegeToDelete?.name || ""}
          resourceType="institution name"
          impactedResources={[
            `Enrolled Students (${collegeToDelete?.student_count || 0})`,
            `Campus Courses (${collegeToDelete?.course_count || 0})`,
            "Campus Administrators & Delegated Credentials",
            "Departmental records and activity logs"
          ]}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}
