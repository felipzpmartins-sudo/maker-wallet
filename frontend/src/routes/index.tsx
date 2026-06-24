import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: currentUser ? (currentUser.mustChangePassword ? "/change-password" : "/departments") : "/login",
    });
  }, [currentUser, navigate]);

  return null;
}
