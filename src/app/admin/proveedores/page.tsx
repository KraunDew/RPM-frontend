"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconEdit,
    IconMail,
    IconMapPin,
    IconPhone,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconTrash,
    IconTruck,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.BACKEND;
const DPA_API = "https://apis.digital.gob.cl/dpa";

type Region = {
    codigo: string;
    nombre: string;
};

type Commune = {
    codigo: string;
    nombre: string;
};

type SupplierAddress = {
    id_address?: string;
    street: string;
    house_number: string;
    department?: string | null;
    block?: string | null;
    comune: string;
    region: string;
    reference?: string | null;
};

type Supplier = {
    id_supplier: string;
    name: string;
    email: string;
    phone_number: string;
    address?: SupplierAddress[];
};

type SupplierForm = {
    name: string;
    email: string;
    phone_number: string;
    street: string;
    house_number: string;
    department: string;
    block: string;
    comune: string;
    region: string;
    reference: string;
};

const REGIONS: Region[] = [
    { codigo: "15", nombre: "Región de Arica y Parinacota" },
    { codigo: "01", nombre: "Región de Tarapacá" },
    { codigo: "02", nombre: "Región de Antofagasta" },
    { codigo: "03", nombre: "Región de Atacama" },
    { codigo: "04", nombre: "Región de Coquimbo" },
    { codigo: "05", nombre: "Región de Valparaíso" },
    {
        codigo: "13",
        nombre: "Región Metropolitana de Santiago",
    },
    {
        codigo: "06",
        nombre: "Región del Libertador General Bernardo O'Higgins",
    },
    { codigo: "07", nombre: "Región del Maule" },
    { codigo: "16", nombre: "Región de Ñuble" },
    { codigo: "08", nombre: "Región del Biobío" },
    { codigo: "09", nombre: "Región de La Araucanía" },
    { codigo: "14", nombre: "Región de Los Ríos" },
    { codigo: "10", nombre: "Región de Los Lagos" },
    { codigo: "11", nombre: "Región de Aysén del General Carlos Ibáñez del Campo" },
    {
        codigo: "12",
        nombre: "Región de Magallanes y de la Antártica Chilena",
    },
];

const EMPTY_FORM: SupplierForm = {
    name: "",
    email: "",
    phone_number: "",
    street: "",
    house_number: "",
    department: "",
    block: "",
    comune: "",
    region: "",
    reference: "",
};

function getErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
    }

    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[] } | undefined;

    if (!error.response) {
        return "No se pudo conectar con el servidor. Revisa que el backend esté funcionando.";
    }

    if (status === 400) {
        return Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Los datos ingresados no son válidos.";
    }

    if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (status === 403) return "No tienes permisos para realizar esta acción.";
    if (status === 404) return "No se encontró el proveedor solicitado.";
    if (status === 409) return "Ya existe un proveedor con esos datos.";

    if (status === 500) {
        return "Ocurrió un error interno del servidor. Revisa el backend.";
    }

    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (data?.message) return data.message;

    return "No se pudo completar la operación.";
}

function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function findRegion(regionName: string): Region | undefined {
    const normalized = normalizeText(regionName)
        .replace(/^region (de |del |de la |de los |de las )?/, "")
        .replace(/^region metropolitana de /, "");

    return REGIONS.find(region => {
        const candidate = normalizeText(region.nombre)
            .replace(/^region (de |del |de la |de los |de las )?/, "")
            .replace(/^region metropolitana de /, "");

        return candidate === normalized || normalizeText(region.nombre) === normalizeText(regionName);
    });
}

export default function ProveedoresPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [communes, setCommunes] = useState<Commune[]>([]);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [communeError, setCommuneError] = useState("");
    const [communeReloadKey, setCommuneReloadKey] = useState(0);

    const regions = REGIONS;

    const selectedRegion = useMemo(() => findRegion(form.region), [form.region]);

    const availableCommunes = useMemo(
        () => [...communes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
        [communes],
    );

    const loadSuppliers = useCallback(async () => {
        if (!API_URL) {
            setError("Falta configurar BACKEND en .env.local.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(`${API_URL}/suppliers`, {
                withCredentials: true,
            });

            const data = response.data;

            const list: Supplier[] | null = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : null;

            if (!list) {
                throw new Error("La respuesta de /suppliers no contiene una lista de proveedores.");
            }

            setSuppliers(list);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // Las regiones están definidas localmente, así que no dependen de una API.
    // Solo se consulta el servicio externo para obtener las comunas.
    useEffect(() => {
        let cancelled = false;

        async function loadCommunes() {
            if (!selectedRegion) {
                setCommunes([]);
                setLoadingCommunes(false);
                return;
            }

            setLoadingCommunes(true);
            setCommuneError("");
            setCommunes([]);

            try {
                const response = await axios.get<Commune[]>(`${DPA_API}/regiones/${selectedRegion.codigo}/comunas`, {
                    timeout: 10000,
                });

                if (!Array.isArray(response.data)) {
                    throw new Error("Formato de comunas inválido.");
                }

                if (!cancelled) {
                    setCommunes(response.data);
                }
            } catch {
                if (!cancelled) {
                    setCommunes([]);
                    setCommuneError("No se pudieron cargar las comunas. Comprueba tu conexión e inténtalo nuevamente.");
                }
            } finally {
                if (!cancelled) setLoadingCommunes(false);
            }
        }

        void loadCommunes();

        return () => {
            cancelled = true;
        };
    }, [selectedRegion, communeReloadKey]);

    useEffect(() => {
        void loadSuppliers();
    }, [loadSuppliers]);

    useEffect(() => {
        if (!success) return;

        const timeout = setTimeout(() => setSuccess(""), 3500);
        return () => clearTimeout(timeout);
    }, [success]);

    const filteredSuppliers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return suppliers;

        return suppliers.filter(supplier => {
            const address = supplier.address?.[0];

            const values = [
                supplier.name,
                supplier.email,
                supplier.phone_number,
                address?.street,
                address?.house_number,
                address?.comune,
                address?.region,
            ];

            return values.some(value => value?.toLowerCase().includes(query));
        });
    }, [suppliers, search]);

    function openCreateModal() {
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
        setError("");
        setSuccess("");
        setCommuneError("");
        setCommunes([]);
        setModalOpen(true);
    }

    function openEditModal(supplier: Supplier) {
        const address = supplier.address?.[0];

        setEditingSupplier(supplier);
        setForm({
            name: supplier.name ?? "",
            email: supplier.email ?? "",
            phone_number: supplier.phone_number ?? "",
            street: address?.street ?? "",
            house_number: address?.house_number ?? "",
            department: address?.department ?? "",
            block: address?.block ?? "",
            comune: address?.comune ?? "",
            region: address?.region ?? "",
            reference: address?.reference ?? "",
        });

        setError("");
        setSuccess("");
        setCommuneError("");
        setCommunes([]);
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;

        setModalOpen(false);
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
        setError("");
        setCommuneError("");
        setCommunes([]);
    }

    function updateField<K extends keyof SupplierForm>(field: K, value: SupplierForm[K]) {
        setForm(previous => ({
            ...previous,
            [field]: value,
        }));
    }

    function handleRegionChange(regionCode: string) {
        const region = regions.find(item => item.codigo === regionCode);

        setForm(previous => ({
            ...previous,
            region: region?.nombre ?? "",
            comune: "",
        }));

        setCommunes([]);
        setCommuneError("");
    }

    function retryCommunes() {
        setCommuneError("");
        setCommuneReloadKey(previous => previous + 1);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!API_URL) {
            setError("Falta configurar BACKEND en .env.local.");
            return;
        }

        if (!selectedRegion) {
            setError("Debes seleccionar una región válida.");
            return;
        }

        const selectedCommune = availableCommunes.find(
            commune => normalizeText(commune.nombre) === normalizeText(form.comune),
        );

        if (!selectedCommune) {
            setError("Debes seleccionar una comuna válida para la región.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone_number: form.phone_number.trim(),
            address: {
                street: form.street.trim(),
                house_number: form.house_number.trim(),
                department: form.department.trim() || null,
                block: form.block.trim() || null,
                comune: selectedCommune.nombre,
                region: selectedRegion.nombre,
                reference: form.reference.trim() || null,
            },
        };

        try {
            if (editingSupplier) {
                await axios.patch(`${API_URL}/suppliers/${editingSupplier.id_supplier}`, payload, {
                    withCredentials: true,
                });

                setSuccess("Proveedor actualizado correctamente.");
            } else {
                await axios.post(`${API_URL}/suppliers`, payload, {
                    withCredentials: true,
                });

                setSuccess("Proveedor creado correctamente.");
            }

            setModalOpen(false);
            setEditingSupplier(null);
            setForm(EMPTY_FORM);

            await loadSuppliers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(supplier: Supplier) {
        const confirmed = window.confirm(
            `¿Seguro que quieres eliminar a "${supplier.name}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) return;

        if (!API_URL) {
            setError("Falta configurar BACKEND en .env.local.");
            return;
        }

        setError("");
        setSuccess("");
        setDeletingId(supplier.id_supplier);

        try {
            await axios.delete(`${API_URL}/suppliers/${supplier.id_supplier}`, { withCredentials: true });

            setSuccess("Proveedor eliminado correctamente.");
            await loadSuppliers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    }

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#0d0f13] px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-red-500/60";

    const selectClass =
        "w-full rounded-xl border border-white/10 bg-[#0d0f13] px-4 py-3 text-sm text-white outline-none transition focus:border-red-500/60 disabled:cursor-not-allowed disabled:opacity-50";

    const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

    return (
        <main className="min-h-screen bg-[#0d0f13] p-5 text-white sm:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-red-400">
                            <IconTruck size={18} />
                            <span>Administración / Proveedores</span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>

                        <p className="mt-2 text-sm text-zinc-400">
                            Administra los proveedores y sus datos de contacto y dirección.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500"
                    >
                        <IconPlus size={19} />
                        Nuevo proveedor
                    </button>
                </header>

                {success && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                        <IconCheck size={20} />
                        {success}
                    </div>
                )}

                {error && !modalOpen && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                        <IconAlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <div className="flex-1">{error}</div>
                        <button
                            onClick={() => setError("")}
                            aria-label="Cerrar mensaje"
                            className="text-red-300 hover:text-white"
                        >
                            <IconX size={18} />
                        </button>
                    </div>
                )}

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.07] bg-[#14171d] p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-400">Total de proveedores</p>
                            <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
                                <IconTruck size={22} />
                            </div>
                        </div>

                        <p className="mt-4 text-3xl font-bold">{suppliers.length}</p>
                        <p className="mt-1 text-xs text-zinc-500">Registrados en el sistema</p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-[#14171d] p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-400">Resultados de búsqueda</p>
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                                <IconSearch size={22} />
                            </div>
                        </div>

                        <p className="mt-4 text-3xl font-bold">{filteredSuppliers.length}</p>
                        <p className="mt-1 text-xs text-zinc-500">Coincidencias con el filtro actual</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#14171d]">
                    <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">Listado de proveedores</h2>
                            <p className="mt-1 text-sm text-zinc-500">Datos de contacto y ubicación comercial.</p>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1 sm:w-80">
                                <IconSearch
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                />
                                <input
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Buscar proveedor o dirección..."
                                    className="w-full rounded-xl border border-white/10 bg-[#0d0f13] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-red-500/60"
                                />
                            </div>

                            <button
                                onClick={() => void loadSuppliers()}
                                disabled={loading}
                                title="Actualizar listado"
                                aria-label="Actualizar listado"
                                className="rounded-xl border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                                <IconRefresh size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Proveedor</th>
                                    <th className="px-6 py-4 font-medium">Correo</th>
                                    <th className="px-6 py-4 font-medium">Teléfono</th>
                                    <th className="px-6 py-4 font-medium">Dirección</th>
                                    <th className="px-6 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.05]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-14 text-center">
                                            <IconRefresh size={24} className="mx-auto animate-spin text-red-400" />
                                            <p className="mt-3 text-zinc-400">Cargando proveedores...</p>
                                        </td>
                                    </tr>
                                ) : filteredSuppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-14 text-center">
                                            <IconTruck size={30} className="mx-auto text-zinc-600" />
                                            <p className="mt-3 font-medium text-zinc-300">
                                                {search
                                                    ? "No se encontraron proveedores"
                                                    : "Todavía no hay proveedores"}
                                            </p>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                {search
                                                    ? "Prueba con otro nombre, correo o dirección."
                                                    : "Agrega el primer proveedor para comenzar."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSuppliers.map(supplier => {
                                        const address = supplier.address?.[0];

                                        return (
                                            <tr key={supplier.id_supplier} className="transition hover:bg-white/[0.02]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 font-bold text-red-400">
                                                            {supplier.name?.charAt(0)?.toUpperCase() || "P"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-zinc-100">{supplier.name}</p>
                                                            <p className="mt-1 max-w-48 truncate text-xs text-zinc-500">
                                                                ID: {supplier.id_supplier}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-zinc-300">
                                                        <IconMail size={17} className="shrink-0 text-zinc-500" />
                                                        <span>{supplier.email}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-zinc-300">
                                                        <IconPhone size={17} className="shrink-0 text-zinc-500" />
                                                        <span>{supplier.phone_number}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {address ? (
                                                        <div className="flex max-w-xs items-start gap-2">
                                                            <IconMapPin
                                                                size={17}
                                                                className="mt-0.5 shrink-0 text-zinc-500"
                                                            />
                                                            <div>
                                                                <p className="text-zinc-200">
                                                                    {address.street} {address.house_number}
                                                                    {address.department
                                                                        ? `, ${address.department}`
                                                                        : ""}
                                                                    {address.block ? `, ${address.block}` : ""}
                                                                </p>
                                                                <p className="mt-1 text-xs text-zinc-500">
                                                                    {address.comune}, {address.region}
                                                                </p>
                                                                {address.reference && (
                                                                    <p className="mt-1 text-xs text-zinc-500">
                                                                        Ref.: {address.reference}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-500">Sin dirección</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(supplier)}
                                                            title="Editar proveedor"
                                                            aria-label={`Editar ${supplier.name}`}
                                                            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                                                        >
                                                            <IconEdit size={18} />
                                                        </button>

                                                        <button
                                                            onClick={() => void handleDelete(supplier)}
                                                            disabled={deletingId === supplier.id_supplier}
                                                            title="Eliminar proveedor"
                                                            aria-label={`Eliminar ${supplier.name}`}
                                                            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {deletingId === supplier.id_supplier ? (
                                                                <IconRefresh size={18} className="animate-spin" />
                                                            ) : (
                                                                <IconTrash size={18} />
                                                            )}
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

                    <div className="border-t border-white/[0.07] px-6 py-4 text-xs text-zinc-500">
                        Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores
                    </div>
                </section>
            </div>

            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#14171d] shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#14171d] p-6">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
                                </h2>
                                <p className="mt-1 text-sm text-zinc-500">
                                    Completa los datos de contacto y dirección.
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Cerrar formulario"
                                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            {error && (
                                <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                                    <IconAlertTriangle size={19} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <section className="space-y-4">
                                <h3 className="font-semibold text-zinc-100">Datos del proveedor</h3>

                                <div>
                                    <label htmlFor="supplier-name" className={labelClass}>
                                        Nombre del proveedor
                                    </label>
                                    <input
                                        id="supplier-name"
                                        required
                                        maxLength={120}
                                        autoFocus
                                        value={form.name}
                                        onChange={e => updateField("name", e.target.value)}
                                        placeholder="Ej. Repuestos del Sur"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="supplier-email" className={labelClass}>
                                        Correo electrónico
                                    </label>
                                    <input
                                        id="supplier-email"
                                        type="email"
                                        required
                                        maxLength={254}
                                        value={form.email}
                                        onChange={e => updateField("email", e.target.value)}
                                        placeholder="contacto@proveedor.cl"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="supplier-phone" className={labelClass}>
                                        Número de teléfono
                                    </label>
                                    <input
                                        id="supplier-phone"
                                        type="tel"
                                        required
                                        maxLength={25}
                                        value={form.phone_number}
                                        onChange={e => updateField("phone_number", e.target.value)}
                                        placeholder="Ej. +56 9 1234 5678"
                                        className={inputClass}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4 border-t border-white/[0.07] pt-5">
                                <div>
                                    <h3 className="font-semibold text-zinc-100">Dirección del proveedor</h3>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Selecciona primero la región y luego la comuna.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="supplier-street" className={labelClass}>
                                        Calle o avenida
                                    </label>
                                    <input
                                        id="supplier-street"
                                        required
                                        maxLength={150}
                                        value={form.street}
                                        onChange={e => updateField("street", e.target.value)}
                                        placeholder="Ej. Avenida Providencia"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="supplier-house-number" className={labelClass}>
                                            Número
                                        </label>
                                        <input
                                            id="supplier-house-number"
                                            required
                                            maxLength={20}
                                            value={form.house_number}
                                            onChange={e => updateField("house_number", e.target.value)}
                                            placeholder="Ej. 1234"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="supplier-region" className={labelClass}>
                                            Región
                                        </label>
                                        <select
                                            id="supplier-region"
                                            required
                                            value={selectedRegion?.codigo ?? ""}
                                            onChange={e => handleRegionChange(e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="">Selecciona una región</option>
                                            {regions.map(region => (
                                                <option key={region.codigo} value={region.codigo}>
                                                    {region.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="supplier-comune" className={labelClass}>
                                            Comuna
                                        </label>
                                        <select
                                            id="supplier-comune"
                                            required
                                            value={
                                                availableCommunes.find(
                                                    commune =>
                                                        normalizeText(commune.nombre) === normalizeText(form.comune),
                                                )?.codigo ?? ""
                                            }
                                            disabled={
                                                !selectedRegion || loadingCommunes || availableCommunes.length === 0
                                            }
                                            onChange={e => {
                                                const commune = availableCommunes.find(
                                                    item => item.codigo === e.target.value,
                                                );
                                                updateField("comune", commune?.nombre ?? "");
                                            }}
                                            className={selectClass}
                                        >
                                            <option value="">
                                                {!selectedRegion
                                                    ? "Primero selecciona una región"
                                                    : loadingCommunes
                                                      ? "Cargando comunas..."
                                                      : availableCommunes.length === 0
                                                        ? "No hay comunas disponibles"
                                                        : "Selecciona una comuna"}
                                            </option>
                                            {availableCommunes.map(commune => (
                                                <option key={commune.codigo} value={commune.codigo}>
                                                    {commune.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {communeError && (
                                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300 sm:col-span-2">
                                            <div>{communeError}</div>
                                            <button
                                                type="button"
                                                onClick={retryCommunes}
                                                className="mt-2 inline-flex items-center gap-2 underline hover:text-white"
                                            >
                                                <IconRefresh size={15} />
                                                Reintentar
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="supplier-department" className={labelClass}>
                                            Departamento <span className="text-zinc-500">(opcional)</span>
                                        </label>
                                        <input
                                            id="supplier-department"
                                            maxLength={50}
                                            value={form.department}
                                            onChange={e => updateField("department", e.target.value)}
                                            placeholder="Ej. Oficina 402"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="supplier-block" className={labelClass}>
                                            Block <span className="text-zinc-500">(opcional)</span>
                                        </label>
                                        <input
                                            id="supplier-block"
                                            maxLength={50}
                                            value={form.block}
                                            onChange={e => updateField("block", e.target.value)}
                                            placeholder="Ej. Block B"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="supplier-reference" className={labelClass}>
                                            Referencia <span className="text-zinc-500">(opcional)</span>
                                        </label>
                                        <input
                                            id="supplier-reference"
                                            maxLength={250}
                                            value={form.reference}
                                            onChange={e => updateField("reference", e.target.value)}
                                            placeholder="Ej. Frente al local de repuestos"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-white/[0.07] bg-[#14171d] pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || loadingCommunes || !!communeError}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <>
                                            <IconRefresh size={18} className="animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <IconCheck size={18} />
                                            {editingSupplier ? "Guardar cambios" : "Crear proveedor"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
