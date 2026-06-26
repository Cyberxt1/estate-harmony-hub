import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquareWarning, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const STATUSES = ["open", "assigned", "in_progress", "resolved", "closed"] as const;
type Status = typeof STATUSES[number];
type Complaint = Tables<"complaints">;

export const Route = createFileRoute("/dashboard/complaints")({
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const { data } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
      const { error } = await supabase.from("complaints").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        subject,
        description,
        priority: priority as "low" | "medium" | "high" | "urgent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Complaint submitted");
      setOpen(false);
      setSubject("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const patch: { status: Status; resolved_at?: string } = { status };
      if (status === "resolved") patch.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("complaints").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });

  return (
    <div>
      <PageHeader title="Complaints" description="Submit, assign, track and resolve estate complaints." icon={MessageSquareWarning}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New complaint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit complaint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!subject || create.isPending}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((c) => (
            <div
              key={c.id}
              className="cursor-pointer rounded-md border border-border bg-card p-5 transition hover:bg-secondary/30"
              onClick={() => setSelectedComplaint(c)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{c.subject}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{c.priority}</span>
                  {isAdmin ? (
                    <Select
                      value={c.status}
                      onValueChange={(v) => updateStatus.mutate({ id: c.id, status: v as Status })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                      {c.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No complaints" description="Residents can raise complaints and track their progress here." />
      )}

      <Dialog open={!!selectedComplaint} onOpenChange={(nextOpen) => !nextOpen && setSelectedComplaint(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.subject || "Complaint"}</DialogTitle>
            <DialogDescription>Expanded complaint record.</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Subject" value={selectedComplaint.subject} wide />
              <Detail label="Status" value={selectedComplaint.status.replace("_", " ")} />
              <Detail label="Priority" value={selectedComplaint.priority} />
              <Detail label="Category" value={selectedComplaint.category} />
              <Detail label="Created" value={new Date(selectedComplaint.created_at).toLocaleString()} />
              <Detail label="Description" value={selectedComplaint.description} wide />
              <Detail label="Resolution notes" value={selectedComplaint.resolution_notes} wide />
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
