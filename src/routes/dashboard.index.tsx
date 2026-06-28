import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  Home,
  QrCode,
  CreditCard,
  MessageSquareWarning,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageLoadError, PageLoading } from "@/components/page-loading";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, primaryRole, isAdmin, isSecurity } = useAuth();

  useEffect(() => {
    const rawReceipt = sessionStorage.getItem("duePaymentReceipt");
    if (!rawReceipt) return;
    sessionStorage.removeItem("duePaymentReceipt");
    try {
      const receipt = JSON.parse(rawReceipt) as {
        title: string;
        amount: number;
        currency: string;
      };
      toast.success(`You paid ${receipt.title}`, {
        description: formatMoney(receipt.amount, receipt.currency),
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
        (sum, i) => sum + (Number(i.amount) - Number(i.amount_paid ?? 0)),
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

  const cards = isSecurity
    ? [
        { label: "Expected visitors today", value: stats?.visitors ?? 0, icon: QrCode },
        { label: "Open incidents", value: stats?.incidents ?? 0, icon: ShieldCheck },
        { label: "Total residents", value: stats?.residents ?? 0, icon: Users },
        { label: "Total properties", value: stats?.properties ?? 0, icon: Home },
      ]
    : isAdmin
      ? [
          { label: "Residents", value: stats?.residents ?? 0, icon: Users },
          { label: "Properties", value: stats?.properties ?? 0, icon: Home },
          { label: "Open complaints", value: stats?.complaints ?? 0, icon: MessageSquareWarning },
          {
            label: "Outstanding dues",
            value: formatMoney(stats?.outstanding ?? 0),
            icon: CreditCard,
          },
        ]
      : [
          { label: "Expected visitors", value: stats?.visitors ?? 0, icon: QrCode },
          { label: "Dues to pay", value: stats?.duesToPay ?? 0, icon: CreditCard },
          { label: "Open complaints", value: stats?.complaints ?? 0, icon: MessageSquareWarning },
          { label: "Announcements", value: "—", icon: TrendingUp },
        ];

  if (isLoading) {
    return <PageLoading label="Loading your overview" onRetry={() => void refetch()} />;
  }
  if (isError) {
    return <PageLoadError onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">
          {formatRole(primaryRole)} workspace for Oyesile Estate
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const card = (
            <div
              className="rounded-2xl border border-border bg-card p-5"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold">{c.value}</p>
            </div>
          );

          return c.label === "Outstanding dues" || c.label === "Dues to pay" ? (
            <Link key={c.label} to="/dashboard/payments" className="block">
              {card}
            </Link>
          ) : (
            <div key={c.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-2 font-display text-lg font-semibold">Getting started</h2>
          <p className="text-sm text-muted-foreground">
            Oyesile Estate is ready for resident records, properties, visitors, dues and community
            announcements.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Confirm Oyesile Estate details in Settings",
              "Add properties and assign households",
              "Assign community officers and security roles",
              "Create dues for all members or selected residents",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-semibold">Your role</h2>
          <p className="text-sm text-muted-foreground">
            You're signed in as{" "}
            <strong className="text-foreground">{formatRole(primaryRole)}</strong>. Your dashboard,
            navigation and permissions adapt automatically to this role.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatMoney(n: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
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
