import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/residents")({
  component: ResidentsPage,
});

type Resident = Tables<"profiles">;

function ResidentsPage() {
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

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
        description="Manage landlords, tenants, household profiles, vehicles and documents."
        icon={Users}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : data && data.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((resident) => (
                <tr
                  key={resident.id}
                  className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
                  onClick={() => setSelectedResident(resident)}
                >
                  <td className="px-4 py-3 font-medium">{resident.full_name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
                      {resident.resident_type || "Not completed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{resident.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resident.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                      {resident.status}
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
          description="Landlords and tenants that sign up will appear here for admin review."
        />
      )}

      <Dialog open={!!selectedResident} onOpenChange={(open) => !open && setSelectedResident(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedResident?.full_name || "Resident"}</DialogTitle>
            <DialogDescription>Expanded resident profile and submitted form details.</DialogDescription>
          </DialogHeader>
          {selectedResident && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Name" value={selectedResident.full_name} />
              <Detail label="Type" value={selectedResident.resident_type} />
              <Detail label="Email" value={selectedResident.email} />
              <Detail label="Phone" value={selectedResident.phone} />
              <Detail label="Status" value={selectedResident.status} />
              <Detail label="Form completed" value={selectedResident.onboarding_completed ? "Yes" : "No"} />
              <Detail
                label="Emergency contact"
                value={`${selectedResident.emergency_contact_name || ""}${selectedResident.emergency_contact_phone ? ` - ${selectedResident.emergency_contact_phone}` : ""}`}
                wide
              />
              <Detail
                label="Submitted data"
                value={formatSubmittedData(selectedResident.onboarding_data)}
                wide
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | number | boolean | null;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-md border border-border bg-secondary/20 p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "Not provided"}</p>
    </div>
  );
}

function formatSubmittedData(value: unknown) {
  if (!value || typeof value !== "object") return "Not provided";

  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${formatKey(key)}: ${item || "Not provided"}`)
    .join("\n");
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
