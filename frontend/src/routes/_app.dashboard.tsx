import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/departments", replace: true });
  }, [navigate]);

  return null;
}
