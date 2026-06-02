import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  LinkIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import {
  RENEWAL_INTERVAL_LABELS,
  RENEWAL_TYPE_LABELS,
  type RenewalInterval,
  type RenewalService,
  type RenewalServiceType,
} from "@/lib/mock-data";
import { sortByName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/ListPagination";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/renewals")({
  component: RenewalsPage,
});

type RenewalStatus = "active" | "expiring" | "expired" | "inactive";

const statusConfig: Record<
  RenewalStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Em dia",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  expiring: {
    label: "Vencendo",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    icon: AlertTriangle,
  },
  expired: {
    label: "Vencido",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  inactive: {
    label: "Inativo",
    className: "border-muted bg-muted text-muted-foreground",
    icon: CalendarClock,
  },
};

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function getStatus(service: RenewalService): RenewalStatus {
  if (!service.isActive) return "inactive";
  const remaining = daysUntil(service.expiresAt);
  if (remaining < 0) return "expired";
  if (remaining <= service.notifyDaysBefore) return "expiring";
  return "active";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function formatAmount(service: RenewalService) {
  if (!service.amount) return null;
  const value = Number(service.amount);
  if (Number.isNaN(value)) return service.amount;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: service.currency || "BRL",
  }).format(value);
}

function emptyDraft(): RenewalService {
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  return {
    id: `r${Date.now()}`,
    name: "",
    type: "hosting",
    currency: "BRL",
    renewalInterval: "yearly",
    expiresAt: nextMonth.toISOString().slice(0, 10),
    notifyDaysBefore: 30,
    isActive: true,
  };
}

function RenewalsPage() {
  const allowed = useAdminGuard("ceo");
  const { renewalServices, accesses, isAdmin, saveRenewalService, deleteRenewalService } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RenewalService | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RenewalServiceType | "all">("all");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredServices = useMemo(
    () => {
      const normalizedSearch = search.trim().toLowerCase();
      return [...renewalServices]
        .filter((service) => {
          const accessName = accesses.find((access) => access.id === service.accessId)?.name ?? "";
          const searchable = [service.name, service.provider, accessName].filter(Boolean).join(" ").toLowerCase();
          const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
          const matchesType = typeFilter === "all" || service.type === typeFilter;
          const matchesAccess =
            accessFilter === "all" ||
            (accessFilter === "none" ? !service.accessId : service.accessId === accessFilter);
          return matchesSearch && matchesType && matchesAccess;
        })
        .sort((a, b) => {
        const statusOrder = { expired: 0, expiring: 1, active: 2, inactive: 3 };
        const statusDiff = statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
        if (statusDiff !== 0) return statusDiff;
        return daysUntil(a.expiresAt) - daysUntil(b.expiresAt);
      });
    },
    [accessFilter, accesses, renewalServices, search, typeFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, accessFilter, pageSize]);

  const paginatedServices = useMemo(
    () => filteredServices.slice((page - 1) * pageSize, page * pageSize),
    [filteredServices, page, pageSize],
  );

  const summary = useMemo(
    () => ({
      expiring: renewalServices.filter((service) => getStatus(service) === "expiring").length,
      expired: renewalServices.filter((service) => getStatus(service) === "expired").length,
      active: renewalServices.filter((service) => getStatus(service) === "active").length,
    }),
    [renewalServices],
  );

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Controle de servicos que precisam ser renovados</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Renovacoes</h1>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Novo servico
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryItem label="Vencidos" value={summary.expired} tone="danger" />
        <SummaryItem label="Vencendo" value={summary.expiring} tone="warning" />
        <SummaryItem label="Em dia" value={summary.active} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[1fr_220px_260px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por nome, fornecedor ou acesso"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as RenewalServiceType | "all")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(RENEWAL_TYPE_LABELS) as RenewalServiceType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {RENEWAL_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accessFilter} onValueChange={setAccessFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os acessos</SelectItem>
            <SelectItem value="none">Sem acesso vinculado</SelectItem>
            {sortByName(accesses).map((access) => (
              <SelectItem key={access.id} value={access.id}>
                {access.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum servico recorrente encontrado.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {paginatedServices.map((service) => (
              <RenewalCard
                key={service.id}
                service={service}
                accessName={accesses.find((access) => access.id === service.accessId)?.name}
                canManage={isAdmin}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={deleteRenewalService}
              />
            ))}
          </div>
          <ListPagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredServices.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {isAdmin && (
        <RenewalForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          accesses={accesses}
          onSave={saveRenewalService}
        />
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success";
}) {
  const toneClass = {
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function RenewalCard({
  service,
  accessName,
  canManage,
  onEdit,
  onDelete,
}: {
  service: RenewalService;
  accessName?: string;
  canManage?: boolean;
  onEdit: (service: RenewalService) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = getStatus(service);
  const remaining = daysUntil(service.expiresAt);
  const StatusIcon = statusConfig[status].icon;
  const amount = formatAmount(service);

  const remainingText =
    status === "inactive"
      ? "Sem alertas ativos"
      : remaining < 0
        ? `Venceu ha ${Math.abs(remaining)} dia(s)`
        : remaining === 0
          ? "Vence hoje"
          : `Vence em ${remaining} dia(s)`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusConfig[status].className}>
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {statusConfig[status].label}
            </Badge>
            <Badge variant="secondary">{RENEWAL_TYPE_LABELS[service.type]}</Badge>
          </div>
          <h3 className="mt-3 font-display text-base font-semibold">{service.name}</h3>
          {service.provider && <p className="text-sm text-muted-foreground">{service.provider}</p>}
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(service)} aria-label="Editar">
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)} aria-label="Excluir">
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Info label="Vencimento" value={formatDate(service.expiresAt)} />
        <Info label="Alerta" value={remainingText} strong={status === "expired" || status === "expiring"} />
        <Info label="Recorrencia" value={RENEWAL_INTERVAL_LABELS[service.renewalInterval]} />
        <Info label="Valor" value={amount ?? "Nao informado"} />
      </div>

      {(service.renewalUrl || accessName) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {service.renewalUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={service.renewalUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> Renovar
              </a>
            </Button>
          )}
          {accessName && (
            <Badge variant="outline" className="gap-1 py-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              {accessName}
            </Badge>
          )}
        </div>
      )}

      {service.notes && (
        <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
          <span className="text-xs text-muted-foreground">Observacao</span>
          <p className="mt-0.5 text-sm">{service.notes}</p>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir servico?</AlertDialogTitle>
            <AlertDialogDescription>
              O controle de renovacao de "{service.name}" sera removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                if (deleting) return;
                setDeleting(true);
                try {
                  await onDelete(service.id);
                  toast.success("Servico excluido", { description: service.name });
                  setConfirmOpen(false);
                } catch {
                  toast.error("Nao foi possivel excluir o servico");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${strong ? "font-semibold text-foreground" : ""}`}>{value}</span>
    </div>
  );
}

function RenewalForm({
  open,
  onOpenChange,
  initial,
  accesses,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: RenewalService | null;
  accesses: Array<{ id: string; name: string }>;
  onSave: (service: RenewalService) => Promise<void>;
}) {
  const [draft, setDraft] = useState<RenewalService>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const sortedAccesses = useMemo(() => sortByName(accesses), [accesses]);

  useEffect(() => {
    if (open) setDraft(initial ? { ...initial } : emptyDraft());
  }, [open, initial]);

  const set = (patch: Partial<RenewalService>) => setDraft((current) => ({ ...current, ...patch }));

  const submit = async () => {
    if (saving || !draft.name.trim() || !draft.expiresAt) return;
    setSaving(true);
    try {
      await onSave({
        ...draft,
        name: draft.name.trim(),
        provider: draft.provider?.trim() || undefined,
        accessId: draft.accessId || undefined,
      });
      toast.success(initial ? "Servico atualizado" : "Servico criado");
      onOpenChange(false);
    } catch {
      toast.error("Nao foi possivel salvar o servico");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar servico" : "Novo servico"}</DialogTitle>
          <DialogDescription>Cadastre vencimentos importantes para acompanhar antes que expirem.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome do servico</Label>
            <Input value={draft.name} onChange={(event) => set({ name: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={draft.type} onValueChange={(value) => set({ type: value as RenewalServiceType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RENEWAL_TYPE_LABELS) as RenewalServiceType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {RENEWAL_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input value={draft.provider ?? ""} onChange={(event) => set({ provider: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Data de vencimento</Label>
            <Input type="date" value={draft.expiresAt} onChange={(event) => set({ expiresAt: event.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Alertar com quantos dias</Label>
            <Input
              type="number"
              min={1}
              value={draft.notifyDaysBefore}
              onChange={(event) => set({ notifyDaysBefore: Number(event.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Recorrencia</Label>
            <Select
              value={draft.renewalInterval}
              onValueChange={(value) => set({ renewalInterval: value as RenewalInterval })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RENEWAL_INTERVAL_LABELS) as RenewalInterval[]).map((interval) => (
                  <SelectItem key={interval} value={interval}>
                    {RENEWAL_INTERVAL_LABELS[interval]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_96px] gap-2">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input value={draft.amount ?? ""} onChange={(event) => set({ amount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input value={draft.currency} onChange={(event) => set({ currency: event.target.value.toUpperCase() })} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Link de renovacao</Label>
            <Input value={draft.renewalUrl ?? ""} onChange={(event) => set({ renewalUrl: event.target.value })} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Acesso vinculado</Label>
            <Select value={draft.accessId ?? "none"} onValueChange={(value) => set({ accessId: value === "none" ? undefined : value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {sortedAccesses.map((access) => (
                  <SelectItem key={access.id} value={access.id}>
                    {access.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Observacoes</Label>
            <Textarea value={draft.notes ?? ""} onChange={(event) => set({ notes: event.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
