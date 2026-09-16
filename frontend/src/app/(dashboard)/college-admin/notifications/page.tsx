"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  Bell,
  Plus,
  Send,
  RefreshCw,
  Clock,
  Radio,
  BookOpen,
  FileCheck2,
  Award,
  AlertTriangle
} from "lucide-react";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: number | boolean;
  created_at: string;
}

export default function CollegeAdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "assessment" | "course" | "certificate" | "system">("info");
  const [linkUrl, setLinkUrl] = useState("");
  const [sending, setSending] = useState(false);

  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ notifications: NotificationItem[]; unread_count: number }>("/api/notifications");
      setNotifications(res.notifications || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast("Title and message are required", "warning");
      return;
    }

    try {
      setSending(true);
      await api.post("/api/notifications/broadcast", {
        title: title.trim(),
        message: message.trim(),
        type,
        link_url: linkUrl.trim() || undefined
      });
      showToast("Campus broadcast notification dispatched to all students", "success");
      setIsModalOpen(false);
      setTitle("");
      setMessage("");
      setLinkUrl("");
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || "Failed to send broadcast", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout requiredRoles={["college_admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-blue-400" />
              Campus Broadcast & Announcements Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dispatch urgent notifications, examination deadlines, and curriculum updates to enrolled student cohorts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              Compose Broadcast
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Announcement Feed ({notifications.length})
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                Loading broadcast messages...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{n.title}</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      {n.link_url && (
                        <a
                          href={n.link_url}
                          className="inline-block mt-2 text-xs text-blue-400 hover:underline font-semibold"
                        >
                          Open Attached Resource ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                      {n.type}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                No announcements dispatched yet.
              </p>
            )}
          </div>
        </div>

        {/* Modal: Compose Broadcast */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Compose Campus Announcement"
          subtitle="Push instantaneous alerts to student dashboards and notifications inbox"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Broadcast Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. JetBot Simulation Practical Exam Scheduled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Announcement Category
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="info">General Information</option>
                <option value="assessment">Examination Alert</option>
                <option value="course">Curriculum Update</option>
                <option value="certificate">Certification Defense</option>
                <option value="system">Campus Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Message Body <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Details of the announcement or instructions for the student cohort..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Action Link (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /student/exam/1"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
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
                disabled={sending}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Broadcasting..." : "Send Announcement"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
