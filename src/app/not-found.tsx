import { IconArrowLeft, IconArrowUpRight, IconCarCrash, IconGauge, IconRoute, IconTool } from "@tabler/icons-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090b0e] px-5 py-16 text-white selection:bg-red-500/30">
            {/* Fondo decorativo */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(220,38,38,0.12),transparent_45%)]" />

                <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />

                <div className="absolute -right-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full border border-white/[0.06]" />
                <div className="absolute -right-16 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full border border-red-500/10" />

                <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-6xl">
                {/* Cabecera */}
                <header className="mb-16 flex items-center justify-between border-b border-white/[0.08] pb-5">
                    <Link href="/" className="group flex items-center gap-3" aria-label="RPM, volver al inicio">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-sm font-black tracking-tighter text-white shadow-lg shadow-red-950/40 transition-transform group-hover:scale-105">
                            RPM
                        </span>

                        <span className="flex flex-col">
                            <span className="text-sm font-bold tracking-[0.2em]">RPM</span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                                Repuestos automotrices
                            </span>
                        </span>
                    </Link>

                    <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
                        <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
                        SISTEMA DE NAVEGACIÓN
                    </div>
                </header>

                {/* Contenido principal */}
                <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                    <div>
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
                            <IconRoute size={16} stroke={1.8} />
                            Error de navegación
                        </div>

                        <div className="relative mb-5">
                            <h1 className="select-none text-[clamp(7rem,19vw,13rem)] font-black leading-[0.78] tracking-[-0.09em] text-white">
                                404<span className="text-red-500">.</span>
                            </h1>

                            <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-600">
                                DESTINO NO ENCONTRADO
                            </span>
                        </div>

                        <h2 className="mt-9 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                            Parece que tomaste <span className="text-red-500">un desvío.</span>
                        </h2>

                        <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
                            La página que buscas no está en esta ruta. Puede que la dirección esté mal escrita o que el
                            contenido haya cambiado de ubicación.
                        </p>

                        {/* Acciones */}
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/"
                                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-all hover:bg-red-500 hover:shadow-red-900/30 active:scale-[0.98]"
                            >
                                <IconArrowLeft size={19} className="transition-transform group-hover:-translate-x-1" />
                                VOLVER AL INICIO
                            </Link>

                            <Link
                                href="/catalogo"
                                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.07]"
                            >
                                EXPLORAR CATÁLOGO
                                <IconArrowUpRight size={18} />
                            </Link>
                        </div>

                        <p className="mt-7 flex items-center gap-2 text-xs text-zinc-600">
                            <IconTool size={15} />
                            No te preocupes, no necesitas herramientas para volver.
                        </p>
                    </div>

                    {/* Panel visual */}
                    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                        <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#101317] p-6 shadow-2xl shadow-black/40 sm:p-8">
                            {/* Brillo superior */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                                        Diagnóstico de ruta
                                    </p>
                                    <p className="mt-2 text-lg font-bold text-white">Destino desconocido</p>
                                </div>

                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.08] text-red-400">
                                    <IconCarCrash size={25} stroke={1.5} />
                                </div>
                            </div>

                            {/* Ilustración técnica */}
                            <div className="relative my-8 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0d10]">
                                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,transparent_49.5%,rgba(255,255,255,0.09)_50%,transparent_50.5%)] [background-size:24px_24px]" />

                                <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.06]" />
                                <div className="absolute left-1/2 top-0 h-full w-px bg-white/[0.06]" />

                                <div className="relative flex flex-col items-center">
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/[0.08] text-red-400 shadow-[0_0_55px_rgba(220,38,38,0.12)]">
                                        <IconRoute size={38} stroke={1.3} />

                                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-4 border-[#0b0d10] bg-red-500" />
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                                            Ruta interrumpida
                                        </span>
                                    </div>
                                </div>

                                <span className="absolute left-4 top-4 font-mono text-[9px] text-zinc-600">
                                    LAT --.----
                                </span>
                                <span className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-600">
                                    DEST: NULL
                                </span>
                            </div>

                            {/* Información */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                                    <div className="flex items-center gap-3">
                                        <IconGauge size={20} className="text-zinc-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-200">Estado de navegación</p>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                No se encontró la página solicitada
                                            </p>
                                        </div>
                                    </div>

                                    <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400">
                                        404
                                    </span>
                                </div>

                                <div className="flex items-center justify-between px-1 pt-1 text-xs">
                                    <span className="text-zinc-500">Código de respuesta</span>
                                    <span className="font-mono font-semibold text-zinc-300">HTTP_NOT_FOUND</span>
                                </div>
                            </div>
                        </div>

                        {/* Decoración exterior */}
                        <div className="absolute -bottom-3 -right-3 -z-10 h-24 w-24 rounded-3xl border border-red-500/10" />
                        <div className="absolute -left-3 -top-3 -z-10 h-16 w-16 rounded-2xl border border-white/[0.06]" />
                    </div>
                </section>

                {/* Pie */}
                <footer className="mt-20 flex flex-col items-start justify-between gap-3 border-t border-white/[0.08] pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center">
                    <p>© {new Date().getFullYear()} RPM. Repuestos para seguir adelante.</p>
                    <p className="font-mono tracking-wider">PRECISIÓN · CONFIANZA · MOVIMIENTO</p>
                </footer>
            </div>
        </main>
    );
}
