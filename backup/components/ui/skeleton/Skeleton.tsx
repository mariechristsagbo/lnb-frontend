import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

const SkeletonLoader = ({ className = "", count = 1 }: SkeletonProps) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
        />
      ))}
    </>
  );
};

export default SkeletonLoader;