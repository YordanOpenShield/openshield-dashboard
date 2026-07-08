"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string | null;
  banned: boolean | null;
  banReason: string | null;
}

interface UsersResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
}

interface UserRolesResponse {
  userId: string;
  builtInRole: string;
  customRoles: CustomRole[];
}

interface UserSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
}

// ─── Modal Component ─────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500/10 border-green-500/20 text-green-400"
      : "bg-red-500/10 border-red-500/20 text-red-400";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className={`${bgColor} px-4 py-2.5 rounded-lg text-sm font-medium`}>
        {message}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  // User list state
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Ban/unban state
  const [banningUser, setBanningUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  // Custom roles state
  const [allCustomRoles, setAllCustomRoles] = useState<CustomRole[]>([]);
  const [userCustomRoleIds, setUserCustomRoleIds] = useState<Set<string>>(new Set());
  const [rolesLoading, setRolesLoading] = useState(false);

  // Permission state for gating action buttons
  const [perms, setPerms] = useState({ canEdit: false, canBan: false, canDelete: false });

  // Fetch permissions on mount
  useEffect(() => {
    async function loadPerms() {
      const [editRes, banRes, delRes] = await Promise.all([
        fetch("/api/admin/check-permission?resource=user&action=update"),
        fetch("/api/admin/check-permission?resource=user&action=ban"),
        fetch("/api/admin/check-permission?resource=user&action=delete"),
      ]);
      const [edit, ban, del] = await Promise.all([
        editRes.json().then((r) => r.authorized).catch(() => false),
        banRes.json().then((r) => r.authorized).catch(() => false),
        delRes.json().then((r) => r.authorized).catch(() => false),
      ]);
      setPerms({ canEdit: edit, canBan: ban, canDelete: del });
    }
    loadPerms();
  }, []);

  // Sessions state
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Fetch users ───────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: UsersResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setToast({ message: "Failed to load users", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Create user ───────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create user");
      }

      setToast({ message: "User created successfully", type: "success" });
      setShowCreate(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to create user", type: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Update user ───────────────────────────────────────────────────────────

  const openEdit = async (user: User) => {
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditEmail(user.email);

    // Fetch all roles and determine which ones are assigned
    setRolesLoading(true);
    try {
      const rolesRes = await fetch("/api/admin/roles");
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const allRoles: CustomRole[] = rolesData.roles ?? [];
        setAllCustomRoles(allRoles);
        // Determine assigned role IDs from the user.role column (comma-separated)
        const assignedRoleNames = (user.role ?? "").split(",").map((r) => r.trim()).filter(Boolean);
        const assignedIds = new Set(
          allRoles.filter((r) => assignedRoleNames.includes(r.name)).map((r) => r.id)
        );
        setUserCustomRoleIds(assignedIds);
      }
    } catch {
      // Silently fail
    } finally {
      setRolesLoading(false);
    }

    // Fetch user sessions
    setSessionsLoading(true);
    try {
      const sessionsRes = await fetch(`/api/admin/users/${user.id}/sessions`);
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setUserSessions(sessionsData.sessions ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update user");
      }

      setToast({ message: "User updated successfully", type: "success" });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update user", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Toggle role ───────────────────────────────────────────────────────────

  const handleToggleRole = async (roleId: string, assign: boolean) => {
    if (!editingUser) return;

    // Find the role name
    const role = allCustomRoles.find((r) => r.id === roleId);
    if (!role) return;

    // Optimistic update: update both the checked set and the displayed role string
    const newSet = new Set(userCustomRoleIds);
    if (assign) newSet.add(roleId);
    else newSet.delete(roleId);
    setUserCustomRoleIds(newSet);

    // Update the local editing user's role string for immediate feedback
    const currentRoles = (editingUser.role ?? "").split(",").map((r) => r.trim()).filter(Boolean);
    const updatedRoles = assign
      ? [...new Set([...currentRoles, role.name])]
      : currentRoles.filter((r) => r !== role.name);
    setEditingUser({ ...editingUser, role: updatedRoles.join(",") });

    try {
      const url = assign
        ? `/api/admin/users/${editingUser.id}/roles`
        : `/api/admin/users/${editingUser.id}/roles?roleId=${roleId}`;
      const res = await fetch(url, {
        method: assign ? "POST" : "DELETE",
        headers: assign ? { "Content-Type": "application/json" } : undefined,
        body: assign ? JSON.stringify({ roleId }) : undefined,
      });

      if (!res.ok) {
        // Revert on failure
        setUserCustomRoleIds(new Set(userCustomRoleIds));
        setEditingUser({ ...editingUser, role: currentRoles.join(",") });
        const err = await res.json();
        throw new Error(err.error ?? `Failed to ${assign ? "assign" : "remove"} role`);
      }

      setToast({
        message: `Role "${role.name}" ${assign ? "assigned" : "removed"} successfully`,
        type: "success",
      });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update roles", type: "error" });
    }
  };

  // ─── Revoke session ────────────────────────────────────────────────────────

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSession(sessionToken);
    try {
      const res = await fetch(
        `/api/admin/users/${editingUser!.id}/sessions?sessionToken=${encodeURIComponent(sessionToken)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to revoke session");
      }

      setUserSessions((prev) => prev.filter((s) => s.token !== sessionToken));
      setToast({ message: "Session revoked successfully", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to revoke session", type: "error" });
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(
        `/api/admin/users/${editingUser.id}/sessions?revokeAll=true`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to revoke sessions");
      }

      setUserSessions([]);
      setToast({ message: "All sessions revoked", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to revoke sessions", type: "error" });
    }
  };

  // ─── Delete user ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete user");
      }

      setToast({ message: "User deleted successfully", type: "success" });
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete user", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Ban / Unban user ──────────────────────────────────────────────────────

  const openBan = (user: User) => {
    setBanningUser(user);
    setBanReason(user.banReason ?? "");
  };

  const handleBan = async () => {
    if (!banningUser) return;
    setBanLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${banningUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: true,
          banReason: banReason || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to ban user");
      }

      setToast({ message: `${banningUser.name || banningUser.email} has been banned`, type: "success" });
      setBanningUser(null);
      setBanReason("");
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to ban user", type: "error" });
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: false, banReason: null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to unban user");
      }

      setToast({ message: `${user.name || user.email} has been unbanned`, type: "success" });
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to unban user", type: "error" });
    }
  };

  // ─── Helper: format date ───────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Debounced search ──────────────────────────────────────────────────────

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Users</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all registered users ({total} total)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[0, 1, 2, 3, 4, 5].map((j) => {
                      // Deterministic widths per column to avoid hydration mismatch
                      const widths = ["40%", "55%", "28%", "30%", "35%", "20%"];
                      return (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: widths[j] }} />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    {search ? "No users match your search" : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-gray-200 font-medium truncate max-w-[160px]">
                          {user.name || "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono truncate max-w-[220px]">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.role
                          ? user.role.split(",").map((r) => {
                              const trimmed = r.trim();
                              if (!trimmed) return null;
                              const isAdmin = trimmed === "admin";
                              return (
                                <span
                                  key={trimmed}
                                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                                    isAdmin
                                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                      : trimmed === "user"
                                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  }`}
                                >
                                  {trimmed}
                                </span>
                              );
                            })
                          : <span className="text-xs text-gray-600">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {perms.canEdit && (
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all duration-200"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        )}
                        {perms.canBan && (user.banned ? (
                          <button
                            type="button"
                            onClick={() => handleUnban(user)}
                            className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-all duration-200"
                            title="Unban user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBan(user)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                            title="Ban user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        ))}
                        {perms.canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                          title="Delete user"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-sm text-gray-500">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create User Modal ──────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Name
            </label>
            <input
              id="create-name"
              type="text"
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="create-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="create-email"
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="create-password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="create-password"
              type="password"
              required
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
          <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              Users are created without roles. You can assign roles after creation by editing the user.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {createLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit User Modal ────────────────────────────────────────────────── */}
      <Modal
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title={`Edit User${editingUser ? ` — ${editingUser.name || editingUser.email}` : ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Roles
              <span className="text-xs text-gray-500 font-normal ml-2">(toggle to assign or remove)</span>
            </label>
            {rolesLoading ? (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
                <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
              </div>
            ) : allCustomRoles.length === 0 ? (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-500">No roles defined. <Link href="/admin/roles" className="text-violet-400 hover:text-violet-300 underline">Create one</Link>.</p>
              </div>
            ) : (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-3 space-y-1 max-h-60 overflow-y-auto">
                {allCustomRoles.map((role) => {
                  const isAssigned = userCustomRoleIds.has(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                        isAssigned
                          ? "bg-violet-500/10 border border-violet-500/20"
                          : "hover:bg-white/[0.02] border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => handleToggleRole(role.id, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-200 font-medium">{role.name}</span>
                        {role.description && (
                          <p className="text-xs text-gray-500 truncate">{role.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">
                        {Object.keys(role.permissions).length} resource{(Object.keys(role.permissions).length !== 1) ? "s" : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Sessions
              </label>
              {userSessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllSessions}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
                >
                  Revoke all
                </button>
              )}
            </div>
            {sessionsLoading ? (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
                <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
              </div>
            ) : userSessions.length === 0 ? (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-500">No active sessions</p>
              </div>
            ) : (
              <div className="bg-[#0d0d0d] border border-white/10 rounded-lg divide-y divide-white/5 max-h-48 overflow-y-auto">
                {userSessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs text-gray-400 font-mono truncate">
                          {session.ipAddress || "Unknown IP"}
                        </span>
                      </div>
                      {session.userAgent && (
                        <p className="text-xs text-gray-600 truncate mt-0.5 pl-[14px]">
                          {session.userAgent}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5 pl-[14px]">
                        Created {new Date(session.createdAt).toLocaleDateString()} · Expires{" "}
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!session.impersonatedBy && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(session.token)}
                        disabled={revokingSession === session.token}
                        className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-40 shrink-0 mt-0.5 transition-colors duration-200"
                      >
                        {revokingSession === session.token ? "Revoking..." : "Revoke"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        open={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingUser?.name || deletingUser?.email}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Ban User Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={banningUser !== null}
        onClose={() => { setBanningUser(null); setBanReason(""); }}
        title={`Ban User — ${banningUser?.name || banningUser?.email || ""}`}
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">
              Banning this user will immediately revoke all their active sessions and prevent them from signing in.
            </p>
          </div>
          <div>
            <label htmlFor="ban-reason" className="block text-sm font-medium text-gray-300 mb-1.5">
              Reason (optional)
            </label>
            <input
              id="ban-reason"
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g. Violation of terms of service"
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setBanningUser(null); setBanReason(""); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBan}
              disabled={banLoading}
              className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {banLoading ? "Banning..." : "Ban User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
