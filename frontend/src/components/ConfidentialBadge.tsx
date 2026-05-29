import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfidentialBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning",
        className,
      )}
    >
      <ShieldAlert className="h-3.5 w-3.5" />
      Informação confidencial
    </div>
  );
}
