import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: ReturnToHub });

function hubUrl() {
  return import.meta.env.VITE_MKR_HUB_URL?.trim() || "http://localhost:3000/dashboard";
}

function ReturnToHub() {
  useEffect(() => {
    window.location.replace(hubUrl());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <p className="text-sm text-muted-foreground">Voltando para o MKR HUB…</p>
    </main>
  );
}
