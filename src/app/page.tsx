"use client";

import Header from "@/components/Header";
import {
    IconArrowDownRight,
    IconArrowRight,
    IconArrowUpRight,
    IconCar,
    IconCategory,
    IconChevronRight,
    IconEngine,
    IconGauge,
    IconSearch,
    IconShieldCheck,
    IconShoppingBag,
    IconTool,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Product = {
    id_product: string;
    sku: string;
    name: string;
    model: string;
    price: number;
    stock: number;
    description?: string | null;
    photo_path?: string | null;
    image?: string | null;
    category?: { name: string } | null;
    brand?: { name: string } | null;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

const categories = [
    {
        name: "Frenos",
        subtitle: "Seguridad en cada viaje",
        icon: IconGauge,
        query: "freno",
    },
    {
        name: "Motor",
        subtitle: "El corazón de tu auto",
        icon: IconEngine,
        query: "motor",
    },
    {
        name: "Accesorios",
        subtitle: "Detalles que importan",
        icon: IconTool,
        query: "accesorio",
    },
    {
        name: "Otros repuestos",
        subtitle: "Encuentra esa pieza",
        icon: IconCategory,
        query: "",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(price);
}

function getProductImage(product: Product): string {
    const path = product.photo_path || product.image;

    if (!path?.trim() || !BACKEND_URL) return "";

    const value = path.trim();

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const normalizedPath = value.replace(/\\/g, "/");
    const publicMatch = normalizedPath.match(/(?:^|\/)public\/(.+)$/);

    if (publicMatch?.[1]) {
        return `${BACKEND_URL}/public/${publicMatch[1].split("/").map(encodeURIComponent).join("/")}`;
    }

    return `${BACKEND_URL}/public/${normalizedPath.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;
}

export default function Page() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [apiError, setApiError] = useState(false);
    const [failedImages, setFailedImages] = useState<string[]>([]);
    const [carMoving, setCarMoving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                if (!BACKEND_URL) {
                    throw new Error("Falta configurar NEXT_PUBLIC_BACKEND.");
                }

                const response = await fetch(`${BACKEND_URL}/products`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("No se pudieron cargar los productos.");
                }

                const data = await response.json();

                const list: Product[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                      ? data.data
                      : Array.isArray(data?.products)
                        ? data.products
                        : [];

                if (!cancelled) {
                    setProducts(list.slice(0, 4));
                    setApiError(false);
                }
            } catch (error) {
                console.error("Error cargando productos:", error);

                if (!cancelled) {
                    setApiError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    function searchProducts(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query = search.trim();

        if (!query) {
            window.location.href = "/catalogo";
            return;
        }

        window.location.href = `/catalogo?search=${encodeURIComponent(query)}`;
    }

    function markImageAsFailed(id: string) {
        setFailedImages(previous => (previous.includes(id) ? previous : [...previous, id]));
    }

    function animateCar() {
        if (carMoving) return;
        setCarMoving(true);
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#080808] text-white">
            <Header />

            {/* HERO */}
            <section className="relative isolate border-b border-white/[0.06]">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute right-[-10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-red-700/[0.12] blur-[130px]" />
                    <div className="absolute bottom-[-20%] left-[10%] h-[280px] w-[500px] rounded-full bg-red-950/20 blur-[120px]" />
                    <div
                        className="absolute inset-0 opacity-[0.045]"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
                            backgroundSize: "52px 52px",
                            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
                        }}
                    />
                </div>

                <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:gap-6 lg:py-32">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-xs font-medium tracking-wide text-red-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                            REPUESTOS AUTOMOTRICES
                        </div>

                        <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                            Tu auto merece
                            <br />
                            <span className="text-zinc-500">más que</span>{" "}
                            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-700 bg-clip-text text-transparent">
                                cualquier pieza.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
                            Encuentra los repuestos que necesitas sin dar mil vueltas. Busca, compara y encuentra la
                            pieza correcta para seguir avanzando.
                        </p>

                        <form
                            onSubmit={searchProducts}
                            className="mt-9 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-[#141414]/90 p-2 shadow-2xl shadow-black/40 transition focus-within:border-red-500/50"
                        >
                            <IconSearch size={21} stroke={1.7} className="ml-3 shrink-0 text-zinc-500" />
                            <input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Ej. pastillas de freno, filtro de aceite..."
                                aria-label="Buscar repuestos"
                                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                            />
                            <button
                                type="submit"
                                className="flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-500 sm:px-5"
                            >
                                Buscar
                                <IconArrowRight size={17} />
                            </button>
                        </form>

                        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-2">
                                <IconShieldCheck size={16} className="text-red-400" />
                                Compra informada
                            </span>
                            <span className="flex items-center gap-2">
                                <IconSearch size={16} className="text-red-400" />
                                Catálogo de repuestos
                            </span>
                        </div>
                    </div>

                    {/* VISUAL PRINCIPAL */}
                    <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
                        <div className="absolute inset-8 rounded-full bg-red-700/15 blur-[85px]" />

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1c1c1c] via-[#111111] to-[#090909] p-6 sm:p-8">
                            <div
                                className="absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(135deg, transparent 48%, rgba(255,255,255,.4) 49%, transparent 50%)",
                                    backgroundSize: "18px 18px",
                                }}
                            />

                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.28em] text-red-400">
                                        RPM / PERFORMANCE
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-400">Precisión en cada pieza.</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                    <IconCar size={24} stroke={1.4} className="text-zinc-300" />
                                </div>
                            </div>

                            <div className="relative flex aspect-[5/4] items-center justify-center">
                                <div className="absolute h-52 w-52 rounded-full border border-red-500/10 sm:h-64 sm:w-64" />
                                <div className="absolute h-40 w-40 rounded-full border border-white/[0.06] sm:h-52 sm:w-52" />
                                <div className="absolute h-64 w-64 rounded-full bg-red-600/[0.06] blur-3xl" />

                                <button
                                    key={carMoving ? "moving" : "idle"}
                                    type="button"
                                    onClick={animateCar}
                                    disabled={carMoving}
                                    aria-label="Acelerar automóvil"
                                    title="Haz clic para acelerar"
                                    onAnimationEnd={() => setCarMoving(false)}
                                    className={`rpm-car relative z-10 w-full cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                                        carMoving ? "rpm-car-launch" : ""
                                    }`}
                                >
                                    <svg
                                        viewBox="0 0 500 300"
                                        role="img"
                                        aria-label="Ilustración de un automóvil deportivo rojo"
                                        className="w-full drop-shadow-[0_22px_30px_rgba(180,0,0,0.2)]"
                                        fill="none"
                                    >
                                        <defs>
                                            <linearGradient
                                                id="carPaint"
                                                x1="80"
                                                y1="70"
                                                x2="390"
                                                y2="240"
                                                gradientUnits="userSpaceOnUse"
                                            >
                                                <stop stopColor="#ff4545" />
                                                <stop offset=".5" stopColor="#b91c1c" />
                                                <stop offset="1" stopColor="#450a0a" />
                                            </linearGradient>

                                            <linearGradient
                                                id="glassPaint"
                                                x1="190"
                                                y1="80"
                                                x2="320"
                                                y2="150"
                                                gradientUnits="userSpaceOnUse"
                                            >
                                                <stop stopColor="#555b64" />
                                                <stop offset="1" stopColor="#15171b" />
                                            </linearGradient>
                                        </defs>

                                        <ellipse cx="250" cy="246" rx="184" ry="15" fill="#000" opacity=".65" />

                                        <g
                                            className={
                                                carMoving ? "rpm-speed-lines rpm-speed-active" : "rpm-speed-lines"
                                            }
                                            stroke="#f87171"
                                            strokeLinecap="round"
                                        >
                                            <path d="M35 145 H105" strokeWidth="3" />
                                            <path d="M15 165 H82" strokeWidth="2" />
                                            <path d="M42 185 H92" strokeWidth="2" />
                                            <path d="M55 205 H115" strokeWidth="3" />
                                        </g>

                                        <path
                                            d="M65 198 L83 170 Q91 158 117 151 L166 136 L214 88 Q225 77 245 77 L311 81 Q333 84 348 105 L383 145 L418 164 Q430 172 430 187 L424 208 L393 221 L105 221 L70 211 Z"
                                            fill="url(#carPaint)"
                                            stroke="#ef4444"
                                            strokeWidth="2"
                                        />

                                        <path
                                            d="M178 135 L221 94 Q229 87 246 87 L271 89 L271 136 Z"
                                            fill="url(#glassPaint)"
                                            stroke="#7f1d1d"
                                            strokeWidth="2"
                                        />

                                        <path
                                            d="M282 90 L309 94 Q325 97 337 114 L355 137 L282 136 Z"
                                            fill="url(#glassPaint)"
                                            stroke="#7f1d1d"
                                            strokeWidth="2"
                                        />

                                        <path
                                            d="M80 176 L129 160 L165 143 L177 143 L155 177 Z"
                                            fill="#ef4444"
                                            opacity=".5"
                                        />

                                        <path d="M283 144 L373 149 L403 167 L354 167 Z" fill="#ef4444" opacity=".45" />

                                        <path d="M73 194 L119 194 L111 206 L73 204 Z" fill="#f8fafc" opacity=".9" />

                                        <path d="M379 174 L421 182 L415 193 L382 189 Z" fill="#fca5a5" />

                                        <path
                                            d="M162 142 L165 135 M274 90 L274 137 M282 137 L355 138"
                                            stroke="#fca5a5"
                                            strokeWidth="2"
                                            opacity=".65"
                                        />

                                        <path
                                            d="M135 220 L145 195 L192 195 L204 220 M322 220 L333 194 L379 194 L390 220"
                                            fill="#171717"
                                            stroke="#525252"
                                            strokeWidth="2"
                                        />

                                        <g
                                            className={carMoving ? "rpm-wheel-spin" : ""}
                                            style={{
                                                transformBox: "view-box",
                                                transformOrigin: "169px 215px",
                                            }}
                                        >
                                            <circle
                                                cx="169"
                                                cy="215"
                                                r="27"
                                                fill="#090909"
                                                stroke="#525252"
                                                strokeWidth="4"
                                            />
                                            <circle
                                                cx="169"
                                                cy="215"
                                                r="15"
                                                fill="#262626"
                                                stroke="#a3a3a3"
                                                strokeWidth="2"
                                            />
                                            <circle cx="169" cy="215" r="5" fill="#dc2626" />
                                            <path
                                                d="M169 202 L169 228 M156 215 L182 215 M160 206 L178 224 M178 206 L160 224"
                                                stroke="#737373"
                                                strokeWidth="2"
                                            />
                                        </g>

                                        <g
                                            className={carMoving ? "rpm-wheel-spin" : ""}
                                            style={{
                                                transformBox: "view-box",
                                                transformOrigin: "359px 215px",
                                            }}
                                        >
                                            <circle
                                                cx="359"
                                                cy="215"
                                                r="27"
                                                fill="#090909"
                                                stroke="#525252"
                                                strokeWidth="4"
                                            />
                                            <circle
                                                cx="359"
                                                cy="215"
                                                r="15"
                                                fill="#262626"
                                                stroke="#a3a3a3"
                                                strokeWidth="2"
                                            />
                                            <circle cx="359" cy="215" r="5" fill="#dc2626" />
                                            <path
                                                d="M359 202 L359 228 M346 215 L372 215 M350 206 L368 224 M368 206 L350 224"
                                                stroke="#737373"
                                                strokeWidth="2"
                                            />
                                        </g>

                                        <path d="M196 177 L283 177" stroke="#fecaca" strokeWidth="2" opacity=".55" />
                                    </svg>
                                </button>

                                <div className="pointer-events-none absolute bottom-3 left-0 rounded-xl border border-white/10 bg-[#111]/90 px-4 py-3 backdrop-blur">
                                    <p className="text-[10px] tracking-wider text-zinc-500">HECHO PARA AVANZAR</p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {carMoving ? "¡Acelerando!" : "Encuentra tu pieza."}
                                    </p>
                                </div>

                                <div className="pointer-events-none absolute right-0 top-8 rounded-xl border border-red-500/20 bg-[#151010]/90 px-3 py-3 backdrop-blur">
                                    <IconGauge
                                        size={23}
                                        className={carMoving ? "animate-pulse text-red-400" : "text-red-400"}
                                    />
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between border-t border-white/[0.08] pt-5">
                                <p className="text-xs text-zinc-500">TU AUTO. TUS REPUESTOS. RPM.</p>
                                <span className="text-xs font-bold tracking-[0.2em] text-red-500">01 / RPM</span>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -left-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#151515] p-4 shadow-xl sm:flex">
                            <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
                                <IconTool size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">La pieza correcta</p>
                                <p className="mt-1 text-xs text-zinc-500">Parte por una buena búsqueda</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-5 pb-7 sm:px-8">
                    <div className="flex items-center justify-between border-t border-white/[0.07] pt-5">
                        <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-600">
                            INGENIERÍA PARA TU CAMINO
                        </p>
                        <a
                            href="#categorias"
                            className="flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"
                        >
                            Explorar catálogo
                            <IconArrowDownRight size={16} />
                        </a>
                    </div>
                </div>
            </section>

            {/* CATEGORÍAS */}
            <section id="categorias" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-xs font-bold tracking-[0.22em] text-red-500">ENCUENTRA LO QUE BUSCAS</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Explora por categoría</h2>
                        <p className="mt-3 text-sm text-zinc-500">
                            Empieza por el tipo de repuesto que necesita tu vehículo.
                        </p>
                    </div>

                    <Link
                        href="/catalogo"
                        className="group flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                    >
                        Ver catálogo completo
                        <IconArrowRight size={17} className="transition group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {categories.map((category, index) => {
                        const CategoryIcon = category.icon;

                        return (
                            <Link
                                key={category.name}
                                href={
                                    category.query
                                        ? `/catalogo?search=${encodeURIComponent(category.query)}`
                                        : "/catalogo"
                                }
                                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010] p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:bg-[#151111]"
                            >
                                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-red-600/[0.04] blur-2xl transition group-hover:bg-red-600/[0.12]" />

                                <div className="relative flex items-start justify-between">
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition group-hover:border-red-500/20 group-hover:text-red-400">
                                        <CategoryIcon size={24} stroke={1.5} />
                                    </div>
                                    <span className="text-xs text-zinc-700">0{index + 1}</span>
                                </div>

                                <h3 className="relative mt-8 text-lg font-semibold">{category.name}</h3>
                                <p className="relative mt-2 text-sm text-zinc-500">{category.subtitle}</p>

                                <div className="relative mt-5 flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-red-400">
                                    Explorar
                                    <IconChevronRight size={15} className="transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* PRODUCTOS DESTACADOS */}
            <section className="border-y border-white/[0.06] bg-[#0d0d0d]">
                <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <p className="text-xs font-bold tracking-[0.22em] text-red-500">DEL CATÁLOGO A TU AUTO</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Repuestos disponibles
                            </h2>
                            <p className="mt-3 text-sm text-zinc-500">Productos cargados desde el catálogo de RPM.</p>
                        </div>

                        <Link
                            href="/catalogo"
                            className="group flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                        >
                            Explorar todos
                            <IconArrowRight size={17} className="transition group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map(item => (
                                <div
                                    key={item}
                                    className="h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                                />
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {products.map(product => {
                                const imageUrl = getProductImage(product);
                                const imageFailed = !imageUrl || failedImages.includes(product.id_product);

                                return (
                                    <article
                                        key={product.id_product}
                                        className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212] transition duration-300 hover:-translate-y-1 hover:border-red-500/30"
                                    >
                                        <Link href={`/catalogo/${product.id_product}`} className="block">
                                            <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-[#1c1c1c] to-[#0c0c0c]">
                                                <div className="absolute h-28 w-28 rounded-full bg-red-600/[0.05] blur-2xl transition group-hover:bg-red-600/[0.12]" />

                                                {!imageFailed && imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        onError={() => markImageAsFailed(product.id_product)}
                                                        className="relative z-[1] h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <IconTool
                                                        size={48}
                                                        stroke={1}
                                                        className="relative z-[1] text-zinc-700 transition duration-300 group-hover:scale-110 group-hover:text-red-400/80"
                                                    />
                                                )}

                                                <span
                                                    className={`absolute right-3 top-3 z-[2] rounded-full border bg-[#090909]/90 px-2.5 py-1 text-[10px] font-medium ${
                                                        product.stock > 0
                                                            ? "border-emerald-500/20 text-emerald-400"
                                                            : "border-red-500/20 text-red-400"
                                                    }`}
                                                >
                                                    {product.stock > 0 ? "Disponible" : "Sin stock"}
                                                </span>
                                            </div>

                                            <div className="p-5">
                                                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-red-400">
                                                    {product.brand?.name ?? "RPM"}
                                                    {product.category?.name ? ` / ${product.category.name}` : ""}
                                                </p>

                                                <h3 className="mt-3 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-zinc-200 transition group-hover:text-white">
                                                    {product.name}
                                                </h3>

                                                <p className="mt-1 truncate text-xs text-zinc-500">
                                                    {product.model || product.sku}
                                                </p>

                                                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                                                    <span className="text-base font-bold">
                                                        {formatPrice(Number(product.price))}
                                                    </span>
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-400 transition group-hover:bg-red-600 group-hover:text-white">
                                                        <IconArrowUpRight size={19} />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/[0.08] bg-[#111] px-6 py-12 text-center">
                            <IconShoppingBag size={32} stroke={1.3} className="mx-auto text-zinc-600" />
                            <h3 className="mt-4 font-semibold">
                                {apiError
                                    ? "No pudimos conectar con el catálogo"
                                    : "Todavía no hay productos para mostrar"}
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                {apiError
                                    ? "Revisa que el backend esté funcionando y que NEXT_PUBLIC_BACKEND esté configurada correctamente."
                                    : "Cuando haya productos disponibles en RPM, aparecerán en esta sección."}
                            </p>
                            <Link
                                href="/catalogo"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
                            >
                                Ir al catálogo
                                <IconArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* BLOQUE FINAL */}
            <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-[#1b0b0b] via-[#120c0c] to-[#0d0d0d] p-8 sm:p-12 lg:p-14">
                    <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-red-600/[0.12] blur-[90px]" />

                    <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
                        <div className="max-w-xl">
                            <p className="text-xs font-bold tracking-[0.22em] text-red-400">RPM / TU PRÓXIMO PASO</p>
                            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                                Cada kilómetro cuenta.
                                <br />
                                <span className="text-zinc-500">Elige bien tus repuestos.</span>
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-zinc-400">
                                Revisa el catálogo y encuentra la pieza que tu vehículo necesita.
                            </p>
                        </div>

                        <Link
                            href="/catalogo"
                            className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 text-sm font-semibold transition hover:bg-red-500"
                        >
                            Explorar catálogo
                            <IconArrowRight size={18} className="transition group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/[0.07]">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p>
                        <span className="font-black tracking-[0.2em] text-zinc-300">RPM</span> · Repuestos para seguir
                        avanzando.
                    </p>
                    <p>© {new Date().getFullYear()} RPM. Todos los derechos reservados.</p>
                </div>
            </footer>
        </main>
    );
}
