import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SensitiveFieldProps {
  value: string;
  label: string;
  className?: string;
}

export function SensitiveField({ value, label, className }: SensitiveFieldProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    toast.success("Copiado", { description: `${label} copiado para a area de transferencia.` });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="flex-1 truncate rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-sm tracking-wider">
        {visible ? value : "*".repeat(Math.min(value.length || 12, 14))}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Ocultar ${label}` : `Visualizar ${label}`}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`Copiar ${label}`}>
        {copied ? <Check className="text-primary" /> : <Copy />}
      </Button>
    </div>
  );
}
