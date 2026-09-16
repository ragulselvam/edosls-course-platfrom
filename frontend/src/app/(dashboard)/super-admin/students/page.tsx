"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Users,
  Search,
  Building2,
  BookOpen,
  Award,
  Plus,
  RefreshCw,
  Eye,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone
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
  is_active: number | boolean;
  college_id: number;
  college_name: string;
  college_code: string;
  enrolled_courses_count: number;
  certificates_count: number;
  average_progress?: number;
}

interface StudentDetail {
  student: Student;
  enrollments: Array<{
    id: number;
    course_id: number;
    course_title: string;
    course_code: string;
    progress_percentage: number;
    status: string;
    certificate_id?: number;
    certificate_code?: string;
    enrolled_at: string;
  }>;
  results: Array<{
    id: number;
    assessment_title?: string;
    quiz_id_title?: string;
    course_title?: string;
    score: number;
    total_marks: number;
    percentage: number;
    passed: number;
    evaluated_at: string;
  }>;
}

interface College {
  id: number;
  name: string;
  code: string;
}

export default function SuperAdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Profile Drawer / Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetail | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Add Student Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    college_id: "",
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
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, collegesRes] = await Promise.all([
        api.get<Student[]>("/api/students"),
        api.get<College[]>("/api/colleges")
      ]);
      setStudents(studentsRes || []);
      setColleges(collegesRes || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInspectStudent = async (studentId: number) => {
    try {
      setLoadingProfile(true);
      setProfileModalOpen(true);
      const res = await api.get<StudentDetail>(`/api/students/${studentId}`);
      setSelectedStudentDetail(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load student profile", "error");
      setProfileModalOpen(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.college_id || !formData.email.trim() || !formData.roll_number.trim()) {
      showToast("Institution, Email, and Roll Number are required", "warning");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/students", {
        ...formData,
        college_id: parseInt(formData.college_id),
        year_of_study: parseInt(formData.year_of_study.toString())
      });
      showToast("Student account created successfully", "success");
      setAddModalOpen(false);
      setFormData({
        college_id: "",
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
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to register student", "error");
    } finally {
      setSaving(false);
    }
  };

  const departments = Array.from(new Set(students.map((s) => s.department))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.college_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCollege =
      selectedCollege === "all" || s.college_id.toString() === selectedCollege;

    const matchesDept =
      selectedDepartment === "all" || s.department === selectedDepartment;

    return matchesSearch && matchesCollege && matchesDept;
  });

  return (
    <DashboardLayout requiredRoles={["super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-400" />
              Cross-Campus Student Cohorts
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Global directory of enrolled learners across all connected autonomous engineering institutes.
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
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Register Student
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, roll no, email, campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Institutions ({colleges.length})</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            {departments.length > 0 && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Departments</option>
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
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Enrollments</th>
                  <th className="py-3 px-4">Certificates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading student cohorts...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
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
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                          <Building2 className="w-3 h-3 text-blue-400" />
                          {s.college_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="text-slate-200 font-medium">{s.department}</p>
                        <p className="text-slate-400 text-[11px]">
                          Year {s.year_of_study} • Batch {s.batch || "N/A"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <BookOpen className="w-3 h-3" />
                          {s.enrolled_courses_count} Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {s.certificates_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            <Award className="w-3 h-3" />
                            {s.certificates_count} Verified
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">0 Earned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectStudent(s.student_id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition inline-flex items-center gap-1 text-xs font-medium"
                          title="Inspect Student Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No students found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspect Student Profile Modal */}
        <Modal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedStudentDetail(null);
          }}
          title="Student Academic Dossier"
          subtitle="Real-time curriculum progress and examination records"
          maxWidth="max-w-2xl"
        >
          {loadingProfile || !selectedStudentDetail ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading student records...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600/30 to-blue-600/30 border border-emerald-500/30 flex items-center justify-center text-white font-extrabold text-lg">
                    {selectedStudentDetail.student.first_name[0]}
                    {selectedStudentDetail.student.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedStudentDetail.student.first_name} {selectedStudentDetail.student.last_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedStudentDetail.student.email} • Roll: <span className="text-blue-400 font-mono font-semibold">{selectedStudentDetail.student.roll_number}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-xs">
                    {selectedStudentDetail.student.college_name}
                  </span>
                </div>
              </div>

              {/* Course Progress Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  Active Course Enrollments ({selectedStudentDetail.enrollments.length})
                </h4>
                {selectedStudentDetail.enrollments.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedStudentDetail.enrollments.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-white">{e.course_title}</p>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${e.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-200">{Math.round(e.progress_percentage)}%</span>
                          {e.certificate_code && (
                            <Link
                              href={`/verify/${e.certificate_code}`}
                              target="_blank"
                              className="block text-[10px] text-amber-400 hover:underline mt-0.5"
                            >
                              Certificate ↗
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center bg-slate-900/50 rounded-xl">
                    No active course enrollments.
                  </p>
                )}
              </div>

              {/* Assessment Submissions */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Examination Results ({selectedStudentDetail.results.length})
                </h4>
                {selectedStudentDetail.results.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentDetail.results.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{r.assessment_title || r.quiz_id_title || "Exam"}</p>
                          <p className="text-[11px] text-slate-400">{r.course_title}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.passed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {r.score} / {r.total_marks} ({r.percentage}%) • {r.passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center bg-slate-900/50 rounded-xl">
                    No exam records logged yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Add Student */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Register Student Account"
          subtitle="Enroll student into campus cohort with secure tenant isolation"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campus / Institution <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.college_id}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select institution...</option>
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
                  placeholder="e.g. Alex"
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
                  placeholder="e.g. Rivera"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="e.g. CS202401"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
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
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Year of Study
                </label>
                <select
                  value={formData.year_of_study}
                  onChange={(e) => setFormData({ ...formData, year_of_study: parseInt(e.target.value) })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {saving ? "Registering..." : "Register Student"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
