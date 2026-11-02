import AccountShell from "@/components/AccountShell";
import { IconBox, IconCalendar, IconChevronRight, IconPackage, IconShoppingBag } from "@tabler/icons-react";
import Link from "next/link";

export default function MyOrdersPage() {
    return (
        <AccountShell
            active="pedidos"
            title="Mis pedidos"
            description="Consulta el estado y el detalle de todas las compras realizadas con tu cuenta RPM."
        >
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216]">
                <div className="flex flex-col gap-3 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h2 className="text-base font-semibold text-white">Historial de pedidos</h2>
                        <p className="mt-1 text-sm text-zinc-500">Tus compras aparecerán ordenadas desde la más reciente.</p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400">
                        <IconShoppingBag size={15} /> 0 pedidos
                    </span>
                </div>

                <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/15 bg-red-500/[0.08] text-red-400">
                        <IconPackage size={37} stroke={1.5} />
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#14171d] text-zinc-400">
                            <IconBox size={14} />
                        </span>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-white">Aún no tienes pedidos</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Cuando completes una compra, aquí podrás revisar sus productos, fecha, total y estado de envío.</p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500">
                            Explorar catálogo <IconChevronRight size={17} />
                        </Link>
                        <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs text-zinc-500">
                            <IconCalendar size={16} /> Próximamente: historial conectado
                        </span>
                    </div>
                </div>
            </div>
        </AccountShell>
    );
}
