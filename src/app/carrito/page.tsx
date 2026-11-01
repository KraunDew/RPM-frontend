"use client";

import {
    IconAlertCircle,
    IconArrowLeft,
    IconCheck,
    IconChevronRight,
    IconCreditCard,
    IconLoader2,
    IconLock,
    IconMinus,
    IconPackage,
    IconPlus,
    IconShieldCheck,
    IconShoppingCart,
    IconTrash,
    IconTruck,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");
const STORAGE_KEY = "rpm-carrito";

type CartItem = {
    id_product: string;
    sku: string;
    name: string;
    model: string | null;
    price: number;
    stock: number;
    image: string | null;
    quantity: number;
};

type ApiProduct = {
    id_product: string;
    sku?: string | null;
    name?: string | null;
    model?: string | null;
    price: number;
    stock: number;
    photo_path?: string | null;
    image?: string | null;
};

type CreatePaypalOrderResponse = {
    id_order?: string;
    paypalOrderId?: string;
    approvalUrl?: string;
    totalCLP?: number;
    totalUSD?: number;
    currency?: string;
};

type CapturePaypalOrderResponse = {
    id_order?: string;
    message?: string;
    status?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCart(value: unknown): CartItem[] {
    if (!Array.isArray(value)) return [];

    return value.reduce<CartItem[]>((items, entry) => {
        if (!isRecord(entry)) return items;

        const idProduct = entry.id_product;
        const name = entry.name;
        const price = Number(entry.price);
        const stock = Number(entry.stock ?? 0);
        const quantity = Number(entry.quantity);
        const imageValue = entry.image ?? entry.photo_path ?? entry.photo;
        const modelValue = entry.model;
        const skuValue = entry.sku;

        if (
            typeof idProduct !== "string" ||
            typeof name !== "string" ||
            !Number.isFinite(price) ||
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return items;
        }

        items.push({
            id_product: idProduct,
            sku: typeof skuValue === "string" ? skuValue : "",
            name,
            model: typeof modelValue === "string" ? modelValue : null,
            price: Math.max(0, Math.round(price)),
            stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
            image: typeof imageValue === "string" ? imageValue : null,
            quantity,
        });

        return items;
    }, []);
}

function formatCLP(value: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(value);
}

function resolveImageUrl(image: string | null): string | null {
    if (!image) return null;

    const trimmed = image.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const cleanPath = trimmed.replace(/^\/+/, "");
    let path = `/${cleanPath}`;

    if (cleanPath.startsWith("photos/")) {
        path = `/public/${cleanPath}`;
    } else if (cleanPath.startsWith("public/")) {
        path = `/${cleanPath}`;
    }

    return API_URL ? `${API_URL}${path}` : path;
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;

        if (status === 401) {
            return "Tu sesión no está activa o el navegador no envió la cookie de autenticación. Inicia sesión nuevamente y vuelve a intentarlo.";
        }

        if (status === 403) {
            return "No tienes autorización para realizar esta operación.";
        }

        if (Array.isArray(data?.message)) {
            return data.message.join(" ");
        }

        if (typeof data?.message === "string") {
            return data.message;
        }

        if (typeof data?.error === "string") {
            return data.error;
        }

        if (!error.response) {
            return "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";
        }
    }

    return error instanceof Error ? error.message : "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

function cleanPaypalQuery(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("paypal");
    url.searchParams.delete("token");
    url.searchParams.delete("PayerID");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function CarritoPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [purchaseConfirmed, setPurchaseConfirmed] = useState(false);
    const [confirmedOrderId, setConfirmedOrderId] = useState("");
    const paypalReturnProcessed = useRef(false);

    useEffect(() => {
        try {
            const storedCart = localStorage.getItem(STORAGE_KEY);
            setCart(storedCart ? normalizeCart(JSON.parse(storedCart)) : []);
        } catch (storageError) {
            console.error("No se pudo leer el carrito:", storageError);
            setCart([]);
            setError("No se pudo recuperar el carrito guardado en este navegador.");
        } finally {
            setCartLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!cartLoaded) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (storageError) {
            console.error("No se pudo guardar el carrito:", storageError);
            setError("No se pudieron guardar los cambios del carrito en este navegador.");
        }
    }, [cart, cartLoaded]);

    const itemCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

    const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);

    const hasStockIssues = useMemo(() => cart.some(item => item.stock <= 0 || item.quantity > item.stock), [cart]);

    const changeQuantity = useCallback(
        (idProduct: string, amount: number) => {
            const selectedItem = cart.find(item => item.id_product === idProduct);
            if (!selectedItem) return;

            const nextQuantity = selectedItem.quantity + amount;
            if (nextQuantity < 1) return;

            if (amount > 0 && selectedItem.stock <= 0) {
                setError(`"${selectedItem.name}" no tiene stock disponible.`);
                return;
            }

            if (amount > 0 && nextQuantity > selectedItem.stock) {
                setError(`Solo quedan ${selectedItem.stock} unidades de "${selectedItem.name}".`);
                return;
            }

            setError("");
            setNotice("");
            setCart(current =>
                current.map(item => (item.id_product === idProduct ? { ...item, quantity: nextQuantity } : item)),
            );
        },
        [cart],
    );

    const removeItem = useCallback((idProduct: string) => {
        setCart(current => current.filter(item => item.id_product !== idProduct));
        setError("");
        setNotice("Producto eliminado del carrito.");
    }, []);

    const confirmPaypalPayment = useCallback(async (paypalOrderId: string) => {
        if (!API_URL) {
            setError("Falta configurar NEXT_PUBLIC_BACKEND en el frontend.");
            return;
        }

        setPaymentLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await axios.post<CapturePaypalOrderResponse>(
                `${API_URL}/payments/paypal/capture-order`,
                { paypalOrderId },
                { withCredentials: true },
            );

            setCart([]);
            setPurchaseConfirmed(true);
            setConfirmedOrderId(response.data?.id_order ?? "");
            setNotice("Tu pago fue confirmado correctamente. Gracias por comprar en RPM.");
        } catch (paymentError) {
            console.error("Error confirmando el pago PayPal:", paymentError);
            setError(
                `${getErrorMessage(paymentError)} No vuelvas a iniciar otro pago hasta comprobar el estado de esta operación. Código de PayPal: ${paypalOrderId}`,
            );
        } finally {
            setPaymentLoading(false);
        }
    }, []);

    useEffect(() => {
        if (paypalReturnProcessed.current) return;

        const params = new URLSearchParams(window.location.search);
        const paypalStatus = params.get("paypal");
        if (!paypalStatus) return;

        paypalReturnProcessed.current = true;

        if (paypalStatus === "cancel") {
            cleanPaypalQuery();
            setNotice("El pago fue cancelado. Tu carrito sigue guardado y no se realizó la compra.");
            return;
        }

        if (paypalStatus === "success") {
            const paypalOrderId = params.get("token");
            cleanPaypalQuery();

            if (!paypalOrderId) {
                setError(
                    "PayPal devolvió a RPM sin un identificador de orden. No inicies otro pago hasta revisar la operación.",
                );
                return;
            }

            void confirmPaypalPayment(paypalOrderId);
        }
    }, [confirmPaypalPayment]);

    const checkout = useCallback(async () => {
        if (!API_URL) {
            setError("Falta configurar NEXT_PUBLIC_BACKEND.");
            return;
        }

        if (cart.length === 0) {
            setError("Tu carrito está vacío.");
            return;
        }

        // Abrir inmediatamente para evitar el bloqueo del navegador.
        const paypalWindow = window.open(
            "about:blank",
            "RPM_PayPal",
            "popup=yes,width=550,height=750,resizable=yes,scrollbars=yes",
        );

        if (!paypalWindow) {
            setError("Tu navegador bloqueó la ventana emergente. Permite los popups para continuar.");
            return;
        }

        setPaymentLoading(true);
        setError("");
        setNotice("");

        try {
            await axios.get(`${API_URL}/users/me`, {
                withCredentials: true,
            });

            const productsResponse = await axios.get<ApiProduct[]>(`${API_URL}/products`, { withCredentials: true });

            if (!Array.isArray(productsResponse.data)) {
                throw new Error("No se pudo validar el catálogo.");
            }

            const productsById = new Map(productsResponse.data.map(product => [product.id_product, product]));

            const validationErrors: string[] = [];

            const refreshedCart = cart.map(item => {
                const product = productsById.get(item.id_product);

                if (!product) {
                    validationErrors.push(`"${item.name}" ya no está disponible.`);
                    return item;
                }

                const price = Number(product.price);
                const stock = Number(product.stock);

                if (!Number.isFinite(price) || !Number.isFinite(stock)) {
                    validationErrors.push(`No se pudo validar "${item.name}".`);
                    return item;
                }

                const updatedItem: CartItem = {
                    ...item,
                    name: product.name ?? item.name,
                    sku: product.sku ?? item.sku,
                    model: product.model ?? item.model,
                    price: Math.max(0, Math.round(price)),
                    stock: Math.max(0, Math.floor(stock)),
                    image: product.photo_path ?? product.image ?? item.image,
                };

                if (updatedItem.stock <= 0) {
                    validationErrors.push(`"${updatedItem.name}" está sin stock.`);
                } else if (updatedItem.quantity > updatedItem.stock) {
                    validationErrors.push(`Solo quedan ${updatedItem.stock} unidades de "${updatedItem.name}".`);
                }

                if (updatedItem.price !== item.price) {
                    validationErrors.push(`El precio de "${updatedItem.name}" cambió. Revisa el nuevo precio.`);
                }

                return updatedItem;
            });

            setCart(refreshedCart);

            if (validationErrors.length > 0) {
                paypalWindow.close();
                setError(validationErrors.join(" "));
                return;
            }

            const response = await axios.post<CreatePaypalOrderResponse>(
                `${API_URL}/payments/paypal/create-order`,
                {
                    products: refreshedCart.map(item => ({
                        id_product: item.id_product,
                        amount: item.quantity,
                    })),
                },
                { withCredentials: true },
            );

            const approvalUrl = response.data?.approvalUrl;

            if (!approvalUrl) {
                throw new Error("El servidor no devolvió el enlace de PayPal.");
            }

            // Validar que el enlace corresponda a PayPal.
            const paypalUrl = new URL(approvalUrl);

            if (
                paypalUrl.protocol !== "https:" ||
                !(
                    paypalUrl.hostname === "paypal.com" ||
                    paypalUrl.hostname.endsWith(".paypal.com") ||
                    paypalUrl.hostname === "paypalobjects.com" ||
                    paypalUrl.hostname.endsWith(".paypalobjects.com")
                )
            ) {
                throw new Error("El enlace de aprobación de PayPal no es válido.");
            }

            paypalWindow.location.replace(approvalUrl);
            paypalWindow.focus();
        } catch (checkoutError) {
            console.error("Error iniciando el pago:", checkoutError);

            if (!paypalWindow.closed) {
                paypalWindow.close();
            }

            setError(getErrorMessage(checkoutError));
        } finally {
            setPaymentLoading(false);
        }
    }, [cart]);

    return (
        <main className="min-h-screen bg-[#080a0f] text-zinc-100">
            <header className="border-b border-white/[0.07] bg-[#0c0f14]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link href="/" className="group flex items-center gap-3" aria-label="Ir al inicio de RPM">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-sm font-black tracking-tight text-white shadow-lg shadow-red-950/30">
                            RPM
                        </span>
                        <span>
                            <span className="block text-sm font-black tracking-[0.18em] text-white">RPM</span>
                            <span className="block text-[10px] tracking-wide text-zinc-500">
                                REPUESTOS AUTOMOTRICES
                            </span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 sm:gap-3">
                        <IconLock size={15} className="text-emerald-400" />
                        <span className="hidden sm:inline">Compra protegida</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-medium text-zinc-300">
                            <span className="text-red-400">{itemCount}</span>{" "}
                            {itemCount === 1 ? "producto" : "productos"}
                        </span>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
                <Link
                    href="/catalog"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
                >
                    <IconArrowLeft size={17} />
                    Seguir comprando
                </Link>

                <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-400">Tu compra</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Carrito de compras
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        Revisa tus repuestos y confirma que las cantidades sean correctas antes de continuar al pago.
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.08] p-4 text-sm text-red-200"
                    >
                        <IconAlertCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
                        <p className="leading-6">{error}</p>
                    </div>
                )}

                {notice && !purchaseConfirmed && (
                    <div
                        role="status"
                        className="mb-6 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 text-sm text-emerald-200"
                    >
                        <IconCheck size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p className="leading-6">{notice}</p>
                    </div>
                )}

                {!cartLoaded ? (
                    <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border border-white/[0.07] bg-[#101319] text-sm text-zinc-400">
                        <IconLoader2 className="animate-spin text-red-400" size={22} />
                        Cargando tu carrito...
                    </div>
                ) : purchaseConfirmed ? (
                    <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-[#10171a] px-6 py-12 text-center sm:px-10">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <IconCheck size={34} />
                        </span>
                        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                            Pago confirmado
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white">¡Gracias por comprar en RPM!</h2>
                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-400">
                            PayPal confirmó tu pago y RPM recibió la confirmación de la orden.
                        </p>
                        {confirmedOrderId && (
                            <p className="mt-5 rounded-lg border border-white/[0.07] bg-black/20 px-4 py-3 text-sm text-zinc-300">
                                Número de orden: <span className="font-semibold text-white">{confirmedOrderId}</span>
                            </p>
                        )}
                        <Link
                            href="/catalog"
                            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500"
                        >
                            Volver al catálogo <IconChevronRight size={17} />
                        </Link>
                    </section>
                ) : cart.length === 0 ? (
                    <section className="rounded-2xl border border-white/[0.07] bg-[#101319] px-6 py-16 text-center">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                            <IconShoppingCart size={31} />
                        </span>
                        <h2 className="mt-5 text-xl font-bold text-white">Tu carrito está vacío</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                            Todavía no agregas repuestos. Explora el catálogo y encuentra lo que necesita tu vehículo.
                        </p>
                        <Link
                            href="/catalog"
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500"
                        >
                            Explorar catálogo <IconChevronRight size={17} />
                        </Link>
                    </section>
                ) : (
                    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101319]">
                            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                                <div>
                                    <h2 className="font-bold text-white">Productos seleccionados</h2>
                                    <p className="mt-1 text-xs text-zinc-500">{itemCount} unidades en tu carrito</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCart([]);
                                        setError("");
                                        setNotice("Se vació el carrito.");
                                    }}
                                    className="text-xs font-medium text-zinc-500 transition hover:text-red-400"
                                >
                                    Vaciar carrito
                                </button>
                            </div>

                            <div className="divide-y divide-white/[0.06]">
                                {cart.map(item => {
                                    const imageUrl = resolveImageUrl(item.image);
                                    const lineTotal = item.price * item.quantity;
                                    const stockInvalid = item.stock <= 0 || item.quantity > item.stock;

                                    return (
                                        <article
                                            key={item.id_product}
                                            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6"
                                        >
                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-[#090c11]">
                                                {imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain p-2"
                                                        onError={event => {
                                                            event.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <IconPackage size={30} className="text-zinc-600" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold leading-5 text-white">
                                                            {item.name}
                                                        </h3>
                                                        {item.model && (
                                                            <p className="mt-1 text-xs text-zinc-400">
                                                                Modelo: {item.model}
                                                            </p>
                                                        )}
                                                        {item.sku && (
                                                            <p className="mt-1 text-[11px] tracking-wide text-zinc-600">
                                                                SKU: {item.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="shrink-0 font-bold tabular-nums text-white">
                                                        {formatCLP(lineTotal)}
                                                    </p>
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs text-zinc-500">
                                                            {formatCLP(item.price)}{" "}
                                                            <span className="text-zinc-600">/ unidad</span>
                                                        </p>
                                                        {stockInvalid ? (
                                                            <p className="mt-1 text-xs font-medium text-amber-400">
                                                                {item.stock <= 0
                                                                    ? "Sin stock"
                                                                    : `Stock disponible: ${item.stock}`}
                                                            </p>
                                                        ) : (
                                                            <p className="mt-1 text-xs text-emerald-500">
                                                                Stock disponible: {item.stock}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center rounded-lg border border-white/10 bg-[#090c11]">
                                                            <button
                                                                type="button"
                                                                onClick={() => changeQuantity(item.id_product, -1)}
                                                                disabled={item.quantity <= 1}
                                                                aria-label={`Disminuir cantidad de ${item.name}`}
                                                                className="flex h-9 w-9 items-center justify-center text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                            >
                                                                <IconMinus size={15} />
                                                            </button>
                                                            <span className="w-9 text-center text-sm font-semibold tabular-nums text-white">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => changeQuantity(item.id_product, 1)}
                                                                disabled={
                                                                    item.stock <= 0 || item.quantity >= item.stock
                                                                }
                                                                aria-label={`Aumentar cantidad de ${item.name}`}
                                                                className="flex h-9 w-9 items-center justify-center text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                                            >
                                                                <IconPlus size={15} />
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.id_product)}
                                                            aria-label={`Eliminar ${item.name} del carrito`}
                                                            title="Eliminar producto"
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/15 text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                                        >
                                                            <IconTrash size={17} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="space-y-4 lg:sticky lg:top-6">
                            <section className="rounded-2xl border border-white/[0.07] bg-[#101319] p-5 sm:p-6">
                                <h2 className="text-lg font-bold text-white">Resumen de compra</h2>

                                <div className="mt-6 space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span>Productos ({itemCount})</span>
                                        <span className="tabular-nums text-zinc-200">{formatCLP(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span>Despacho</span>
                                        <span className="text-xs text-zinc-500">Por calcular</span>
                                    </div>
                                    <div className="border-t border-white/[0.07] pt-4">
                                        <div className="flex items-end justify-between gap-3">
                                            <span className="font-semibold text-zinc-300">Total productos</span>
                                            <span className="text-2xl font-black tabular-nums text-white">
                                                {formatCLP(subtotal)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                                            El total mostrado corresponde a los productos. El despacho, si corresponde,
                                            se informará por separado.
                                        </p>
                                    </div>
                                </div>

                                {hasStockIssues && (
                                    <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-3 text-xs leading-5 text-amber-200">
                                        Hay datos de stock que requieren revisión. Al continuar, RPM volverá a consultar
                                        el catálogo y validará las cantidades antes de crear el pago.
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => void checkout()}
                                    disabled={paymentLoading || cart.length === 0}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {paymentLoading ? (
                                        <>
                                            <IconLoader2 size={18} className="animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <IconCreditCard size={18} />
                                            Continuar con PayPal
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                                    <IconLock size={14} className="text-emerald-500" />
                                    Conexión protegida mediante HTTPS
                                </div>
                            </section>

                            <section className="rounded-2xl border border-white/[0.07] bg-[#101319] p-5">
                                <div className="flex gap-3">
                                    <IconShieldCheck size={20} className="shrink-0 text-emerald-400" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Pago protegido</h3>
                                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                                            Serás redirigido a PayPal para aprobar el pago. RPM no recibe ni almacena
                                            los datos de tu tarjeta.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-3 border-t border-white/[0.07] pt-4">
                                    <IconTruck size={20} className="shrink-0 text-zinc-400" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Despacho</h3>
                                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                                            Las condiciones y el costo de entrega se deben confirmar según la cobertura
                                            disponible.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <p className="px-2 text-center text-[10px] leading-5 text-zinc-600">
                                Entorno de pruebas: PayPal Sandbox. No se realizará un cobro real.
                            </p>
                        </aside>
                    </div>
                )}
            </div>

            <footer className="border-t border-white/[0.07]">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
