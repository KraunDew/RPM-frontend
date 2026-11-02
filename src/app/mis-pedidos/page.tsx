"use client";

import AccountShell from "@/components/AccountShell";
import { IconAlertCircle, IconBox, IconCalendar, IconChevronRight, IconLoader2, IconPackage, IconShoppingBag } from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND?.replace(/\/+$/, "");
type Order = { id_order: string; date: string; total: number; method: string; status: string; detailOrders: { id_detail: string; amount: number; unit_price: number; product: { name: string; sku?: string | null } }[] };

const formatPrice = (amount: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);
const formatDate = (date: string) => new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(date));
const statusStyle: Record<string, string> = { PAID: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400", PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-400", CANCELLED: "border-red-500/20 bg-red-500/10 text-red-400" };

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!API_URL) { setError("No se configuró la conexión con el servidor."); setLoading(false); return; }
        axios.get<Order[]>(`${API_URL}/orders/me`, { withCredentials: true })
            .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
            .catch(() => setError("No pudimos cargar tus pedidos. Inténtalo nuevamente."))
            .finally(() => setLoading(false));
    }, []);

    return <AccountShell active="pedidos" title="Mis pedidos" description="Consulta el estado y el detalle de todas las compras realizadas con tu cuenta RPM.">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216]">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-base font-semibold text-white">Historial de pedidos</h2><p className="mt-1 text-sm text-zinc-500">Tus compras aparecen ordenadas desde la más reciente.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400"><IconShoppingBag size={15} /> {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</span></div>
            {loading ? <div className="flex min-h-[340px] items-center justify-center"><IconLoader2 className="animate-spin text-red-500" size={30} /></div> : error ? <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center"><IconAlertCircle className="text-red-400" size={36} /><p className="mt-4 text-sm text-zinc-400">{error}</p></div> : orders.length === 0 ? <EmptyOrders /> : <div className="space-y-4 p-5 sm:p-6">{orders.map(order => <OrderCard key={order.id_order} order={order} />)}</div>}
        </div>
    </AccountShell>;
}

function OrderCard({ order }: { order: Order }) {
    const status = order.status.toUpperCase();
    return <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"><div className="flex flex-col gap-4 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs text-zinc-500">Pedido #{order.id_order.slice(-8).toUpperCase()}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400"><IconCalendar size={14} /> {formatDate(order.date)}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? "border-white/10 bg-white/[0.04] text-zinc-300"}`}>{status === "PAID" ? "Pagado" : status === "PENDING" ? "Pendiente" : status === "CANCELLED" ? "Cancelado" : status}</span><p className="text-lg font-bold text-white">{formatPrice(Number(order.total))}</p></div></div><div className="space-y-3 p-4">{order.detailOrders.map(detail => <div key={detail.id_detail} className="flex items-center justify-between gap-4 text-sm"><div className="min-w-0"><p className="truncate font-medium text-zinc-200">{detail.product.name}</p>{detail.product.sku && <p className="mt-0.5 text-xs text-zinc-500">SKU: {detail.product.sku}</p>}</div><p className="shrink-0 text-zinc-400">{detail.amount} × {formatPrice(Number(detail.unit_price))}</p></div>)}</div><div className="border-t border-white/[0.08] px-4 py-3 text-xs text-zinc-500">Método de pago: <span className="font-medium text-zinc-300">{order.method}</span></div></article>;
}

function EmptyOrders() { return <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-14 text-center"><div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/15 bg-red-500/[0.08] text-red-400"><IconPackage size={37} stroke={1.5} /><span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#14171d] text-zinc-400"><IconBox size={14} /></span></div><h3 className="mt-6 text-lg font-semibold text-white">Aún no tienes pedidos</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Cuando completes una compra, aquí podrás revisar sus productos, fecha, total y estado de envío.</p><Link href="/catalogo" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500">Explorar catálogo <IconChevronRight size={17} /></Link></div>; }
