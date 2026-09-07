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
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";

function Header() {
    const lista = [
        { name: "Inicio", route: "/", icon: <IconHome className="mr-2" /> },
        { name: "Talleres Aliados", route: "/talleres", icon: <IconTool className="mr-2" /> },
        { name: "Catálogo", route: "/catalogo", icon: <IconLayoutGrid className="mr-2" /> },
        { name: "Sobre Nosotros", route: "/about", icon: <IconUsersGroup className="mr-2" /> },
    ];
    const pathname = usePathname();
    return (
        <nav className="flex bg-indigo-800 h-20 justify-between items-center">
            <div>
                <ul className="flex">
                    {lista.map(elemento => (
                        <li
                            key={elemento.name}
                            className={`m-4 py-2 px-4 bg-transparent text-white ${elemento.route == pathname ? "border-b-red-600 border-b-4" : "hover:border-1 hover:border-red-600"} hover:rounded-lg hover:bg-red-500/40`}
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
                    <li className="m-4 py-2 px-4 text-white flex">
                        <IconShoppingCart className="mr-2" />
                        Carrito
                    </li>
                    <li className="m-4 py-2 px-4 text-white flex">
                        <IconHeart className="mr-2" />
                        Favoritos
                    </li>
                    <li>
                        <Button color="primary">
                            <Link href="/register" className="flex">
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
