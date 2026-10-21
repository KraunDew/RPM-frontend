"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.BACKEND ?? "http://localhost:3000";

type UserRole = "USER" | "SUPPLIER" | "ADMIN" | "SUPERADMIN";

type User = {
    id_user: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role: UserRole;
    createdAt?: string;
    created_at?: string;
};

const ROLES: UserRole[] = ["USER", "SUPPLIER", "ADMIN", "SUPERADMIN"];

const ROLE_LABELS: Record<UserRole, string> = {
    USER: "Cliente",
    SUPPLIER: "Proveedor",
    ADMIN: "Administrador",
    SUPERADMIN: "Superadministrador",
};

function getDisplayName(user: User) {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return fullName || user.name || "Sin nombre";
}

function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
        if (status === 403) return "No tienes permisos para realizar esta acción.";
        if (Array.isArray(message)) return message.join(", ");
        if (typeof message === "string") return message;
    }

    return fallback;
}

function RoleBadge({ role }: { role: UserRole }) {
    const styles: Record<UserRole, string> = {
        USER: "border-slate-700 bg-slate-800/70 text-slate-300",
        SUPPLIER: "border-blue-500/20 bg-blue-500/10 text-blue-300",
        ADMIN: "border-orange-500/20 bg-orange-500/10 text-orange-300",
        SUPERADMIN: "border-red-500/20 bg-red-500/10 text-red-300",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[role]}`}>
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

export default function UsuariosPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>("USER");

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [usersResponse, meResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/users`, { withCredentials: true }),
                axios.get(`${API_URL}/users/me`, { withCredentials: true }),
            ]);

            if (usersResponse.status === "rejected") {
                throw usersResponse.reason;
            }

            const responseData = usersResponse.value.data;
            const list: User[] = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                  ? responseData.data
                  : [];

            setUsers(list);

            if (meResponse.status === "fulfilled") {
                const me = meResponse.value.data;
                setCurrentUserId(me?.id_user ?? me?.id ?? null);
                setCurrentUserRole(me?.role ?? null);
            } else {
                setCurrentUserId(null);
                setCurrentUserRole(null);
            }
        } catch (err) {
            setError(getErrorMessage(err, "No se pudieron cargar los usuarios."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return users.filter(user => {
            const matchesSearch =
                getDisplayName(user).toLowerCase().includes(normalizedSearch) ||
                user.email.toLowerCase().includes(normalizedSearch) ||
                user.id_user.toLowerCase().includes(normalizedSearch);

            const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const stats = useMemo(
        () => ({
            total: users.length,
            customers: users.filter(user => user.role === "USER").length,
            suppliers: users.filter(user => user.role === "SUPPLIER").length,
            admins: users.filter(user => user.role === "ADMIN" || user.role === "SUPERADMIN").length,
        }),
        [users],
    );

    function canManageRole(target: User): boolean {
        if (!currentUserRole || target.id_user === currentUserId) return false;

        if (currentUserRole === "ADMIN") {
            return target.role !== "ADMIN" && target.role !== "SUPERADMIN";
        }

        if (currentUserRole === "SUPERADMIN") {
            return target.role !== "SUPERADMIN";
        }

        return false;
    }

    function canDeleteUser(target: User): boolean {
        return canManageRole(target);
    }

    function openEditModal(user: User) {
        if (!canManageRole(user)) {
            setError("No tienes permisos para modificar el rol de esta cuenta.");
            return;
        }

        setEditingUser(user);
        setSelectedRole(user.role);
        setError("");
        setSuccess("");
    }

    async function handleUpdateRole() {
        if (!editingUser || saving) return;

        if (!canManageRole(editingUser)) {
            setEditingUser(null);
            setError("No tienes permisos para modificar el rol de esta cuenta.");
            return;
        }

        if (selectedRole === editingUser.role) {
            setEditingUser(null);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await axios.patch(
                `${API_URL}/users/${editingUser.id_user}`,
                { role: selectedRole },
                { withCredentials: true },
            );

            setUsers(previous =>
                previous.map(user => (user.id_user === editingUser.id_user ? { ...user, role: selectedRole } : user)),
            );

            setEditingUser(null);
            setSuccess("El rol del usuario se actualizó correctamente.");
        } catch (err) {
            setError(getErrorMessage(err, "No se pudo actualizar el rol."));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user: User) {
        if (!canDeleteUser(user)) {
            setError(
                user.id_user === currentUserId
                    ? "No puedes eliminar tu propia cuenta desde este panel."
                    : "No tienes permisos para eliminar esta cuenta.",
            );
            return;
        }

        const confirmed = window.confirm(
            `¿Eliminar la cuenta de ${getDisplayName(user)} (${user.email})? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) return;

        setDeletingId(user.id_user);
        setError("");
        setSuccess("");

        try {
            await axios.delete(`${API_URL}/users/${user.id_user}`, {
                withCredentials: true,
            });

            setUsers(previous => previous.filter(item => item.id_user !== user.id_user));
            setSuccess("La cuenta se eliminó correctamente.");
        } catch (err) {
            setError(getErrorMessage(err, "No se pudo eliminar la cuenta. Puede tener registros relacionados."));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="min-h-screen space-y-8 bg-[#0d0f13] p-4 text-white sm:p-6 lg:p-8">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Administración RPM
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Usuarios</h1>

                    <p className="mt-2 max-w-xl text-sm text-slate-400">
                        Administra las cuentas, revisa los perfiles y controla los permisos de acceso de la plataforma.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadUsers()}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className={loading ? "animate-spin" : ""}>↻</span>
                    Actualizar
                </button>
            </header>

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
                >
                    <span className="font-bold">!</span>
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="ml-auto text-red-300/70 hover:text-white"
                        aria-label="Cerrar mensaje de error"
                    >
                        ✕
                    </button>
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300"
                >
                    <span className="font-bold">✓</span>
                    <p>{success}</p>
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        className="ml-auto text-emerald-300/70 hover:text-white"
                        aria-label="Cerrar mensaje"
                    >
                        ✕
                    </button>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Total de cuentas", value: stats.total, detail: "Usuarios registrados", icon: "◎" },
                    { label: "Clientes", value: stats.customers, detail: "Cuentas de compradores", icon: "○" },
                    { label: "Proveedores", value: stats.suppliers, detail: "Cuentas de proveedores", icon: "◇" },
                    {
                        label: "Administradores",
                        value: stats.admins,
                        detail: "Cuentas con permisos elevados",
                        icon: "⬡",
                    },
                ].map(stat => (
                    <article
                        key={stat.label}
                        className="rounded-2xl border border-white/[0.07] bg-[#13161c] p-5 transition hover:border-white/[0.13]"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-sm text-slate-400">{stat.label}</p>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-lg text-red-400">
                                {stat.icon}
                            </span>
                        </div>
                        <p className="mt-4 text-3xl font-bold tracking-tight">{loading ? "—" : stat.value}</p>
                        <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
                    </article>
                ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13161c]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Todas las cuentas</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {filteredUsers.length} resultado{filteredUsers.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, correo o ID..."
                            className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0f13] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500/50 sm:w-72"
                        />

                        <select
                            value={roleFilter}
                            onChange={event => setRoleFilter(event.target.value)}
                            className="h-11 rounded-xl border border-white/10 bg-[#0d0f13] px-3 text-sm text-slate-300 outline-none focus:border-red-500/50"
                            aria-label="Filtrar por rol"
                        >
                            <option value="ALL">Todos los roles</option>
                            {ROLES.map(role => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4 font-medium">Usuario</th>
                                <th className="px-5 py-4 font-medium">Correo electrónico</th>
                                <th className="px-5 py-4 font-medium">Rol</th>
                                <th className="px-5 py-4 font-medium">Identificador</th>
                                <th className="px-5 py-4 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.05]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />
                                        <p className="text-sm text-slate-400">Cargando usuarios...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <p className="font-medium text-slate-300">No se encontraron usuarios</p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Prueba con otro término o cambia el filtro de rol.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isCurrentUser = user.id_user === currentUserId;
                                    const canEditRole = canManageRole(user);
                                    const canDelete = canDeleteUser(user);

                                    return (
                                        <tr key={user.id_user} className="transition hover:bg-white/[0.02]">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] font-semibold text-slate-300">
                                                        {getDisplayName(user).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-100">
                                                            {getDisplayName(user)}
                                                        </p>
                                                        {isCurrentUser && (
                                                            <span className="mt-0.5 inline-block text-xs text-red-400">
                                                                Tu cuenta
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-slate-400">{user.email}</td>

                                            <td className="px-5 py-4">
                                                <RoleBadge role={user.role} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <span title={user.id_user} className="font-mono text-xs text-slate-500">
                                                    {user.id_user.length > 15
                                                        ? `${user.id_user.slice(0, 15)}...`
                                                        : user.id_user}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        disabled={!canEditRole || deletingId === user.id_user}
                                                        title={
                                                            isCurrentUser
                                                                ? "No puedes cambiar tu propio rol"
                                                                : !canEditRole
                                                                  ? "No tienes permisos para modificar el rol de esta cuenta"
                                                                  : "Editar rol"
                                                        }
                                                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Editar rol
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(user)}
                                                        disabled={!canDelete || deletingId === user.id_user}
                                                        title={
                                                            isCurrentUser
                                                                ? "No puedes eliminar tu propia cuenta"
                                                                : !canDelete
                                                                  ? "No tienes permisos para eliminar esta cuenta"
                                                                  : "Eliminar usuario"
                                                        }
                                                        className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        {deletingId === user.id_user ? "Eliminando..." : "Eliminar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Mostrando {loading ? 0 : filteredUsers.length} de {users.length} usuarios
                    </span>
                    <span>RPM · Panel de administración</span>
                </div>
            </section>

            {editingUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !saving) setEditingUser(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-user-title"
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15181f] p-6 shadow-2xl shadow-black/40"
                    >
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                                    Gestión de cuentas
                                </p>
                                <h2 id="edit-user-title" className="mt-2 text-xl font-bold">
                                    Cambiar rol
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">Define los permisos de esta cuenta.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                                aria-label="Cerrar modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                            <p className="font-medium text-slate-100">{getDisplayName(editingUser)}</p>
                            <p className="mt-1 break-all text-sm text-slate-400">{editingUser.email}</p>
                            <div className="mt-3">
                                <RoleBadge role={editingUser.role} />
                            </div>
                        </div>

                        <label htmlFor="user-role" className="mb-2 block text-sm font-medium text-slate-300">
                            Nuevo rol
                        </label>

                        <select
                            id="user-role"
                            value={selectedRole}
                            onChange={event => setSelectedRole(event.target.value as UserRole)}
                            disabled={saving}
                            className="h-12 w-full rounded-xl border border-white/10 bg-[#0d0f13] px-3 text-sm text-white outline-none focus:border-red-500/50 disabled:opacity-50"
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>

                        {selectedRole === "SUPERADMIN" && (
                            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-xs leading-5 text-red-300">
                                Este rol concede permisos elevados. Asígnalo únicamente a cuentas de confianza.
                            </p>
                        )}

                        <div className="mt-7 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                disabled={saving}
                                className="h-11 flex-1 rounded-xl border border-white/10 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleUpdateRole()}
                                disabled={saving || selectedRole === editingUser.role}
                                className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
