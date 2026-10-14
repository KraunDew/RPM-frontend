

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProductoCarrito = {
    id: number;
    name: string;
    category?: string;
    brand?: string;
    price: number;
    image?: string;
    quantity: number;
};

const STORAGE_KEY = "rpm-carrito";

const formatoPrecio = (precio: number) =>
    precio.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    });

export default function CarritoPage() {
    const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
    const [cargado, setCargado] = useState(false);

    // Recuperar los productos guardados
    useEffect(() => {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);

            if (guardado) {
                const datos = JSON.parse(guardado);

                if (Array.isArray(datos)) {
                    setCarrito(datos);
                }
            }
        } catch (error) {
            console.error("Error al cargar el carrito:", error);
        } finally {
            setCargado(true);
        }
    }, []);

    // Guardar los cambios automáticamente
    useEffect(() => {
        if (cargado) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        }
    }, [carrito, cargado]);

    function cambiarCantidad(id: number, cambio: number) {
        setCarrito((actual) =>
            actual
                .map((producto) =>
                    producto.id === id
                        ? {
                              ...producto,
                              quantity: Math.max(
                                  1,
                                  producto.quantity + cambio
                              ),
                          }
                        : producto
                )
        );
    }

    function eliminarProducto(id: number) {
        setCarrito((actual) =>
            actual.filter((producto) => producto.id !== id)
        );
    }

    function vaciarCarrito() {
        setCarrito([]);
    }

    const totalUnidades = carrito.reduce(
        (total, producto) => total + producto.quantity,
        0
    );

    const totalPrecio = carrito.reduce(
        (total, producto) => total + producto.price * producto.quantity,
        0
    );

    if (!cargado) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#090b0e] text-white">
                Cargando carrito...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#090b0e] px-4 py-10 text-white sm:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Encabezado */}
                <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <Link
                            href="/"
                            className="text-sm text-gray-400 transition hover:text-red-500"
                        >
                            ← Volver al inicio
                        </Link>

                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                            Mi <span className="text-red-600">carrito</span>
                        </h1>

                        <p className="mt-2 text-gray-400">
                            Revisa tus repuestos antes de continuar.
                        </p>
                    </div>

                    <Link
                        href="/catalogo"
                        className="rounded-lg border border-red-600 px-5 py-3 font-semibold transition hover:bg-red-600"
                    >
                        + Seguir comprando
                    </Link>
                </header>

                {carrito.length === 0 ? (
                    /* Carrito vacío */
                    <section className="rounded-2xl border border-white/10 bg-[#111419] px-6 py-16 text-center">
                        <div className="mb-5 text-6xl">🛒</div>

                        <h2 className="text-2xl font-bold">
                            Tu carrito está vacío
                        </h2>

                        <p className="mx-auto mt-3 max-w-md text-gray-400">
                            Todavía no has agregado productos. Explora el
                            catálogo y encuentra los repuestos que necesitas.
                        </p>

                        <Link
                            href="/catalogo"
                            className="mt-7 inline-flex rounded-lg bg-red-700 px-7 py-3 font-bold transition hover:bg-red-600"
                        >
                            Explorar catálogo
                        </Link>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_340px]">
                        {/* Lista de productos */}
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-xl font-bold">
                                    Productos ({totalUnidades})
                                </h2>

                                <button
                                    onClick={vaciarCarrito}
                                    className="text-sm text-red-400 transition hover:text-red-300"
                                >
                                    Vaciar carrito
                                </button>
                            </div>

                            {carrito.map((producto) => (
                                <article
                                    key={producto.id}
                                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#111419] p-4 sm:flex-row sm:items-center"
                                >
                                    {/* Imagen */}
                                    <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1b2027] sm:w-36">
                                        {producto.image ? (
                                            <img
                                                src={producto.image}
                                                alt={producto.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl">🔧</span>
                                        )}
                                    </div>

                                    {/* Información */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                                            {producto.category || "Repuesto"}
                                        </p>

                                        <h3 className="mt-1 text-lg font-bold">
                                            {producto.name}
                                        </h3>

                                        {producto.brand && (
                                            <p className="mt-1 text-sm text-gray-400">
                                                Marca: {producto.brand}
                                            </p>
                                        )}

                                        <p className="mt-2 font-semibold text-white">
                                            {formatoPrecio(producto.price)}
                                        </p>
                                    </div>

                                    {/* Cantidad y eliminar */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end">
                                        <div className="flex items-center overflow-hidden rounded-lg border border-white/15">
                                            <button
                                                onClick={() =>
                                                    cambiarCantidad(
                                                        producto.id,
                                                        -1
                                                    )
                                                }
                                                aria-label="Disminuir cantidad"
                                                className="px-3 py-2 transition hover:bg-white/10"
                                            >
                                                −
                                            </button>

                                            <span className="min-w-10 text-center">
                                                {producto.quantity}
                                            </span>

                                            <button
                                                onClick={() =>
                                                    cambiarCantidad(
                                                        producto.id,
                                                        1
                                                    )
                                                }
                                                aria-label="Aumentar cantidad"
                                                className="px-3 py-2 transition hover:bg-white/10"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-bold text-red-400">
                                            {formatoPrecio(
                                                producto.price *
                                                    producto.quantity
                                            )}
                                        </p>

                                        <button
                                            onClick={() =>
                                                eliminarProducto(producto.id)
                                            }
                                            className="text-sm text-gray-400 transition hover:text-red-400"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>

                        {/* Resumen de compra */}
                        <aside className="rounded-xl border border-white/10 bg-[#111419] p-6 lg:sticky lg:top-6">
                            <h2 className="text-xl font-bold">
                                Resumen de compra
                            </h2>

                            <div className="mt-6 space-y-4 text-sm">
                                <div className="flex justify-between gap-4 text-gray-400">
                                    <span>Productos</span>
                                    <span>{totalUnidades} unidad(es)</span>
                                </div>

                                <div className="flex justify-between gap-4 text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatoPrecio(totalPrecio)}</span>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="font-semibold">
                                            Total
                                        </span>
                                        <span className="text-xl font-black text-red-500">
                                            {formatoPrecio(totalPrecio)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    alert(
                                        "¡Tu carrito está listo! La compra todavía no está conectada a un sistema de pagos."
                                    )
                                }
                                className="mt-7 w-full rounded-lg bg-red-700 px-5 py-3 font-bold transition hover:bg-red-600"
                            >
                                Continuar compra
                            </button>

                            <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                                El botón de compra es demostrativo. Todavía no
                                se procesa ningún pago.
                            </p>

                            <Link
                                href="/catalogo"
                                className="mt-5 block text-center text-sm text-gray-300 transition hover:text-red-400"
                            >
                                Seguir buscando repuestos
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
