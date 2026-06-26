import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/dashboard/residents")({
  component: ResidentsPage,
});

function ResidentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Residents"
        description="Manage resident profiles, households, vehicles and documents."
        icon={Users}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data && data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No residents yet"
          description="Residents that sign up will appear here. Estate admins can approve and assign them to households."
        />
      )}
    </div>
  );
}
