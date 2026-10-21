"use client";

import { IconAlertTriangle, IconArrowRight, IconCar, IconRefresh, IconSend, IconX } from "@tabler/icons-react";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    sku: string;
    imageUrl?: string | null;
    category?: string;
    brand?: string;
    stock?: number;
    slug?: string;
    model?: string;
}

export interface ChatMessage {
    id: string;
    sender: "user" | "assistant";
    text: string;
    timestamp: Date;
    products?: Product[];
    error?: boolean;
}

export interface ChatPayload {
    message: string;
    conversationId?: string;
}

export interface RPMChatResponse {
    message?: string;
    reply?: string;
    intent?: string;
    products?: unknown[];
    conversationId?: string | null;
}

interface RPMChatProps {
    mode?: "floating" | "embedded";
    apiUrl?: string;
    initialQuery?: string;
    onProductClick?: (product: Product) => void;
    authToken?: string;
}

const INITIAL_SUGGESTIONS = [
    "Busco repuestos para mi auto",
    "Necesito pastillas de freno",
    "Ayúdame a encontrar un filtro de aceite",
    "¿Qué repuestos necesito para mi vehículo?",
];

const WELCOME_MESSAGE =
    "¡Hola! Soy el asistente virtual de RPM (Repuestos por Minuto). 🚗⚡\n\n¿En qué te puedo ayudar hoy? Puedes preguntarme por repuestos específicos, compatibilidad de piezas o mantenimiento para tu vehículo.";

const formatCLP = (amount: number): string =>
    new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(amount);

const getApiBaseUrl = (): string => {
    const configuredUrl = process.env.BACKEND?.trim();
    return (configuredUrl || "http://localhost:3000").replace(/\/+$/, "");
};

function normalizeProduct(value: unknown, index: number): Product | null {
    if (!value || typeof value !== "object") return null;

    const item = value as Record<string, unknown>;
    const id = String(item.id ?? item.id_product ?? item.idProduct ?? "");
    const name = String(item.name ?? item.nombre ?? "").trim();

    if (!name) return null;

    const rawPrice = Number(item.price ?? item.precio ?? 0);
    const rawStock = Number(item.stock);

    return {
        id: id || String(item.sku ?? `product-${index}`),
        name,
        description:
            typeof item.description === "string"
                ? item.description
                : typeof item.descripcion === "string"
                  ? item.descripcion
                  : null,
        price: Number.isFinite(rawPrice) ? rawPrice : 0,
        sku: String(item.sku ?? `SKU-${index}`),
        imageUrl:
            typeof item.imageUrl === "string"
                ? item.imageUrl
                : typeof item.image_url === "string"
                  ? item.image_url
                  : typeof item.image === "string"
                    ? item.image
                    : null,
        category: typeof item.category === "string" ? item.category : undefined,
        brand: typeof item.brand === "string" ? item.brand : undefined,
        stock: Number.isFinite(rawStock) ? rawStock : undefined,
        slug: typeof item.slug === "string" ? item.slug : undefined,
        model: typeof item.model === "string" ? item.model : undefined,
    };
}

function getErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : "Ocurrió un error inesperado al consultar el asistente.";
    }

    const axiosError = error as AxiosError<{
        message?: string | string[];
        error?: string;
    }>;

    const status = axiosError.response?.status;
    const serverMessage = axiosError.response?.data?.message;

    if (status === 401) {
        return "Tu sesión no está autenticada o ha expirado. Inicia sesión nuevamente.";
    }

    if (status === 403) {
        return "No tienes permiso para utilizar este servicio de RPM.";
    }

    if (status === 400) {
        return Array.isArray(serverMessage)
            ? serverMessage.join(", ")
            : serverMessage || "La solicitud no es válida. Revisa el mensaje e inténtalo nuevamente.";
    }

    if (status === 404) {
        return "No se encontró el endpoint del asistente. Revisa la URL del backend.";
    }

    if (status === 429) {
        return "El asistente recibió demasiadas solicitudes. Espera un momento antes de volver a intentarlo.";
    }

    if (status && status >= 500) {
        return "El servidor de RPM tuvo un problema al procesar tu consulta. Inténtalo nuevamente.";
    }

    if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
        return "La solicitud tardó más de lo esperado. El backend o sus servicios de IA podrían estar demorando.";
    }

    if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
        return "No se pudo conectar con el backend. Comprueba que esté ejecutándose, que la URL sea correcta y que CORS permita la petición.";
    }

    if (Array.isArray(serverMessage)) return serverMessage.join(", ");
    if (serverMessage) return serverMessage;

    return "No se pudo completar la consulta. Inténtalo nuevamente.";
}

export default function RPMChat({ mode = "floating", apiUrl, initialQuery, onProductClick, authToken }: RPMChatProps) {
    const [isOpen, setIsOpen] = useState(mode === "embedded");
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome-1",
            sender: "assistant",
            text: WELCOME_MESSAGE,
            timestamp: new Date(),
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sendingRef = useRef(false);
    const initialQuerySentRef = useRef(false);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, []);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isLoading, isOpen, scrollToBottom]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, [inputMessage]);

    // Evita que la página del fondo se desplace al usar el chat móvil.
    useEffect(() => {
        if (mode !== "floating" || !isOpen) return;

        const isMobile = window.matchMedia("(max-width: 639px)").matches;
        if (!isMobile) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mode, isOpen]);

    const handleSendMessage = useCallback(
        async (textToSend?: string, isRetry = false) => {
            const messageText = (textToSend ?? inputMessage).trim();

            if (!messageText || sendingRef.current) return;

            sendingRef.current = true;
            setIsLoading(true);
            setApiError(null);
            setPendingMessage(messageText);

            if (!isRetry) {
                setMessages(previous => [
                    ...previous,
                    {
                        id: `user-${Date.now()}`,
                        sender: "user",
                        text: messageText,
                        timestamp: new Date(),
                    },
                ]);
            }

            setInputMessage("");

            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            try {
                const baseUrl = (apiUrl || getApiBaseUrl()).replace(/\/+$/, "");
                const endpoint = `${baseUrl}/ia/chat`;

                let token = authToken?.trim();

                if (!token && typeof window !== "undefined") {
                    try {
                        token = window.localStorage.getItem("token") || undefined;
                    } catch {
                        token = undefined;
                    }
                }

                const payload: ChatPayload = {
                    message: messageText,
                    ...(conversationId ? { conversationId } : {}),
                };

                const response = await axios.post<RPMChatResponse>(endpoint, payload, {
                    timeout: 60_000,
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                const data = response.data;

                const answer =
                    typeof data.message === "string" ? data.message : typeof data.reply === "string" ? data.reply : "";

                if (!answer.trim()) {
                    throw new Error("El servidor respondió, pero no entregó un mensaje válido.");
                }

                const normalizedProducts = Array.isArray(data.products)
                    ? data.products
                          .map((product, index) => normalizeProduct(product, index))
                          .filter((product): product is Product => product !== null)
                    : [];

                if (typeof data.conversationId === "string" && data.conversationId.length > 0) {
                    setConversationId(data.conversationId);
                }

                setMessages(previous => [
                    ...previous,
                    {
                        id: `assistant-${Date.now()}`,
                        sender: "assistant",
                        text: answer,
                        timestamp: new Date(),
                        products: normalizedProducts,
                    },
                ]);

                setPendingMessage(null);
            } catch (error: unknown) {
                console.error("[RPM Chat Error]", {
                    error,
                    endpoint: `${(apiUrl || getApiBaseUrl()).replace(/\/+$/, "")}/ia/chat`,
                    status: axios.isAxiosError(error) ? error.response?.status : undefined,
                    response: axios.isAxiosError(error) ? error.response?.data : undefined,
                });

                const errorMessage = getErrorMessage(error);
                setApiError(errorMessage);

                setMessages(previous => [
                    ...previous,
                    {
                        id: `error-${Date.now()}`,
                        sender: "assistant",
                        text: `⚠️ Ocurrió un inconveniente.\n\n${errorMessage}`,
                        timestamp: new Date(),
                        error: true,
                    },
                ]);
            } finally {
                sendingRef.current = false;
                setIsLoading(false);
            }
        },
        [apiUrl, authToken, conversationId, inputMessage],
    );

    useEffect(() => {
        if (!initialQuery?.trim() || initialQuerySentRef.current) {
            return;
        }

        initialQuerySentRef.current = true;
        void handleSendMessage(initialQuery);
    }, [initialQuery, handleSendMessage]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSendMessage();
        }
    };

    const renderProductCard = (product: Product) => {
        const productId = product.id;

        return (
            <div
                key={productId || product.sku}
                className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#14171d] p-3 shadow-md transition-colors hover:border-red-500/40 hover:bg-[#181c24]"
            >
                <div className="flex min-w-0 gap-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0d0f13] sm:h-20 sm:w-20">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={event => {
                                    event.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-zinc-500">
                                <IconCar size={24} stroke={1.4} />
                                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">RPM</span>
                            </div>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="min-w-0">
                            {product.brand && (
                                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-red-400">
                                    {product.brand}
                                </span>
                            )}

                            <h4 className="break-words text-xs font-bold leading-snug text-white transition-colors group-hover:text-red-400">
                                {product.name}
                            </h4>

                            {product.sku && (
                                <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-500">
                                    SKU: {product.sku}
                                </p>
                            )}

                            {product.description && (
                                <p className="mt-1 line-clamp-2 break-words text-[11px] text-zinc-400">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
                            <span className="text-sm font-extrabold text-white">{formatCLP(product.price)}</span>

                            {productId ? (
                                <Link
                                    href={`/catalogo/${encodeURIComponent(productId)}`}
                                    onClick={() => {
                                        onProductClick?.(product);

                                        if (mode === "floating") {
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-500"
                                >
                                    <span>Ver pieza</span>
                                    <IconArrowRight size={12} />
                                </Link>
                            ) : (
                                <span className="text-[10px] text-zinc-500">ID no disponible</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const chatContent = (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[#0d0f13] text-zinc-100 shadow-2xl antialiased sm:rounded-2xl">
            {/* Encabezado */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#12151b] px-3 py-3 text-white sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 font-black text-white shadow-lg shadow-red-950/40">
                        <span className="text-xs tracking-tighter">RPM</span>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f13]" />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold tracking-tight text-white">Chat Piston</h3>
                        <p className="truncate text-[11px] text-zinc-400">Catálogo & Repuestos Automotrices</p>
                    </div>
                </div>

                {mode === "floating" && (
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Cerrar chat"
                        className="ml-2 shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <IconX size={20} />
                    </button>
                )}
            </div>

            {/* Mensajes */}
            <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain p-3 sm:p-4">
                {messages.map(msg => {
                    const isUser = msg.sender === "user";

                    return (
                        <div key={msg.id} className={`flex min-w-0 flex-col ${isUser ? "items-end" : "items-start"}`}>
                            <div
                                className={`min-w-0 max-w-[95%] overflow-hidden rounded-2xl px-3 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[92%] sm:px-4 ${
                                    isUser
                                        ? "rounded-br-sm bg-red-600 font-medium text-white"
                                        : msg.error
                                          ? "rounded-bl-sm border border-amber-500/20 bg-amber-500/10 text-amber-200"
                                          : "rounded-bl-sm border border-white/10 bg-[#14171d] text-zinc-200"
                                }`}
                            >
                                <div className="break-words [overflow-wrap:anywhere] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            strong: ({ children }) => (
                                                <strong className="font-bold text-white">{children}</strong>
                                            ),
                                            em: ({ children }) => <em className="italic">{children}</em>,
                                            ul: ({ children }) => (
                                                <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
                                            ),
                                            li: ({ children }) => <li className="pl-1">{children}</li>,
                                            h1: ({ children }) => (
                                                <h1 className="mb-2 mt-3 text-lg font-bold text-white">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="mb-2 mt-3 text-base font-bold text-white">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="mb-1 mt-2 text-sm font-bold text-white">{children}</h3>
                                            ),
                                            code: ({ children }) => (
                                                <code className="break-words rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-red-300 [overflow-wrap:anywhere]">
                                                    {children}
                                                </code>
                                            ),
                                            a: ({ children, href }) => (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-words text-red-400 underline underline-offset-2 hover:text-red-300"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                            hr: () => <hr className="my-3 border-white/10" />,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>

                                {msg.products && msg.products.length > 0 && (
                                    <div className="mt-3 min-w-0 space-y-2 border-t border-white/10 pt-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 sm:text-[11px]">
                                            Repuestos encontrados ({msg.products.length})
                                        </p>

                                        <div className="grid min-w-0 grid-cols-1 gap-2">
                                            {msg.products.map(renderProductCard)}
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`mt-2 text-right text-[10px] ${
                                        isUser ? "text-red-200" : "text-zinc-500"
                                    }`}
                                >
                                    {msg.timestamp.toLocaleTimeString("es-CL", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex items-start gap-2">
                        <div className="flex max-w-full items-center gap-2 rounded-2xl rounded-bl-sm border border-white/10 bg-[#14171d] px-3 py-3 text-xs text-zinc-400 sm:px-4">
                            <IconRefresh className="shrink-0 animate-spin text-red-500" size={16} />
                            <span className="font-medium text-zinc-300">RPM buscando repuestos...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Sugerencias */}
            {messages.length <= 2 && !isLoading && (
                <div className="max-h-32 shrink-0 overflow-y-auto border-t border-white/10 bg-[#12151b]/80 px-3 py-2.5 sm:max-h-36 sm:px-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
                        Consultas frecuentes
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        {INITIAL_SUGGESTIONS.map(suggestion => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => void handleSendMessage(suggestion)}
                                className="max-w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Errores */}
            {apiError && (
                <div className="flex shrink-0 items-start justify-between gap-2 border-t border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:px-4">
                    <span className="flex min-w-0 items-start gap-1.5">
                        <IconAlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
                        <span className="break-words [overflow-wrap:anywhere]">{apiError}</span>
                    </span>

                    <button
                        type="button"
                        disabled={isLoading || !pendingMessage}
                        onClick={() => {
                            if (pendingMessage) {
                                void handleSendMessage(pendingMessage, true);
                            }
                        }}
                        className="shrink-0 py-1 font-bold text-red-400 underline hover:text-red-300 disabled:opacity-40"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Entrada de mensajes */}
            <div className="shrink-0 border-t border-white/10 bg-[#12151b] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-3">
                <form
                    onSubmit={event => {
                        event.preventDefault();
                        void handleSendMessage();
                    }}
                    className="flex items-end gap-2"
                >
                    <div className="relative min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0d0f13] transition-colors focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputMessage}
                            onChange={event => setInputMessage(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ej: pastillas Chevrolet Sail 2020..."
                            disabled={isLoading}
                            aria-label="Escribe tu consulta"
                            className="block max-h-[120px] min-h-[42px] w-full resize-none bg-transparent px-3 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-50 sm:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isLoading}
                        aria-label="Enviar mensaje"
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
                    >
                        <IconSend size={18} />
                    </button>
                </form>

                <p className="mt-1.5 hidden text-center text-[10px] text-zinc-500 sm:block">
                    Asistente RPM con Inteligencia Artificial. Presiona Enter para enviar.
                </p>
                <p className="mt-1.5 text-center text-[10px] text-zinc-500 sm:hidden">
                    Enter para enviar · Shift + Enter para nueva línea
                </p>
            </div>
        </div>
    );

    if (mode === "embedded") {
        return (
            <div className="mx-auto flex h-[min(720px,80dvh)] min-h-[420px] w-full max-w-5xl flex-col sm:h-[650px]">
                {chatContent}
            </div>
        );
    }

    return (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 sm:bottom-5 sm:right-5">
            {isOpen ? (
                <div className="fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[#0d0f13] sm:absolute sm:inset-auto sm:bottom-0 sm:right-0 sm:h-[min(650px,calc(100dvh-3rem))] sm:w-[min(420px,calc(100vw-2.5rem))] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-2xl sm:bg-transparent sm:animate-in sm:slide-in-from-bottom-4 sm:fade-in sm:duration-200">
                    {chatContent}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0d0f13] px-3 py-3 text-white shadow-2xl shadow-black/80 transition-colors hover:border-red-500 hover:bg-red-600 sm:px-4"
                    aria-label="Abrir Asistente RPM"
                >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white transition-colors group-hover:bg-[#0d0f13]">
                        RPM
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0f13]" />
                    </div>

                    <span className="pr-1 text-xs font-bold tracking-tight">Chat Piston</span>
                </button>
            )}
        </div>
    );
}
