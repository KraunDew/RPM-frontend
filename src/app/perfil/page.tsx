"use client";

import AccountShell from "@/components/AccountShell";
import { IconCheck, IconDeviceFloppy, IconLoader2, IconLock, IconMail, IconPhone, IconUser } from "@tabler/icons-react";
import axios from "axios";
import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");

type Profile = { id_user: string; firstName: string; lastName: string; email: string; phone_number: string | null; birthDate: string | null };
type ProfileForm = Omit<Profile, "id_user">;
const emptyProfile: ProfileForm = { firstName: "", lastName: "", email: "", phone_number: "", birthDate: "" };

function dateForInput(value: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function errorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;
    const message = error.response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
}

export default function ProfilePage() {
    const [profileId, setProfileId] = useState<string | null>(null);
    const [form, setForm] = useState<ProfileForm>(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!API_URL) { setNotice({ type: "error", text: "No se configuró la conexión con el servidor." }); setLoading(false); return; }
        axios.get<Profile>(`${API_URL}/users/me`, { withCredentials: true })
            .then(({ data }) => { setProfileId(data.id_user); setForm({ firstName: data.firstName ?? "", lastName: data.lastName ?? "", email: data.email ?? "", phone_number: data.phone_number ?? "", birthDate: dateForInput(data.birthDate) }); })
            .catch(error => setNotice({ type: "error", text: errorMessage(error, "No pudimos cargar tu perfil.") }))
            .finally(() => setLoading(false));
    }, []);

    const update = (field: keyof ProfileForm, value: string) => setForm(current => ({ ...current, [field]: value }));
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!API_URL || !profileId || saving) return;
        setSaving(true); setNotice(null);
        try {
            await axios.patch(`${API_URL}/users/${profileId}`, { ...form, phone_number: form.phone_number || null, birthDate: form.birthDate || null }, { withCredentials: true });
            setNotice({ type: "success", text: "Tu perfil se actualizó correctamente." });
        } catch (error) { setNotice({ type: "error", text: errorMessage(error, "No pudimos guardar los cambios.") }); }
        finally { setSaving(false); }
    };

    return <AccountShell active="perfil" title="Mi perfil" description="Mantén actualizados tus datos de contacto para que podamos comunicarnos contigo sobre tus compras.">
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216]">
            <div className="border-b border-white/[0.08] p-5 sm:p-6"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400"><IconUser size={23} /></div><div><h2 className="text-base font-semibold text-white">Información personal</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Estos datos se usarán para identificar tu cuenta.</p></div></div></div>
            <div className="space-y-6 p-5 sm:p-6">
                {notice && <div role="status" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}><IconCheck size={18} /> {notice.text}</div>}
                {loading ? <div className="flex min-h-48 items-center justify-center"><IconLoader2 className="animate-spin text-red-500" size={28} /></div> : <><div className="grid gap-5 sm:grid-cols-2"><Field label="Nombre" icon={IconUser} value={form.firstName} onChange={value => update("firstName", value)} autoComplete="given-name" required /><Field label="Apellido" icon={IconUser} value={form.lastName} onChange={value => update("lastName", value)} autoComplete="family-name" required /></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Correo electrónico" icon={IconMail} value={form.email} onChange={value => update("email", value)} type="email" autoComplete="email" required /><Field label="Teléfono" icon={IconPhone} value={form.phone_number ?? ""} onChange={value => update("phone_number", value)} type="tel" autoComplete="tel" placeholder="+56 9 1234 5678" /></div><div className="max-w-sm"><Field label="Fecha de nacimiento" icon={IconUser} value={form.birthDate ?? ""} onChange={value => update("birthDate", value)} type="date" autoComplete="bday" /></div></>}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex gap-3"><IconLock size={18} className="mt-0.5 shrink-0 text-zinc-500" /><div><p className="text-sm font-medium text-zinc-200">Tu cuenta está protegida</p><p className="mt-1 text-xs leading-5 text-zinc-500">Por seguridad, el cambio de contraseña se habilitará en una sección independiente.</p></div></div></div>
            </div>
            <div className="flex justify-end border-t border-white/[0.08] bg-white/[0.02] p-4 sm:px-6"><button type="submit" disabled={loading || saving || !profileId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <IconLoader2 className="animate-spin" size={18} /> : <IconDeviceFloppy size={18} />}{saving ? "Guardando..." : "Guardar cambios"}</button></div>
        </form>
    </AccountShell>;
}

function Field({ label, icon: Icon, value, onChange, type = "text", autoComplete, placeholder, required = false }: { label: string; icon: typeof IconUser; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; placeholder?: string; required?: boolean }) {
    return <label className="block"><span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span><span className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#090b0e] px-3 text-zinc-500 transition focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10"><Icon size={18} /><input value={value} onChange={event => onChange(event.target.value)} type={type} autoComplete={autoComplete} placeholder={placeholder} required={required} className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" /></span></label>;
}
