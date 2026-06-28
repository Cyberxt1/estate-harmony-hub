import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type Status = (typeof STATUSES)[number];
type Complaint = Tables<"complaints">;
type Complainant = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "phone" | "whatsapp_number" | "resident_type"
>;

export const Route = createFileRoute("/dashboard/complaints")({
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const {
    data: complaints = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["complaints", profile?.estate_id, user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: complainants = [],
    isLoading: complainantsLoading,
    isError: complainantsError,
  } = useQuery({
    queryKey: ["complaint-people", profile?.estate_id],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, whatsapp_number, resident_type")
        .eq("estate_id", profile!.estate_id!);
      if (error) throw error;
      return (data ?? []) as Complainant[];
    },
  });

  const peopleById = useMemo(
    () => new Map(complainants.map((person) => [person.id, person])),
    [complainants],
  );
  const openComplaints = complaints.filter((item) =>
    ["open", "assigned", "in_progress"].includes(item.status),
  );
  const resolvedComplaints = complaints.filter((item) =>
    ["resolved", "closed"].includes(item.status),
  );

  const createComplaint = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id)
        throw new Error("Your account is not linked to the estate.");
      if (!subject.trim()) throw new Error("Tell us what the complaint is about.");
      if (!description.trim()) throw new Error("Add a short description.");
      const { error } = await supabase.from("complaints").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Complaint sent");
      setCreateOpen(false);
      setSubject("");
      setDescription("");
      setPriority("medium");
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ complaint, status }: { complaint: Complaint; status: Status }) => {
      const { error } = await supabase
        .from("complaints")
        .update({
          status,
          resolution_notes:
            status === "resolved" ? resolutionNotes.trim() || complaint.resolution_notes : null,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", complaint.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Complaint updated");
      setSelectedComplaint(null);
      setResolutionNotes("");
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResolutionNotes(complaint.resolution_notes || "");
  };

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Complaint desk" : "Complaints"}
        description={
          isAdmin
            ? "See who complained, contact them and move each issue to resolution."
            : "Report a community issue and follow its progress."
        }
        icon={MessageSquareWarning}
      >
        {!isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New complaint
          </Button>
        )}
      </PageHeader>

      {isAdmin && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <SummaryCard icon={Clock3} label="Open complaints" value={openComplaints.length} />
          <SummaryCard
            icon={CheckCircle2}
            label="Resolved complaints"
            value={resolvedComplaints.length}
          />
        </div>
      )}

      {isError || (isAdmin && complainantsError) ? (
        <PageLoadError onRetry={() => void queryClient.refetchQueries()} />
      ) : isLoading || (isAdmin && complainantsLoading) ? (
        <PageLoading label="Loading complaints" onRetry={() => void queryClient.refetchQueries()} />
      ) : isAdmin ? (
        <Tabs defaultValue="open">
          <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-96">
            <TabsTrigger value="open">Open ({openComplaints.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedComplaints.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <ComplaintList
              complaints={openComplaints}
              peopleById={peopleById}
              onSelect={openDetails}
              emptyTitle="No open complaints"
            />
          </TabsContent>
          <TabsContent value="resolved">
            <ComplaintList
              complaints={resolvedComplaints}
              peopleById={peopleById}
              onSelect={openDetails}
              emptyTitle="No resolved complaints"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ComplaintList
          complaints={complaints}
          peopleById={peopleById}
          onSelect={openDetails}
          emptyTitle="No complaints"
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New complaint</DialogTitle>
            <DialogDescription>Explain the issue briefly and clearly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What is the issue?</Label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="For example, broken street light"
              />
            </div>
            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>How urgent is it?</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createComplaint.mutate()} disabled={createComplaint.isPending}>
              Send complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ComplaintDetails
        complaint={selectedComplaint}
        complainant={selectedComplaint ? peopleById.get(selectedComplaint.reporter_id) : undefined}
        isAdmin={isAdmin}
        resolutionNotes={resolutionNotes}
        setResolutionNotes={setResolutionNotes}
        updating={updateStatus.isPending}
        onStatusChange={(status) =>
          selectedComplaint && updateStatus.mutate({ complaint: selectedComplaint, status })
        }
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}

function ComplaintList({
  complaints,
  peopleById,
  onSelect,
  emptyTitle,
}: {
  complaints: Complaint[];
  peopleById: Map<string, Complainant>;
  onSelect: (complaint: Complaint) => void;
  emptyTitle: string;
}) {
  if (complaints.length === 0) {
    return <EmptyState title={emptyTitle} description="Nothing needs attention here right now." />;
  }

  return (
    <div className="space-y-3">
      {complaints.map((complaint) => {
        const person = peopleById.get(complaint.reporter_id);
        return (
          <button
            key={complaint.id}
            type="button"
            className="w-full rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
            onClick={() => onSelect(complaint)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{complaint.subject}</h2>
                {person && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    From {person.full_name || person.email || "Community member"}
                  </p>
                )}
              </div>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {complaint.description}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(complaint.created_at).toLocaleString()}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ComplaintDetails({
  complaint,
  complainant,
  isAdmin,
  resolutionNotes,
  setResolutionNotes,
  updating,
  onStatusChange,
  onClose,
}: {
  complaint: Complaint | null;
  complainant?: Complainant;
  isAdmin: boolean;
  resolutionNotes: string;
  setResolutionNotes: (value: string) => void;
  updating: boolean;
  onStatusChange: (status: Status) => void;
  onClose: () => void;
}) {
  const phone = complainant?.phone || "";
  const whatsapp = complainant?.whatsapp_number || phone;

  return (
    <Dialog open={Boolean(complaint)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{complaint?.subject || "Complaint"}</DialogTitle>
          <DialogDescription>
            {complaint ? `Submitted ${new Date(complaint.created_at).toLocaleString()}` : ""}
          </DialogDescription>
        </DialogHeader>
        {complaint && (
          <div className="space-y-5">
            <div className="rounded-xl bg-secondary/35 p-4">
              <p className="text-sm leading-6">
                {complaint.description || "No description provided."}
              </p>
            </div>

            {isAdmin && (
              <section>
                <h3 className="font-display text-lg font-semibold">Complainant</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Detail label="Name" value={complainant?.full_name} />
                  <Detail label="Resident type" value={complainant?.resident_type} />
                  <Detail label="Phone" value={phone} />
                  <Detail label="WhatsApp" value={whatsapp} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {whatsapp && (
                    <Button asChild variant="outline">
                      <a href={getWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {phone && (
                    <Button asChild variant="outline">
                      <a href={`tel:${phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </section>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Detail label="Status" value={complaint.status.replace("_", " ")} />
              <Detail label="Priority" value={complaint.priority} />
              <Detail label="Category" value={complaint.category} />
            </div>

            {isAdmin && (
              <section className="space-y-3 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label>Resolution note</Label>
                  <Textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(event) => setResolutionNotes(event.target.value)}
                    placeholder="What was done to resolve this complaint?"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onStatusChange("in_progress")}
                    disabled={updating}
                  >
                    Mark in progress
                  </Button>
                  <Button onClick={() => onStatusChange("resolved")} disabled={updating}>
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark resolved
                  </Button>
                </div>
              </section>
            )}

            {!isAdmin && complaint.resolution_notes && (
              <Detail label="Resolution" value={complaint.resolution_notes} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
      </div>
      <Icon className="h-6 w-6 text-primary" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const resolved = ["resolved", "closed"].includes(status);
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        resolved ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 capitalize">{value || "Not provided"}</p>
    </div>
  );
}

function getWhatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
