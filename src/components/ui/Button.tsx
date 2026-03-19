import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "danger" | "primary";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  return (
    <button
      className={clsx(
        "rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",

        // Sizes
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",
        size === "icon" && "p-2", // Icon size

        // Variants
        variant === "default" &&
          "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200",
        variant === "primary" &&
          "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600",
        variant === "outline" &&
          "border border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
        variant === "danger" &&
          "bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600",

        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
