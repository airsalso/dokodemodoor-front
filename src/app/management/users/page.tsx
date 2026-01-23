"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, User, Loader2, Search, Trash2, ShieldCheck, Mail, Plus, X, Edit2, KeyRound, Ban, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type UserRecord = {
  id: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function UserManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { authenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // Modal states
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "", role: "USER", status: "ACTIVE" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      // Initial loading is true by default.
      // We never call setLoading(true) again to provide smooth silent updates (matching Scans page).
      const res = await fetch(`/api/auth/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}&q=${encodeURIComponent(search)}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, router, search]);

  // Initial Load & Page Sync (Matching Scans page dependencies)
  useEffect(() => {
    if (!authLoading) {
      if (!authenticated) {
        // router.push("/") ? Users page usually handles redirect in useAuth but let's be safe
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, authenticated, currentPage, fetchUsers]);

  // Handle Search Debounce (Matching Scans page precisely)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authenticated) {
        fetchUsers();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [search, authenticated, fetchUsers]);

  const resetForm = () => {
    setFormData({ username: "", password: "", role: "USER", status: "ACTIVE" });
    setFormError("");
    setSelectedUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(null);
        resetForm();
        fetchUsers();
      } else {
        setFormError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
      setFormError("Connection error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}),
          role: formData.role,
          status: formData.status
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(null);
        resetForm();
        fetchUsers();
      } else {
        setFormError(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      setFormError("Connection error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    setUpdating(userId);
    try {
      const res = await fetch("/api/auth/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error", error);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-wider border border-rose-500/20">{t("role_admin")}</span>;
      case "SECURITY":
        return <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black tracking-wider border border-primary/20">{t("role_security")}</span>;
      default:
        return <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 text-[10px] font-black tracking-wider border border-white/10">{t("role_user")}</span>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "SECURITY": return <ShieldCheck className="w-4 h-4 text-primary" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="w-fit px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-wider border border-emerald-500/20 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> ACTIVE</span>;
      case "INACTIVE":
        return <span className="w-fit px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-wider border border-amber-500/20 flex items-center gap-1"><Ban className="w-2.5 h-2.5" /> SUSPENDED</span>;
      case "DELETED":
        return <span className="w-fit px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-wider border border-rose-500/20 flex items-center gap-1"><Trash2 className="w-2.5 h-2.5" /> DELETED</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{t("management")}</span>
            </div>
            <h1 className="text-4xl font-black text-white">{t("user_management")}</h1>
            <p className="text-gray-500 max-w-xl">Control system access levels and manage permissions for all users on the platform.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Search by username..."
                className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-white shadow-inner font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowModal('create'); }}
              className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-xl font-black flex items-center justify-center gap-3 glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create User
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-gray-500 animate-pulse">Retrieving users database...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {users.map((u) => (
                  <UserCard
                    key={u.id}
                    u={u}
                    updating={updating}
                    getRoleBadge={getRoleBadge}
                    getRoleIcon={getRoleIcon}
                    getStatusBadge={getStatusBadge}
                    onEdit={() => {
                        setFormData({ username: u.username, password: "", role: u.role, status: u.status });
                        setSelectedUser(u);
                        setShowModal('edit');
                    }}
                    onDelete={() => handleDeleteUser(u.id)}
                  />
                ))}
              </AnimatePresence>

              {users.length === 0 && (
                <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-2xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-bold text-lg">No users found matching your search.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages >= 1 && users.length > 0 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-primary border-primary text-white glow-primary"
                          : "glass-card border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card p-10 border-primary/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    {showModal === 'create' ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
                  </div>
                  <h2 className="text-2xl font-black">{showModal === 'create' ? "Create New User" : "Edit User Profile"}</h2>
                </div>
                <button onClick={() => setShowModal(null)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={showModal === 'create' ? handleCreateUser : handleEditUser} className="space-y-6">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {showModal === 'edit' ? "New Password (Optional)" : "Password"}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      required={showModal === 'create'}
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={showModal === 'edit' ? "Leave blank to keep current" : "Enter password"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Role</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="USER" className="bg-[#0f111a]">USER</option>
                      <option value="SECURITY" className="bg-[#0f111a]">SECURITY</option>
                      <option value="ADMIN" className="bg-[#0f111a]">ADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Status</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE" className="bg-[#0f111a]">ACTIVE</option>
                      <option value="INACTIVE" className="bg-[#0f111a]">SUSPENDED</option>
                      <option value="DELETED" className="bg-[#0f111a]">DELETED</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (showModal === 'create' ? "Confirm Creation" : "Update Profile")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

type UserCardProps = {
  u: UserRecord;
  updating: string | null;
  getRoleBadge: (role: string) => React.ReactNode;
  getRoleIcon: (role: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
};

const UserCard = ({ u, updating, getRoleBadge, getRoleIcon, getStatusBadge, onEdit, onDelete }: UserCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-card p-6 border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center font-bold relative text-lg ${u.status === 'ACTIVE' ? 'from-white/10 to-transparent border-white/10 text-primary' : 'from-gray-800 to-transparent border-white/5 text-gray-600'}`}>
            {u.username[0].toUpperCase()}
            {u.status === 'ACTIVE' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#05070a] shadow-lg shadow-emerald-500/20" />}
          </div>
          <div className="flex flex-col">
            <span className={`font-black text-lg mb-0.5 ${u.status === 'ACTIVE' ? 'text-white' : 'text-gray-500 line-through'}`}>{u.username}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1.5 uppercase tracking-wider font-bold">
              <Mail className="w-3 h-3 text-primary/50" /> System Account
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {getRoleIcon(u.role)}
              {getRoleBadge(u.role)}
            </div>
            {getStatusBadge(u.status)}
          </div>

          <div className="hidden md:block h-8 w-px bg-white/5" />

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Joined Date</span>
            <span className="text-sm text-gray-400 font-bold">
              {format(new Date(u.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {updating === u.id ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:text-white hover:bg-blue-500/90 transition-all border border-blue-500/20 hover:border-blue-500/50"
                  title="Edit User"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500/90 transition-all border border-rose-500/20 hover:border-rose-500/50"
                  title="Delete User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
