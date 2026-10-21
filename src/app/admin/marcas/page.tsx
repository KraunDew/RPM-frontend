"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconEdit,
    IconGlobe,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconTags,
    IconTrash,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

type Brand = {
    id_brand: string;
    name: string;
    country_origin?: string | null;
};

type BrandForm = {
    name: string;
    country_origin: string;
};

const EMPTY_FORM: BrandForm = {
    name: "",
    country_origin: "",
};

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;

        if (Array.isArray(message)) return message.join(", ");
        if (typeof message === "string") return message;

        if (!error.response) {
            return "No se pudo conectar con el backend.";
        }

        if (error.response.status === 401 || error.response.status === 403) {
            return "No tienes permisos para realizar esta operación. Revisa tu sesión y los permisos del backend.";
        }

        if (error.response.status === 409) {
            return "Ya existe una marca con esos datos.";
        }

        if (error.response.status === 400) {
            return "Los datos enviados no son válidos.";
        }

        return `Error del servidor (${error.response.status}).`;
    }

    return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
    const [formError, setFormError] = useState("");

    const loadBrands = useCallback(async () => {
        if (!API_URL) {
            setError("Falta configurar NEXT_PUBLIC_BACKEND en .env.local.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get<Brand[]>(`${API_URL}/brands`, {
                withCredentials: true,
            });

            if (!Array.isArray(response.data)) {
                throw new Error("El backend no devolvió una lista de marcas.");
            }

            setBrands(response.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBrands();
    }, [loadBrands]);

    const filteredBrands = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return brands;

        return brands.filter(brand =>
            [brand.name, brand.country_origin ?? ""].some(value => value.toLowerCase().includes(term)),
        );
    }, [brands, search]);

    function openCreateModal() {
        setEditingBrand(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setNotice("");
        setModalOpen(true);
    }

    function openEditModal(brand: Brand) {
        setEditingBrand(brand);
        setForm({
            name: brand.name,
            country_origin: brand.country_origin ?? "",
        });
        setFormError("");
        setNotice("");
        setModalOpen(true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");
        setNotice("");

        if (!API_URL) {
            setFormError("Falta configurar NEXT_PUBLIC_BACKEND.");
            return;
        }

        const name = form.name.trim();
        const countryOrigin = form.country_origin.trim();

        if (!name) {
            setFormError("El nombre de la marca es obligatorio.");
            return;
        }

        const payload = {
            name,
            country_origin: countryOrigin || null,
        };

        setSaving(true);

        try {
            if (editingBrand) {
                await axios.patch(`${API_URL}/brands/${editingBrand.id_brand}`, payload, { withCredentials: true });
                setNotice("Marca actualizada correctamente.");
            } else {
                await axios.post(`${API_URL}/brands`, payload, {
                    withCredentials: true,
                });
                setNotice("Marca creada correctamente.");
            }

            setModalOpen(false);
            await loadBrands();
        } catch (err) {
            setFormError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(brand: Brand) {
        const confirmed = window.confirm(
            `¿Eliminar la marca "${brand.name}"?\n\nEsta acción no se puede deshacer. Si existen productos asociados, el backend podría impedir su eliminación.`,
        );

        if (!confirmed || !API_URL) return;

        setDeletingId(brand.id_brand);
        setError("");
        setNotice("");

        try {
            await axios.delete(`${API_URL}/brands/${brand.id_brand}`, {
                withCredentials: true,
            });

            setNotice(`Marca "${brand.name}" eliminada correctamente.`);
            await loadBrands();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-7">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
                            Catálogo automotriz
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Marcas<span className="text-red-500">.</span>
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Gestiona las marcas de los repuestos disponibles en RPM.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => void loadBrands()}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-red-500/30 hover:text-white disabled:opacity-50"
                    >
                        <IconRefresh size={17} className={loading ? "animate-spin" : ""} />
                        Actualizar
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
                    >
                        <IconPlus size={18} />
                        Nueva marca
                    </button>
                </div>
            </header>

            {notice && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-400">
                    <IconCheck size={18} />
                    <span>{notice}</span>
                    <button onClick={() => setNotice("")} className="ml-auto" aria-label="Cerrar aviso">
                        <IconX size={17} />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                    <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="ml-auto" aria-label="Cerrar error">
                        <IconX size={17} />
                    </button>
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-white/[0.08] bg-[#101216] p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400">Marcas registradas</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/[0.08] text-red-400">
                            <IconTags size={21} />
                        </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold tracking-tight text-white">{loading ? "…" : brands.length}</p>
                    <p className="mt-1 text-xs text-zinc-500">Total registrado en el backend</p>
                </article>

                <article className="rounded-xl border border-white/[0.08] bg-[#101216] p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400">Resultados de búsqueda</p>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300">
                            <IconSearch size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold tracking-tight text-white">
                        {loading ? "…" : filteredBrands.length}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Marcas que coinciden con el filtro</p>
                </article>
            </section>

            <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101216]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="font-semibold text-white">Listado de marcas</h2>
                        <p className="mt-1 text-xs text-zinc-500">
                            {loading ? "Cargando marcas…" : `${filteredBrands.length} de ${brands.length} marcas`}
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Buscar por marca o país..."
                            className="w-full rounded-lg border border-white/10 bg-[#090b0e] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-zinc-400">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                        Cargando marcas…
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <IconTags size={34} className="mx-auto text-zinc-600" />
                        <h3 className="mt-3 font-semibold text-zinc-200">
                            {brands.length === 0 ? "Todavía no hay marcas" : "No encontramos coincidencias"}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-500">
                            {brands.length === 0
                                ? "Crea tu primera marca para asociarla a los productos."
                                : "Prueba con otro nombre o país de origen."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Marca</th>
                                    <th className="px-5 py-4 font-semibold">País de origen</th>
                                    <th className="px-5 py-4 text-right font-semibold">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.05]">
                                {filteredBrands.map(brand => (
                                    <tr key={brand.id_brand} className="transition hover:bg-white/[0.025]">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-400">
                                                    <IconTags size={19} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-100">{brand.name}</p>
                                                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                                                        {brand.id_brand}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {brand.country_origin ? (
                                                <span className="inline-flex items-center gap-2 text-zinc-300">
                                                    <IconGlobe size={16} className="text-zinc-500" />
                                                    {brand.country_origin}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">No especificado</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(brand)}
                                                    aria-label={`Editar ${brand.name}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-500/30 hover:text-white"
                                                >
                                                    <IconEdit size={16} />
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => void handleDelete(brand)}
                                                    disabled={deletingId === brand.id_brand}
                                                    aria-label={`Eliminar ${brand.name}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/15 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                                                >
                                                    {deletingId === brand.id_brand ? (
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                                                    ) : (
                                                        <IconTrash size={16} />
                                                    )}
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:items-center"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !saving) {
                            setModalOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="brand-form-title"
                        className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#101216] shadow-2xl shadow-black/40"
                    >
                        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
                                    Catálogo RPM
                                </p>
                                <h2 id="brand-form-title" className="mt-1 text-xl font-bold text-white">
                                    {editingBrand ? "Editar marca" : "Nueva marca"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                                aria-label="Cerrar formulario"
                                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                                <IconX size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 p-5">
                                <label className="block space-y-2">
                                    <span className="block text-sm font-medium text-zinc-300">
                                        Nombre de la marca <span className="text-red-400">*</span>
                                    </span>
                                    <input
                                        required
                                        maxLength={100}
                                        autoFocus
                                        value={form.name}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-[#090b0e] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                                        placeholder="Ej. Toyota"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="block text-sm font-medium text-zinc-300">País de origen</span>
                                    <input
                                        maxLength={100}
                                        value={form.country_origin}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                country_origin: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-[#090b0e] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                                        placeholder="Ej. Japón"
                                    />
                                </label>

                                {formError && (
                                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.08] p-3 text-sm leading-5 text-red-300">
                                        <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}
                            </div>

                            <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    )}
                                    {saving ? "Guardando..." : editingBrand ? "Guardar cambios" : "Crear marca"}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
