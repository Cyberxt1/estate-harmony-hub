import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Home,
  MessageSquareWarning,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { downloadDueReceipt } from "@/lib/receipts";
import { PageLoadError, PageLoading } from "@/components/page-loading";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, primaryRole, isAdmin, isSecurity, user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (primaryRole === "security_gateman") {
      void navigate({ to: "/dashboard/gate", replace: true });
    }
  }, [navigate, primaryRole]);

  useEffect(() => {
    const rawReceipt = sessionStorage.getItem("duePaymentReceipt");
    if (!rawReceipt) return;
    sessionStorage.removeItem("duePaymentReceipt");
    try {
      const receipt = JSON.parse(rawReceipt) as {
        title: string;
        amount: number;
        currency: string;
        reference?: string;
        paidAt?: string;
        residentName?: string;
      };
      toast.success(`You paid ${receipt.title}`, {
        description: formatMoney(receipt.amount, receipt.currency),
        action: {
          label: "Receipt",
          onClick: () => downloadDueReceipt(receipt),
        },
      });
    } catch {
      toast.success("Your due was paid successfully");
    }
  }, []);

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats", profile?.estate_id, primaryRole],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const [residents, properties, visitors, invoices, complaints, incidents] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase
          .from("visitors")
          .select("id", { count: "exact", head: true })
          .eq("status", "expected"),
        supabase.from("invoices").select("amount, amount_paid, status"),
        supabase
          .from("complaints")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "assigned", "in_progress"]),
        supabase
          .from("security_incidents")
          .select("id", { count: "exact", head: true })
          .in("status", ["reported", "investigating"]),
      ]);

      const outstanding = (invoices.data ?? []).reduce(
        (sum, item) => sum + (Number(item.amount) - Number(item.amount_paid ?? 0)),
        0,
      );
      const duesToPay = (invoices.data ?? []).filter(
        (invoice) =>
          Number(invoice.amount) > Number(invoice.amount_paid ?? 0) &&
          !["draft", "paid", "cancelled"].includes(invoice.status),
      ).length;

      return {
        residents: residents.count ?? 0,
        properties: properties.count ?? 0,
        visitors: visitors.count ?? 0,
        complaints: complaints.count ?? 0,
        incidents: incidents.count ?? 0,
        outstanding,
        duesToPay,
      };
    },
  });

  const { data: assignedTasks = [] } = useQuery({
    queryKey: ["assigned-tasks", user?.id, roles.join(",")],
    enabled: !loading && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_tasks")
        .select("*")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter(
        (task) =>
          task.assigned_user_id === user?.id ||
          (task.assigned_role && roles.includes(task.assigned_role)),
      );
    },
  });

  const cards = isAdmin
    ? [
        { label: "Residents", value: stats?.residents ?? 0, icon: Users },
        { label: "Properties", value: stats?.properties ?? 0, icon: Home },
        { label: "Open complaints", value: stats?.complaints ?? 0, icon: MessageSquareWarning },
        { label: "Expected visitors", value: stats?.visitors ?? 0, icon: QrCode },
      ]
    : isSecurity
      ? [
          { label: "Expected visitors today", value: stats?.visitors ?? 0, icon: QrCode },
          { label: "Open incidents", value: stats?.incidents ?? 0, icon: ShieldCheck },
          { label: "Total residents", value: stats?.residents ?? 0, icon: Users },
          { label: "Total properties", value: stats?.properties ?? 0, icon: Home },
        ]
      : [
          { label: "Expected visitors", value: stats?.visitors ?? 0, icon: QrCode },
          { label: "Dues to pay", value: stats?.duesToPay ?? 0, icon: CreditCard },
          { label: "Open complaints", value: stats?.complaints ?? 0, icon: MessageSquareWarning },
          { label: "Announcements", value: "-", icon: TrendingUp },
        ];

  if (loading || isLoading) {
    return <PageLoading label="Loading your overview" onRetry={() => void refetch()} />;
  }

  if (isError) {
    return <PageLoadError onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">
          {formatRole(primaryRole)} workspace for Oyesile Estate
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((cardItem) => {
          const card = (
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{cardItem.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">
                  <cardItem.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 font-display text-xl font-semibold">{cardItem.value}</p>
            </div>
          );

          return cardItem.label === "Dues to pay" ? (
            <Link key={cardItem.label} to="/dashboard/payments" className="block">
              {card}
            </Link>
          ) : (
            <div key={cardItem.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h2 className="mb-2 font-display text-lg font-semibold">Getting started</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Oyesile Estate operations are ready for resident records, properties, visitors, security and community communication."
              : "Oyesile Estate is ready for your visitors, dues, complaints and community announcements."}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {(isAdmin
              ? [
                  "Review resident and landlord or tenant records",
                  "Keep property and household records current",
                  "Follow visitor, complaint and security activity",
                  primaryRole === "community_chairman"
                    ? "Manage office administrators and gatemen from Admin team"
                    : "Work from the shared estate administration records",
                ]
              : [
                  "Complete your resident details",
                  "Invite visitors before they arrive",
                  "Check announcements and complaints",
                  "Review and pay your dues",
                ]
            ).map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 font-display text-lg font-semibold">Your role</h2>
          <p className="text-sm text-muted-foreground">
            You're signed in as{" "}
            <strong className="text-foreground">{formatRole(primaryRole)}</strong>. Your dashboard,
            navigation and permissions adapt automatically to this role.
          </p>
        </div>
      </div>

      {assignedTasks.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Assigned tasks</h2>
              <p className="text-sm text-muted-foreground">
                Tasks delegated to your role or account.
              </p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {assignedTasks.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {assignedTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-medium">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
