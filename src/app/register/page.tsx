"use client";

import Button from "@/components/Button";
import Header from "@/components/Header";
import { IconUserEdit } from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { User } from "../types/user.type"; // llamamos al type User

export default function RegisterPage() {
    const [user, setUser] = useState<User>({ firstName: "", lastName: "", email: "", password: "" }); // Plantilla en vacio

    const changeHandle = (e: ChangeEvent<HTMLInputElement>) => {
        // al escribir en los inputs ejecutamos
        const { name, value } = e.target;
        setUser(rest => ({ ...rest, [name]: value })); // le damos valores a la plantilla vacia
    };

    const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
        // se ejecuta al mandar el formularioj
        e.preventDefault(); // evitamos que se recargue la pagina
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND}/users/register`, user); // al backend le pasamos los valore obtenidos
    };

    /**
     * Ahora renderizamos el formulario de registro
     * con sus campos correspondientes, nombre, apellido, correo y contraseña
     * al darle al componente Button se envia al backend los datos guardados en "user"
     */
    return (
        <>
            <Header />

            <div className="flex justify-center items-center min-h-[80vh] px-4">
                <form
                    className="flex flex-col p-8 bg-indigo-800 rounded-2xl w-full max-w-md shadow-xl/30"
                    onSubmit={registerUser}
                >
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex justify-center items-center w-14 h-14 mb-3 bg-indigo-700 rounded-full">
                            <IconUserEdit size={30} stroke={1.5} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-white">Regístrate</h2>

                        <p className="mt-2 text-sm text-indigo-200">Crea tu cuenta para continuar</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <input
                            className="w-full h-12 px-4 text-white placeholder-indigo-300 bg-indigo-900 rounded-lg outline-none border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 transition"
                            type="text"
                            name="firstName"
                            id="firstName"
                            placeholder="Nombre"
                            onChange={changeHandle}
                        />
                        <input
                            className="w-full h-12 px-4 text-white placeholder-indigo-300 bg-indigo-900 rounded-lg outline-none border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 transition"
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Apellido"
                            onChange={changeHandle}
                        />
                        <input
                            className="w-full h-12 px-4 text-white placeholder-indigo-300 bg-indigo-900 rounded-lg outline-none border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 transition"
                            type="email"
                            name="email"
                            id="email"
                            placeholder="example@rpm.cl"
                            onChange={changeHandle}
                        />
                        <input
                            className="w-full h-12 px-4 text-white placeholder-indigo-300 bg-indigo-900 rounded-lg outline-none border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 transition"
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Contraseña"
                            onChange={changeHandle}
                        />
                    </div>

                    <div className="mt-6 w-fill flex justify-center items-center">
                        <Button type="submit" color="primary" size="xl">
                            <IconUserEdit className="mr-2" stroke={1.5} />
                            Registrarse
                        </Button>
                    </div>
                    <p className="text-white w-full text-center mt-4 text-lg">¿Ya tienes cuenta?</p>
                    <Link href="/login" className="underline text-red-400 text-center text-lg font-bold w-full">
                        Inicia sesion aqui
                    </Link>
                </form>
            </div>
        </>
    );
}
