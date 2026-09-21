import type { ComponentPropsWithoutRef } from "react";

type ButtonColor = "primary" | "secondary";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
    children: React.ReactNode;
    color?: ButtonColor;
    bold?: boolean;
    size?: string;
};

function Button({ color, children, bold, size, className, ...props }: ButtonProps) {
    const selectedColor = color ?? "primary";
    const bg: Record<ButtonColor, string> = {
        primary: "bg-red-600",
        secondary: "bg-indigo-700",
    };
    const bgHover: Record<ButtonColor, string> = {
        primary: "hover:bg-red-700",
        secondary: "hover:bg-indigo-800",
    };
    const border: Record<ButtonColor, string> = {
        primary: "border-red-700",
        secondary: "border-indigo-800",
    };

    return (
        <button
            {...props}
            className={`${className ?? ""} flex justify-center items-center ${bg[selectedColor]} ${border[selectedColor]} ${bgHover[selectedColor]} ${bold ? "font-bold" : ""} ${size ? `text-${size}` : ""} border-2 text-white p-2 rounded-lg`}
        >
            {children}
        </button>
    );
}
export default Button;
