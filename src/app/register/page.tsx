"use client";

import Button from "@/components/Button";
import Header from "@/components/Header";
import { Input } from "@/components/motion/input";
import { IconEye, IconEyeOff, IconMail, IconUserEdit } from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
    const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
        // se ejecuta al mandar el formularioj
        e.preventDefault(); // evitamos que se recargue la pagina
        const user = {
            firstName,
            lastName,
            email,
            password: pass,
        };
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND}/users/register`, user, {
            withCredentials: true,
        }); // al backend le pasamos los valores obtenidos
        localStorage.setItem("user", JSON.stringify(res.data));
        redirect("/");
    };

    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [pass, setPass] = useState("");
    const [show, setShow] = useState(false);

    const emailError = email.length > 0 && !email.includes("@") ? "Enter a valid email address." : undefined;

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
                        <Input
                            classNames={{
                                label: "px-1 text-base font-medium text-white",
                                field: "bg-indigo-900 border-transparent rounded-lg h-12",
                                input: "!text-white !placeholder-indigo-300",
                            }}
                            label="Primer Nombre"
                            type="text"
                            value={firstName}
                            onChange={setFirstName}
                            name="firstName"
                            id="firstName"
                            placeholder="Nombre"
                            required
                        />
                        <Input
                            classNames={{
                                label: "px-1 text-base font-medium text-white",
                                field: "bg-indigo-900 border-transparent rounded-lg h-12",
                                input: "!text-white !placeholder-indigo-300",
                            }}
                            label="Apellido"
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Apellido"
                            value={lastName}
                            onChange={setLastName}
                            required
                        />
                        <Input
                            classNames={{
                                label: "px-1 text-base font-medium text-white",
                                field: "bg-indigo-900 border-transparent rounded-lg h-12",
                                input: "!text-white !placeholder-indigo-300",
                            }}
                            label="Email"
                            type="email"
                            name="email"
                            id="email"
                            placeholder="example@rpm.cl"
                            rightIcon={<IconMail className="text-white mr-4" size={64} />}
                            value={email}
                            onChange={setEmail}
                            error={emailError}
                            required
                        />
                        <Input
                            classNames={{
                                label: "px-1 text-base font-medium text-white",
                                field: "bg-indigo-900 border-transparent rounded-lg h-12",
                                input: "!text-white !placeholder-indigo-300",
                            }}
                            label="Contraseña"
                            type={show ? "text" : "password"}
                            value={pass}
                            onChange={setPass}
                            name="password"
                            id="password"
                            placeholder="Contraseña"
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShow(s => !s)}
                                    aria-label={show ? "Ocultar Contraseña" : "Mostar contraseña"}
                                    className="pointer-events-auto"
                                >
                                    {show ? <IconEye className="text-white" /> : <IconEyeOff className="text-white" />}
                                </button>
                            }
                            required
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
