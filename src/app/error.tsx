"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console without leaking sensitive stack traces in production
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Terjadi Kesalahan Sistem</h2>
        <p className="text-sm text-muted-foreground">
          Mohon maaf, halaman yang Anda tuju sedang mengalami kendala teknis. Silakan coba muat
          ulang halaman.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-md bg-muted p-3 text-left font-mono text-xs text-muted-foreground overflow-auto max-h-32">
            {error.message}
          </div>
        )}
        <div className="pt-2">
          <Button onClick={() => reset()} variant="default">
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}

