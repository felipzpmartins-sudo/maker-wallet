import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

type GuardScope = "admin" | "permissions" | "ceo";

// Redirects non-admins away from admin-only pages. Returns true when allowed.
export function useAdminGuard(scope: GuardScope = "admin") {
  const { isAdmin, isCeo, canManagePermissions, currentUser } = useAuth();
  const navigate = useNavigate();
  const allowed =
    scope === "ceo" ? isCeo : scope === "permissions" ? canManagePermissions : isAdmin;

  useEffect(() => {
    if (currentUser && !allowed) navigate({ to: "/departments" });
  }, [allowed, currentUser, navigate]);

  return allowed;
}
