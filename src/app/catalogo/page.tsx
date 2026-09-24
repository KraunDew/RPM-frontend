
"use client";

import { useMemo, useState } from "react";

const productos = [
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
  const [carrito, setCarrito] = useState<number[]>([]);

  const resultados = useMemo(() => {
    const lista = productos.filter((producto) => {
      const coincideTexto = producto.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideCategoria =
        categoria === "Todas" ||
        producto.categoria === categoria;

      const coincideMarca =
        marca === "Todas" || producto.marca === marca;

      return coincideTexto && coincideCategoria && coincideMarca;
    });

    if (orden === "menor") {
      lista.sort((a, b) => a.precio - b.precio);
    }

    if (orden === "mayor") {
      lista.sort((a, b) => b.precio - a.precio);
    }

    return lista;
  }, [busqueda, categoria, marca, orden]);

  function agregarAlCarrito(id: number) {
    setCarrito((actual) => [...actual, id]);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoria("Todas");
    setMarca("Todas");
    setOrden("relevancia");
  }

  return (
    <main className="min-h-screen bg-[#090b0e] text-white">
      {/* Encabezado del catálogo */}
      <section className="border-b border-white/10 bg-gradient-to-r from-[#190909] to-[#101318] px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm text-gray-400">
            Inicio / <span className="text-red-500">Catálogo</span>
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Nuestro <span className="text-red-600">catálogo</span>
          </h1>

          <p className="mt-4 max-w-xl text-gray-300">
            Encuentra repuestos y accesorios para mantener
            tu vehículo en las mejores condiciones.
          </p>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:px-12 lg:grid-cols-[250px_1fr]">
        {/* Filtros */}
        <aside className="h-fit rounded-xl border border-white/10 bg-[#111419] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Filtros</h2>
            <button
              onClick={limpiarFiltros}
              className="text-sm text-red-500 hover:text-red-400"
            >
              Limpiar
            </button>
          </div>

          <label className="mb-2 block text-sm font-semibold">
            Categoría
          </label>

          <div className="mb-6 flex flex-col gap-3">
            {categorias.map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-2 text-sm text-gray-300"
              >
                <input
                  type="radio"
                  name="categoria"
                  checked={categoria === item}
                  onChange={() => setCategoria(item)}
                  className="accent-red-600"
                />
                {item}
              </label>
            ))}
          </div>

          <label
            htmlFor="marca"
            className="mb-2 block text-sm font-semibold"
          >
            Marca
          </label>

          <select
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="mb-6 w-full rounded-lg border border-white/15 bg-[#090b0e] p-3 text-sm outline-none focus:border-red-600"
          >
            <option value="Todas">Todas las marcas</option>
            <option value="Bosch">Bosch</option>
            <option value="NGK">NGK</option>
            <option value="Monroe">Monroe</option>
            <option value="Mann">Mann</option>
          </select>

          <p className="mb-2 text-sm font-semibold">
            Carrito
          </p>
          <p className="text-sm text-gray-400">
            Productos agregados: {carrito.length}
          </p>
        </aside>

        {/* Productos */}
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar repuestos..."
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#111419] px-4 py-3 outline-none placeholder:text-gray-500 focus:border-red-600"
            />

            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#111419] px-4 py-3 outline-none focus:border-red-600"
              aria-label="Ordenar productos"
            >
              <option value="relevancia">Más relevantes</option>
              <option value="menor">Menor precio</option>
              <option value="mayor">Mayor precio</option>
            </select>
          </div>

          <p className="mb-5 text-sm text-gray-400">
            Mostrando {resultados.length} productos
          </p>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {resultados.map((producto) => (
              <article
                key={producto.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#111419] transition duration-300 hover:-translate-y-1 hover:border-red-600/60"
              >
                <div className="flex h-48 items-center justify-center bg-[#191d22] p-4">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </div>

                <div className="p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-500">
                    {producto.categoria}
                  </p>

                  <h3 className="min-h-12 font-bold">
                    {producto.nombre}
                  </h3>

                  <p className="mt-2 text-sm text-gray-400">
                    Marca: {producto.marca}
                  </p>

                  <p className="mt-4 text-2xl font-black">
                    {formatoPrecio(producto.precio)}
                  </p>

                  <button
                    onClick={() => agregarAlCarrito(producto.id)}
                    className="mt-5 w-full rounded-lg bg-red-700 px-4 py-3 font-bold transition hover:bg-red-600"
                  >
                    + Agregar al carrito
                  </button>
                </div>
              </article>
            ))}
          </div>

          {resultados.length === 0 && (
            <div className="rounded-xl border border-white/10 py-16 text-center">
              <h3 className="text-xl font-bold">
                No encontramos productos
              </h3>
              <p className="mt-2 text-gray-400">
                Prueba con otro nombre o cambia los filtros.
              </p>
              <button
                onClick={limpiarFiltros}
                className="mt-5 rounded-lg bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
