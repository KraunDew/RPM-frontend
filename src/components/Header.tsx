"use client";
import {
    IconHeart,
    IconHome,
    IconLayoutGrid,
    IconShoppingCart,
    IconTool,
    IconUserCircle,
    IconUsersGroup,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";

function Header() {
    const lista = [
        { name: "Inicio", route: "/", icon: <IconHome className="mr-2" /> },
        { name: "Talleres Aliados", route: "/workshops", icon: <IconTool className="mr-2" /> },
        { name: "Catálogo", route: "/catalog", icon: <IconLayoutGrid className="mr-2" /> },
        { name: "Sobre Nosotros", route: "/about", icon: <IconUsersGroup className="mr-2" /> },
    ];
    const pathname = usePathname();
    return (
        <nav className="flex bg-indigo-800 h-32 justify-between items-center">
            <Link href="/">
                <Image
                    src="/assets/logo.png"
                    alt="RPM (Revoluciones por Minuto) Logo"
                    width={150}
                    height={1}
                    className="w-auto h-full mb-4 mx-6"
                    loading="eager"
                />
            </Link>
            <div>
                <ul className="flex justify-between">
                    {lista.map(elemento => (
                        <li
                            key={elemento.name}
                            className={`m-4 py-2 text-lg px-4 bg-transparent text-white ${elemento.route == pathname ? "border-b-red-600 border-b-4" : "hover:border-1 hover:border-b-4 hover:border-red-600"} rounded-lg hover:bg-red-500/40`}
                        >
                            <Link href={elemento.route} className="flex">
                                {elemento.icon}
                                {elemento.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <ul className="flex">
                    <li className="m-4 py-2 px-4 text-white flex text-lg">
                        <IconShoppingCart className="mr-2" />
                        Carrito
                    </li>
                    <li className="m-4 py-2 px-4 text-white flex text-lg">
                        <IconHeart className="mr-2" />
                        Favoritos
                    </li>
                    <li>
                        <Button color="primary" className="m-4">
                            <Link href="/register" className="flex text-lg justify-center items-center">
                                <IconUserCircle className="mr-2" />
                                Registrar / Iniciar Sesion
                            </Link>
                        </Button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Header;
