"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconEdit,
    IconPackage,
    IconPhoto,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconTrash,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND;

type Category = {
    id_category: string;
    name: string;
};

type Brand = {
    id_brand: string;
    name: string;
};

type Supplier = {
    id_supplier: string;
    name: string;
};

type Product = {
    id_product: string;
    sku: string;
    name: string;
    model: string;
    material?: string | null;
    weight?: number | string | null;
    description?: string | null;
    price: number | string;
    stock: number;
    photo_path?: string | null;
    id_category?: string;
    id_brand?: string;
    id_supplier?: string;
    category?: Category | null;
    brand?: Brand | null;
    supplier?: Supplier | null;
};

type ProductForm = {
    sku: string;
    name: string;
    model: string;
    material: string;
    weight: string;
    description: string;
    price: string;
    stock: string;
    id_category: string;
    id_brand: string;
    id_supplier: string;
};

const EMPTY_FORM: ProductForm = {
    sku: "",
    name: "",
    model: "",
    material: "",
    weight: "",
    description: "",
    price: "",
    stock: "0",
    id_category: "",
    id_brand: "",
    id_supplier: "",
};

function getPhotoUrl(photoPath?: string | null): string | null {
    if (!photoPath || !API_URL) return null;
    if (/^https?:\/\//i.test(photoPath)) return photoPath;

    let path = photoPath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
    const publicIndex = path.indexOf("public/photos/");
    if (publicIndex >= 0) path = path.slice(publicIndex);
    else if (!path.startsWith("public/")) path = `public/${path}`;

    return `${API_URL.replace(/\/+$/, "")}/${path}`;
}

const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(Number(price));

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        const message = data?.message;

        if (Array.isArray(message)) return message.join(", ");
        if (typeof message === "string") return message;

        if (!error.response) {
            return "No se pudo conectar con el backend.";
        }

        if (error.response.status === 401 || error.response.status === 403) {
            return "No tienes permiso para realizar esta operación. Revisa tu sesión y los permisos del backend.";
        }

        return `Error del servidor (${error.response.status}).`;
    }

    return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

/** Convierte imágenes a JPEG, limita su lado mayor a 1600 px y comprime al 82%. */
async function compressImageToJpeg(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Selecciona un archivo de imagen válido.");
    }

    const bitmap = await createImageBitmap(file);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
        bitmap.close();
        throw new Error("No se pudo procesar la imagen en este navegador.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            result => (result ? resolve(result) : reject(new Error("No se pudo convertir la imagen a JPEG."))),
            "image/jpeg",
            0.82,
        );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "producto";
    return new File([blob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
    });
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

    const loadProducts = useCallback(async () => {
        if (!API_URL) {
            setError("Falta configurar BACKEND en .env.local.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get<Product[]>(`${API_URL}/products`, {
                withCredentials: true,
            });

            if (!Array.isArray(response.data)) {
                throw new Error("El backend no devolvió una lista de productos.");
            }

            setProducts(response.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadOptions = useCallback(async () => {
        if (!API_URL) return;

        try {
            const [categoryResponse, brandResponse, supplierResponse] = await Promise.all([
                axios.get<Category[]>(`${API_URL}/categories`, {
                    withCredentials: true,
                }),
                axios.get<Brand[]>(`${API_URL}/brands`, {
                    withCredentials: true,
                }),
                axios.get<Supplier[]>(`${API_URL}/suppliers`, {
                    withCredentials: true,
                }),
            ]);

            setCategories(categoryResponse.data);
            setBrands(brandResponse.data);
            setSuppliers(supplierResponse.data);
        } catch (err) {
            setFormError(`No se pudieron cargar las categorías, marcas o proveedores. ${getErrorMessage(err)}`);
        }
    }, []);

    useEffect(() => {
        void loadProducts();
        void loadOptions();
    }, [loadProducts, loadOptions]);

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return products;

        return products.filter(product =>
            [
                product.name,
                product.sku,
                product.model ?? "",
                product.category?.name ?? "",
                product.brand?.name ?? "",
            ].some(value => value.toLowerCase().includes(term)),
        );
    }, [products, search]);

    const outOfStock = products.filter(product => product.stock <= 0).length;
    const lowStock = products.filter(product => product.stock > 0 && product.stock <= 5).length;

    function openCreateModal() {
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setRemoveCurrentPhoto(false);
        setNotice("");
        setModalOpen(true);
    }

    function openEditModal(product: Product) {
        setEditingProduct(product);
        setForm({
            sku: product.sku,
            name: product.name,
            model: product.model ?? "",
            material: product.material ?? "",
            weight: product.weight == null ? "" : String(product.weight),
            description: product.description ?? "",
            price: String(product.price),
            stock: String(product.stock),
            id_category: product.id_category ?? product.category?.id_category ?? "",
            id_brand: product.id_brand ?? product.brand?.id_brand ?? "",
            id_supplier: product.id_supplier ?? product.supplier?.id_supplier ?? "",
        });
        setFormError("");
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setRemoveCurrentPhoto(false);
        setNotice("");
        setModalOpen(true);
    }

    function updateField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
        setForm(current => ({ ...current, [field]: value }));
    }

    async function handleDeleteProduct(product: Product) {
        if (!API_URL) {
            setError("Falta configurar BACKEND.");
            return;
        }

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar "${product.name}"?\n\nEsta acción no se puede deshacer.`,
        );

        if (!confirmed) return;

        setDeletingId(product.id_product);
        setError("");
        setNotice("");

        try {
            await axios.delete(`${API_URL}/products/${product.id_product}`, {
                withCredentials: true,
            });

            setProducts(current => current.filter(item => item.id_product !== product.id_product));
            setNotice(`El producto "${product.name}" se eliminó correctamente.`);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    }

    async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setFormError("");
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setRemoveCurrentPhoto(false);

        if (!file.type.startsWith("image/")) {
            setFormError("Selecciona una imagen JPG, PNG o WEBP.");
            event.target.value = "";
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            setFormError("La imagen original no puede superar los 15 MB.");
            event.target.value = "";
            return;
        }

        try {
            const compressed = await compressImageToJpeg(file);
            setSelectedPhoto(compressed);
            setPhotoPreview(URL.createObjectURL(compressed));
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
            event.target.value = "";
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");
        setNotice("");

        if (!API_URL) {
            setFormError("Falta configurar BACKEND.");
            return;
        }

        if (!editingProduct && !selectedPhoto) {
            setFormError("Selecciona una foto para el producto. La imagen se convertirá a JPEG automáticamente.");
            return;
        }

        if (!form.id_category || !form.id_brand || !form.id_supplier) {
            setFormError("Selecciona una categoría, marca y proveedor.");
            return;
        }

        const price = Number(form.price);
        const stock = Number(form.stock);
        const weight = form.weight.trim() === "" ? null : Number(form.weight);

        if (!Number.isFinite(price) || price < 0) {
            setFormError("El precio debe ser un número válido mayor o igual a cero.");
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            setFormError("El stock debe ser un número entero mayor o igual a cero.");
            return;
        }

        if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
            setFormError("El peso debe ser un número válido mayor o igual a cero.");
            return;
        }

        const payload = {
            sku: form.sku.trim(),
            name: form.name.trim(),
            model: form.model.trim(),
            material: form.material.trim() || null,
            weight,
            description: form.description.trim() || null,
            price: Math.round(price),
            stock,
            category: { connect: { id_category: form.id_category } },
            brand: { connect: { id_brand: form.id_brand } },
            supplier: { connect: { id_supplier: form.id_supplier } },
        };

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));
            if (selectedPhoto) formData.append("photo", selectedPhoto, selectedPhoto.name);

            if (editingProduct) {
                if (removeCurrentPhoto && selectedPhoto) {
                    setFormError("Elige entre reemplazar la foto o eliminarla, no ambas cosas a la vez.");
                    setSaving(false);
                    return;
                }
                if (removeCurrentPhoto) formData.append("removePhoto", "true");

                // El PATCH recibe multipart/form-data: data (JSON), photo opcional y removePhoto opcional.
                await axios.patch(`${API_URL}/products/${editingProduct.id_product}`, formData, {
                    withCredentials: true,
                });
                setNotice(
                    removeCurrentPhoto
                        ? "Producto actualizado y foto eliminada correctamente."
                        : selectedPhoto
                          ? "Producto actualizado y foto reemplazada correctamente."
                          : "Producto actualizado correctamente.",
                );
            } else {
                // No fijes Content-Type manualmente: el navegador agrega el boundary de multipart.
                await axios.post(`${API_URL}/products`, formData, {
                    withCredentials: true,
                });
                setNotice("Producto creado correctamente. La foto se envió comprimida en JPEG.");
            }
            if (photoPreview) URL.revokeObjectURL(photoPreview);
            setSelectedPhoto(null);
            setPhotoPreview(null);
            setRemoveCurrentPhoto(false);

            setModalOpen(false);
            await loadProducts();
            await loadOptions();
        } catch (err) {
            setFormError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-7">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
                            Gestión de inventario
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Productos<span className="text-red-500">.</span>
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">Administra el catálogo y el inventario de RPM.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => void loadProducts()}
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
                        Nuevo producto
                    </button>
                </div>
            </header>

            {notice && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-400">
                    <IconCheck size={18} />
                    {notice}
                    <button onClick={() => setNotice("")} className="ml-auto" aria-label="Cerrar aviso">
                        <IconX size={17} />
                    </button>
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-3">
                <Metric label="Productos registrados" value={loading ? "…" : String(products.length)} />
                <Metric label="Sin stock" value={loading ? "…" : String(outOfStock)} danger={outOfStock > 0} />
                <Metric label="Stock bajo (1–5)" value={loading ? "…" : String(lowStock)} warning={lowStock > 0} />
            </section>

            <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101216]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="font-semibold text-white">Catálogo de productos</h2>
                        <p className="mt-1 text-xs text-zinc-500">
                            {loading
                                ? "Cargando inventario…"
                                : `${filteredProducts.length} de ${products.length} productos`}
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, SKU o marca..."
                            className="w-full rounded-lg border border-white/10 bg-[#090b0e] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/50"
                        />
                    </div>
                </div>

                {error ? (
                    <div className="px-6 py-14 text-center">
                        <IconAlertTriangle size={28} className="mx-auto text-red-400" />
                        <h3 className="mt-3 font-semibold text-white">No se pudieron cargar los productos</h3>
                        <p className="mt-2 text-sm text-zinc-400">{error}</p>
                        <button
                            onClick={() => void loadProducts()}
                            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-zinc-400">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                        Cargando productos…
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <IconPackage size={32} className="mx-auto text-zinc-600" />
                        <h3 className="mt-3 font-semibold text-zinc-200">
                            {products.length === 0 ? "Todavía no hay productos" : "No hay coincidencias"}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-500">
                            {products.length === 0
                                ? "Crea tu primer producto con el botón Nuevo producto."
                                : "Prueba con otro término de búsqueda."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                                <tr>
                                    <th className="px-5 py-4">Producto</th>
                                    <th className="px-5 py-4">SKU</th>
                                    <th className="px-5 py-4">Categoría</th>
                                    <th className="px-5 py-4">Marca</th>
                                    <th className="px-5 py-4 text-right">Precio</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {filteredProducts.map(product => (
                                    <tr key={product.id_product} className="transition hover:bg-white/[0.025]">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-400">
                                                    {getPhotoUrl(product.photo_path) ? (
                                                        <img
                                                            src={getPhotoUrl(product.photo_path)!}
                                                            alt={`Foto de ${product.name}`}
                                                            loading="lazy"
                                                            onError={event => {
                                                                event.currentTarget.style.display = "none";
                                                            }}
                                                            className="h-full w-full object-contain"
                                                        />
                                                    ) : (
                                                        <IconPackage size={19} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-100">{product.name}</p>
                                                    {product.model && (
                                                        <p className="mt-1 text-xs text-zinc-500">{product.model}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs text-zinc-400">{product.sku}</td>
                                        <td className="px-5 py-4 text-zinc-400">
                                            {product.category?.name ?? "Sin categoría"}
                                        </td>
                                        <td className="px-5 py-4 text-zinc-400">
                                            {product.brand?.name ?? "Sin marca"}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-white">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StockBadge stock={product.stock} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    disabled={deletingId !== null}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <IconEdit size={16} />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => void handleDeleteProduct(product)}
                                                    disabled={deletingId !== null}
                                                    title="Eliminar producto"
                                                    aria-label={`Eliminar ${product.name}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingId === product.id_product ? (
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                                                    ) : (
                                                        <IconTrash size={16} />
                                                    )}
                                                    {deletingId === product.id_product ? "Eliminando..." : "Eliminar"}
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
                        if (event.target === event.currentTarget && !saving) setModalOpen(false);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-form-title"
                        className="my-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-[#101216] shadow-2xl shadow-black/40"
                    >
                        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-400">
                                    Inventario RPM
                                </p>
                                <h2 id="product-form-title" className="mt-1 text-xl font-bold text-white">
                                    {editingProduct ? "Editar producto" : "Crear producto"}
                                </h2>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                                aria-label="Cerrar formulario"
                                className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                                <IconX size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                                <Field label="Nombre del producto" required>
                                    <input
                                        required
                                        maxLength={150}
                                        value={form.name}
                                        onChange={e => updateField("name", e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej. Pastillas de freno"
                                    />
                                </Field>

                                <Field label="SKU" required>
                                    <input
                                        required
                                        maxLength={100}
                                        value={form.sku}
                                        onChange={e => updateField("sku", e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej. FR-TOY-COR-001"
                                    />
                                </Field>

                                <Field label="Modelo" required>
                                    <input
                                        required
                                        value={form.model}
                                        onChange={e => updateField("model", e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej. Corolla 2014–2019"
                                    />
                                </Field>

                                <Field label="Material">
                                    <input
                                        value={form.material}
                                        onChange={e => updateField("material", e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej. Cerámica"
                                    />
                                </Field>

                                <Field label="Precio (CLP)" required>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.price}
                                        onChange={e => updateField("price", e.target.value)}
                                        className={inputClass}
                                        placeholder="34990"
                                    />
                                </Field>

                                <Field label="Stock disponible" required>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.stock}
                                        onChange={e => updateField("stock", e.target.value)}
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Categoría" required>
                                    <select
                                        required
                                        value={form.id_category}
                                        onChange={e => updateField("id_category", e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categories.map(category => (
                                            <option key={category.id_category} value={category.id_category}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Marca" required>
                                    <select
                                        required
                                        value={form.id_brand}
                                        onChange={e => updateField("id_brand", e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Selecciona una marca</option>
                                        {brands.map(brand => (
                                            <option key={brand.id_brand} value={brand.id_brand}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Proveedor" required>
                                    <select
                                        required
                                        value={form.id_supplier}
                                        onChange={e => updateField("id_supplier", e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Selecciona un proveedor</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id_supplier} value={supplier.id_supplier}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Peso (kg)">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={form.weight}
                                        onChange={e => updateField("weight", e.target.value)}
                                        className={inputClass}
                                        placeholder="Ej. 1.250"
                                    />
                                </Field>

                                <div className="sm:col-span-2">
                                    <Field
                                        label={
                                            editingProduct
                                                ? "Foto del producto"
                                                : "Foto del producto (se convertirá a JPEG)"
                                        }
                                        required={!editingProduct}
                                    >
                                        <div className="space-y-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
                                            {editingProduct &&
                                                !selectedPhoto &&
                                                !removeCurrentPhoto &&
                                                editingProduct.photo_path && (
                                                    <div className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-black/20 p-3">
                                                        <img
                                                            src={getPhotoUrl(editingProduct.photo_path) ?? ""}
                                                            alt={`Foto actual de ${editingProduct.name}`}
                                                            className="h-20 w-20 rounded-lg border border-white/10 object-contain"
                                                            onError={event => {
                                                                event.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-zinc-200">
                                                                Foto actual
                                                            </p>
                                                            <p className="mt-1 text-xs text-zinc-500">
                                                                Puedes conservarla, reemplazarla o eliminarla.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRemoveCurrentPhoto(true)}
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <IconTrash size={15} />
                                                            Eliminar foto
                                                        </button>
                                                    </div>
                                                )}

                                            {editingProduct && removeCurrentPhoto && (
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
                                                    <p className="text-sm text-amber-300">
                                                        La foto se eliminará al guardar los cambios.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRemoveCurrentPhoto(false)}
                                                        className="text-xs font-semibold text-zinc-300 underline underline-offset-4"
                                                    >
                                                        Deshacer
                                                    </button>
                                                </div>
                                            )}

                                            {editingProduct &&
                                                !editingProduct.photo_path &&
                                                !selectedPhoto &&
                                                !removeCurrentPhoto && (
                                                    <p className="text-sm text-zinc-500">
                                                        Este producto no tiene una foto guardada.
                                                    </p>
                                                )}

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-red-500/40 hover:bg-white/[0.03]">
                                                    <IconPhoto size={18} />
                                                    {selectedPhoto
                                                        ? "Elegir otra imagen"
                                                        : editingProduct
                                                          ? "Cambiar foto"
                                                          : "Seleccionar imagen"}
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp,image/avif,image/*"
                                                        onChange={handlePhotoChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="text-xs leading-5 text-zinc-500">
                                                    JPG, PNG o WEBP. Máximo 15 MB original. Se redimensiona a 1600 px y
                                                    se comprime al 82% en JPEG.
                                                </p>
                                            </div>

                                            {photoPreview && selectedPhoto && (
                                                <div className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-black/20 p-3">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Vista previa de la nueva foto comprimida"
                                                        className="h-20 w-20 rounded-lg border border-white/10 object-contain"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-zinc-200">
                                                            {selectedPhoto.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-emerald-400">
                                                            JPEG listo para subir ·{" "}
                                                            {(selectedPhoto.size / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            URL.revokeObjectURL(photoPreview);
                                                            setPhotoPreview(null);
                                                            setSelectedPhoto(null);
                                                        }}
                                                        className="ml-auto rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                                                        aria-label="Quitar foto seleccionada"
                                                    >
                                                        <IconX size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Field>
                                </div>

                                <div className="sm:col-span-2">
                                    <Field label="Descripción">
                                        <textarea
                                            rows={3}
                                            value={form.description}
                                            onChange={e => updateField("description", e.target.value)}
                                            className={`${inputClass} resize-y`}
                                            placeholder="Detalles y compatibilidad del producto..."
                                        />
                                    </Field>
                                </div>

                                {formError && (
                                    <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.08] p-3 text-sm leading-5 text-red-300 sm:col-span-2">
                                        <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}
                            </div>

                            <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] disabled:opacity-50"
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
                                    {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}

const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#090b0e] px-3 py-2.5 text-sm text-white outline-none transition focus:border-red-500/50 disabled:opacity-50";

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-2">
            <span className="block text-sm font-medium text-zinc-300">
                {label}
                {required && <span className="ml-1 text-red-400">*</span>}
            </span>
            {children}
        </label>
    );
}

function Metric({
    label,
    value,
    danger = false,
    warning = false,
}: {
    label: string;
    value: string;
    danger?: boolean;
    warning?: boolean;
}) {
    const tone = danger
        ? "border-red-500/20 bg-red-500/10 text-red-400"
        : warning
          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
          : "border-white/[0.08] bg-white/[0.04] text-zinc-300";

    return (
        <article className="rounded-xl border border-white/[0.08] bg-[#101216] p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">{label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${tone}`}>
                    <IconPackage size={19} />
                </div>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
        </article>
    );
}

function StockBadge({ stock }: { stock: number }) {
    const status =
        stock <= 0
            ? { label: "Agotado", style: "border-red-500/20 bg-red-500/10 text-red-400" }
            : stock <= 5
              ? { label: `${stock} unidades`, style: "border-amber-500/20 bg-amber-500/10 text-amber-400" }
              : { label: `${stock} unidades`, style: "border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400" };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.style}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
        </span>
    );
}
