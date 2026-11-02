"use client";

import AccountShell from "@/components/AccountShell";
import { IconAlertCircle, IconLoader2, IconMapPin, IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import axios from "axios";
import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");
type Address = { id_address: string; street: string; house_number: string; department?: string | null; block?: string | null; comune: string; region: string; reference?: string | null };
type AddressDraft = Omit<Address, "id_address">;
const emptyAddress: AddressDraft = { street: "", house_number: "", department: "", block: "", comune: "", region: "", reference: "" };
function getError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const message = error.response?.data?.message; return Array.isArray(message) ? message.join(", ") : message || fallback; }

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [draft, setDraft] = useState<AddressDraft>(emptyAddress);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAddresses = async () => {
        if (!API_URL) { setError("No se configuró la conexión con el servidor."); setLoading(false); return; }
        try { const { data } = await axios.get<Address[]>(`${API_URL}/addresses`, { withCredentials: true }); setAddresses(Array.isArray(data) ? data : []); }
        catch (requestError) { setError(getError(requestError, "No pudimos cargar tus direcciones.")); }
        finally { setLoading(false); }
    };
    useEffect(() => { void loadAddresses(); }, []);

    const closeForm = () => { setFormOpen(false); setEditingId(null); setDraft(emptyAddress); };
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!API_URL || saving) return;
        setSaving(true); setError(null);
        const payload = { ...draft, department: draft.department || undefined, block: draft.block || undefined, reference: draft.reference || undefined };
        try {
            if (editingId) { const { data } = await axios.patch<Address>(`${API_URL}/addresses/${editingId}`, payload, { withCredentials: true }); setAddresses(items => items.map(item => item.id_address === editingId ? data : item)); }
            else { const { data } = await axios.post<Address>(`${API_URL}/addresses`, payload, { withCredentials: true }); setAddresses(items => [...items, data]); }
            closeForm();
        } catch (requestError) { setError(getError(requestError, "No pudimos guardar la dirección.")); }
        finally { setSaving(false); }
    };
    const remove = async (id: string) => {
        if (!API_URL || !window.confirm("¿Eliminar esta dirección?")) return;
        setError(null);
        try { await axios.delete(`${API_URL}/addresses/${id}`, { withCredentials: true }); setAddresses(items => items.filter(item => item.id_address !== id)); }
        catch (requestError) { setError(getError(requestError, "No pudimos eliminar la dirección.")); }
    };
    const edit = (address: Address) => { setEditingId(address.id_address); setDraft({ street: address.street, house_number: address.house_number, department: address.department ?? "", block: address.block ?? "", comune: address.comune, region: address.region, reference: address.reference ?? "" }); setFormOpen(true); };

    return <AccountShell active="direcciones" title="Mis direcciones" description="Administra las direcciones que podrás seleccionar al momento de comprar.">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216]">
            <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-base font-semibold text-white">Direcciones guardadas</h2><p className="mt-1 text-sm text-zinc-500">Agrega, edita o elimina direcciones de entrega.</p></div><button onClick={() => setFormOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500"><IconPlus size={18} /> Agregar dirección</button></div>
            {error && <div role="alert" className="m-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"><IconAlertCircle size={18} /> {error}</div>}
            {loading ? <div className="flex min-h-[320px] items-center justify-center"><IconLoader2 className="animate-spin text-red-500" size={30} /></div> : addresses.length === 0 ? <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-500"><IconMapPin size={30} /></div><h3 className="mt-5 text-lg font-semibold text-white">No tienes direcciones guardadas</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Agrega una dirección para hacer más rápido tu próximo pedido.</p></div> : <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{addresses.map(address => <article key={address.id_address} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400"><IconMapPin size={19} /></div><div className="flex gap-1"><button onClick={() => edit(address)} aria-label="Editar dirección" className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"><IconPencil size={17} /></button><button onClick={() => void remove(address.id_address)} aria-label="Eliminar dirección" className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"><IconTrash size={17} /></button></div></div><p className="mt-4 text-sm font-semibold text-white">{address.street} {address.house_number}</p>{(address.department || address.block) && <p className="mt-1 text-sm text-zinc-400">{[address.department, address.block].filter(Boolean).join(", ")}</p>}<p className="mt-1 text-sm text-zinc-400">{address.comune}, {address.region}</p>{address.reference && <p className="mt-3 text-xs text-zinc-500">Ref.: {address.reference}</p>}</article>)}</div>}
        </div>
        {formOpen && <div className="fixed inset-0 z-[70] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><form onSubmit={submit} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#14171d] shadow-2xl sm:max-w-xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-white/[0.08] p-5"><div><h2 className="font-semibold text-white">{editingId ? "Editar dirección" : "Nueva dirección"}</h2><p className="mt-1 text-xs text-zinc-500">Completa los datos de entrega.</p></div><button type="button" onClick={closeForm} aria-label="Cerrar" className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white"><IconX size={20} /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><AddressField label="Calle" value={draft.street} onChange={value => setDraft({ ...draft, street: value })} /><AddressField label="Número" value={draft.house_number} onChange={value => setDraft({ ...draft, house_number: value })} /><AddressField label="Departamento" value={draft.department ?? ""} onChange={value => setDraft({ ...draft, department: value })} required={false} /><AddressField label="Block / condominio" value={draft.block ?? ""} onChange={value => setDraft({ ...draft, block: value })} required={false} /><AddressField label="Comuna" value={draft.comune} onChange={value => setDraft({ ...draft, comune: value })} /><AddressField label="Región" value={draft.region} onChange={value => setDraft({ ...draft, region: value })} /><div className="sm:col-span-2"><AddressField label="Referencia" value={draft.reference ?? ""} onChange={value => setDraft({ ...draft, reference: value })} required={false} /></div></div><div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] p-5 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-300 hover:bg-white/[0.05]">Cancelar</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">{saving && <IconLoader2 className="animate-spin" size={17} />}{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar dirección"}</button></div></form></div>}
    </AccountShell>;
}

function AddressField({ label, value, onChange, required = true }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span><input value={value} required={required} onChange={event => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/60" /></label>; }
