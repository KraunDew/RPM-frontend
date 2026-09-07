import type { ComponentPropsWithoutRef } from "react";

type ButtonColor = "primary" | "secondary";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
    children: React.ReactNode;
    color?: ButtonColor;
    bold?: boolean;
};

function Button({ color, children, bold, ...props }: ButtonProps) {
    const selectedColor = color ?? "primary";
    const bg: Record<ButtonColor, string> = {
        primary: "bg-red-600",
        secondary: "bg-blue-800",
    };
    const bgHover: Record<ButtonColor, string> = {
        primary: "hover:bg-red-700",
        secondary: "hover:bg-blue-900",
    };
    const border: Record<ButtonColor, string> = {
        primary: "border-red-700",
        secondary: "border-blue-900",
    };

    return (
        <button
            {...props}
            className={`flex m-4 ${bg[selectedColor]} ${border[selectedColor]} ${bgHover[selectedColor]} ${bold ? "font-bold" : ""} border-2 text-white p-2 rounded-lg m-2`}
        >
            {children}
        </button>
    );
}
export default Button;
