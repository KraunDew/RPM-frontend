"use client";

import type { User } from "@/app/types/user.type";
import {
    IconChevronRight,
    IconHeart,
    IconHome,
    IconLayoutDashboard,
    IconLayoutGrid,
    IconLogout2,
    IconMapPin,
    IconMenu2,
    IconPackage,
    IconShoppingCart,
    IconTool,
    IconUserCircle,
    IconUsersGroup,
    IconX,
} from "@tabler/icons-react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./motion/popover";

const API_URL = process.env.NEXT_PUBLIC_BACKEND;
const CART_KEY = "rpm-carrito";

type AuthUser = User & {
    id_user?: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
};

type MeResponse = AuthUser | { info?: AuthUser; user?: AuthUser };

type CartItem = {
    quantity?: number;
    cantidad?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUser(data: unknown): AuthUser | null {
    if (!isRecord(data)) return null;

    let candidate: unknown = data;

    if ("info" in data) {
        candidate = data.info;
    } else if ("user" in data) {
        candidate = data.user;
    }

    if (!isRecord(candidate)) return null;

    const firstName =
        typeof candidate.firstName === "string"
            ? candidate.firstName
            : typeof candidate.first_name === "string"
              ? candidate.first_name
              : "";

    const lastName =
        typeof candidate.lastName === "string"
            ? candidate.lastName
            : typeof candidate.last_name === "string"
              ? candidate.last_name
              : "";

    const role = typeof candidate.role === "string" ? candidate.role.trim().toUpperCase() : "";

    return {
        ...(candidate as AuthUser),
        firstName,
        lastName,
        role,
    };
}

function getCartCount(): number {
    try {
        const rawCart = localStorage.getItem(CART_KEY);
        if (!rawCart) return 0;

        const cart: unknown = JSON.parse(rawCart);
        if (!Array.isArray(cart)) return 0;

        return cart.reduce((total: number, item: CartItem) => {
            const quantity = Number(item.quantity ?? item.cantidad ?? 1);
            return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
        }, 0);
    } catch {
        return 0;
    }
}

function Header() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const fetchUser = useCallback(async () => {
        if (!API_URL) {
            console.error("Falta configurar BACKEND.");
            setUser(null);
            setLoadingUser(false);
            return;
        }

        try {
            const response = await axios.get<MeResponse>(`${API_URL}/users/me`, {
                withCredentials: true,
            });

            setUser(normalizeUser(response.data));
        } catch (error) {
            setUser(null);

            if (axios.isAxiosError(error) && error.response?.status !== 401 && error.response?.status !== 403) {
                console.error("No se pudo consultar la sesión:", error);
            }
        } finally {
            setLoadingUser(false);
        }
    }, []);

    useEffect(() => {
        void fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        const updateCart = () => setCartCount(getCartCount());

        updateCart();
        window.addEventListener("cart-updated", updateCart);
        window.addEventListener("storage", updateCart);

        return () => {
            window.removeEventListener("cart-updated", updateCart);
            window.removeEventListener("storage", updateCart);
        };
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileMenuOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mobileMenuOpen]);

    const logout = async () => {
        if (loggingOut || !API_URL) return;

        setLoggingOut(true);

        try {
            await axios.post(
                `${API_URL}/users/logout`,
                {},
                {
                    withCredentials: true,
                },
            );

            setUser(null);
            localStorage.removeItem(CART_KEY);
            setCartCount(0);
            setMobileMenuOpen(false);
            router.replace("/");
            router.refresh();
        } catch (error) {
            console.error("No se pudo cerrar la sesión:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const firstName = user?.firstName?.trim() ?? "";
    const lastName = user?.lastName?.trim() ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || "Usuario RPM";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "R";
    const role = String(user?.role ?? "")
        .trim()
        .toUpperCase();
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(role);

    const roleLabel = role === "SUPERADMIN" ? "Superadministrador" : role === "ADMIN" ? "Administrador" : "Cliente";

    const avatarUrl = `https://ui-avatars.com/api/?background=991b1b&color=ffffff&bold=true&size=96&name=${encodeURIComponent(fullName)}`;

    const navigation = [
        { name: "Inicio", route: "/", icon: IconHome },
        { name: "Talleres Aliados", route: "/workshops", icon: IconTool },
        { name: "Catálogo", route: "/catalogo", icon: IconLayoutGrid },
        { name: "Sobre Nosotros", route: "/about", icon: IconUsersGroup },
    ];

    const linkClass = (route: string) =>
        `flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
            pathname === route ? "bg-red-600/15 text-red-400" : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
        }`;

    return (
        <header className="sticky top-0 z-50 border-b border-red-900/40 bg-[#090b0e]/95 text-white shadow-lg shadow-black/30 backdrop-blur-xl">
            <nav
                aria-label="Navegación principal"
                className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4 lg:gap-x-6 lg:px-8"
            >
                <Link href="/" aria-label="RPM, ir al inicio" className="flex min-w-0 shrink items-center">
                    <Image
                        src="/assets/logo.png"
                        alt="RPM, Revoluciones por Minuto"
                        width={160}
                        height={64}
                        className="h-auto w-[88px] object-contain min-[380px]:w-[105px] sm:w-[145px] lg:w-[155px]"
                        priority
                    />
                </Link>

                <ul className="hidden flex-1 items-center justify-center gap-1 xl:flex">
                    {navigation.map(({ name, route, icon: Icon }) => {
                        const isActive = pathname === route;

                        return (
                            <li key={route}>
                                <Link
                                    href={route}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors 2xl:px-4 ${
                                        isActive
                                            ? "bg-red-700/15 text-red-400"
                                            : "text-gray-300 hover:bg-white/5 hover:text-red-400"
                                    }`}
                                >
                                    <Icon size={20} stroke={1.8} />
                                    <span>{name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="ml-auto flex shrink-0 items-center gap-1 min-[380px]:gap-1.5 sm:gap-2">
                    <Link
                        href="/carrito"
                        aria-label={`Ver carrito: ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`}
                        aria-current={pathname === "/carrito" ? "page" : undefined}
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11 lg:w-auto lg:gap-2 lg:px-3 ${
                            pathname === "/carrito"
                                ? "bg-red-700 text-white"
                                : "text-gray-200 hover:bg-red-700/20 hover:text-red-400"
                        }`}
                    >
                        <span className="relative inline-flex">
                            <IconShoppingCart size={22} stroke={1.8} />
                            {cartCount > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#090b0e] bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
                                >
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </span>
                        <span className="hidden text-sm font-semibold lg:inline">Carrito</span>
                    </Link>

                    <Link
                        href="/favoritos"
                        aria-label="Ver favoritos"
                        aria-current={pathname === "/favoritos" ? "page" : undefined}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11 lg:w-auto lg:gap-2 lg:px-3 ${
                            pathname === "/favoritos"
                                ? "bg-red-700/20 text-red-400"
                                : "text-gray-200 hover:bg-white/5 hover:text-red-400"
                        }`}
                    >
                        <IconHeart size={22} stroke={1.8} />
                        <span className="hidden text-sm font-semibold 2xl:inline">Favoritos</span>
                    </Link>

                    {loadingUser ? (
                        <div
                            aria-label="Consultando sesión"
                            className="h-9 w-9 shrink-0 animate-pulse rounded-full border border-white/10 bg-white/5 min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11"
                        />
                    ) : user ? (
                        <Popover side="bottom" align="end">
                            <PopoverTrigger>
                                <button
                                    type="button"
                                    aria-label={`Abrir menú de ${fullName}`}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-red-700/80 bg-[#15171b] transition-colors hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090b0e] min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11"
                                >
                                    <Image
                                        src={avatarUrl}
                                        alt={`Avatar de ${fullName}`}
                                        width={44}
                                        height={44}
                                        className="h-full w-full rounded-full object-cover"
                                        unoptimized
                                    />
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className="!border-0 !bg-transparent !p-0 !shadow-none !ring-0">
                                <div className="w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111318] text-white shadow-2xl shadow-black/50">
                                    <div className="border-b border-white/[0.08] bg-gradient-to-br from-red-950/70 via-[#171419] to-[#111318] p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-950/60 text-sm font-bold text-red-300">
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{fullName}</p>
                                                <p className="mt-1 truncate text-xs text-white/45">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300">
                                                {roleLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                            Mi cuenta
                                        </p>
                                        <Link href="/perfil" className={linkClass("/perfil")}>
                                            <IconUserCircle size={19} />
                                            <span>Mi perfil</span>
                                            <IconChevronRight size={15} className="ml-auto text-white/25" />
                                        </Link>
                                        <Link href="/mis-pedidos" className={linkClass("/mis-pedidos")}>
                                            <IconPackage size={19} />
                                            <span>Mis pedidos</span>
                                            <IconChevronRight size={15} className="ml-auto text-white/25" />
                                        </Link>
                                        <Link href="/direcciones" className={linkClass("/direcciones")}>
                                            <IconMapPin size={19} />
                                            <span>Mis direcciones</span>
                                            <IconChevronRight size={15} className="ml-auto text-white/25" />
                                        </Link>
                                    </div>

                                    {isAdmin && (
                                        <div className="border-t border-white/[0.08] p-2">
                                            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                                Administración
                                            </p>
                                            <Link href="/admin" className={linkClass("/admin")}>
                                                <IconLayoutDashboard size={19} />
                                                <span>Panel de administración</span>
                                                <IconChevronRight size={15} className="ml-auto text-white/25" />
                                            </Link>
                                        </div>
                                    )}

                                    <div className="border-t border-white/[0.08] p-2">
                                        <button
                                            type="button"
                                            disabled={loggingOut}
                                            onClick={logout}
                                            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <IconLogout2 size={19} />
                                            <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                                        </button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-red-500/40 bg-red-600 px-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090b0e] min-[380px]:h-10 min-[380px]:gap-1.5 min-[380px]:px-2.5 min-[380px]:text-sm sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                        >
                            <IconUserCircle size={19} className="shrink-0 min-[380px]:h-5 min-[380px]:w-5" />
                            <span className="hidden min-[420px]:inline">Iniciar sesión</span>
                            <span className="min-[420px]:hidden">Entrar</span>
                        </Link>
                    )}

                    <button
                        type="button"
                        aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="rpm-mobile-navigation"
                        onClick={() => setMobileMenuOpen(open => !open)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-gray-200 transition-colors hover:border-red-500/40 hover:bg-white/5 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11 xl:hidden"
                    >
                        {mobileMenuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div
                        id="rpm-mobile-navigation"
                        className="absolute left-0 right-0 top-full z-50 w-full border-t border-red-900/40 bg-[#090b0e] px-3 pb-4 pt-3 shadow-xl shadow-black/40 sm:px-5 xl:hidden"
                    >
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                            Navegación
                        </p>

                        <ul className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2">
                            {navigation.map(({ name, route, icon: Icon }) => {
                                const isActive = pathname === route;

                                return (
                                    <li key={route}>
                                        <Link
                                            href={route}
                                            aria-current={isActive ? "page" : undefined}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                                                isActive
                                                    ? "bg-red-700/15 text-red-400"
                                                    : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                                            }`}
                                        >
                                            <Icon size={21} stroke={1.8} />
                                            <span>{name}</span>
                                            <IconChevronRight size={17} className="ml-auto opacity-40" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
                            <Link
                                href="/carrito"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.07]"
                            >
                                <IconShoppingCart size={19} />
                                Carrito ({cartCount > 99 ? "99+" : cartCount})
                            </Link>
                            <Link
                                href="/favoritos"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.07]"
                            >
                                <IconHeart size={19} />
                                Favoritos
                            </Link>
                        </div>

                        {user && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-950/70 text-sm font-bold text-red-300">
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{fullName}</p>
                                    <p className="truncate text-xs text-white/45">{roleLabel}</p>
                                </div>
                                <Link
                                    href="/perfil"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
                                >
                                    Mi perfil
                                </Link>
                            </div>
                        )}

                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-300 hover:bg-red-500/10"
                            >
                                <IconLayoutDashboard size={20} />
                                Panel de administración
                                <IconChevronRight size={16} className="ml-auto opacity-50" />
                            </Link>
                        )}

                        {user && (
                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={logout}
                                className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            >
                                <IconLogout2 size={20} />
                                {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                            </button>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;
