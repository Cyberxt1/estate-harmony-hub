import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["report-stats"],
    queryFn: async () => {
      const [residents, properties, invoices, payments, complaints, visitors, incidents] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("status"),
        supabase.from("invoices").select("amount, amount_paid, status"),
        supabase.from("payments").select("amount, status"),
        supabase.from("complaints").select("status"),
        supabase.from("visitors").select("status"),
        supabase.from("security_incidents").select("severity, status"),
      ]);
      const revenue = (payments.data ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
      const outstanding = (invoices.data ?? []).reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid ?? 0)), 0);
      const occupied = (properties.data ?? []).filter((p) => p.status === "occupied").length;
      const total = (properties.data ?? []).length;
      return {
        residents: residents.count ?? 0,
        revenue,
        outstanding,
        occupancy: total > 0 ? Math.round((occupied / total) * 100) : 0,
        openComplaints: (complaints.data ?? []).filter((c) => c.status !== "resolved" && c.status !== "closed").length,
        visitorsToday: (visitors.data ?? []).filter((v) => v.status === "checked_in").length,
        criticalIncidents: (incidents.data ?? []).filter((i) => i.severity === "critical" || i.severity === "high").length,
      };
    },
  });

  const tiles = [
    { label: "Total residents", value: data?.residents ?? 0 },
    { label: "Revenue collected", value: `₦${(data?.revenue ?? 0).toLocaleString()}` },
    { label: "Outstanding dues", value: `₦${(data?.outstanding ?? 0).toLocaleString()}` },
    { label: "Occupancy", value: `${data?.occupancy ?? 0}%` },
    { label: "Open complaints", value: data?.openComplaints ?? 0 },
    { label: "Visitors on site", value: data?.visitorsToday ?? 0 },
    { label: "High/critical incidents", value: data?.criticalIncidents ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Revenue, occupancy, complaints, visitor and security analytics." icon={BarChart3} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
