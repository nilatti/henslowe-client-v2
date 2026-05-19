import { QueryClient } from "@tanstack/react-query";
import { type AuthState } from "./auth";

export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}
