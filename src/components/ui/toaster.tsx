import { useEffect, useState } from "react";
import { subscribeToasts } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; type: string; message: string }>
  >([]);

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4",
            t.type === "success" &&
              "border-emerald-500/30 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/40 dark:bg-emerald-900/95 dark:text-emerald-50",
            t.type === "error" &&
              "border-destructive/40 bg-destructive/95 text-destructive-foreground shadow-destructive/40",
            t.type === "info" &&
              "border-blue-500/30 bg-blue-950/90 text-blue-100 shadow-blue-950/40",
            t.type === "warning" &&
              "border-amber-500/30 bg-amber-950/90 text-amber-100 shadow-amber-950/40"
          )}
        >
          <div className="flex items-center gap-3">
            {t.type === "success" && (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
            )}
            {t.type === "error" && (
              <AlertCircle className="size-5 shrink-0 text-white" />
            )}
            {t.type === "info" && (
              <Info className="size-5 shrink-0 text-blue-400" />
            )}
            {t.type === "warning" && (
              <AlertTriangle className="size-5 shrink-0 text-amber-400" />
            )}
            <p className="leading-snug">{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
