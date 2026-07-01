import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
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
  ScanLine,
  ClipboardList,
  UserCog,
  UsersRound,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import type { AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { EmergencyFab } from "@/components/emergency-fab";
import { PageLoading } from "@/components/page-loading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: DashboardLayout,
});

const nav = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    groups: ["resident", "operations"],
  },
  { to: "/dashboard/onboarding", label: "My details", icon: Users, groups: ["resident"] },
  {
    to: "/dashboard/admins",
    label: "Know your admins",
    icon: UsersRound,
    groups: ["resident"],
  },
  {
    to: "/dashboard/residents",
    label: "Community members",
    icon: Users,
    groups: ["operations"],
  },
  { to: "/dashboard/properties", label: "Properties", icon: Home, groups: ["operations"] },
  {
    to: "/dashboard/visitors",
    label: "Visitors",
    icon: QrCode,
    groups: ["resident", "operations"],
  },
  {
    to: "/dashboard/payments",
    label: "Dues",
    icon: CreditCard,
    groups: ["resident"],
  },
  {
    to: "/dashboard/payments",
    label: "Dues",
    icon: CreditCard,
    groups: ["dues"],
  },
  {
    to: "/dashboard/announcements",
    label: "Announcements",
    icon: Megaphone,
    groups: ["resident", "operations"],
  },
  {
    to: "/dashboard/complaints",
    label: "Complaints",
    icon: MessageSquareWarning,
    groups: ["resident", "operations"],
  },
  { to: "/dashboard/security", label: "Security", icon: ShieldCheck, groups: ["operations"] },
  {
    to: "/dashboard/documents",
    label: "Documents",
    icon: FileText,
    groups: ["resident", "operations"],
  },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3, groups: ["operations"] },
  {
    to: "/dashboard/team",
    label: "Admin team",
    icon: UserCog,
    groups: ["team"],
  },
  {
    to: "/dashboard/gate",
    label: "Gate check-in",
    icon: ScanLine,
    groups: ["gate"],
  },
  {
    to: "/dashboard/visitor-log",
    label: "Visitor log",
    icon: ClipboardList,
    groups: ["gate"],
  },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: SettingsIcon,
    groups: ["resident", "operations", "gate"],
  },
];

function DashboardLayout() {
  const { profile, primaryRole, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspace = getWorkspace(primaryRole);
  const navGroups = getNavGroups(primaryRole, workspace.key);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (
      !loading &&
      profile &&
      !profile.onboarding_completed &&
      ["resident", "household_member", "domestic_staff"].includes(primaryRole) &&
      pathname !== "/dashboard/onboarding"
    ) {
      void navigate({ to: "/dashboard/onboarding", replace: true });
    }
  }, [loading, navigate, pathname, primaryRole, profile]);

  useEffect(() => {
    if (
      !loading &&
      isAdmin &&
      profile &&
      !profile.avatar_url &&
      pathname !== "/dashboard/settings"
    ) {
      void navigate({ to: "/dashboard/settings", replace: true });
    }
  }, [isAdmin, loading, navigate, pathname, profile]);

  if (loading) {
    return <PageLoading fullScreen label="Preparing your dashboard" />;
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
          "fixed inset-y-0 left-0 z-50 w-56 transform border-r border-sidebar-border bg-sidebar transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Oyesile</span>
          </Link>
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-2.5">
          <div className="px-3 pb-2 pt-1 text-xs font-medium uppercase text-sidebar-foreground/50">
            {workspace.label}
          </div>
          {nav
            .filter((item) => item.groups.some((group) => navGroups.includes(group)))
            .map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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

        <div className="absolute inset-x-2.5 bottom-2.5 rounded-lg border border-sidebar-border bg-card p-2.5">
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
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background/90 px-3.5 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{workspace.title}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {workspace.description}
            </p>
          </div>
          <DashboardNotifications />
          <div className="hidden text-sm text-muted-foreground md:block">
            {profile?.full_name || profile?.email}
          </div>
        </header>
        <main className="flex-1 p-3.5 sm:p-5 md:p-6">
          <div className="app-content mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <EmergencyFab />
      </div>
    </div>
  );
}

function getWorkspace(role: AppRole) {
  if (role === "security_gateman") {
    return {
      key: "gate",
      label: "Gate view",
      title: "Gate workspace",
      description: "Scan, check in and log people at the gate.",
    } as const;
  }

  if (role === "security_officer") {
    return {
      key: "operations",
      label: "CSO view",
      title: "Security workspace",
      description: "Visitors, incidents and security reports.",
    } as const;
  }

  if (
    role === "community_secretary" ||
    role === "community_chairman" ||
    role === "chief_security_officer" ||
    role === "treasurer" ||
    role === "estate_admin" ||
    role === "super_admin"
  ) {
    const labels: Record<string, string> = {
      community_chairman: "Chairman view",
      community_secretary: "Secretary view",
      treasurer: "Treasurer view",
      chief_security_officer: "CSO view",
      estate_admin: "Estate admin view",
      super_admin: "Super admin view",
    };

    const titles: Record<string, string> = {
      community_chairman: "Chairman workspace",
      community_secretary: "Secretary workspace",
      treasurer: "Treasurer workspace",
      chief_security_officer: "CSO workspace",
      estate_admin: "Estate operations workspace",
      super_admin: "Estate operations workspace",
    };

    return {
      key: "operations",
      label: labels[role] ?? "Estate operations view",
      title: titles[role] ?? "Estate operations workspace",
      description: "Residents, properties, payments and estate records.",
    } as const;
  }

  return {
    key: "resident",
    label: "Resident view",
    title: "Resident workspace",
    description: "Your dues, visitors, notices and household records.",
  } as const;
}

function getNavGroups(role: AppRole, workspace: string) {
  const groups = [workspace];
  if (
    [
      "community_chairman",
      "community_secretary",
      "treasurer",
      "chief_security_officer",
      "estate_admin",
      "super_admin",
    ].includes(role)
  ) {
    groups.push("dues");
  }
  if (role === "community_chairman" || role === "chief_security_officer") {
    groups.push("team");
  }
  return groups;
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
    security_gateman: "Security gateman",
    resident: "Resident",
    household_member: "Household member",
    domestic_staff: "Domestic staff",
  };

  return labels[role] ?? role.replaceAll("_", " ");
}
