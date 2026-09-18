"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  Mail,
  Phone,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface Student {
  student_id: number;
  roll_number: string;
  department: string;
  year_of_study: number;
  batch?: string;
  created_at: string;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  enrolled_courses_count: number;
  certificates_count: number;
  average_progress?: number;
}

export default function CollegeAdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Single Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [singleForm, setSingleForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    roll_number: "",
    department: "Computer Science & Engineering",
    year_of_study: 1,
    batch: "2024-2028",
    phone: ""
  });
  const [savingSingle, setSavingSingle] = useState(false);

  // Bulk Import Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [importResult, setImportResult] = useState<{
    created_count: number;
    errors: string[];
  } | null>(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const { showToast } = useToast();

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await api.del(`/api/students/${studentToDelete.student_id}`);
      showToast(`Student ${studentToDelete.first_name} ${studentToDelete.last_name} removed successfully`, "success");
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "Failed to remove student", "error");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get<Student[]>("/api/students");
      setStudents(res || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load student cohort", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.email.trim() || !singleForm.roll_number.trim()) {
      showToast("Email and Roll Number are required", "warning");
      return;
    }

    try {
      setSavingSingle(true);
      await api.post("/api/students", {
        ...singleForm,
        year_of_study: parseInt(singleForm.year_of_study.toString())
      });
      showToast("Student registered successfully", "success");
      setAddModalOpen(false);
      setSingleForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        roll_number: "",
        department: "Computer Science & Engineering",
        year_of_study: 1,
        batch: "2024-2028",
        phone: ""
      });
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "Failed to register student", "error");
    } finally {
      setSavingSingle(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      showToast("Please enter or upload CSV rows", "warning");
      return;
    }

    try {
      setBulkSaving(true);
      setImportResult(null);

      // Parse CSV lines
      const lines = csvText.trim().split("\n");
      const studentsList = [];

      // Determine if header exists
      const startIndex = lines[0].toLowerCase().includes("email") || lines[0].toLowerCase().includes("roll") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length >= 3) {
          studentsList.push({
            roll_number: cols[0],
            first_name: cols[1],
            last_name: cols[2] || "",
            email: cols[3] || `${cols[0].toLowerCase()}@campus.edu`,
            department: cols[4] || "Computer Science",
            year_of_study: parseInt(cols[5]) || 1,
            batch: cols[6] || "2024-2028",
            password: cols[7] || "Student@123",
            phone: cols[8] || undefined
          });
        }
      }

      if (studentsList.length === 0) {
        showToast("No valid student rows found in CSV data", "error");
        return;
      }

      const res = await api.post<any>("/api/students/bulk-import", { students: studentsList });
      setImportResult({
        created_count: res.imported_count || res.created_count || studentsList.length,
        errors: res.errors || []
      });

      showToast(`Bulk import processed: ${res.imported_count || studentsList.length} students onboarded`, "success");
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "Bulk import failed", "error");
    } finally {
      setBulkSaving(false);
    }
  };

  const sampleCsv = `roll_number,first_name,last_name,email,department,year_of_study,batch
CS202401,Aria,Chen,aria.chen@campus.edu,Computer Science,1,2024-2028
CS202402,Mateo,Silva,mateo.silva@campus.edu,Robotics & AI,1,2024-2028
CS202403,Siddharth,Rao,siddharth.rao@campus.edu,Electronics,2,2023-2027`;

  const departments = Array.from(new Set(students.map((s) => s.department))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment === "all" || s.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-400" />
              Campus Student Cohort & Admissions
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage departmental enrollments, single admissions, and batch CSV imports with automated credentials.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={() => {
                setCsvText(sampleCsv);
                setImportResult(null);
                setBulkModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Bulk CSV Import
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Single Student
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            {departments.length > 0 && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Departments ({students.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Enrolled Courses</th>
                  <th className="py-3 px-4">Certificates</th>
                  <th className="py-3 px-4">Admitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading campus student roster...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                            {s.first_name[0]}
                            {s.last_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {s.first_name} {s.last_name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-normal">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-blue-400 font-semibold">
                        {s.roll_number}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="text-slate-200 font-medium">{s.department}</p>
                        <p className="text-slate-400 text-[11px]">
                          Year {s.year_of_study} • Batch {s.batch || "N/A"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <BookOpen className="w-3 h-3" />
                          {s.enrolled_courses_count} Enrolled
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                        {s.certificates_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Award className="w-3 h-3" />
                            {s.certificates_count} Earned
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setStudentToDelete(s);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No students found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Single Student */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Admit Single Student"
          subtitle="Enroll a single student directly into campus cohort"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam"
                  value={singleForm.first_name}
                  onChange={(e) => setSingleForm({ ...singleForm, first_name: e.target.value })}
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
                  placeholder="e.g. Hayes"
                  value={singleForm.last_name}
                  onChange={(e) => setSingleForm({ ...singleForm, last_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={singleForm.email}
                  onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Roll / ID Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS202499"
                  value={singleForm.roll_number}
                  onChange={(e) => setSingleForm({ ...singleForm, roll_number: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  value={singleForm.department}
                  onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Year of Study
                </label>
                <select
                  value={singleForm.year_of_study}
                  onChange={(e) => setSingleForm({ ...singleForm, year_of_study: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Initial Password
              </label>
              <input
                type="password"
                placeholder="Default: Student@123"
                value={singleForm.password}
                onChange={(e) => setSingleForm({ ...singleForm, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSingle}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {savingSingle ? "Registering..." : "Admit Student"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Bulk CSV Import */}
        <Modal
          isOpen={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          title="Batch CSV Student Import"
          subtitle="Onboard hundreds of students simultaneously with automated credential distribution"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleBulkImport} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">CSV Column Schema:</p>
                <p className="font-mono text-[11px] text-blue-200 mt-0.5">
                  roll_number, first_name, last_name, email, department, year_of_study, batch
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste CSV Data or Edit Below:
              </label>
              <textarea
                rows={8}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {importResult && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully imported: {importResult.created_count} students
                </div>
                {importResult.errors.length > 0 && (
                  <div className="space-y-1 text-rose-400 pt-1 border-t border-slate-800">
                    <p className="font-semibold">Import Warnings ({importResult.errors.length}):</p>
                    {importResult.errors.slice(0, 3).map((err, i) => (
                      <p key={i} className="text-[11px]">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={bulkSaving}
                className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {bulkSaving ? "Processing..." : "Process Bulk Import"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteStudent}
          title="Are you sure you want to delete this Student?"
          itemName={studentToDelete ? `${studentToDelete.first_name} ${studentToDelete.last_name}` : ""}
          resourceType="student name"
          impactedResources={[
            `Enrolled Courses (${studentToDelete?.enrolled_courses_count || 0})`,
            `Issued Certificates (${studentToDelete?.certificates_count || 0})`,
            "Assessment submissions, test answers & evaluation scores",
            "Student account credentials & campus roster records"
          ]}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </DashboardLayout>
  );
}
