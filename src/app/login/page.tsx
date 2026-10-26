"use client";

import Button from "@/components/Button";
import Header from "@/components/Header";
import { Input } from "@/components/motion/input";
import {
    IconAlertCircle,
    IconArrowRight,
    IconEye,
    IconEyeOff,
    IconLock,
    IconMail,
    IconShieldCheck,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const emailError =
        email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ? "Ingresa un correo electrónico válido."
            : undefined;

    const loginUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading) return;

        setError("");

        if (emailError || !email.trim() || !pass) {
            setError("Revisa tu correo electrónico y contraseña.");
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND;

        if (!backendUrl) {
            setError("No pudimos iniciar sesión. Inténtalo más tarde.");
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `${backendUrl.replace(/\/+$/, "")}/users/login`,
                {
                    email: email.trim().toLowerCase(),
                    password: pass,
                },
                {
                    withCredentials: true,
                    timeout: 15000,
                },
            );

            // No guardamos el usuario ni el JWT en localStorage.
            // El backend administra la sesión mediante la cookie HttpOnly.
            router.replace("/");
            router.refresh();
        } catch {
            setError("No pudimos iniciar sesión con esos datos. Revisa la información e inténtalo nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = {
        label: "px-1 text-sm font-medium text-zinc-300",
        field: "h-12 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-red-500/70",
        input: "!text-white !placeholder-zinc-500",
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
            {/* Fondo profundo con grid y resplandor ambiental */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(127, 29, 29, 0.16), transparent 55%),
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
                    backgroundSize: "auto, 48px 48px, 48px 48px",
                    maskImage: "linear-gradient(to bottom, black 15%, transparent 100%)",
                }}
            />

            {/* Luz roja difuminada */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-1/2 h-[32rem] w-[44rem] -translate-x-1/2 rounded-full bg-red-700/[0.12] blur-[150px]"
            />

            {/* Viñeta oscura en los bordes */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.58)_100%)]"
            />

            <div className="relative z-10">
                <Header />

                <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 sm:px-6">
                    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#151515] via-[#101010] to-[#090909] shadow-2xl shadow-black/60 lg:grid-cols-[0.85fr_1.15fr]">
                        {/* Panel de marca */}
                        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#181818] via-[#121212] to-[#0c0c0c] p-10 lg:flex">
                            {/* Decoración ambiental */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full border border-red-500/10"
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-10 top-30 h-44 w-44 rounded-full border border-red-500/[0.15]"
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-red-700/[0.08] blur-[90px]"
                            />

                            <div className="relative">
                                <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.05] px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-red-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    RPM AUTOMOTRIZ
                                </span>

                                <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
                                    Qué bueno
                                    <br />
                                    <span className="text-red-500">tenerte de vuelta.</span>
                                </h1>

                                <p className="mt-5 max-w-xs text-sm leading-7 text-zinc-400">
                                    Accede a tu cuenta y sigue encontrando los repuestos que tu auto necesita.
                                </p>
                            </div>

                            <div className="relative mt-12 border-t border-white/10 pt-6">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-red-400">
                                        <IconShieldCheck size={20} />
                                    </span>

                                    <div>
                                        <p className="font-medium text-zinc-200">Acceso a tu cuenta</p>
                                        <p className="mt-1 text-xs">Ingresa tus credenciales para continuar.</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Formulario de inicio de sesión */}
                        <div className="relative p-6 sm:p-9 lg:p-10">
                            {/* Luz ambiental dentro del formulario */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-red-600/[0.04] blur-[80px]"
                            />

                            <div className="relative mb-8">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 lg:hidden">
                                    <IconLock size={25} />
                                </div>

                                <p className="text-xs font-semibold tracking-[0.22em] text-red-400">
                                    ACCESO DE CLIENTES
                                </p>

                                <h2 className="mt-2 text-3xl font-bold tracking-tight">Inicia sesión</h2>

                                <p className="mt-2 text-sm text-zinc-400">Ingresa tus datos para continuar en RPM.</p>
                            </div>

                            <form onSubmit={loginUser} className="relative space-y-5">
                                <Input
                                    classNames={inputClasses}
                                    label="Correo electrónico"
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="nombre@correo.cl"
                                    rightIcon={<IconMail className="mr-3 text-zinc-500" size={20} />}
                                    value={email}
                                    onChange={setEmail}
                                    error={emailError}
                                    autoComplete="email"
                                    maxLength={254}
                                    required
                                />

                                <div className="space-y-2">
                                    <Input
                                        classNames={inputClasses}
                                        label="Contraseña"
                                        type={show ? "text" : "password"}
                                        name="password"
                                        id="password"
                                        placeholder="Ingresa tu contraseña"
                                        rightIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShow(current => !current)}
                                                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                className="pointer-events-auto mr-3 text-zinc-400 transition-colors hover:text-white"
                                            >
                                                {show ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                                            </button>
                                        }
                                        value={pass}
                                        onChange={setPass}
                                        autoComplete="current-password"
                                        required
                                    />

                                    <div className="flex items-center gap-2 px-1 text-xs text-zinc-500">
                                        <IconLock size={14} />
                                        Tu contraseña se mantiene privada.
                                    </div>
                                </div>

                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3.5 text-sm text-red-300"
                                    >
                                        <IconAlertCircle size={20} className="mt-0.5 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="pt-3">
                                    <div className="flex w-full justify-center">
                                        <Button type="submit" color="primary" size="xl" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Iniciando sesión...
                                                </>
                                            ) : (
                                                <>
                                                    Iniciar sesión
                                                    <IconArrowRight className="ml-2" size={20} />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-white/[0.07] pt-5">
                                    <p className="text-center text-sm text-zinc-400">¿Todavía no tienes cuenta?</p>

                                    <Link
                                        href="/register"
                                        className="mt-2 block text-center text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
                                    >
                                        Crear una cuenta en RPM
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
