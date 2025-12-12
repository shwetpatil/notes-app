import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
                        "bg-white text-gray-900",
                        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className
                    )}
                    aria-invalid={!!error}
                    {...props}
                />        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
