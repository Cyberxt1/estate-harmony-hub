import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("low");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const { data } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_incidents")
        .select("*")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("Your estate isn't configured yet.");
      const { error } = await supabase.from("security_incidents").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        type,
        severity: severity as "low" | "medium" | "high" | "critical",
        location,
        description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incident reported");
      setOpen(false);
      setType("");
      setLocation("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Security" description="Incident reports, patrol logs, blacklist and watchlist." icon={ShieldCheck}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Report incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Trespass, theft, suspicious activity" />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!type || create.isPending}>Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((i) => (
            <div key={i.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{i.type}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{i.location} · {i.occurred_at ? new Date(i.occurred_at).toLocaleString() : ""}</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{i.severity}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">{i.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No incidents reported" description="Security can log incidents, patrol activity and suspicious events here." />
      )}
    </div>
  );
}
