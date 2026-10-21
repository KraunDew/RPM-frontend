import Header from "@/components/Header";
import { IconArrowRight, IconCar, IconCpu, IconGauge, IconTargetArrow, IconTool, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

const values = [
    {
        icon: IconTargetArrow,
        title: "Precisión",
        description:
            "Te ayudamos a encontrar el repuesto adecuado, con información clara para que tomes mejores decisiones.",
        number: "01",
    },
    {
        icon: IconUsers,
        title: "Confianza",
        description:
            "Buscamos que comprar repuestos sea un proceso sencillo, transparente y pensado en las necesidades de cada cliente.",
        number: "02",
    },
    {
        icon: IconCpu,
        title: "Innovación",
        description:
            "Combinamos tecnología y conocimiento automotriz para facilitar la búsqueda y elección de repuestos.",
        number: "03",
    },
];

const features = [
    {
        icon: IconTool,
        title: "Catálogo de repuestos",
        description: "Explora distintas opciones y encuentra repuestos para las necesidades de tu vehículo.",
    },
    {
        icon: IconCpu,
        title: "Asistente inteligente",
        description:
            "Describe lo que necesitas con tus propias palabras y recibe orientación para encontrar productos relevantes.",
    },
    {
        icon: IconUsers,
        title: "Talleres aliados",
        description:
            "Conectamos a los usuarios con talleres para acercarlos a soluciones relacionadas con el cuidado de sus vehículos.",
    },
];

export default function AboutPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen overflow-hidden bg-[#090b0e] text-white">
                {/* Hero */}
                <section className="relative border-b border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.17),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.10),transparent_45%)]" />

                    <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-16 lg:py-32">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                Conoce RPM
                            </span>

                            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                                Los repuestos correctos.
                                <span className="mt-2 block text-red-500">Sin tantas vueltas.</span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
                                En RPM queremos hacer que encontrar repuestos automotrices sea una experiencia más
                                simple, accesible e inteligente. Combinamos tecnología y soluciones prácticas para
                                acercarte a lo que tu vehículo necesita.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-4">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-bold transition hover:bg-red-500"
                                >
                                    Explorar catálogo
                                    <IconArrowRight size={18} />
                                </Link>

                                <Link
                                    href="/workshops"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                                >
                                    Ver talleres aliados
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-5 rounded-3xl bg-red-600/10 blur-3xl" />

                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101318]">
                                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                            RPM / AUTOMOTRIZ
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-white">
                                            Tecnología al servicio de tu vehículo
                                        </p>
                                    </div>

                                    <IconGauge className="text-red-500" size={30} stroke={1.5} />
                                </div>

                                <div className="relative flex min-h-64 items-center justify-center overflow-hidden px-6 py-12 sm:min-h-80">
                                    <div className="absolute h-52 w-52 rounded-full border border-red-500/15 sm:h-64 sm:w-64" />
                                    <div className="absolute h-40 w-40 rounded-full border border-red-500/20 sm:h-48 sm:w-48" />
                                    <div className="absolute h-28 w-28 rounded-full bg-red-600/10 blur-2xl" />

                                    <div className="relative flex flex-col items-center">
                                        <IconCar className="text-red-500" size={112} stroke={1.1} />
                                        <p className="mt-5 text-2xl font-black tracking-[0.3em]">RPM</p>
                                        <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
                                            Revoluciones por Minuto
                                        </p>
                                    </div>

                                    <div className="absolute left-4 top-7 rounded-lg border border-white/10 bg-[#171a20] px-3 py-2 sm:left-8">
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Enfoque</p>
                                        <p className="mt-1 text-xs font-bold">Soluciones</p>
                                    </div>

                                    <div className="absolute bottom-7 right-4 rounded-lg border border-white/10 bg-[#171a20] px-3 py-2 sm:right-8">
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                                            Nuestro motor
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-red-400">Innovación</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 border-t border-white/10">
                                    {[
                                        ["01", "Buscar"],
                                        ["02", "Comparar"],
                                        ["03", "Encontrar"],
                                    ].map(([number, label]) => (
                                        <div
                                            key={number}
                                            className="border-r border-white/10 px-3 py-4 last:border-r-0 sm:px-5"
                                        >
                                            <p className="text-xs font-bold text-red-500">{number}</p>
                                            <p className="mt-1 text-xs font-semibold text-zinc-300 sm:text-sm">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quiénes somos */}
                <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Quiénes somos</p>
                            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                                Más que repuestos, buscamos soluciones.
                            </h2>
                        </div>

                        <div className="space-y-5 text-base leading-8 text-zinc-400">
                            <p>
                                RPM, sigla de Revoluciones por Minuto, nace como una propuesta para mejorar la forma en
                                que las personas buscan y encuentran repuestos automotrices.
                            </p>
                            <p>
                                Sabemos que identificar una pieza puede ser complicado cuando no conoces su nombre
                                técnico o no tienes claro cuál necesitas. Por eso, buscamos reunir en un solo lugar un
                                catálogo de productos, herramientas digitales y orientación que facilite ese proceso.
                            </p>
                            <p>
                                Nuestro objetivo es acercar el mundo de los repuestos a las personas mediante una
                                experiencia más clara, práctica y apoyada en la tecnología.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Qué ofrecemos */}
                <section className="border-y border-white/10 bg-[#0e1116]">
                    <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Qué ofrecemos</p>
                            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                                Todo parte por encontrar lo que necesitas.
                            </h2>
                            <p className="mt-4 leading-7 text-zinc-400">
                                Estamos desarrollando una experiencia que conecta la búsqueda de productos con
                                herramientas diseñadas para facilitar cada decisión.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-5 md:grid-cols-3">
                            {features.map((feature, index) => {
                                const FeatureIcon = feature.icon;

                                return (
                                    <article
                                        key={feature.title}
                                        className="group rounded-xl border border-white/10 bg-[#11151b] p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/40"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition group-hover:bg-red-500 group-hover:text-white">
                                                <FeatureIcon size={25} stroke={1.7} />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-600">0{index + 1}</span>
                                        </div>

                                        <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-zinc-400">{feature.description}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Valores */}
                <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                                Lo que nos mueve
                            </p>
                            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Nuestra forma de avanzar.</h2>
                        </div>

                        <p className="max-w-lg text-sm leading-7 text-zinc-400">
                            Queremos que la tecnología sea una herramienta útil, no otra complicación que el usuario
                            tenga que aprender a soportar.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 md:grid-cols-3">
                        {values.map(value => {
                            const ValueIcon = value.icon;

                            return (
                                <article key={value.number} className="border-t border-white/15 pt-6">
                                    <div className="flex items-center justify-between">
                                        <ValueIcon size={30} stroke={1.5} className="text-red-500" />
                                        <span className="text-sm font-bold text-zinc-600">{value.number}</span>
                                    </div>

                                    <h3 className="mt-6 text-xl font-bold">{value.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-zinc-400">{value.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* Cierre */}
                <section className="px-5 pb-20 sm:px-8 sm:pb-24">
                    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-red-500/20 bg-[#111318] px-6 py-12 sm:px-12 sm:py-16">
                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-600/15 blur-3xl" />

                        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                                    RPM · Revoluciones por Minuto
                                </p>
                                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                                    Tu vehículo necesita soluciones. No más complicaciones.
                                </h2>
                                <p className="mt-4 leading-7 text-zinc-400">
                                    Explora nuestro catálogo y descubre una nueva forma de buscar repuestos
                                    automotrices.
                                </p>
                            </div>

                            <Link
                                href="/catalog"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-bold transition hover:bg-red-500"
                            >
                                Ir al catálogo
                                <IconArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
