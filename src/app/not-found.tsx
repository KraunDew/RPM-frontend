import Button from "@/components/Button";
import Link from "next/link";

function NotFound() {
    return (
        <div className="min-h-screen w-full bg-indigo-900 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-8xl font-bold text-white">404</h1>

                <p className="mt-4 text-2xl text-white">Página no encontrada</p>

                <p className="mt-2 text-lg text-indigo-200">La página que buscas no existe o fue movida.</p>

                <Button className="my-4 mx-auto">
                    <Link href="/" className="text-3xl">
                        Volver al inicio
                    </Link>
                </Button>
            </div>
        </div>
    );
}

export default NotFound;
