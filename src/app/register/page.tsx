"use client";

import Button from "@/components/Button";
import { IconUserEdit } from "@tabler/icons-react";
import axios from "axios";
import { ChangeEvent, useState } from "react";
import { User } from "../types/user.type";

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

    return (
        <form className="flex" onSubmit={registerUser}>
            <input type="text" name="firstName" placeholder="First Name" onChange={changeHandle} />
            <input type="text" name="lastName" placeholder="Last Name" onChange={changeHandle} />
            <input type="email" name="email" id="email" placeholder="example@rpm.cl" onChange={changeHandle} />
            <input type="password" name="password" id="password" placeholder="Password" onChange={changeHandle} />
            <Button type="submit" color="primary">
                <IconUserEdit stroke={1.5} />
                Register
            </Button>
        </form>
    );
}
