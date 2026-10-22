"use client";

import Button from "@/components/Button";
import Header from "@/components/Header";
import { Input } from "@/components/motion/input";
import {
    IconAlertCircle,
    IconCalendar,
    IconCheck,
    IconEye,
    IconEyeOff,
    IconLock,
    IconMail,
    IconUserEdit,
} from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateYearsAgo(years: number): string {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setFullYear(date.getFullYear() - years);

    return formatLocalDate(date);
}

function getAge(birthDate: string): number | null {
    if (!birthDate) return null;

    const [year, month, day] = birthDate.split("-").map(Number);

    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);
    date.setHours(12, 0, 0, 0);

    // Evita fechas imposibles, como el 31 de febrero.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (date > today) return null;

    let age = today.getFullYear() - year;

    const birthdayHasPassed =
        today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);

    if (!birthdayHasPassed) age--;

    return age;
}

export default function RegisterPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    const [show, setShow] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const maxBirthDate = getDateYearsAgo(18);
    const minBirthDate = getDateYearsAgo(100);

    const age = getAge(birthDate);

    const emailError =
        email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ? "Ingresa un correo electrónico válido."
            : undefined;

    const passwordError =
        pass.length > 0 && (pass.length < 8 || pass.length > 12)
            ? "La contraseña debe tener entre 8 y 12 caracteres."
            : undefined;

    const confirmPasswordError =
        confirmPass.length > 0 && pass !== confirmPass ? "Las contraseñas no coinciden." : undefined;

    const birthDateError = (() => {
        if (!birthDate) return undefined;

        if (age === null) return "Ingresa una fecha válida.";

        if (birthDate < minBirthDate) {
            return "La fecha de nacimiento no puede superar los 100 años.";
        }

        if (age < 18) {
            return "Debes tener al menos 18 años para crear una cuenta.";
        }

        return undefined;
    })();

    const registerUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading) return;

        setError("");

        if (!firstName.trim() || !lastName.trim()) {
            setError("Completa tu nombre y apellido.");
            return;
        }

        if (emailError) {
            setError("Revisa el correo electrónico ingresado.");
            return;
        }

        if (!birthDate || birthDateError) {
            setError(birthDateError ?? "Debes ingresar tu fecha de nacimiento.");
            return;
        }

        if (pass.length < 8 || pass.length > 12) {
            setError("La contraseña debe tener entre 8 y 12 caracteres.");
            return;
        }

        if (!confirmPass) {
            setError("Debes repetir tu contraseña.");
            return;
        }

        if (pass !== confirmPass) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND;

        if (!backendUrl) {
            setError("No pudimos completar el registro. Inténtalo más tarde.");
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `${backendUrl.replace(/\/+$/, "")}/users/register`,
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    birthDate,
                    password: pass,
                },
                {
                    withCredentials: true,
                    timeout: 15000,
                },
            );

            // El backend debe establecer la cookie HttpOnly.
            // No guardamos el usuario ni el token en localStorage.
            router.replace("/");
            router.refresh();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setError("Ya existe una cuenta con ese correo electrónico.");
            } else {
                setError("No pudimos crear tu cuenta con esos datos. Revisa la información e inténtalo nuevamente.");
            }
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
            {/* Fondo */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage: "linear-gradient(to bottom, black, transparent 90%)",
                }}
            />

            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />

            <div className="relative z-10">
                <Header />

                <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 sm:px-6">
                    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/40 lg:grid-cols-[0.85fr_1.15fr]">
                        {/* Panel de marca */}
                        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#141414] p-10 lg:flex">
                            <div
                                aria-hidden="true"
                                className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-red-500/10"
                            />

                            <div
                                aria-hidden="true"
                                className="absolute -right-10 top-30 h-44 w-44 rounded-full border border-red-500/15"
                            />

                            <div className="relative">
                                <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
                                    Tu próximo viaje
                                    <br />
                                    <span className="text-red-500">comienza aquí.</span>
                                </h1>

                                <p className="mt-5 max-w-xs text-sm leading-7 text-zinc-400">
                                    Crea tu cuenta y encuentra los repuestos que tu auto necesita, sin complicaciones.
                                </p>
                            </div>

                            <div className="relative mt-12 border-t border-white/10 pt-6">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-red-400">
                                        <IconLock size={20} />
                                    </span>

                                    <div>
                                        <p className="font-medium text-zinc-200">Tu cuenta, bajo control</p>
                                        <p className="mt-1 text-xs">Tus datos merecen un trato responsable.</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Formulario */}
                        <div className="p-6 sm:p-9 lg:p-10">
                            <div className="mb-8">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 lg:hidden">
                                    <IconUserEdit size={25} />
                                </div>

                                <p className="text-xs font-semibold tracking-[0.22em] text-red-400">CREA TU CUENTA</p>

                                <h2 className="mt-2 text-3xl font-bold tracking-tight">Regístrate en RPM</h2>

                                <p className="mt-2 text-sm text-zinc-400">Completa tus datos para comenzar.</p>
                            </div>

                            <form onSubmit={registerUser} className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        classNames={inputClasses}
                                        label="Nombre"
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        placeholder="Tu nombre"
                                        value={firstName}
                                        onChange={setFirstName}
                                        autoComplete="given-name"
                                        maxLength={80}
                                        required
                                    />

                                    <Input
                                        classNames={inputClasses}
                                        label="Apellido"
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        placeholder="Tu apellido"
                                        value={lastName}
                                        onChange={setLastName}
                                        autoComplete="family-name"
                                        maxLength={80}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Input
                                        classNames={inputClasses}
                                        label="Fecha de nacimiento"
                                        type="date"
                                        name="birthDate"
                                        id="birthDate"
                                        value={birthDate}
                                        onChange={setBirthDate}
                                        min={minBirthDate}
                                        max={maxBirthDate}
                                        error={birthDateError}
                                        rightIcon={<IconCalendar className="mr-3 text-zinc-500" size={20} />}
                                        autoComplete="bday"
                                        required
                                    />

                                    <p className="px-1 text-xs leading-5 text-zinc-500">Debes tener 18+ años</p>
                                </div>

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

                                {/* Contraseña */}
                                <div className="space-y-2">
                                    <Input
                                        classNames={inputClasses}
                                        label="Contraseña"
                                        type={show ? "text" : "password"}
                                        name="password"
                                        id="password"
                                        placeholder="Entre 8 y 12 caracteres"
                                        value={pass}
                                        onChange={setPass}
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={12}
                                        error={passwordError}
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
                                        required
                                    />

                                    <div className="flex items-center justify-between px-1 text-xs">
                                        <span className="text-zinc-500">Entre 8 y 12 caracteres</span>

                                        <span
                                            className={
                                                pass.length >= 8 && pass.length <= 12
                                                    ? "text-emerald-400"
                                                    : "text-zinc-500"
                                            }
                                        >
                                            {pass.length}/12
                                        </span>
                                    </div>
                                </div>

                                {/* Repetir contraseña */}
                                <div className="space-y-2">
                                    <Input
                                        classNames={inputClasses}
                                        label="Repetir contraseña"
                                        type={showConfirm ? "text" : "password"}
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        placeholder="Vuelve a escribir tu contraseña"
                                        value={confirmPass}
                                        onChange={setConfirmPass}
                                        autoComplete="new-password"
                                        maxLength={12}
                                        error={confirmPasswordError}
                                        rightIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(current => !current)}
                                                aria-label={
                                                    showConfirm
                                                        ? "Ocultar contraseña repetida"
                                                        : "Mostrar contraseña repetida"
                                                }
                                                className="pointer-events-auto mr-3 text-zinc-400 transition-colors hover:text-white"
                                            >
                                                {showConfirm ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                                            </button>
                                        }
                                        required
                                    />

                                    {confirmPass.length > 0 && !confirmPasswordError && pass.length > 0 && (
                                        <p className="flex items-center gap-1.5 px-1 text-xs text-emerald-400">
                                            <IconCheck size={15} />
                                            Las contraseñas coinciden.
                                        </p>
                                    )}
                                </div>

                                {/* Error del formulario */}
                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3.5 text-sm text-red-300"
                                    >
                                        <IconAlertCircle size={20} className="mt-0.5 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <div className="flex w-full justify-center">
                                        <Button type="submit" color="primary" size="xl" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Creando cuenta...
                                                </>
                                            ) : (
                                                <>
                                                    <IconCheck className="mr-2" size={20} />
                                                    Crear mi cuenta
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <p className="pt-2 text-center text-sm text-zinc-400">
                                    ¿Ya tienes una cuenta?{" "}
                                    <Link
                                        href="/login"
                                        className="font-semibold text-red-400 transition-colors hover:text-red-300"
                                    >
                                        Inicia sesión
                                    </Link>
                                </p>

                                <p className="text-center text-xs leading-5 text-zinc-600">
                                    Al registrarte, asegúrate de ingresar información correcta.
                                </p>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
