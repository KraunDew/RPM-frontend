"use client";

import {
    IconAlertTriangle,
    IconArrowUpRight,
    IconCurrencyDollar,
    IconPackage,
    IconShoppingBag,
    IconUsers,
} from "@tabler/icons-react";

const metrics = [
    {
        title: "Productos registrados",
        value: "—",
        detail: "Inventario pendiente de conexión",
        icon: IconPackage,
        accent: "red",
    },
    {
        title: "Pedidos recibidos",
        value: "—",
        detail: "Pedidos pendientes de conexión",
        icon: IconShoppingBag,
        accent: "blue",
    },
    {
        title: "Usuarios registrados",
        value: "—",
        detail: "Usuarios pendientes de conexión",
        icon: IconUsers,
        accent: "violet",
    },
    {
        title: "Ingresos registrados",
        value: "—",
        detail: "Ventas pendientes de conexión",
        icon: IconCurrencyDollar,
        accent: "emerald",
    },
];

const accentStyles = {
    red: {
        icon: "border-red-500/20 bg-red-500/10 text-red-400",
        glow: "group-hover:border-red-500/30",
        dot: "bg-red-400",
    },
    blue: {
        icon: "border-blue-500/20 bg-blue-500/10 text-blue-400",
        glow: "group-hover:border-blue-500/30",
        dot: "bg-blue-400",
    },
    violet: {
        icon: "border-violet-500/20 bg-violet-500/10 text-violet-400",
        glow: "group-hover:border-violet-500/30",
        dot: "bg-violet-400",
    },
    emerald: {
        icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        glow: "group-hover:border-emerald-500/30",
        dot: "bg-emerald-400",
    },
};

export default function AdminDashboard() {
    return (
        <main className="min-h-full space-y-7 text-zinc-100 sm:space-y-9">
            {/* Encabezado */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216] p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-red-600/[0.09] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-40 w-40 rounded-full bg-red-500/[0.05] blur-3xl" />

                <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-40" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                            </span>

                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">
                                Centro de operaciones
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Dashboard<span className="text-red-500">.</span>
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                            Supervisa el estado de RPM, administra el inventario y mantén las operaciones de la tienda
                            bajo control desde un solo lugar.
                        </p>
                    </div>

                    <div className="flex w-fit shrink-0 items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                            <IconAlertTriangle size={19} stroke={1.8} />
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-amber-300">Configuración pendiente</p>
                            <p className="mt-1 text-[11px] text-zinc-500">Métricas sin conectar</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Métricas */}
            <section>
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-base font-semibold text-white">Resumen general</h2>
                        <p className="mt-1 text-xs text-zinc-500">Indicadores principales de tu tienda</p>
                    </div>

                    <span className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Esperando datos del servidor
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map(metric => {
                        const Icon = metric.icon;
                        const styles = accentStyles[metric.accent as keyof typeof accentStyles];

                        return (
                            <article
                                key={metric.title}
                                className={`group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#101216] p-5 transition duration-200 hover:-translate-y-0.5 ${styles.glow}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl border ${styles.icon}`}
                                    >
                                        <Icon size={22} stroke={1.7} />
                                    </div>

                                    <IconArrowUpRight
                                        size={18}
                                        className="text-zinc-700 transition-colors group-hover:text-zinc-400"
                                    />
                                </div>

                                <p className="mt-6 text-sm font-medium text-zinc-400">{metric.title}</p>

                                <p className="mt-2 text-3xl font-bold tracking-tight text-white">{metric.value}</p>

                                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                                    <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                                    <p className="text-[11px] leading-5 text-zinc-500">{metric.detail}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Actividad e inventario */}
            <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101216]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Actividad de la tienda</h2>
                            <p className="mt-1.5 text-xs text-zinc-500">Movimientos y operaciones recientes</p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-zinc-400">
                            <IconShoppingBag size={20} stroke={1.7} />
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.09] px-6 py-10 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-zinc-500">
                                <IconPackage size={27} stroke={1.5} />
                            </div>

                            <h3 className="mt-5 text-sm font-semibold text-zinc-200">
                                Todavía no hay actividad disponible
                            </h3>

                            <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-500">
                                Cuando conectemos los endpoints de productos y pedidos, aquí podrás consultar la
                                actividad reciente de RPM.
                            </p>

                            <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                <span className="text-[11px] text-zinc-400">Datos aún no disponibles</span>
                            </div>
                        </div>
                    </div>
                </article>

                <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101216]">
                    <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.08] text-amber-400">
                            <IconAlertTriangle size={20} stroke={1.7} />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-white">Atención requerida</h2>
                            <p className="mt-1.5 text-xs text-zinc-500">Estado del inventario</p>
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/[0.08] text-amber-400">
                                    <IconPackage size={19} stroke={1.7} />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-zinc-200">Productos con stock bajo</p>
                                    <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                                        Se mostrarán los productos que necesiten reposición cuando el inventario esté
                                        conectado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/[0.08] text-red-400">
                                    <IconShoppingBag size={19} stroke={1.7} />
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-zinc-200">Pedidos pendientes</p>
                                    <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                                        El panel podrá identificar pedidos que necesiten revisión una vez conectada la
                                        información.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.045] p-3.5">
                            <IconAlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-400" />
                            <p className="text-[11px] leading-5 text-zinc-400">
                                Las alertas no están activas todavía. No se han consultado cantidades ni pedidos reales
                                en la base de datos.
                            </p>
                        </div>
                    </div>
                </article>
            </section>

            {/* Estado de conexión */}
            <section className="rounded-xl border border-white/[0.08] bg-[#101216] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.08] text-red-400">
                            <IconCurrencyDollar size={22} stroke={1.7} />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-white">Próximo paso: conectar las métricas</h2>
                            <p className="mt-1.5 max-w-xl text-xs leading-6 text-zinc-500">
                                El dashboard necesita endpoints para consultar productos, pedidos, usuarios, ventas y
                                niveles de inventario. Los valores se actualizarán cuando se integre esa información.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2 text-xs font-medium text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Integración pendiente
                    </span>
                </div>
            </section>

            <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-xs text-zinc-600 sm:flex-row sm:items-center">
                <p className="font-medium tracking-wide">
                    RPM <span className="text-red-500">·</span> Revoluciones por Minuto
                </p>
                <p>Panel administrativo</p>
            </footer>
        </main>
    );
}
