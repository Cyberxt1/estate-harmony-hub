import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PageLoading({
  label = "Loading page",
  onRetry,
  fullScreen = false,
}: {
  label?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}) {
  const [takingLong, setTakingLong] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLong(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`grid place-items-center px-5 text-center ${
        fullScreen ? "min-h-screen bg-background" : "min-h-[45vh]"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-sm flex-col items-center">
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-accent">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/5" />
        </div>
        <p className="mt-4 text-sm font-medium">{label}</p>
        {!takingLong ? (
          <p className="mt-1 text-xs text-muted-foreground">Just a moment…</p>
        ) : (
          <div className="mt-4 rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <WifiOff className="h-4 w-4" />
              This is taking longer than expected
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Check your internet connection, then try again.
            </p>
            {onRetry && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[45vh] place-items-center px-5 text-center" role="alert">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <WifiOff className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">This page could not load</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Check your internet connection and try again.
        </p>
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
