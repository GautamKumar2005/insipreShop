import React from "react";
import clsx from "clsx";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  fullScreen = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        fullScreen &&
          "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
        !fullScreen && "inline-flex items-center justify-center",
        className
      )}
    >
      <span
        className={clsx(
          "inline-block animate-spin rounded-full border-4 border-gray-300 border-t-black",

          size === "sm" && "h-4 w-4 border-2",
          size === "md" && "h-6 w-6 border-2",
          size === "lg" && "h-10 w-10 border-4"
        )}
      />
    </div>
  );
};
