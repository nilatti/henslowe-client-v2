import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "../components/LoginPage";
import { type AuthState } from "../types/auth";
import { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/plays" });
    }
  },
  component: LoginPage,
});
