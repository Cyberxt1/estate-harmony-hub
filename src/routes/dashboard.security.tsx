import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Plus, PhoneCall } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/security")({
  component: SecurityPage,
});

type SecurityIncident = Tables<"security_incidents">;
type EmergencyContact = Tables<"emergency_contacts">;

function SecurityPage() {
  const { user, profile, hasRole } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("low");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [status, setStatus] = useState("reported");
  const [contactLabel, setContactLabel] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactPriority, setContactPriority] = useState("1");

  const canManageSecurity =
    hasRole("chief_security_officer") || hasRole("community_chairman") || hasRole("estate_admin");

  const { data, isLoading, isError, refetch } = useQuery({
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

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["emergency-contacts", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmergencyContact[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id)
        throw new Error("Your account is not linked to Oyesile Estate yet.");
      const { error } = await supabase.from("security_incidents").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        type,
        severity: severity as "low" | "medium" | "high" | "critical",
        location,
        description,
        occurred_at: new Date().toISOString(),
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

  const updateIncident = useMutation({
    mutationFn: async () => {
      if (!selectedIncident) throw new Error("Choose an incident first.");
      const payload: Tables<"security_incidents">["Update"] = {
        status: status as SecurityIncident["status"],
        resolution_notes: status === "resolved" ? resolutionNotes.trim() || null : null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from("security_incidents")
        .update(payload)
        .eq("id", selectedIncident.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Incident updated");
      setSelectedIncident(null);
      setResolutionNotes("");
      await qc.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id || !user?.id) throw new Error("No estate linked.");
      const { error } = await supabase.from("emergency_contacts").insert({
        estate_id: profile.estate_id,
        created_by: user.id,
        label: contactLabel.trim(),
        phone: contactPhone.trim(),
        address: contactAddress.trim() || null,
        notes: contactNotes.trim() || null,
        priority: Number(contactPriority) || 0,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Emergency contact saved");
      setContactOpen(false);
      setContactLabel("");
      setContactPhone("");
      setContactAddress("");
      setContactNotes("");
      setContactPriority("1");
      await qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader
        title="Security"
        description="Incidents, emergency contacts, patrol records and resident help tools."
        icon={ShieldCheck}
      >
        <div className="flex gap-2">
          {canManageSecurity && (
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PhoneCall className="mr-1 h-4 w-4" /> Emergency contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add emergency contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Field label="Label">
                    <Input
                      value={contactLabel}
                      onChange={(e) => setContactLabel(e.target.value)}
                      placeholder="Estate security line"
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="080..."
                    />
                  </Field>
                  <Field label="Address">
                    <Input
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                    />
                  </Field>
                  <Field label="Priority">
                    <Input
                      type="number"
                      min="0"
                      value={contactPriority}
                      onChange={(e) => setContactPriority(e.target.value)}
                    />
                  </Field>
                  <Field label="Notes">
                    <Textarea
                      rows={3}
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                    />
                  </Field>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => addContact.mutate()}
                    loading={addContact.isPending}
                    loadingLabel="Saving contact"
                  >
                    Save contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

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
                <Field label="Type">
                  <Input
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g. Trespass, theft, suspicious activity"
                  />
                </Field>
                <Field label="Severity">
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Location">
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!type}
                  loading={create.isPending}
                  loadingLabel="Reporting incident"
                >
                  Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-semibold">Incident reports</h2>
          {isError ? (
            <PageLoadError onRetry={() => void refetch()} />
          ) : isLoading ? (
            <PageLoading label="Loading security records" onRetry={() => void refetch()} />
          ) : data && data.length > 0 ? (
            <div className="mt-4 space-y-3">
              {data.map((i) => (
                <div
                  key={i.id}
                  className="cursor-pointer rounded-md border border-border bg-card p-4 transition hover:bg-secondary/30"
                  onClick={() => {
                    setSelectedIncident(i);
                    setStatus(i.status);
                    setResolutionNotes(i.resolution_notes || "");
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{i.type}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {i.location} ·{" "}
                        {i.occurred_at ? new Date(i.occurred_at).toLocaleString() : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                        {i.severity}
                      </span>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                        {i.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No incidents reported"
              description="Security can log incidents, patrol activity and suspicious events here."
            />
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-semibold">Emergency contacts</h2>
          {contactsLoading ? (
            <PageLoading label="Loading emergency contacts" />
          ) : contacts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {contacts.map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.phone}`}
                  className="block rounded-lg border border-border p-3 transition hover:bg-secondary/30"
                >
                  <p className="font-medium">{contact.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{contact.phone}</p>
                  {contact.address && (
                    <p className="mt-1 text-xs text-muted-foreground">{contact.address}</p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No emergency contacts have been added yet.
            </p>
          )}
        </section>
      </div>

      <Dialog
        open={!!selectedIncident}
        onOpenChange={(nextOpen) => !nextOpen && setSelectedIncident(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.type || "Security incident"}</DialogTitle>
            <DialogDescription>Expanded security incident record.</DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Type" value={selectedIncident.type} />
                <Detail label="Status" value={selectedIncident.status} />
                <Detail label="Severity" value={selectedIncident.severity} />
                <Detail label="Location" value={selectedIncident.location} />
                <Detail
                  label="Occurred"
                  value={
                    selectedIncident.occurred_at
                      ? new Date(selectedIncident.occurred_at).toLocaleString()
                      : null
                  }
                />
                <Detail
                  label="Resolved"
                  value={
                    selectedIncident.resolved_at
                      ? new Date(selectedIncident.resolved_at).toLocaleString()
                      : null
                  }
                />
                <Detail label="Description" value={selectedIncident.description} wide />
              </div>

              {canManageSecurity && (
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <Field label="Update status">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["reported", "investigating", "resolved", "archived"].map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Resolution notes">
                    <Textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </Field>
                  <Button
                    onClick={() => updateIncident.mutate()}
                    loading={updateIncident.isPending}
                    loadingLabel="Saving incident"
                  >
                    Save incident update
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
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
    <div
      className={`rounded-md border border-border bg-secondary/20 p-3 ${wide ? "sm:col-span-2" : ""}`}
    >
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "Not provided"}</p>
    </div>
  );
}
