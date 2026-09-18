"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  BookOpen,
  Mail,
  Phone,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Power
} from "lucide-react";
import Link from "next/link";

interface Trainer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: number | boolean;
  college_id?: number;
  college_name: string;
  college_code: string;
  role_name: string;
  assigned_courses_count: number;
}

interface College {
  id: number;
  name: string;
  code: string;
}

export default function SuperAdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string>("all");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: ""
  });
  const [saving, setSaving] = useState(false);

  // Deletion & Status Confirmation Modals
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trainersRes, collegesRes] = await Promise.all([
        api.get<Trainer[]>("/api/courses/trainers?include_inactive=true"),
        api.get<College[]>("/api/colleges")
      ]);
      setTrainers(trainersRes || []);
      setColleges(collegesRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load faculty roster", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.first_name.trim()) {
      showToast("First Name and Email are required", "warning");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/courses/trainers", {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password || "Trainer@123",
        phone: formData.phone || undefined,
        college_id: formData.college_id ? parseInt(formData.college_id) : null
      });
      showToast("Faculty Trainer account created successfully", "success");
      setIsModalOpen(false);
      setFormData({
        college_id: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: ""
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create trainer", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return;
    try {
      await api.del(`/api/courses/trainers/${selectedTrainer.id}`);
      showToast(`Trainer ${selectedTrainer.first_name} ${selectedTrainer.last_name} removed successfully`, "success");
      setConfirmDeleteOpen(false);
      setSelectedTrainer(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to remove trainer", "error");
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTrainer) return;
    const newStatus = selectedTrainer.is_active ? false : true;
    try {
      await api.put(`/api/courses/trainers/${selectedTrainer.id}/status`, { is_active: newStatus });
      showToast(`Trainer ${newStatus ? "activated" : "suspended"} successfully`, "success");
      setConfirmStatusOpen(false);
      setSelectedTrainer(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const matchesSearch =
      t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.college_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCollege =
      selectedCollege === "all" || (t.college_id && t.college_id.toString() === selectedCollege);

    return matchesSearch && matchesCollege;
  });

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Faculty Roster & Class Allocations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage subject matter experts, autonomous robotics instructors, and course allocations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Faculty Trainer
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty by name, email, institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Campus Allocations</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trainers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading faculty directory...
            </div>
          ) : filteredTrainers.length > 0 ? (
            filteredTrainers.map((t) => {
              const isActive = t.is_active === 1 || t.is_active === true;
              return (
                <div
                  key={t.id}
                  className={`rounded-2xl bg-white dark:bg-slate-900/60 border ${
                    isActive ? "border-slate-200/90 dark:border-slate-800" : "border-rose-200 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10"
                  } p-5 shadow-xs hover:shadow-md dark:shadow-lg hover:border-blue-500/40 transition duration-300 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-600/30 dark:to-blue-600/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-white font-extrabold text-base">
                        {t.first_name[0]}
                        {t.last_name ? t.last_name[0] : ""}
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

                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {t.first_name} {t.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.email}</p>

                    <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{t.college_name}</span>
                      </div>
                      {t.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{t.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{t.assigned_courses_count} Classes Assigned</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href="/super-admin/courses"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition inline-flex items-center cursor-pointer"
                        title="Manage Class Assignments"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedTrainer(t);
                          setConfirmStatusOpen(true);
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        }`}
                        title={isActive ? "Suspend Trainer" : "Activate Trainer"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrainer(t);
                          setConfirmDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition cursor-pointer"
                        title="Remove Trainer"
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
              No faculty trainers found matching filters.
            </div>
          )}
        </div>

        {/* Modal: Add Trainer */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Onboard Faculty Trainer"
          subtitle="Provision instructor credentials with class allocation rights"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateTrainer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chen"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="faculty.trainer@campus.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  placeholder="Default: Trainer@123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Campus Affiliation (Optional)
              </label>
              <select
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Platform Global Faculty (All Campuses)</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
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
                {saving ? "Provisioning..." : "Onboard Trainer"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDeleteTrainer}
          title="Are you sure you want to delete this Trainer?"
          itemName={selectedTrainer ? `${selectedTrainer.first_name} ${selectedTrainer.last_name}` : ''}
          resourceType="trainer name"
          impactedResources={[
            `Assigned Classes (${selectedTrainer?.assigned_courses_count || 0})`,
            "Trainer account credentials and login access",
            "Teaching allocations & historical evaluations",
            "Course assignments and curriculum authoring links"
          ]}
          confirmText="Delete"
          type="danger"
        />

        {/* Status Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmStatusOpen}
          onClose={() => setConfirmStatusOpen(false)}
          onConfirm={handleToggleStatus}
          title={
            selectedTrainer?.is_active
              ? `Suspend ${selectedTrainer?.first_name} ${selectedTrainer?.last_name}?`
              : `Activate ${selectedTrainer?.first_name} ${selectedTrainer?.last_name}?`
          }
          message={
            selectedTrainer?.is_active
              ? "Suspending this instructor will prevent them from logging in and grading classes until re-activated."
              : "Activating this instructor will restore their access to teaching and grading immediately."
          }
          confirmText={selectedTrainer?.is_active ? "Suspend Trainer" : "Activate"}
          type={selectedTrainer?.is_active ? "warning" : "info"}
        />
      </div>
    </DashboardLayout>
  );
}
