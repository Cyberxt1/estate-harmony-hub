import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Home, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/properties")({
  component: PropertiesPage,
});

function PropertiesPage() {
  const { profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
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
      if (!profile?.estate_id) throw new Error("You're not assigned to an estate yet. Configure it in Settings.");
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
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-lg font-semibold">{p.house_number}</p>
              <p className="text-sm text-muted-foreground">{p.street || "—"}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-accent px-2 py-0.5 capitalize text-accent-foreground">
                  {p.status}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">
                  {p.property_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No properties yet"
          description={isAdmin ? "Add the houses in your estate to start managing occupancy." : "Properties will appear here once your admin adds them."}
        />
      )}
    </div>
  );
}
