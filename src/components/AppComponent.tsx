import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "../lib/queryClient";

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // will be set by AuthProvider
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
export function App() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}
