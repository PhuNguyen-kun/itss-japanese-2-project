import { Loader2 } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} aria-hidden />;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? 18 : size === "lg" ? 48 : 32;
  return (
    <Loader2
      className={`animate-spin text-indigo-600 ${className}`}
      size={px}
      aria-hidden
    />
  );
}

const pagePadding = "p-4 sm:p-6 lg:p-8";

function DashboardSkeleton() {
  return (
    <div className={`${pagePadding} space-y-6 sm:space-y-8`}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 sm:h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className={`${pagePadding} space-y-6 sm:space-y-8`}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={`${pagePadding} space-y-6 sm:space-y-8`}>
      <Skeleton className="h-5 w-36" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function DepositSkeleton() {
  return (
    <div className={`${pagePadding} space-y-4 sm:space-y-6`}>
      <div className="space-y-2 pt-2 sm:pt-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className={`${pagePadding} max-w-4xl mx-auto w-full space-y-4 sm:space-y-6`}>
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4 max-w-sm" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function SpinnerFallback() {
  return (
    <div
      className={`${pagePadding} flex flex-col items-center justify-center min-h-[40vh] gap-4`}
      role="status"
      aria-busy="true"
    >
      <LoadingSpinner size="lg" />
    </div>
  );
}

export type PageLoadingVariant =
  | "dashboard"
  | "list"
  | "detail"
  | "deposit"
  | "form"
  | "spinner";

export function PageLoading({ variant = "spinner" }: { variant?: PageLoadingVariant }) {
  switch (variant) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "list":
      return <ListSkeleton />;
    case "detail":
      return <DetailSkeleton />;
    case "deposit":
      return <DepositSkeleton />;
    case "form":
      return <FormSkeleton />;
    default:
      return <SpinnerFallback />;
  }
}
