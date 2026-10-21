"use client";

import {
    IconActivity,
    IconCategory,
    IconChevronRight,
    IconDashboard,
    IconLogout2,
    IconMenu2,
    IconPackage,
    IconShieldCheck,
    IconTags,
    IconTruck,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

const navigation = [
    {
        title: "GENERAL",
        items: [
            { label: "Dashboard", href: "/admin", icon: IconDashboard },
            { label: "Productos", href: "/admin/productos", icon: IconPackage },
            { label: "Pedidos", href: "/admin/pedidos", icon: IconActivity },
        ],
    },
    {
        title: "GESTIÓN",
        items: [
            { label: "Categorías", href: "/admin/categorias", icon: IconCategory },
            { label: "Marcas", href: "/admin/marcas", icon: IconTags },
            { label: "Proveedores", href: "/admin/proveedores", icon: IconTruck },
            { label: "Usuarios", href: "/admin/usuarios", icon: IconUsers },
        ],
    },
];

type AuthResponse = {
    role?: string;
    info?: { role?: string };
    user?: { role?: string };
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [checkingAccess, setCheckingAccess] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        let active = true;

        async function verifyAccess() {
            if (!API_URL) {
                console.error("Falta configurar NEXT_PUBLIC_BACKEND.");
                router.replace("/login");
                if (active) setCheckingAccess(false);
                return;
            }

            try {
                const response = await axios.get<AuthResponse>(`${API_URL}/users/me`, { withCredentials: true });

                const data = response.data;
                const role = String(data.role ?? data.info?.role ?? data.user?.role ?? "")
                    .trim()
                    .toUpperCase();

                if (!["ADMIN", "SUPERADMIN"].includes(role)) {
                    router.replace("/");
                    return;
                }

                if (active) setAllowed(true);
            } catch {
                router.replace("/login");
            } finally {
                if (active) setCheckingAccess(false);
            }
        }

        void verifyAccess();

        return () => {
            active = false;
        };
    }, [router]);

    // Cierra el menú al cambiar de sección.
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Permite cerrar el menú con Escape.
    useEffect(() => {
        if (!mobileMenuOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileMenuOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileMenuOpen]);

    if (checkingAccess || !allowed) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#090b0e] px-4 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                    <p className="text-center text-sm text-zinc-400">Verificando acceso al panel...</p>
                </div>
            </main>
        );
    }

    const currentSection = pathname.split("/").filter(Boolean).slice(1).join(" / ") || "Dashboard";

    const renderNavigation = (mobile = false) => (
        <nav aria-label="Navegación de administración" className="flex-1 space-y-7 overflow-y-auto px-3 py-5 sm:py-6">
            {navigation.map(group => (
                <section key={group.title}>
                    <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-zinc-600">{group.title}</p>

                    <div className="space-y-1">
                        {group.items.map(item => {
                            const active =
                                item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => {
                                        if (mobile) setMobileMenuOpen(false);
                                    }}
                                    className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                                        active
                                            ? "border border-red-500/15 bg-red-500/10 font-semibold text-red-400"
                                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                                    }`}
                                >
                                    <Icon size={20} stroke={1.8} />
                                    <span>{item.label}</span>
                                    {active && <IconChevronRight size={16} className="ml-auto" />}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ))}
        </nav>
    );

    const renderStoreLink = (mobile = false) => (
        <Link
            href="/"
            onClick={() => {
                if (mobile) setMobileMenuOpen(false);
            }}
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
            <IconLogout2 size={19} />
            Volver a la tienda
        </Link>
    );

    return (
        <div className="min-h-screen bg-[#090b0e] text-zinc-100">
            {/* Sidebar de escritorio */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.07] bg-[#0d0f13] lg:flex">
                <Link href="/admin" className="flex h-20 shrink-0 items-center gap-3 border-b border-white/[0.07] px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 font-black tracking-tight text-white shadow-lg shadow-red-950/40">
                        RPM
                    </div>
                    <div>
                        <p className="font-bold tracking-wide">RPM Admin</p>
                        <p className="mt-0.5 text-xs text-zinc-500">Panel de gestión</p>
                    </div>
                </Link>

                {renderNavigation()}

                <div className="shrink-0 border-t border-white/[0.07] p-3">{renderStoreLink()}</div>
            </aside>

            {/* Menú móvil y tablet */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú de administración"
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
                    />

                    <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-white/[0.08] bg-[#0d0f13] shadow-2xl shadow-black/50">
                        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
                            <Link
                                href="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 font-black text-white shadow-lg shadow-red-950/40">
                                    RPM
                                </div>
                                <div>
                                    <p className="font-bold tracking-wide">RPM Admin</p>
                                    <p className="mt-0.5 text-xs text-zinc-500">Panel de gestión</p>
                                </div>
                            </Link>

                            <button
                                type="button"
                                aria-label="Cerrar menú"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                <IconX size={22} />
                            </button>
                        </div>

                        {renderNavigation(true)}

                        <div className="shrink-0 border-t border-white/[0.07] p-3">{renderStoreLink(true)}</div>
                    </aside>
                </div>
            )}

            {/* Contenido principal */}
            <div className="min-w-0 lg:pl-64">
                <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#090b0e]/90 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            aria-label={mobileMenuOpen ? "Cerrar navegación" : "Abrir navegación"}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="admin-mobile-menu"
                            onClick={() => setMobileMenuOpen(open => !open)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition-colors hover:border-red-500/30 hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 lg:hidden"
                        >
                            {mobileMenuOpen ? <IconX size={21} /> : <IconMenu2 size={21} />}
                        </button>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 font-black text-white lg:hidden">
                            R
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white sm:text-base">Administración</p>
                            <p className="truncate text-[11px] text-zinc-500 sm:text-xs">RPM / {currentSection}</p>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-2.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/30 hover:text-white sm:px-3 sm:text-sm"
                    >
                        <IconShieldCheck size={17} />
                        <span className="hidden min-[380px]:inline">Tienda pública</span>
                        <span className="min-[380px]:hidden">Tienda</span>
                    </Link>
                </header>

                <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1600px] p-3 sm:p-5 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
