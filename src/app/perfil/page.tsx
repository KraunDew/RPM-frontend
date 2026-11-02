"use client";

import AccountShell from "@/components/AccountShell";
import { IconCheck, IconDeviceFloppy, IconLock, IconMail, IconPhone, IconUser } from "@tabler/icons-react";
import { FormEvent, useState } from "react";

export default function ProfilePage() {
    const [saved, setSaved] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaved(true);
    };

    return (
        <AccountShell
            active="perfil"
            title="Mi perfil"
            description="Mantén actualizados tus datos de contacto para que podamos comunicarnos contigo sobre tus compras."
        >
            <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216]">
                <div className="border-b border-white/[0.08] p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                            <IconUser size={23} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Información personal</h2>
                            <p className="mt-1 text-sm leading-6 text-zinc-500">Estos datos se usarán para identificar tu cuenta.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                    {saved && (
                        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            <IconCheck size={18} /> Cambios preparados. La conexión al endpoint de perfil se agregará próximamente.
                        </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Nombre" icon={IconUser} name="firstName" autoComplete="given-name" required />
                        <Field label="Apellido" icon={IconUser} name="lastName" autoComplete="family-name" required />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Correo electrónico" icon={IconMail} name="email" type="email" autoComplete="email" required />
                        <Field label="Teléfono" icon={IconPhone} name="phone_number" type="tel" autoComplete="tel" placeholder="+56 9 1234 5678" />
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="flex gap-3">
                            <IconLock size={18} className="mt-0.5 shrink-0 text-zinc-500" />
                            <div>
                                <p className="text-sm font-medium text-zinc-200">Tu cuenta está protegida</p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">Por seguridad, el cambio de contraseña se habilitará en una sección independiente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-white/[0.08] bg-white/[0.02] p-4 sm:px-6">
                    <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500">
                        <IconDeviceFloppy size={18} /> Guardar cambios
                    </button>
                </div>
            </form>
        </AccountShell>
    );
}

function Field({
    label,
    icon: Icon,
    name,
    type = "text",
    autoComplete,
    placeholder,
    required = false,
}: {
    label: string;
    icon: typeof IconUser;
    name: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
            <span className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#090b0e] px-3 text-zinc-500 transition focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10">
                <Icon size={18} />
                <input name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} required={required} className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" />
            </span>
        </label>
    );
}
