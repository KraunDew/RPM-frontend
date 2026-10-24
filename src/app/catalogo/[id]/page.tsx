"use client";

import Header from "@/components/Header";
import { IconArrowLeft, IconCar, IconShoppingBag } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
    id_product: string;
    sku: string;
    name: string;
    model: string;
    material?: string | null;
    price: number;
    description?: string | null;
    stock: number;
    photo_path?: string | null;
    image?: string | null;
    category?: { name: string } | null;
    brand?: { name: string } | null;
    supplier?: { name: string } | null;
};

type CartItem = {
    id_product: string;
    sku: string;
    name: string;
    model: string;
    category: string;
    brand: string;
    price: number;
    stock: number;
    image: string;
    quantity: number;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

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

export default function ProductPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            try {
                if (!BACKEND_URL) {
                    throw new Error("Falta configurar NEXT_PUBLIC_BACKEND en las variables de entorno.");
                }

                setLoading(true);
                setError("");
                setProduct(null);
                setImageFailed(false);

                const response = await fetch(`${BACKEND_URL}/products/${encodeURIComponent(id)}`, {
                    cache: "no-store",
                });

                if (response.status === 404) {
                    if (!cancelled) setProduct(null);
                    return;
                }

                if (!response.ok) {
                    throw new Error("No se pudo cargar el producto.");
                }

                const data: Product = await response.json();

                if (!cancelled) {
                    setProduct(data);
                }
            } catch (err) {
                console.error("Error al cargar el producto:", err);

                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Ocurrió un error al cargar el producto.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (id) {
            void loadProduct();
        } else {
            setLoading(false);
            setError("No se encontró el identificador del producto.");
        }

        return () => {
            cancelled = true;
        };
    }, [id]);

    function addToCart() {
        if (!product) return;

        if (product.stock <= 0) {
            setMessage("Este producto no tiene stock.");
            return;
        }

        try {
            const savedCart = localStorage.getItem("rpm-carrito");
            const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : [];

            const cart: CartItem[] = Array.isArray(parsedCart) ? parsedCart : [];

            const existingIndex = cart.findIndex(item => item.id_product === product.id_product);

            const image = getProductImage(product);

            if (existingIndex !== -1) {
                const existingItem = cart[existingIndex];

                if (existingItem.quantity >= product.stock) {
                    setMessage("Ya alcanzaste el stock disponible.");
                    return;
                }

                cart[existingIndex] = {
                    ...existingItem,
                    name: product.name,
                    sku: product.sku,
                    model: product.model,
                    category: product.category?.name ?? "Sin categoría",
                    brand: product.brand?.name ?? "Sin marca",
                    price: Number(product.price),
                    stock: product.stock,
                    image: image || existingItem.image || "",
                    quantity: existingItem.quantity + 1,
                };
            } else {
                cart.push({
                    id_product: product.id_product,
                    sku: product.sku,
                    name: product.name,
                    model: product.model,
                    category: product.category?.name ?? "Sin categoría",
                    brand: product.brand?.name ?? "Sin marca",
                    price: Number(product.price),
                    stock: product.stock,
                    image,
                    quantity: 1,
                });
            }

            localStorage.setItem("rpm-carrito", JSON.stringify(cart));
            window.dispatchEvent(new Event("rpm-carrito-actualizado"));

            setMessage("¡Producto agregado al carrito!");
        } catch (err) {
            console.error("Error al actualizar el carrito:", err);
            setMessage("No se pudo actualizar el carrito.");
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
                <p className="animate-pulse text-zinc-400">Cargando repuesto...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#090909] px-6 text-center text-white">
                <p className="text-sm font-semibold tracking-[0.2em] text-red-500">RPM / PRODUCTOS</p>
                <h1 className="mt-4 text-2xl font-bold">No pudimos cargar el producto</h1>
                <p className="mt-3 max-w-lg text-zinc-400">{error}</p>
                <Link
                    href="/catalogo"
                    className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-500"
                >
                    Volver al catálogo
                </Link>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#090909] px-6 text-center text-white">
                <p className="text-sm font-semibold tracking-[0.2em] text-red-500">RPM / PRODUCTOS</p>
                <h1 className="mt-4 text-3xl font-bold">No encontramos este repuesto</h1>
                <p className="mt-3 text-zinc-400">Puede que el producto ya no exista o que el enlace sea incorrecto.</p>
                <Link
                    href="/catalogo"
                    className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-500"
                >
                    Volver al catálogo
                </Link>
            </main>
        );
    }

    const imageUrl = getProductImage(product);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-[#090909] px-4 py-10 text-white sm:px-8">
                <div className="mx-auto max-w-6xl">
                    <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                        <Link href="/" className="transition hover:text-white">
                            Inicio
                        </Link>
                        <span>/</span>
                        <Link href="/catalogo" className="transition hover:text-white">
                            Catálogo
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-300">{product.name}</span>
                    </nav>

                    <section className="grid gap-10 lg:grid-cols-2">
                        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#191919] to-[#0d0d0d] p-6 sm:min-h-[480px] sm:p-8">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl"
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
                                    backgroundSize: "32px 32px",
                                }}
                            />

                            {imageUrl && !imageFailed ? (
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    onError={() => setImageFailed(true)}
                                    className="relative z-[1] max-h-[420px] w-full object-contain"
                                />
                            ) : (
                                <div className="relative z-[1] flex flex-col items-center text-center">
                                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-zinc-500">
                                        <IconCar size={54} stroke={1.2} />
                                    </div>
                                    <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-red-500">
                                        RPM AUTOMOTRIZ
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-500">Imagen no disponible</p>
                                </div>
                            )}

                            <span className="absolute bottom-4 right-4 z-[2] rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-300">
                                SKU: {product.sku}
                            </span>
                        </div>

                        <div className="flex flex-col justify-center">
                            <p className="text-sm font-medium text-red-400">
                                {product.category?.name ?? "Sin categoría"} · {product.brand?.name ?? "Sin marca"}
                            </p>

                            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>

                            <p className="mt-3 text-sm text-zinc-400">Modelo: {product.model || "No especificado"}</p>

                            <p className="mt-6 text-3xl font-bold">{formatPrice(Number(product.price))}</p>

                            <p className="mt-5 leading-7 text-zinc-300">
                                {product.description || "Sin descripción disponible."}
                            </p>

                            <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm">
                                <p className="text-zinc-400">
                                    SKU: <span className="text-white">{product.sku}</span>
                                </p>

                                <p className="text-zinc-400">
                                    Material:{" "}
                                    <span className="text-white">{product.material || "No especificado"}</span>
                                </p>

                                <p className="text-zinc-400">
                                    Proveedor:{" "}
                                    <span className="text-white">{product.supplier?.name ?? "No especificado"}</span>
                                </p>

                                <p>
                                    Disponibilidad:{" "}
                                    <span className={product.stock > 0 ? "text-emerald-400" : "text-red-400"}>
                                        {product.stock > 0 ? `${product.stock} unidades disponibles` : "Sin stock"}
                                    </span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addToCart}
                                disabled={product.stock <= 0}
                                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                            >
                                <IconShoppingBag size={20} />
                                {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
                            </button>

                            {message && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className={`mt-3 text-sm ${
                                        message.startsWith("¡") ? "text-emerald-400" : "text-amber-400"
                                    }`}
                                >
                                    {message}
                                </p>
                            )}

                            <p className="mt-3 text-xs leading-5 text-zinc-500">
                                Antes de comprar, verifica que el repuesto sea compatible con tu vehículo.
                            </p>

                            <Link
                                href="/catalogo"
                                className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                            >
                                <IconArrowLeft size={17} />
                                Volver al catálogo
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
