"use client";
import type { User } from "@/app/types/user.type";
import {
    IconHeart,
    IconHome,
    IconLayoutGrid,
    IconLogout2,
    IconShoppingCart,
    IconTool,
    IconUserCircle,
    IconUsersGroup,
} from "@tabler/icons-react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./motion/popover";

function Header() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storageUser = localStorage.getItem("user");
        if (storageUser) {
            setUser(JSON.parse(storageUser));
        }
    }, []);

    const lista = [
        { name: "Inicio", route: "/", icon: <IconHome className="mr-2" /> },
        { name: "Talleres Aliados", route: "/workshops", icon: <IconTool className="mr-2" /> },
        { name: "Catálogo", route: "/catalog", icon: <IconLayoutGrid className="mr-2" /> },
        { name: "Sobre Nosotros", route: "/about", icon: <IconUsersGroup className="mr-2" /> },
    ];
    const pathname = usePathname();

    const logout = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND}/users/logout`,
                {},
                {
                    withCredentials: true,
                },
            );

            localStorage.removeItem("user");
            setUser(null);

            redirect("/");
        } catch (error) {
            console.log("Logout failed:", error);
            // Still clear local session even if backend logout fails
            localStorage.removeItem("user");
            setUser(null);
            redirect("/");
        }
    };

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
                        {user ? (
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Popover side="bottom" align="end">
                                    <PopoverTrigger>
                                        <button className="m-4 rounded-full flex justify-center border-2 border-red-700 items-center text-white">
                                            <Image
                                                src={`https://ui-avatars.com/api/?background=random&name=${user.firstName}`}
                                                alt="Foto usuario"
                                                height={40}
                                                width={40}
                                                className="w-10 rounded-full"
                                                unoptimized
                                            />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <ul>
                                            <li>
                                                <button
                                                    className="flex text-red-500"
                                                    onClick={() => {
                                                        console.log("Logout");
                                                        logout();
                                                    }}
                                                >
                                                    <IconLogout2 className="mr-2" />
                                                    Cerrar Sesion
                                                </button>
                                            </li>
                                        </ul>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : (
                            <Button color="primary" className="m-4">
                                <Link href="/register" className="flex text-lg justify-center items-center">
                                    <IconUserCircle className="mr-2" />
                                    Registrar / Iniciar Sesion
                                </Link>
                            </Button>
                        )}
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Header;
