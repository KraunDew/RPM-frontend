"use client";

import Header from "@/components/Header";
import {
    IconAdjustmentsHorizontal,
    IconAlertCircle,
    IconArrowRight,
    IconCar,
    IconSearch,
    IconShoppingBag,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
    id_product: string;
    sku: string;
    name: string;
    model: string;
    material?: string | null;
    price: number;
    description?: string | null;
    stock: number;
    category?: { name: string } | null;
    brand?: { name: string } | null;
    supplier?: { name: string } | null;
};

type SortOption = "name" | "price-asc" | "price-desc";

function formatPrice(price: number) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(price);
}

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [sort, setSort] = useState<SortOption>("name");
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProducts = useCallback(async () => {
        const backend = process.env.NEXT_PUBLIC_BACKEND;

        if (!backend) {
            setError("No pudimos cargar el catálogo. Inténtalo más tarde.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${backend.replace(/\/+$/, "")}/products`, { timeout: 15000 });

            const payload = response.data;

            const items: Product[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                  ? payload.data
                  : Array.isArray(payload?.products)
                    ? payload.products
                    : [];

            setProducts(items);
        } catch {
            setError("No pudimos cargar los repuestos. Revisa tu conexión e inténtalo nuevamente.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    const categories = useMemo(() => {
        const names = products.map(product => product.category?.name).filter((name): name is string => Boolean(name));

        return ["Todas", ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLocaleLowerCase("es");

        const result = products.filter(product => {
            const matchesSearch = [
                product.name,
                product.sku,
                product.model,
                product.brand?.name,
                product.category?.name,
            ].some(value => value?.toLocaleLowerCase("es").includes(query));

            const matchesCategory = selectedCategory === "Todas" || product.category?.name === selectedCategory;

            const matchesStock = !onlyAvailable || product.stock > 0;

            return matchesSearch && matchesCategory && matchesStock;
        });

        return result.sort((a, b) => {
            if (sort === "price-asc") return a.price - b.price;
            if (sort === "price-desc") return b.price - a.price;
            return a.name.localeCompare(b.name, "es");
        });
    }, [products, search, selectedCategory, sort, onlyAvailable]);

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("Todas");
        setSort("name");
        setOnlyAvailable(false);
    };

    const hasFilters = search !== "" || selectedCategory !== "Todas" || sort !== "name" || onlyAvailable;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
            {/* Fondo ambiental */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(127,29,29,0.16), transparent 55%),
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
                    backgroundSize: "auto, 48px 48px, 48px 48px",
                    maskImage: "linear-gradient(to bottom, black 10%, transparent 85%)",
                }}
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-1/2 h-[32rem] w-[44rem] -translate-x-1/2 rounded-full bg-red-700/[0.10] blur-[150px]"
            />

            <div className="relative z-10">
                <Header />

                <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                    {/* Encabezado */}
                    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#181818] via-[#111111] to-[#0b0b0b] px-6 py-10 sm:px-10 sm:py-14">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-red-500/[0.09]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-red-500/[0.12]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-red-700/[0.08] blur-[90px]"
                        />

                        <div className="relative max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-red-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                RPM AUTOMOTRIZ
                            </span>

                            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                                Encuentra el repuesto
                                <br />
                                <span className="text-red-500">que tu auto necesita.</span>
                            </h1>

                            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                                Explora nuestro catálogo, compara opciones y encuentra información de cada repuesto en
                                un solo lugar.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-zinc-400">
                                <span className="flex items-center gap-2">
                                    <IconShoppingBag size={18} className="text-red-400" />
                                    {loading ? "Cargando productos..." : `${products.length} productos`}
                                </span>

                                <span className="flex items-center gap-2">
                                    <IconCar size={18} className="text-red-400" />
                                    Repuestos automotrices
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Búsqueda y filtros */}
                    <section className="mt-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="relative min-w-0 flex-1">
                                <IconSearch
                                    size={20}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                                />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por repuesto, marca, modelo o SKU..."
                                    aria-label="Buscar productos"
                                    className="h-13 w-full rounded-xl border border-white/10 bg-[#111111]/90 pl-12 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        aria-label="Limpiar búsqueda"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                                    >
                                        <IconX size={17} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <label className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-[#111111]/90 px-4 text-sm text-zinc-300">
                                    <IconAdjustmentsHorizontal size={18} className="shrink-0 text-red-400" />
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        aria-label="Filtrar por categoría"
                                        className="min-w-0 flex-1 bg-transparent outline-none"
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category} className="bg-[#151515] text-white">
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-[#111111]/90 px-4 text-sm text-zinc-300">
                                    <span className="whitespace-nowrap">Ordenar por</span>
                                    <select
                                        value={sort}
                                        onChange={e => setSort(e.target.value as SortOption)}
                                        aria-label="Ordenar productos"
                                        className="min-w-0 flex-1 bg-transparent outline-none"
                                    >
                                        <option value="name" className="bg-[#151515]">
                                            Nombre
                                        </option>
                                        <option value="price-asc" className="bg-[#151515]">
                                            Menor precio
                                        </option>
                                        <option value="price-desc" className="bg-[#151515]">
                                            Mayor precio
                                        </option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm text-zinc-400">
                                    {loading ? "Buscando repuestos..." : `${filteredProducts.length} resultados`}
                                </p>

                                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                                    <input
                                        type="checkbox"
                                        checked={onlyAvailable}
                                        onChange={e => setOnlyAvailable(e.target.checked)}
                                        className="h-4 w-4 accent-red-500"
                                    />
                                    Solo disponibles
                                </label>
                            </div>

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-sm font-medium text-red-400 transition hover:text-red-300"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Estado de error */}
                    {error && (
                        <section
                            role="alert"
                            className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6"
                        >
                            <div className="flex items-start gap-3">
                                <IconAlertCircle size={22} className="shrink-0 text-red-400" />
                                <div>
                                    <h2 className="font-semibold text-white">No pudimos cargar el catálogo</h2>
                                    <p className="mt-2 text-sm text-zinc-400">{error}</p>
                                    <button
                                        type="button"
                                        onClick={() => void loadProducts()}
                                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
                                    >
                                        Intentar nuevamente
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Cargando */}
                    {loading && !error && (
                        <section
                            aria-label="Cargando productos"
                            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]"
                                >
                                    <div className="h-52 animate-pulse bg-white/[0.035]" />
                                    <div className="space-y-4 p-5">
                                        <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
                                        <div className="h-5 w-4/5 animate-pulse rounded bg-white/[0.06]" />
                                        <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                                        <div className="h-9 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Productos */}
                    {!loading && !error && filteredProducts.length > 0 && (
                        <section
                            aria-label="Lista de productos"
                            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            {filteredProducts.map(product => (
                                <Link
                                    key={product.id_product}
                                    href={`/catalogo/${product.id_product}`}
                                    aria-label={`Ver detalles de ${product.name}`}
                                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#151515] to-[#0e0e0e] transition duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                >
                                    {/* Imagen provisional hasta incorporar imágenes reales */}
                                    <div className="relative flex h-52 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-[radial-gradient(ellipse_at_center,rgba(127,29,29,0.12),transparent_70%)]">
                                        <div
                                            aria-hidden="true"
                                            className="absolute inset-0 opacity-30"
                                            style={{
                                                backgroundImage:
                                                    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                                                backgroundSize: "24px 24px",
                                            }}
                                        />

                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#151515]/90 text-zinc-500 transition duration-300 group-hover:scale-105 group-hover:border-red-500/30 group-hover:text-red-400">
                                            <IconCar size={42} stroke={1.2} />
                                        </div>

                                        <span
                                            className={`absolute left-4 top-4 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                                                product.stock > 0
                                                    ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                                                    : "border-red-500/20 bg-red-500/[0.08] text-red-400"
                                            }`}
                                        >
                                            {product.stock > 0 ? "Disponible" : "Sin stock"}
                                        </span>

                                        <span className="absolute bottom-4 right-4 text-[10px] font-medium tracking-widest text-zinc-600">
                                            {product.sku}
                                        </span>
                                    </div>

                                    {/* Datos de la tarjeta */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-wider text-red-400">
                                            {product.category?.name && <span>{product.category.name}</span>}

                                            {product.brand?.name && (
                                                <>
                                                    <span className="text-zinc-700">/</span>
                                                    <span className="text-zinc-400">{product.brand.name}</span>
                                                </>
                                            )}
                                        </div>

                                        <h2 className="mt-3 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-zinc-100 transition-colors group-hover:text-white">
                                            {product.name}
                                        </h2>

                                        <p className="mt-2 line-clamp-1 text-xs text-zinc-500">
                                            Modelo: {product.model}
                                        </p>

                                        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">
                                            {product.description || "Consulta los detalles de este repuesto."}
                                        </p>

                                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.07] pt-5">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                                    Precio
                                                </p>
                                                <p className="mt-1 truncate text-xl font-bold tracking-tight text-white">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>

                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition group-hover:border-red-500/30 group-hover:bg-red-600 group-hover:text-white">
                                                <IconArrowRight size={20} />
                                            </span>
                                        </div>

                                        {product.stock > 0 && (
                                            <p className="mt-3 text-xs text-zinc-600">
                                                {product.stock} unidades en stock
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </section>
                    )}

                    {/* Sin resultados */}
                    {!loading && !error && filteredProducts.length === 0 && (
                        <section className="mt-8 flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#111111]/80 px-6 py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
                                <IconSearch size={28} />
                            </div>

                            <h2 className="mt-5 text-xl font-semibold">No encontramos repuestos</h2>

                            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                {products.length === 0
                                    ? "Todavía no hay productos para mostrar en el catálogo."
                                    : "Prueba con otro término o cambia los filtros para encontrar lo que buscas."}
                            </p>

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-6 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-500/40 hover:bg-white/[0.03]"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </section>
                    )}

                    {/* Pie del catálogo */}
                    <footer className="mt-12 border-t border-white/[0.07] pt-6">
                        <div className="flex flex-col gap-2 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                            <p>RPM · Repuestos automotrices</p>
                            <p>Los precios y la disponibilidad dependen de los datos del catálogo.</p>
                        </div>
                    </footer>
                </div>
            </div>
        </main>
    );
}
