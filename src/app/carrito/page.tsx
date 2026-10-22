"use client";

import {
    IconAlertCircle,
    IconArrowLeft,
    IconArrowRight,
    IconCheck,
    IconMinus,
    IconPackage,
    IconPlus,
    IconRefresh,
    IconShieldCheck,
    IconShoppingBag,
    IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ProductoCarrito = {
    id_product: string;
    sku: string;
    name: string;
    model?: string;
    category?: string;
    brand?: string;
    price: number;
    stock: number;
    image?: string;
    quantity: number;
};

type ProductoAPI = {
    id_product: string;
    sku?: string;
    name: string;
    model?: string;
    category?: { name?: string } | string;
    brand?: { name?: string } | string;
    price: number | string;
    stock: number;
    image?: string;
};

const STORAGE_KEY = "rpm-carrito";
const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/$/, "");

const formatoPrecio = (precio: number) =>
    new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(precio);

function nombreRelacion(relacion: { name?: string } | string | undefined): string | undefined {
    if (typeof relacion === "string") return relacion;
    return relacion?.name;
}

function normalizarProducto(producto: ProductoAPI, cantidad = 1): ProductoCarrito {
    return {
        id_product: producto.id_product,
        sku: producto.sku ?? "",
        name: producto.name,
        model: producto.model,
        category: nombreRelacion(producto.category),
        brand: nombreRelacion(producto.brand),
        price: Number(producto.price),
        stock: Math.max(0, Number(producto.stock) || 0),
        image: producto.image,
        quantity: cantidad,
    };
}

function extraerProductos(respuesta: unknown): ProductoAPI[] {
    if (Array.isArray(respuesta)) return respuesta as ProductoAPI[];

    if (respuesta && typeof respuesta === "object") {
        const objeto = respuesta as {
            data?: unknown;
            products?: unknown;
        };

        if (Array.isArray(objeto.data)) {
            return objeto.data as ProductoAPI[];
        }

        if (Array.isArray(objeto.products)) {
            return objeto.products as ProductoAPI[];
        }
    }

    return [];
}

function leerCarrito(): ProductoCarrito[] {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (!guardado) return [];

        const datos: unknown = JSON.parse(guardado);
        if (!Array.isArray(datos)) return [];

        const productos: (ProductoCarrito | null)[] = datos.map((elemento: unknown): ProductoCarrito | null => {
            if (!elemento || typeof elemento !== "object") {
                return null;
            }

            const item = elemento as Record<string, unknown>;

            // Compatibilidad con el formato anterior que usaba "id".
            const id = item.id_product ?? item.id;
            const quantity = Math.floor(Number(item.quantity));
            const price = Number(item.price);

            if (
                (typeof id !== "string" && typeof id !== "number") ||
                !Number.isFinite(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0 ||
                typeof item.name !== "string"
            ) {
                return null;
            }

            const producto: ProductoCarrito = {
                id_product: String(id),
                sku: String(item.sku ?? ""),
                name: item.name,
                model: typeof item.model === "string" ? item.model : undefined,
                category: typeof item.category === "string" ? item.category : undefined,
                brand: typeof item.brand === "string" ? item.brand : undefined,
                price,
                stock: Math.max(0, Number(item.stock) || 0),
                image: typeof item.image === "string" ? item.image : undefined,
                quantity,
            };

            return producto;
        });

        return productos.filter((producto): producto is ProductoCarrito => producto !== null);
    } catch (error) {
        console.error("No se pudo recuperar el carrito:", error);
        return [];
    }
}

export default function CarritoPage() {
    const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
    const [cargado, setCargado] = useState(false);
    const [validando, setValidando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"error" | "success" | "">("");

    useEffect(() => {
        setCarrito(leerCarrito());
        setCargado(true);
    }, []);

    useEffect(() => {
        if (!cargado) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        } catch (error) {
            console.error("No se pudo guardar el carrito:", error);
            setMensaje("No se pudo guardar el carrito en este navegador.");
            setTipoMensaje("error");
        }
    }, [carrito, cargado]);

    const totalUnidades = useMemo(() => carrito.reduce((total, producto) => total + producto.quantity, 0), [carrito]);

    const totalPrecio = useMemo(
        () => carrito.reduce((total, producto) => total + producto.price * producto.quantity, 0),
        [carrito],
    );

    const cambiarCantidad = useCallback((id: string, cambio: number) => {
        setMensaje("");
        setTipoMensaje("");

        setCarrito(actual =>
            actual.map(producto => {
                if (producto.id_product !== id) return producto;

                const nuevaCantidad = producto.quantity + cambio;

                if (nuevaCantidad < 1) return producto;

                if (nuevaCantidad > producto.stock) {
                    setMensaje(
                        producto.stock === 0
                            ? `${producto.name} no tiene unidades disponibles.`
                            : `Solo hay ${producto.stock} unidad(es) de ${producto.name}.`,
                    );
                    setTipoMensaje("error");
                    return producto;
                }

                return { ...producto, quantity: nuevaCantidad };
            }),
        );
    }, []);

    function eliminarProducto(id: string) {
        setCarrito(actual => actual.filter(producto => producto.id_product !== id));
        setMensaje("");
        setTipoMensaje("");
    }

    function vaciarCarrito() {
        setCarrito([]);
        setMensaje("");
        setTipoMensaje("");
    }

    async function validarCompra() {
        if (carrito.length === 0 || validando) return;

        if (!API_URL) {
            setMensaje("Falta configurar BACKEND en las variables de entorno.");
            setTipoMensaje("error");
            return;
        }

        setValidando(true);
        setMensaje("");
        setTipoMensaje("");

        try {
            const respuesta = await fetch(`${API_URL}/products`, {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (!respuesta.ok) {
                throw new Error("No se pudo consultar el catálogo.");
            }

            const json: unknown = await respuesta.json();
            const productosActuales = extraerProductos(json);

            if (productosActuales.length === 0) {
                throw new Error("El backend no devolvió productos. Revisa la respuesta de GET /products.");
            }

            const porId = new Map(productosActuales.map(producto => [producto.id_product, producto]));

            const problemas: string[] = [];
            const actualizados: ProductoCarrito[] = [];

            for (const producto of carrito) {
                const actual = porId.get(producto.id_product);

                if (!actual) {
                    problemas.push(`${producto.name}: el producto ya no aparece en el catálogo.`);
                    continue;
                }

                const stockActual = Math.max(0, Number(actual.stock) || 0);
                const precioActual = Number(actual.price);

                if (!Number.isFinite(precioActual) || precioActual < 0) {
                    problemas.push(`${producto.name}: el backend devolvió un precio inválido.`);
                    continue;
                }

                actualizados.push(normalizarProducto(actual, producto.quantity));

                if (stockActual === 0) {
                    problemas.push(`${actual.name}: sin stock disponible.`);
                } else if (producto.quantity > stockActual) {
                    problemas.push(`${actual.name}: pediste ${producto.quantity}, pero quedan ${stockActual}.`);
                }

                if (precioActual !== producto.price) {
                    problemas.push(
                        `${actual.name}: el precio cambió de ${formatoPrecio(
                            producto.price,
                        )} a ${formatoPrecio(precioActual)}.`,
                    );
                }
            }

            setCarrito(actualizados);

            if (problemas.length > 0) {
                setMensaje(`Revisa tu carrito antes de continuar:\n${problemas.join("\n")}`);
                setTipoMensaje("error");
                return;
            }

            setMensaje(
                "Stock y precios comprobados. El carrito está listo para continuar, pero el sistema de pedidos y pagos todavía debe conectarse al backend.",
            );
            setTipoMensaje("success");
        } catch (error) {
            console.error("Error validando la compra:", error);
            setMensaje(
                error instanceof Error ? error.message : "No fue posible validar el stock. Inténtalo nuevamente.",
            );
            setTipoMensaje("error");
        } finally {
            setValidando(false);
        }
    }

    if (!cargado) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#070809] text-white">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <IconRefresh className="animate-spin" size={20} />
                    Cargando tu carrito...
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#070809] text-white">
            {/* Fondo ambiental */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse at 15% 0%, rgba(190,20,35,0.17), transparent 42%), radial-gradient(ellipse at 90% 45%, rgba(100,12,22,0.10), transparent 35%)",
                }}
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.045]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage: "linear-gradient(to bottom, black, transparent 80%)",
                }}
            />

            <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <header className="mb-10 flex flex-col justify-between gap-6 border-b border-white/[0.09] pb-8 sm:flex-row sm:items-end">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                        >
                            <IconArrowLeft size={17} />
                            Volver al inicio
                        </Link>

                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400">
                                <IconShoppingBag size={25} stroke={1.7} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">
                                    RPM / TU COMPRA
                                </p>
                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Mi <span className="text-red-500">carrito</span>
                                </h1>
                            </div>
                        </div>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                            Revisa tus repuestos, ajusta las cantidades y verifica la disponibilidad antes de continuar.
                        </p>
                    </div>

                    <Link
                        href="/catalogo"
                        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition hover:border-red-500/50 hover:bg-red-500/10 sm:self-auto"
                    >
                        Seguir comprando
                        <IconArrowRight size={17} />
                    </Link>
                </header>

                {mensaje && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`mb-6 flex items-start gap-3 whitespace-pre-line rounded-xl border p-4 text-sm leading-6 ${
                            tipoMensaje === "error"
                                ? "border-red-500/30 bg-red-500/[0.07] text-red-200"
                                : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200"
                        }`}
                    >
                        {tipoMensaje === "error" ? (
                            <IconAlertCircle className="mt-0.5 shrink-0" size={19} />
                        ) : (
                            <IconCheck className="mt-0.5 shrink-0" size={19} />
                        )}
                        <p>{mensaje}</p>
                    </div>
                )}

                {carrito.length === 0 ? (
                    <section className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101114]/90 px-6 py-20 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.07] text-red-400">
                            <IconShoppingBag size={38} stroke={1.4} />
                        </div>

                        <h2 className="mt-6 text-2xl font-bold">Tu carrito está vacío</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
                            Todavía no has agregado repuestos. Explora el catálogo para encontrar las piezas que
                            necesita tu auto.
                        </p>

                        <Link
                            href="/catalogo"
                            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold transition hover:bg-red-500"
                        >
                            Explorar catálogo
                            <IconArrowRight size={18} />
                        </Link>
                    </section>
                ) : (
                    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="min-w-0">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold">Tus productos</h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"} en el carrito
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={vaciarCarrito}
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                                >
                                    <IconTrash size={16} />
                                    Vaciar carrito
                                </button>
                            </div>

                            <div className="space-y-3">
                                {carrito.map(producto => {
                                    const sinStock = producto.stock <= 0;
                                    const cantidadExcedida = producto.quantity > producto.stock;

                                    return (
                                        <article
                                            key={producto.id_product}
                                            className="group rounded-xl border border-white/[0.09] bg-[#101114]/90 p-4 transition hover:border-white/[0.15] sm:p-5"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row">
                                                <Link
                                                    href={`/catalogo/${producto.id_product}`}
                                                    aria-label={`Ver ${producto.name}`}
                                                    className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-[#191a1e] sm:w-36"
                                                >
                                                    {producto.image ? (
                                                        <img
                                                            src={producto.image}
                                                            alt={producto.name}
                                                            className="h-full w-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <IconPackage
                                                            size={43}
                                                            stroke={1.1}
                                                            className="text-zinc-600 transition group-hover:text-red-400"
                                                        />
                                                    )}
                                                </Link>

                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-400">
                                                            {producto.category || "Repuesto"}
                                                        </span>
                                                        {producto.sku && (
                                                            <span className="text-xs text-zinc-600">
                                                                SKU: {producto.sku}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={`/catalogo/${producto.id_product}`}
                                                        className="mt-2 text-base font-bold leading-snug transition hover:text-red-400"
                                                    >
                                                        {producto.name}
                                                    </Link>

                                                    {producto.model && (
                                                        <p className="mt-1 text-sm text-zinc-400">
                                                            Modelo: {producto.model}
                                                        </p>
                                                    )}

                                                    {producto.brand && (
                                                        <p className="mt-1 text-sm text-zinc-500">
                                                            Marca: {producto.brand}
                                                        </p>
                                                    )}

                                                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 text-xs ${
                                                                sinStock || cantidadExcedida
                                                                    ? "text-red-400"
                                                                    : "text-emerald-400"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    sinStock || cantidadExcedida
                                                                        ? "bg-red-400"
                                                                        : "bg-emerald-400"
                                                                }`}
                                                            />
                                                            {sinStock
                                                                ? "Sin stock"
                                                                : cantidadExcedida
                                                                  ? `Stock disponible: ${producto.stock}`
                                                                  : `${producto.stock} disponibles`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row items-center justify-between gap-4 border-t border-white/[0.07] pt-4 sm:min-w-36 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs text-zinc-500">Precio unitario</p>
                                                        <p className="mt-1 font-semibold">
                                                            {formatoPrecio(producto.price)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarCantidad(producto.id_product, -1)}
                                                            disabled={producto.quantity <= 1}
                                                            aria-label={`Disminuir cantidad de ${producto.name}`}
                                                            className="flex h-9 w-9 items-center justify-center transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                                                        >
                                                            <IconMinus size={15} />
                                                        </button>

                                                        <span className="min-w-10 text-center text-sm font-semibold tabular-nums">
                                                            {producto.quantity}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarCantidad(producto.id_product, 1)}
                                                            disabled={producto.quantity >= producto.stock}
                                                            aria-label={`Aumentar cantidad de ${producto.name}`}
                                                            className="flex h-9 w-9 items-center justify-center transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                                                        >
                                                            <IconPlus size={15} />
                                                        </button>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs text-zinc-500">Subtotal</p>
                                                        <p className="mt-1 font-bold text-red-400">
                                                            {formatoPrecio(producto.price * producto.quantity)}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => eliminarProducto(producto.id_product)}
                                                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-red-400"
                                                    >
                                                        <IconTrash size={14} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="rounded-xl border border-white/[0.1] bg-[#101114]/95 p-5 sm:p-6 lg:sticky lg:top-6">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Resumen</p>
                            <h2 className="mt-2 text-xl font-bold">Resumen de compra</h2>

                            <div className="mt-6 space-y-4 text-sm">
                                <div className="flex justify-between gap-4 text-zinc-400">
                                    <span>Productos</span>
                                    <span className="text-white">{totalUnidades} unidades</span>
                                </div>

                                <div className="flex justify-between gap-4 text-zinc-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatoPrecio(totalPrecio)}</span>
                                </div>

                                <div className="flex justify-between gap-4 text-zinc-400">
                                    <span>Envío</span>
                                    <span>Por confirmar</span>
                                </div>

                                <div className="border-t border-white/[0.09] pt-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="font-semibold">Total parcial</span>
                                        <span className="text-2xl font-black tracking-tight text-red-500">
                                            {formatoPrecio(totalPrecio)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                                        El envío y otros cargos, si corresponden, se calcularán cuando el flujo de
                                        pedidos esté implementado.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={validarCompra}
                                disabled={validando || carrito.length === 0}
                                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3.5 text-sm font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {validando ? (
                                    <>
                                        <IconRefresh className="animate-spin" size={18} />
                                        Verificando stock...
                                    </>
                                ) : (
                                    <>
                                        Validar compra
                                        <IconArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={validarCompra}
                                disabled={validando || carrito.length === 0}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-60"
                            >
                                <IconRefresh size={16} />
                                Actualizar disponibilidad
                            </button>

                            <div className="mt-5 flex items-start gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
                                <IconShieldCheck size={19} className="mt-0.5 shrink-0 text-zinc-400" />
                                <p className="text-xs leading-5 text-zinc-500">
                                    La validación consulta el catálogo del backend. No reserva unidades ni procesa
                                    pagos.
                                </p>
                            </div>

                            <Link
                                href="/catalogo"
                                className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                            >
                                Seguir buscando repuestos
                                <IconArrowRight size={15} />
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
