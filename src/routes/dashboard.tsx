import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  LayoutDashboard,
  Users,
  Home,
  QrCode,
  CreditCard,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/residents", label: "Residents", icon: Users },
  { to: "/dashboard/properties", label: "Properties", icon: Home },
  { to: "/dashboard/visitors", label: "Visitors", icon: QrCode },
  { to: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/dashboard/security", label: "Security", icon: ShieldCheck },
  { to: "/dashboard/documents", label: "Documents", icon: FileText },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

function DashboardLayout() {
  const { profile, primaryRole, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const initials = (profile?.full_name || profile?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-sidebar-border bg-sidebar transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Oyesile</span>
          </Link>
          <button className="md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-sidebar-border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.full_name || profile?.email}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {formatRole(primaryRole)}
              </p>
            </div>
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="hidden text-sm text-muted-foreground md:block">
            {profile?.full_name || profile?.email}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super admin",
    estate_admin: "Estate admin",
    community_chairman: "Community chairman",
    community_secretary: "Community secretary",
    treasurer: "Treasurer",
    chief_security_officer: "Chief Security Officer",
    security_officer: "Security officer",
    resident: "Resident",
    household_member: "Household member",
    domestic_staff: "Domestic staff",
  };

  return labels[role] ?? role.replaceAll("_", " ");
}
