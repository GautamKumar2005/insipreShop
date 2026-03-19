import React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className = "", ...props }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    {...props}
  />
);

export { Skeleton };