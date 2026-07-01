import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["report-stats"],
    queryFn: async () => {
      const [residents, properties, complaints, visitors, incidents] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("status"),
        supabase.from("complaints").select("status"),
        supabase.from("visitors").select("status"),
        supabase.from("security_incidents").select("severity, status"),
      ]);
      const occupied = (properties.data ?? []).filter((item) => item.status === "occupied").length;
      const total = (properties.data ?? []).length;
      return {
        residents: residents.count ?? 0,
        occupancy: total > 0 ? Math.round((occupied / total) * 100) : 0,
        openComplaints: (complaints.data ?? []).filter(
          (item) => item.status !== "resolved" && item.status !== "closed",
        ).length,
        visitorsInside: (visitors.data ?? []).filter((item) => item.status === "checked_in").length,
        visitorsExpected: (visitors.data ?? []).filter((item) => item.status === "expected").length,
        criticalIncidents: (incidents.data ?? []).filter(
          (item) => item.severity === "critical" || item.severity === "high",
        ).length,
      };
    },
  });

  const tiles = [
    { label: "Total residents", value: data?.residents ?? 0 },
    { label: "Occupancy", value: `${data?.occupancy ?? 0}%` },
    { label: "Open complaints", value: data?.openComplaints ?? 0 },
    { label: "Visitors expected", value: data?.visitorsExpected ?? 0 },
    { label: "Visitors inside", value: data?.visitorsInside ?? 0 },
    { label: "High or critical incidents", value: data?.criticalIncidents ?? 0 },
  ];

  if (isLoading) return <PageLoading label="Preparing reports" onRetry={() => void refetch()} />;
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Occupancy, complaints, visitor and security activity."
        icon={BarChart3}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{tile.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
