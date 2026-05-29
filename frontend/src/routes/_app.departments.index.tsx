import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound, ShieldX } from "lucide-react";
import { ConfidentialBadge } from "@/components/ConfidentialBadge";
import { useAuth } from "@/lib/auth-context";
import { departmentIcons, ROLE_LABELS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/departments/")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { currentUser, visibleDepartments, accesses } = useAuth();

  if (currentUser?.role === "pending") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
        <ShieldX className="h-12 w-12 text-warning" />
        <h2 className="font-display text-xl font-semibold">Acesso aguardando liberação</h2>
        <p className="text-sm text-muted-foreground">
          Sua conta foi criada e está aguardando liberação de acesso por um administrador. Assim que
          for aprovado, seus departamentos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Bem-vindo, <span className="text-foreground">{currentUser?.name}</span>
            {currentUser && (
              <>
                {" "}
                · <span className="text-primary">{ROLE_LABELS[currentUser.role]}</span>
              </>
            )}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Departamentos</h1>
        </div>
        <ConfidentialBadge />
      </div>

      {visibleDepartments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum departamento liberado para você.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDepartments.map((dep) => {
            const Icon = departmentIcons[dep.iconKey] ?? KeyRound;
            const count = accesses.filter((a) => a.departmentId === dep.id).length;
            return (
              <Link
                key={dep.id}
                to="/departments/$id"
                params={{ id: dep.id }}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{dep.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dep.description}</p>
                <p className="mt-3 text-xs font-medium text-primary">{count} acesso(s)</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
