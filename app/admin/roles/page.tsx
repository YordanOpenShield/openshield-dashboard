"use client";

import { useState, useEffect, useCallback } from "react";


// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

// Fallback permissions if the API call fails (used during initial render)
const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  user: ["create", "list", "get", "update", "delete", "set-role", "ban", "impersonate", "impersonate-admins", "set-password", "set-email"],
  session: ["list", "revoke"],
  roles: ["list", "create", "update", "delete"],
  sso: ["read", "update"],
  dashboard: ["read"],
};

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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
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
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl"
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

// ─── Permission Toggle Component ─────────────────────────────────────────────

function PermissionToggle({
  resource,
  action,
  checked,
  onChange,
}: {
  resource: string;
  action: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2"
      />
      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{action}</span>
    </label>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string[]>>(FALLBACK_PERMISSIONS);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPermissions, setCreatePermissions] = useState<Record<string, string[]>>({});
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal state
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<Record<string, string[]>>({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Fetch roles and permissions ───────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data.roles);
    } catch {
      setToast({ message: "Failed to load roles", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        if (data.resources) {
          setAvailablePermissions(data.resources);
        }
      }
    } catch {
      // Fallback permissions already set
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ─── Permission helpers ────────────────────────────────────────────────────

  const hasPermission = (permissions: Record<string, string[]>, resource: string, action: string) => {
    return permissions[resource]?.includes(action) ?? false;
  };

  const togglePermission = (
    permissions: Record<string, string[]>,
    resource: string,
    action: string,
    checked: boolean
  ): Record<string, string[]> => {
    const newPermissions = { ...permissions };
    if (checked) {
      newPermissions[resource] = [...(newPermissions[resource] || []), action];
    } else {
      newPermissions[resource] = (newPermissions[resource] || []).filter((a) => a !== action);
      if (newPermissions[resource].length === 0) {
        delete newPermissions[resource];
      }
    }
    return newPermissions;
  };

  // ─── Create role ───────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          description: createDescription,
          permissions: createPermissions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create role");
      }

      setToast({ message: "Role created successfully", type: "success" });
      setShowCreate(false);
      setCreateName("");
      setCreateDescription("");
      setCreatePermissions({});
      fetchRoles();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to create role", type: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Update role ───────────────────────────────────────────────────────────

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    setEditName(role.name);
    setEditDescription(role.description ?? "");
    setEditPermissions(role.permissions);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          permissions: editPermissions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update role");
      }

      setToast({ message: "Role updated successfully", type: "success" });
      setEditingRole(null);
      fetchRoles();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update role", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Delete role ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${deletingRole.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete role");
      }

      setToast({ message: "Role deleted successfully", type: "success" });
      setDeletingRole(null);
      fetchRoles();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete role", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Format date ───────────────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Render permission summary ─────────────────────────────────────────────

  const renderPermissionSummary = (permissions: Record<string, string[]>) => {
    const entries = Object.entries(permissions).filter(([, actions]) => actions.length > 0);
    if (entries.length === 0) return <span className="text-gray-600 italic">No permissions</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {entries.slice(0, 3).map(([resource, actions]) => (
          <span
            key={resource}
            className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20"
          >
            {resource}: {actions.length}
          </span>
        ))}
        {entries.length > 3 && (
          <span className="text-xs text-gray-500">+{entries.length - 3} more</span>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Roles</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage custom roles and their permissions
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
          Create Role
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-400">
          <span className="font-semibold">Roles are permission wrappers.</span> {" "}
          Create roles that bundle specific permissions, then assign them to users.
          A user's effective permissions are the union of all their assigned roles.
          Changes take effect on server restart.
        </p>
      </div>

      {/* Roles Table */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {[0, 1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: ["35%", "60%", "45%", "25%", "20%"][j] }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No custom roles created yet. Click "Create Role" to add one.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-semibold text-xs shrink-0">
                          {role.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-200 font-medium">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {role.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {renderPermissionSummary(role.permissions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(role.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all duration-200"
                          title="Edit role"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRole(role)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                          title="Delete role"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Create Role Modal ──────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Role">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Role Name
            </label>
            <input
              id="create-name"
              type="text"
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. moderator"
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-500">Letters, numbers, hyphens, and underscores only</p>
          </div>
          <div>
            <label htmlFor="create-description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <input
              id="create-description"
              type="text"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="e.g. Can manage users but not system settings"
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
            <div className="space-y-4 bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
              {Object.entries(availablePermissions).map(([resource, actions]) => (
                <div key={resource}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{resource}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actions.map((action) => (
                      <PermissionToggle
                        key={`${resource}-${action}`}
                        resource={resource}
                        action={action}
                        checked={hasPermission(createPermissions, resource, action)}
                        onChange={(checked) =>
                          setCreatePermissions(togglePermission(createPermissions, resource, action, checked))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              {createLoading ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Role Modal ────────────────────────────────────────────────── */}
      <Modal open={editingRole !== null} onClose={() => setEditingRole(null)} title={`Edit Role — ${editingRole?.name}`}>
        <form onSubmit={handleEdit} className="space-y-5">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Role Name
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
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <input
              id="edit-description"
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="block w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
            <div className="space-y-4 bg-[#0d0d0d] border border-white/10 rounded-lg p-4">
              {Object.entries(availablePermissions).map(([resource, actions]) => (
                <div key={resource}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{resource}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actions.map((action) => (
                      <PermissionToggle
                        key={`edit-${resource}-${action}`}
                        resource={resource}
                        action={action}
                        checked={hasPermission(editPermissions, resource, action)}
                        onChange={(checked) =>
                          setEditPermissions(togglePermission(editPermissions, resource, action, checked))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingRole(null)}
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
      <Modal open={deletingRole !== null} onClose={() => setDeletingRole(null)} title="Delete Role">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">
              Are you sure you want to delete the role{" "}
              <span className="font-semibold">{deletingRole?.name}</span>?
              This action cannot be undone. Users assigned this role will lose these permissions.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingRole(null)}
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
              {deleteLoading ? "Deleting..." : "Delete Role"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
