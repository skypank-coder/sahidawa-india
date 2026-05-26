import React from "react";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200 ${className}`}
            {...props}
        />
    );
}
