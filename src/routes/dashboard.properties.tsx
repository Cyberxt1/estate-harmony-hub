import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Home, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/properties")({
  component: PropertiesPage,
});

type Property = Tables<"properties">;

function PropertiesPage() {
  const { profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
      const { error } = await supabase.from("properties").insert({
        estate_id: profile.estate_id,
        house_number: houseNumber,
        street,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property added");
      setOpen(false);
      setHouseNumber("");
      setStreet("");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Properties" description="Houses, ownership, occupancy and meters." icon={Home}>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Add property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New property</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>House number</Label>
                  <Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="e.g. B12" />
                </div>
                <div className="space-y-2">
                  <Label>Street</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!houseNumber || create.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((property) => (
            <button
              key={property.id}
              type="button"
              className="rounded-md border border-border bg-card p-5 text-left transition hover:bg-secondary/30"
              onClick={() => setSelectedProperty(property)}
            >
              <p className="font-display text-lg font-semibold">{property.house_number}</p>
              <p className="text-sm text-muted-foreground">{property.street || "-"}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-accent px-2 py-0.5 capitalize text-accent-foreground">
                  {property.status}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">
                  {property.property_type}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No properties yet"
          description={isAdmin ? "Add the houses in Oyesile Estate to start managing occupancy." : "Properties will appear here once an admin adds them."}
        />
      )}

      <Dialog open={!!selectedProperty} onOpenChange={(nextOpen) => !nextOpen && setSelectedProperty(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.house_number || "Property"}</DialogTitle>
            <DialogDescription>Expanded property record.</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="House number" value={selectedProperty.house_number} />
              <Detail label="Street" value={selectedProperty.street} />
              <Detail label="Type" value={selectedProperty.property_type} />
              <Detail label="Status" value={selectedProperty.status} />
              <Detail label="Bedrooms" value={selectedProperty.bedrooms} />
              <Detail label="Bathrooms" value={selectedProperty.bathrooms} />
              <Detail label="Electricity meter" value={selectedProperty.electricity_meter} />
              <Detail label="Water meter" value={selectedProperty.water_meter} />
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
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "Not provided"}</p>
    </div>
  );
}
