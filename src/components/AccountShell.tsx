import { IconChevronRight, IconHome, IconMapPin, IconPackage, IconUserCircle } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Header from "./Header";

type AccountSection = "perfil" | "pedidos" | "direcciones";

const sections = [
    { id: "perfil" as const, href: "/perfil", label: "Mi perfil", icon: IconUserCircle },
    { id: "pedidos" as const, href: "/mis-pedidos", label: "Mis pedidos", icon: IconPackage },
    { id: "direcciones" as const, href: "/direcciones", label: "Mis direcciones", icon: IconMapPin },
];

export default function AccountShell({
    active,
    title,
    description,
    children,
}: {
    active: AccountSection;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-[#090b0e] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <nav aria-label="Ruta de navegación" className="mb-7 flex items-center gap-2 text-xs text-zinc-500">
                        <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-red-400">
                            <IconHome size={15} /> Inicio
                        </Link>
                        <IconChevronRight size={14} aria-hidden="true" />
                        <span className="text-zinc-300">Mi cuenta</span>
                        <IconChevronRight size={14} aria-hidden="true" />
                        <span className="text-zinc-300">{title}</span>
                    </nav>

                    <div className="mb-8">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Mi cuenta</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">{description}</p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
                        <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101216] p-2 lg:sticky lg:top-24">
                            <nav aria-label="Secciones de mi cuenta" className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
                                {sections.map(({ id, href, label, icon: Icon }) => {
                                    const isActive = id === active;

                                    return (
                                        <Link
                                            key={id}
                                            href={href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                                isActive
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                                                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                                            }`}
                                        >
                                            <Icon size={19} stroke={1.8} />
                                            <span>{label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>

                        <section className="min-w-0">{children}</section>
                    </div>
                </div>
            </main>
        </>
    );
}
