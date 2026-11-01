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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProductoCarrito = {
    id_product: string;
    sku: string;
    name: string;
    model?: string | null;
    category?: string;
    brand?: string;
    price: number;
    stock: number;
    image?: string | null;
    quantity: number;
};

type ProductoAPI = {
    id_product: string;
    sku?: string;
    name: string;
    model?: string | null;
    price: number;
    stock: number;
    photo_path?: string | null;
    image?: string | null;
    category?: { name?: string } | null;
    brand?: { name?: string } | null;
};

type MensajeTipo = "success" | "error" | "info";

const STORAGE_KEY = "rpm-carrito";
const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

function formatoCLP(value: number) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(value);
}

function obtenerImagen(path?: string | null) {
    if (!path) return null;

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (!API_URL) return null;

    const cleanPath = path.replace(/^\/+/, "");

    if (cleanPath.startsWith("public/")) {
        return `${API_URL}/${cleanPath}`;
    }

    return `${API_URL}/${cleanPath}`;
}

function normalizarProducto(producto: ProductoAPI): ProductoCarrito {
    return {
        id_product: producto.id_product,
        sku: producto.sku ?? "",
        name: producto.name,
        model: producto.model ?? null,
        category: producto.category?.name ?? "",
        brand: producto.brand?.name ?? "",
        price: Number(producto.price) || 0,
        stock: Number(producto.stock) || 0,
        image: obtenerImagen(producto.photo_path ?? producto.image),
        quantity: 1,
    };
}

function leerCarrito(): ProductoCarrito[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (!stored) return [];

        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed)) return [];

        const productos: ProductoCarrito[] = parsed
            .map((item: any): ProductoCarrito | null => {
                const id = item.id_product ?? item.id;

                if (!id || typeof id !== "string") return null;

                const price = Number(item.price);
                const quantity = Number(item.quantity ?? 1);
                const stock = Number(item.stock ?? 0);

                if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity < 1) {
                    return null;
                }

                return {
                    id_product: id,
                    sku: String(item.sku ?? ""),
                    name: String(item.name ?? "Producto"),
                    model: item.model ?? null,
                    category: String(item.category ?? ""),
                    brand: String(item.brand ?? ""),
                    price,
                    stock: Number.isFinite(stock) ? stock : 0,
                    image: item.image ?? item.photo_path ?? null,
                    quantity: Math.floor(quantity),
                };
            })
            .filter((item): item is ProductoCarrito => item !== null);

        return productos;
    } catch (error) {
        console.error("Error leyendo el carrito:", error);
        return [];
    }
}

function obtenerMensajeError(data: any, fallback: string) {
    if (typeof data?.message === "string") {
        return data.message;
    }

    if (Array.isArray(data?.message)) {
        return data.message.join(", ");
    }

    if (typeof data?.error === "string") {
        return data.error;
    }

    return fallback;
}

export default function CarritoPage() {
    const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
    const [cargado, setCargado] = useState(false);
    const [validando, setValidando] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<MensajeTipo>("info");

    const retornoProcesado = useRef(false);

    const mostrarMensaje = useCallback((texto: string, tipo: MensajeTipo = "info") => {
        setMensaje(texto);
        setTipoMensaje(tipo);
    }, []);

    // Cargar carrito desde localStorage.
    useEffect(() => {
        setCarrito(leerCarrito());
        setCargado(true);
    }, []);

    // Guardar los cambios del carrito.
    useEffect(() => {
        if (!cargado) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        } catch (error) {
            console.error("No se pudo guardar el carrito:", error);
        }
    }, [carrito, cargado]);

    const subtotal = useMemo(
        () => carrito.reduce((total, producto) => total + producto.price * producto.quantity, 0),
        [carrito],
    );

    const cantidadProductos = useMemo(
        () => carrito.reduce((total, producto) => total + producto.quantity, 0),
        [carrito],
    );

    const actualizarCantidad = (id_product: string, cantidad: number) => {
        setCarrito(actual =>
            actual.map(producto => {
                if (producto.id_product !== id_product) {
                    return producto;
                }

                const nuevaCantidad = Math.max(1, Math.min(cantidad, producto.stock || cantidad));

                return {
                    ...producto,
                    quantity: nuevaCantidad,
                };
            }),
        );
    };

    const eliminarProducto = (id_product: string) => {
        setCarrito(actual => actual.filter(producto => producto.id_product !== id_product));

        mostrarMensaje("Producto eliminado del carrito.", "info");
    };

    const vaciarCarrito = () => {
        setCarrito([]);
        mostrarMensaje("Se vació el carrito.", "info");
    };

    // Crear una orden de PayPal y redirigir al usuario.
    const iniciarPagoPaypal = async (productos: ProductoCarrito[]) => {
        if (!API_URL) {
            throw new Error("No está configurada la URL del backend.");
        }

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Debes iniciar sesión para realizar una compra.");
        }

        setProcesandoPago(true);
        mostrarMensaje("Conectando con PayPal...", "info");

        const response = await fetch(`${API_URL}/payments/paypal/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
                products: productos.map(producto => ({
                    id_product: producto.id_product,
                    amount: producto.quantity,
                })),
            }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(obtenerMensajeError(data, "No se pudo iniciar el pago con PayPal."));
        }

        if (!data?.approvalUrl) {
            throw new Error("El backend no devolvió el enlace de aprobación de PayPal.");
        }

        // PayPal se encarga de la aprobación del pago.
        window.location.href = data.approvalUrl;
    };

    // Capturar el pago cuando PayPal devuelve al usuario a RPM.
    const confirmarPagoPaypal = useCallback(
        async (paypalOrderId: string) => {
            if (!API_URL) {
                mostrarMensaje("No está configurada la URL del backend.", "error");
                return;
            }

            const token = localStorage.getItem("token");

            if (!token) {
                mostrarMensaje(
                    "Tu sesión no está disponible. Inicia sesión nuevamente para verificar tu pago.",
                    "error",
                );
                return;
            }

            setProcesandoPago(true);
            mostrarMensaje("Verificando y confirmando tu pago...", "info");

            try {
                const response = await fetch(`${API_URL}/payments/paypal/capture-order`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        paypalOrderId,
                    }),
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(obtenerMensajeError(data, "PayPal no pudo confirmar el pago."));
                }

                // El carrito solo se limpia después de confirmar el pago.
                localStorage.removeItem(STORAGE_KEY);
                setCarrito([]);

                const orderId = data?.id_order ?? data?.order?.id_order ?? "";

                mostrarMensaje(
                    orderId
                        ? `¡Pago confirmado! Tu número de pedido es ${orderId}.`
                        : "¡Pago confirmado correctamente! Tu pedido fue registrado.",
                    "success",
                );

                // Limpiar los parámetros de retorno de PayPal.
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error("Error confirmando pago:", error);

                mostrarMensaje(
                    error instanceof Error ? error.message : "Ocurrió un error al confirmar el pago.",
                    "error",
                );
            } finally {
                setProcesandoPago(false);
            }
        },
        [mostrarMensaje],
    );

    // Detectar el retorno desde PayPal.
    useEffect(() => {
        if (!cargado || retornoProcesado.current) return;

        const params = new URLSearchParams(window.location.search);

        const estadoPaypal = params.get("paypal");
        const paypalOrderId = params.get("token");

        if (estadoPaypal === "success" && paypalOrderId) {
            retornoProcesado.current = true;
            void confirmarPagoPaypal(paypalOrderId);
            return;
        }

        if (estadoPaypal === "cancel") {
            retornoProcesado.current = true;

            mostrarMensaje("El pago fue cancelado. No se realizó ningún cobro.", "info");

            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [cargado, confirmarPagoPaypal, mostrarMensaje]);

    // Revisar precios y stock antes de iniciar el pago.
    const validarCompra = async () => {
        if (!API_URL) {
            mostrarMensaje("No está configurada la URL del backend.", "error");
            return;
        }

        if (carrito.length === 0) {
            mostrarMensaje("Tu carrito está vacío.", "error");
            return;
        }

        if (!localStorage.getItem("token")) {
            mostrarMensaje("Debes iniciar sesión para realizar una compra.", "error");
            return;
        }

        setValidando(true);
        setMensaje("");

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("No se pudo consultar la disponibilidad de los productos.");
            }

            const productosAPI: ProductoAPI[] = await response.json();

            if (!Array.isArray(productosAPI)) {
                throw new Error("El backend no devolvió una lista válida de productos.");
            }

            const actualizados: ProductoCarrito[] = [];
            const problemas: string[] = [];

            for (const producto of carrito) {
                const productoActual = productosAPI.find(item => item.id_product === producto.id_product);

                if (!productoActual) {
                    problemas.push(`${producto.name}: ya no está disponible.`);
                    continue;
                }

                const stockActual = Number(productoActual.stock);
                const precioActual = Number(productoActual.price);

                if (stockActual <= 0) {
                    problemas.push(`${producto.name}: no tiene stock disponible.`);
                    continue;
                }

                if (producto.quantity > stockActual) {
                    problemas.push(`${producto.name}: solo quedan ${stockActual} unidades.`);
                }

                if (precioActual !== producto.price) {
                    problemas.push(
                        `${producto.name}: su precio cambió de ${formatoCLP(
                            producto.price,
                        )} a ${formatoCLP(precioActual)}.`,
                    );
                }

                actualizados.push({
                    ...producto,
                    name: productoActual.name,
                    sku: productoActual.sku ?? producto.sku,
                    model: productoActual.model ?? producto.model,
                    price: precioActual,
                    stock: stockActual,
                    image: obtenerImagen(productoActual.photo_path ?? productoActual.image) ?? producto.image,
                    quantity: Math.min(producto.quantity, stockActual),
                });
            }

            setCarrito(actualizados);

            if (problemas.length > 0) {
                mostrarMensaje(problemas.join(" "), "error");
                return;
            }

            // Se utiliza la información recién validada.
            await iniciarPagoPaypal(actualizados);
        } catch (error) {
            console.error("Error validando compra:", error);

            mostrarMensaje(error instanceof Error ? error.message : "No se pudo validar tu compra.", "error");
        } finally {
            setValidando(false);
        }
    };

    if (!cargado) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#070809]">
                <IconRefresh className="animate-spin text-red-500" size={30} />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#070809] px-4 py-10 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Encabezado */}
                <header className="mb-10">
                    <div className="mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                            RPM / Tu compra
                        </span>
                    </div>

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Mi carrito
                                <span className="text-red-500">.</span>
                            </h1>

                            <p className="mt-2 text-sm text-zinc-400">
                                Revisa tus productos antes de finalizar la compra.
                            </p>
                        </div>

                        <Link
                            href="/catalog"
                            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
                        >
                            <IconArrowLeft size={17} />
                            Seguir comprando
                        </Link>
                    </div>
                </header>

                {/* Mensajes */}
                {mensaje && (
                    <div
                        role="status"
                        className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                            tipoMensaje === "success"
                                ? "border-green-500/20 bg-green-500/10 text-green-300"
                                : tipoMensaje === "error"
                                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                                  : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                        }`}
                    >
                        {tipoMensaje === "success" ? (
                            <IconCheck className="mt-0.5 shrink-0" size={19} />
                        ) : (
                            <IconAlertCircle className="mt-0.5 shrink-0" size={19} />
                        )}

                        <p className="break-words">{mensaje}</p>
                    </div>
                )}

                {carrito.length === 0 ? (
                    /* Carrito vacío */
                    <section className="rounded-2xl border border-white/10 bg-[#101114] px-6 py-16 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                            <IconShoppingBag size={36} className="text-zinc-500" />
                        </div>

                        <h2 className="text-xl font-bold">Tu carrito está vacío</h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
                            Todavía no agregas productos. Explora nuestro catálogo y encuentra los repuestos que
                            necesitas.
                        </p>

                        <Link
                            href="/catalog"
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-500"
                        >
                            Explorar catálogo
                            <IconArrowRight size={18} />
                        </Link>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_350px]">
                        {/* Productos */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-zinc-300">Productos ({cantidadProductos})</p>

                                <button
                                    type="button"
                                    onClick={vaciarCarrito}
                                    disabled={validando || procesandoPago}
                                    className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 transition hover:text-red-400 disabled:opacity-40"
                                >
                                    <IconTrash size={15} />
                                    Vaciar carrito
                                </button>
                            </div>

                            {carrito.map(producto => (
                                <article
                                    key={producto.id_product}
                                    className="rounded-2xl border border-white/10 bg-[#101114] p-4 sm:p-5"
                                >
                                    <div className="flex gap-4">
                                        {/* Imagen */}
                                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#18191d] sm:h-28 sm:w-28">
                                            {producto.image ? (
                                                <img
                                                    src={producto.image}
                                                    alt={producto.name}
                                                    className="h-full w-full object-contain p-2"
                                                    onError={event => {
                                                        event.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <IconPackage size={34} className="text-zinc-600" />
                                            )}
                                        </div>

                                        {/* Información */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h2 className="line-clamp-2 text-sm font-bold text-white sm:text-base">
                                                        {producto.name}
                                                    </h2>

                                                    {producto.model && (
                                                        <p className="mt-1 text-xs text-zinc-400">{producto.model}</p>
                                                    )}

                                                    {producto.sku && (
                                                        <p className="mt-1 text-[11px] text-zinc-600">
                                                            SKU: {producto.sku}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => eliminarProducto(producto.id_product)}
                                                    disabled={validando || procesandoPago}
                                                    aria-label={`Eliminar ${producto.name}`}
                                                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                                >
                                                    <IconTrash size={17} />
                                                </button>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] text-zinc-500">Precio unitario</p>
                                                    <p className="mt-0.5 text-sm font-bold text-white">
                                                        {formatoCLP(producto.price)}
                                                    </p>
                                                </div>

                                                {/* Cantidad */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center rounded-lg border border-white/10 bg-[#08090b]">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                actualizarCantidad(
                                                                    producto.id_product,
                                                                    producto.quantity - 1,
                                                                )
                                                            }
                                                            disabled={
                                                                producto.quantity <= 1 || validando || procesandoPago
                                                            }
                                                            className="p-2 text-zinc-400 transition hover:text-white disabled:opacity-30"
                                                            aria-label="Disminuir cantidad"
                                                        >
                                                            <IconMinus size={15} />
                                                        </button>

                                                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                                                            {producto.quantity}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                actualizarCantidad(
                                                                    producto.id_product,
                                                                    producto.quantity + 1,
                                                                )
                                                            }
                                                            disabled={
                                                                producto.quantity >= producto.stock ||
                                                                validando ||
                                                                procesandoPago
                                                            }
                                                            className="p-2 text-zinc-400 transition hover:text-white disabled:opacity-30"
                                                            aria-label="Aumentar cantidad"
                                                        >
                                                            <IconPlus size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                                <span className="text-xs text-zinc-500">
                                                    Stock disponible: {producto.stock}
                                                </span>

                                                <span className="text-sm font-bold text-red-400">
                                                    {formatoCLP(producto.price * producto.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        {/* Resumen */}
                        <aside className="lg:sticky lg:top-6">
                            <div className="rounded-2xl border border-white/10 bg-[#101114] p-5 sm:p-6">
                                <h2 className="text-lg font-bold">Resumen de compra</h2>

                                <div className="mt-6 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Productos</span>
                                        <span className="font-medium text-white">{cantidadProductos}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Subtotal</span>
                                        <span className="font-medium text-white">{formatoCLP(subtotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Despacho</span>
                                        <span className="text-xs text-zinc-500">Por calcular</span>
                                    </div>

                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-semibold">Total</span>
                                            <span className="text-xl font-bold text-red-400">
                                                {formatoCLP(subtotal)}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                                            El total corresponde a los productos. Los costos de despacho, si
                                            corresponden, se calcularán por separado.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void validarCompra()}
                                    disabled={validando || procesandoPago || carrito.length === 0}
                                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {validando || procesandoPago ? (
                                        <>
                                            <IconRefresh className="animate-spin" size={18} />
                                            {validando ? "Verificando disponibilidad..." : "Conectando con PayPal..."}
                                        </>
                                    ) : (
                                        <>
                                            Pagar con PayPal
                                            <IconArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                                    <IconShieldCheck size={16} className="text-green-500" />
                                    Pago procesado de forma segura
                                </div>

                                <div className="mt-5 border-t border-white/10 pt-5">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="rounded-md bg-[#003087] px-2 py-1 text-xs font-bold italic text-white">
                                            PayPal
                                        </span>
                                        <span className="text-[11px] text-zinc-500">Sandbox</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
