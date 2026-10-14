
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Producto = {
    id: number;
    nombre: string;
    categoria: string;
    marca: string;
    precio: number;
    imagen: string;
};

type ProductoCarrito = {
    id: number;
    name: string;
    category: string;
    brand: string;
    price: number;
    image: string;
    quantity: number;
};

const STORAGE_KEY = "rpm-carrito";

const productos: Producto[] = [
    {
        id: 1,
        nombre: "Discos de freno deportivos",
        categoria: "Frenos",
        marca: "Bosch",
        precio: 89990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
    {
        id: 2,
        nombre: "Filtro de aire para motor",
        categoria: "Filtros",
        marca: "Bosch",
        precio: 12990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
    {
        id: 3,
        nombre: "Bujías de encendido",
        categoria: "Motor",
        marca: "NGK",
        precio: 24990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
    {
        id: 4,
        nombre: "Amortiguadores delanteros",
        categoria: "Suspensión",
        marca: "Monroe",
        precio: 74990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
    {
        id: 5,
        nombre: "Batería 12V",
        categoria: "Electricidad",
        marca: "Bosch",
        precio: 79990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
    {
        id: 6,
        nombre: "Filtro de aceite",
        categoria: "Filtros",
        marca: "Mann",
        precio: 8990,
        imagen:
            "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    },
];

const categorias = [
    "Todas",
    "Frenos",
    "Filtros",
    "Motor",
    "Suspensión",
    "Electricidad",
];

const marcas = ["Todas", "Bosch", "NGK", "Monroe", "Mann"];

const formatoPrecio = (precio: number) =>
    precio.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    });

export default function CatalogoPage() {
    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("Todas");
    const [marca, setMarca] = useState("Todas");
    const [orden, setOrden] = useState("relevancia");

    const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
    const [carritoCargado, setCarritoCargado] = useState(false);
    const [mensaje, setMensaje] = useState("");

    // Recuperar el carrito guardado en el navegador
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
            console.error("Error al recuperar el carrito:", error);
        } finally {
            setCarritoCargado(true);
        }
    }, []);

    // Guardar automáticamente los cambios del carrito
    useEffect(() => {
        if (carritoCargado) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        }
    }, [carrito, carritoCargado]);

    // Filtrar y ordenar los productos
    const resultados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        const lista = productos.filter((producto) => {
            const coincideBusqueda =
                producto.nombre.toLowerCase().includes(texto) ||
                producto.categoria.toLowerCase().includes(texto) ||
                producto.marca.toLowerCase().includes(texto);

            const coincideCategoria =
                categoria === "Todas" ||
                producto.categoria === categoria;

            const coincideMarca =
                marca === "Todas" || producto.marca === marca;

            return (
                coincideBusqueda &&
                coincideCategoria &&
                coincideMarca
            );
        });

        if (orden === "menor") {
            lista.sort((a, b) => a.precio - b.precio);
        } else if (orden === "mayor") {
            lista.sort((a, b) => b.precio - a.precio);
        } else if (orden === "nombre") {
            lista.sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es")
            );
        }

        return lista;
    }, [busqueda, categoria, marca, orden]);

    // Agregar productos al carrito
    function agregarAlCarrito(id: number) {
        const producto = productos.find((item) => item.id === id);

        if (!producto) return;

        setCarrito((actual) => {
            const existente = actual.find((item) => item.id === id);

            if (existente) {
                return actual.map((item) =>
                    item.id === id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...actual,
                {
                    id: producto.id,
                    name: producto.nombre,
                    category: producto.categoria,
                    brand: producto.marca,
                    price: producto.precio,
                    image: producto.imagen,
                    quantity: 1,
                },
            ];
        });

        setMensaje(`${producto.nombre} agregado al carrito`);

        window.setTimeout(() => {
            setMensaje("");
        }, 2500);
    }

    function limpiarFiltros() {
        setBusqueda("");
        setCategoria("Todas");
        setMarca("Todas");
        setOrden("relevancia");
    }

    const totalUnidades = carrito.reduce(
        (total, producto) => total + producto.quantity,
        0
    );

    return (
        <main className="min-h-screen bg-[#090b0e] text-white">
            {/* Encabezado del catálogo */}
            <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#171b22] via-[#0d1015] to-[#090b0e] px-5 py-16 sm:px-10 sm:py-20">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-700/10 blur-3xl" />

                <div className="relative mx-auto max-w-7xl">
                    <Link
                        href="/"
                        className="inline-block text-sm text-gray-400 transition hover:text-red-500"
                    >
                        ← Volver al inicio
                    </Link>

                    <div className="mt-8 max-w-3xl">
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">
                            RPM · Repuestos y accesorios
                        </p>

                        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
                            Nuestro{" "}
                            <span className="text-red-600">catálogo</span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
                            Encuentra los repuestos que tu vehículo necesita.
                            Busca, filtra y compara productos desde un solo lugar.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/"
                                className="rounded-lg border border-white/15 px-5 py-3 font-semibold transition hover:border-red-500 hover:bg-white/5"
                            >
                                Volver al inicio
                            </Link>

                            <Link
                                href="/carrito"
                                className="inline-flex items-center gap-3 rounded-lg bg-red-700 px-5 py-3 font-bold transition hover:bg-red-600"
                            >
                                <span>🛒 Ver carrito</span>

                                <span className="rounded-full bg-black/30 px-2.5 py-1 text-sm">
                                    {carritoCargado ? totalUnidades : 0}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contenido del catálogo */}
            <section className="mx-auto max-w-7xl px-5 py-10 sm:px-10">
                {/* Buscador */}
                <div className="rounded-2xl border border-white/10 bg-[#111419] p-5 sm:p-7">
                    <label
                        htmlFor="busqueda-productos"
                        className="mb-3 block text-lg font-bold"
                    >
                        Buscar repuestos
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            id="busqueda-productos"
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Ej.: filtros, Bosch, frenos..."
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090b0e] px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-red-600"
                        />

                        <button
                            onClick={() => setBusqueda(busqueda.trim())}
                            className="rounded-lg bg-red-700 px-7 py-3 font-bold transition hover:bg-red-600"
                        >
                            Buscar
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label
                                htmlFor="filtro-categoria"
                                className="mb-2 block text-sm text-gray-400"
                            >
                                Categoría
                            </label>

                            <select
                                id="filtro-categoria"
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[#090b0e] px-4 py-3 text-white outline-none focus:border-red-600"
                            >
                                {categorias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="filtro-marca"
                                className="mb-2 block text-sm text-gray-400"
                            >
                                Marca
                            </label>

                            <select
                                id="filtro-marca"
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[#090b0e] px-4 py-3 text-white outline-none focus:border-red-600"
                            >
                                {marcas.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="orden-precio"
                                className="mb-2 block text-sm text-gray-400"
                            >
                                Ordenar por
                            </label>

                            <select
                                id="orden-precio"
                                value={orden}
                                onChange={(e) => setOrden(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[#090b0e] px-4 py-3 text-white outline-none focus:border-red-600"
                            >
                                <option value="relevancia">Relevancia</option>
                                <option value="menor">Precio: menor a mayor</option>
                                <option value="mayor">Precio: mayor a menor</option>
                                <option value="nombre">Nombre: A-Z</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={limpiarFiltros}
                        className="mt-5 text-sm font-semibold text-red-400 transition hover:text-red-300"
                    >
                        Limpiar búsqueda y filtros
                    </button>
                </div>

                {/* Resultados */}
                <div className="mb-6 mt-10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Repuestos disponibles
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            {resultados.length} producto(s) encontrado(s)
                        </p>
                    </div>

                    <Link
                        href="/carrito"
                        className="text-sm font-semibold text-red-400 transition hover:text-red-300"
                    >
                        Ir al carrito ({carritoCargado ? totalUnidades : 0}) →
                    </Link>
                </div>

                {/* Mensaje al agregar un producto */}
                {mensaje && (
                    <div
                        role="status"
                        className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                    >
                        ✓ {mensaje}
                    </div>
                )}

                {/* Tarjetas */}
                {resultados.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {resultados.map((producto) => {
                            const cantidadEnCarrito =
                                carrito.find(
                                    (item) => item.id === producto.id
                                )?.quantity ?? 0;

                            return (
                                <article
                                    key={producto.id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111419] transition duration-300 hover:-translate-y-1 hover:border-red-600/60"
                                >
                                    <div className="relative h-48 overflow-hidden bg-[#1a1f26]">
                                        <img
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />

                                        <span className="absolute left-3 top-3 rounded-md bg-black/75 px-3 py-1 text-xs font-semibold text-red-400">
                                            {producto.categoria}
                                        </span>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                            {producto.marca}
                                        </p>

                                        <h3 className="mt-2 min-h-14 text-lg font-bold leading-6">
                                            {producto.nombre}
                                        </h3>

                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <p className="text-xs text-gray-500">
                                                Precio
                                            </p>

                                            <p className="mt-1 text-2xl font-black text-white">
                                                {formatoPrecio(producto.precio)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                agregarAlCarrito(producto.id)
                                            }
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 font-bold transition hover:bg-red-600 active:scale-[0.98]"
                                        >
                                            <span>🛒</span>
                                            Agregar al carrito
                                        </button>

                                        {cantidadEnCarrito > 0 && (
                                            <p className="mt-3 text-center text-xs text-green-400">
                                                {cantidadEnCarrito} unidad(es) en
                                                tu carrito
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#111419] px-5 py-16 text-center">
                        <p className="text-4xl">🔎</p>

                        <h3 className="mt-4 text-xl font-bold">
                            No encontramos productos
                        </h3>

                        <p className="mt-2 text-gray-400">
                            Prueba con otra búsqueda o cambia los filtros.
                        </p>

                        <button
                            onClick={limpiarFiltros}
                            className="mt-6 rounded-lg bg-red-700 px-6 py-3 font-bold transition hover:bg-red-600"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {/* Pie */}
                <div className="mt-14 rounded-xl border border-white/10 bg-[#111419] p-6 text-center">
                    <p className="font-semibold">
                        ¿No encuentras el repuesto que buscas?
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                        Explora nuestros talleres aliados o vuelve al inicio.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/workshops"
                            className="rounded-lg border border-white/15 px-5 py-3 font-semibold transition hover:border-red-500"
                        >
                            Talleres aliados
                        </Link>

                        <Link
                            href="/"
                            className="rounded-lg border border-white/15 px-5 py-3 font-semibold transition hover:border-red-500"
                        >
                            Inicio
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
