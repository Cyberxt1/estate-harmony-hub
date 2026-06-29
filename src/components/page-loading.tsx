import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageLoading({
  label = "Loading page",
  fullScreen = false,
}: {
  label?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center px-5 ${
        fullScreen ? "min-h-screen bg-background" : "min-h-[28vh]"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function PageLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-[28vh] place-items-center px-5 text-center" role="alert">
      <div className="max-w-sm rounded-lg border border-border bg-card px-5 py-4">
        <p className="text-sm font-medium">Couldn&apos;t load this page.</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}
