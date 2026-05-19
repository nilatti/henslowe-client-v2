import { Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuth } from "../hooks/useAuth";
import { useIsSuperAdmin } from "../hooks/useUserRole";

export function RootComponent() {
  const auth = useAuth();
  const isSuperAdmin = useIsSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {auth.isAuthenticated && (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">
              Henslowe's Cloud
            </span>
            <Link
              to="/plays"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Plays
            </Link>
            <Link
              to="/specializations"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Specializations
            </Link>
            <Link
              to="/authors"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Authors
            </Link>
            <Link
              to="/theaters"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Theaters
            </Link>
            <Link
              to="/productions"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Productions
            </Link>
            <Link
              to="/spaces"
              className="text-gray-600 hover:text-gray-900 text-sm"
              activeProps={{ className: "text-blue-600 font-medium" }}
            >
              Spaces
            </Link>
            {isSuperAdmin && (
              <Link
                to={"/users" as never}
                className="text-gray-600 hover:text-gray-900 text-sm"
                activeProps={{ className: "text-blue-600 font-medium" }}
              >
                Users
              </Link>
            )}
            {auth.user && (
              <Link
                to={"/users/$userId" as never}
                params={{ userId: String(auth.user.id) } as never}
                className="text-gray-600 hover:text-gray-900 text-sm"
                activeProps={{ className: "text-blue-600 font-medium" }}
              >
                My Profile
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {auth.user?.first_name} {auth.user?.last_name}
            </span>
            <button
              onClick={auth.logout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </nav>
      )}
      <main className="p-6">
        <Outlet />
      </main>
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </>
      )}
    </div>
  );
}
