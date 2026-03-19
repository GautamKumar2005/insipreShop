import React, { forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          {...props}
          className={clsx(
            "w-full rounded-md border px-3 py-2 text-sm outline-none transition bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className,
          )}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
