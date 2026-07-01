import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Megaphone, PhoneCall, Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, PageHeader } from "@/components/page-header";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/security")({
  component: SecurityPage,
});

type SecurityIncident = Tables<"security_incidents"> & {
  resolution_notes?: string | null;
  resolved_at?: string | null;
};
type EmergencyContact = Tables<"emergency_contacts">;
type IncidentTab = "reported" | "investigating" | "resolved" | "archived";

function SecurityPage() {
  const { user, profile, hasRole } = useAuth();
  const qc = useQueryClient();
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState<SecurityIncident["severity"]>("low");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [status, setStatus] = useState<SecurityIncident["status"]>("reported");
  const [activeTab, setActiveTab] = useState<IncidentTab>("reported");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [contactLabel, setContactLabel] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [contactPriority, setContactPriority] = useState("1");

  const canManageSecurity =
    hasRole("chief_security_officer") || hasRole("community_chairman") || hasRole("estate_admin");

  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    isError: incidentsError,
    refetch,
  } = useQuery({
    queryKey: ["incidents", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_incidents")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SecurityIncident[];
    },
  });

  const {
    data: contacts = [],
    isLoading: contactsLoading,
    isError: contactsError,
  } = useQuery({
    queryKey: ["emergency-contacts", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmergencyContact[];
    },
  });

  const groupedIncidents = useMemo(
    () => ({
      reported: incidents.filter((incident) => incident.status === "reported"),
      investigating: incidents.filter((incident) => incident.status === "investigating"),
      resolved: incidents.filter((incident) => incident.status === "resolved"),
      archived: incidents.filter((incident) => incident.status === "archived"),
    }),
    [incidents],
  );

  const criticalCount = incidents.filter((incident) => incident.severity === "critical").length;
  const openCount = groupedIncidents.reported.length + groupedIncidents.investigating.length;

  const createIncident = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) {
        throw new Error("Your account is not linked to Oyesile Estate yet.");
      }
      if (!type.trim()) throw new Error("Enter the incident type.");

      const { error } = await supabase.from("security_incidents").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        type: type.trim(),
        severity,
        location: location.trim() || null,
        description: description.trim() || null,
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Incident reported.");
      setIncidentOpen(false);
      setType("");
      setSeverity("low");
      setLocation("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publishNotice = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("No estate linked to this account.");
      if (!noticeTitle.trim() || !noticeBody.trim()) {
        throw new Error("Add a clear title and message for residents.");
      }
      const { error } = await supabase.from("announcements").insert({
        estate_id: profile.estate_id,
        author_id: user.id,
        title: noticeTitle.trim(),
        body: noticeBody.trim(),
        audience: "all",
        priority: "emergency",
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Security notification sent to all residents.");
      setNoticeOpen(false);
      setNoticeTitle("");
      setNoticeBody("");
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateIncident = useMutation({
    mutationFn: async () => {
      if (!selectedIncident) throw new Error("Choose an incident first.");
      const payload: Record<string, unknown> = {
        status,
        resolution_notes: status === "resolved" ? resolutionNotes.trim() || null : null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from("security_incidents")
        .update(payload as never)
        .eq("id", selectedIncident.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Incident updated.");
      setSelectedIncident(null);
      setResolutionNotes("");
      await qc.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id || !user?.id) throw new Error("No estate linked.");
      if (!contactLabel.trim() || !contactPhone.trim()) {
        throw new Error("Add an agency name and phone number.");
      }
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
      toast.success("Emergency contact saved.");
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

  const hasError = incidentsError || contactsError;
  const isLoading = incidentsLoading || contactsLoading;

  return (
    <div>
      <PageHeader
        title="Security"
        description="Incident reporting, resident alerts, and emergency agency escalation."
        icon={ShieldCheck}
      >
        <div className="flex flex-wrap gap-2">
          {canManageSecurity && (
            <>
              <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Security alert
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send security notification</DialogTitle>
                    <DialogDescription>
                      This goes out to all residents as an estate-wide emergency notice.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Field label="Title">
                      <Input
                        value={noticeTitle}
                        onChange={(event) => setNoticeTitle(event.target.value)}
                        placeholder="Security notice"
                      />
                    </Field>
                    <Field label="Message">
                      <Textarea
                        rows={5}
                        value={noticeBody}
                        onChange={(event) => setNoticeBody(event.target.value)}
                        placeholder="Explain what happened, what residents should do, and any immediate safety steps."
                      />
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => publishNotice.mutate()}
                      loading={publishNotice.isPending}
                      loadingLabel="Sending alert"
                    >
                      Send alert
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Agency contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add escalation contact</DialogTitle>
                    <DialogDescription>
                      Save the phone numbers for police, fire, medical, or any relevant agency.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Field label="Agency or contact name">
                      <Input
                        value={contactLabel}
                        onChange={(event) => setContactLabel(event.target.value)}
                        placeholder="Police control room"
                      />
                    </Field>
                    <Field label="Phone number">
                      <Input
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                        placeholder="080..."
                      />
                    </Field>
                    <Field label="Address">
                      <Input
                        value={contactAddress}
                        onChange={(event) => setContactAddress(event.target.value)}
                      />
                    </Field>
                    <Field label="Priority">
                      <Input
                        type="number"
                        min="0"
                        value={contactPriority}
                        onChange={(event) => setContactPriority(event.target.value)}
                      />
                    </Field>
                    <Field label="Notes">
                      <Textarea
                        rows={3}
                        value={contactNotes}
                        onChange={(event) => setContactNotes(event.target.value)}
                        placeholder="When to call this agency or any special instruction."
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
            </>
          )}

          <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report incident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report incident</DialogTitle>
                <DialogDescription>
                  Log the incident clearly so the security team can act on it fast.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Type">
                  <Input
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    placeholder="Trespass, theft, suspicious movement, gate issue"
                  />
                </Field>
                <Field label="Severity">
                  <Select
                    value={severity}
                    onValueChange={(value) => setSeverity(value as SecurityIncident["severity"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map((item) => (
                        <SelectItem key={item} value={item} className="capitalize">
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Location">
                  <Input value={location} onChange={(event) => setLocation(event.target.value)} />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What happened, who was involved, and what was seen."
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createIncident.mutate()}
                  disabled={!type.trim()}
                  loading={createIncident.isPending}
                  loadingLabel="Reporting incident"
                >
                  Report incident
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Open incidents" value={openCount} tone="amber" />
        <SummaryCard label="Critical cases" value={criticalCount} tone="red" />
        <SummaryCard label="Resolved" value={groupedIncidents.resolved.length} tone="green" />
        <SummaryCard label="Archived" value={groupedIncidents.archived.length} tone="slate" />
      </div>

      {hasError ? (
        <PageLoadError onRetry={() => void refetch()} />
      ) : isLoading ? (
        <PageLoading label="Loading security records" onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Incident reports</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Work through reports by status instead of one long mixed list.
                </p>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as IncidentTab)}
              className="mt-4"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 sm:grid-cols-4">
                <TabsTrigger value="reported">Reported</TabsTrigger>
                <TabsTrigger value="investigating">Investigating</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>

              {(["reported", "investigating", "resolved", "archived"] as IncidentTab[]).map(
                (tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    {groupedIncidents[tab].length ? (
                      <div className="space-y-3">
                        {groupedIncidents[tab].map((incident) => (
                          <button
                            key={incident.id}
                            type="button"
                            className="block w-full rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:bg-secondary/30"
                            onClick={() => {
                              setSelectedIncident(incident);
                              setStatus(incident.status);
                              setResolutionNotes(incident.resolution_notes || "");
                            }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold">{incident.type}</h3>
                                  <SeverityPill severity={incident.severity} />
                                  <StatusPill status={incident.status} />
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {incident.location || "Location not added"}
                                </p>
                                {incident.description ? (
                                  <p className="mt-2 text-sm text-foreground/80">
                                    {incident.description.length > 160
                                      ? `${incident.description.slice(0, 160)}...`
                                      : incident.description}
                                  </p>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {incident.occurred_at
                                  ? new Date(incident.occurred_at).toLocaleString()
                                  : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No incidents here"
                        description={`No ${tab.replace("_", " ")} incidents yet.`}
                      />
                    )}
                  </TabsContent>
                ),
              )}
            </Tabs>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Escalation contacts</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Call the relevant agency directly from here during a security issue.
            </p>

            {contacts.length ? (
              <div className="mt-4 space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{contact.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.address ? (
                          <p className="mt-1 text-xs text-muted-foreground">{contact.address}</p>
                        ) : null}
                        {contact.notes ? (
                          <p className="mt-2 text-xs text-muted-foreground">{contact.notes}</p>
                        ) : null}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${contact.phone}`}>
                          <PhoneCall className="mr-2 h-4 w-4" />
                          Call
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No emergency agencies or escalation contacts have been added yet.
              </p>
            )}
          </section>
        </div>
      )}

      <Dialog
        open={Boolean(selectedIncident)}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      >
        <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedIncident?.type || "Security incident"}</DialogTitle>
            <DialogDescription>
              Clear incident details, actions, and escalation context.
            </DialogDescription>
          </DialogHeader>
          {selectedIncident ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
                {selectedIncident.resolution_notes ? (
                  <Detail label="Resolution notes" value={selectedIncident.resolution_notes} wide />
                ) : null}
              </div>

              {contacts.length ? (
                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-medium">Escalate to agency</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contacts.slice(0, 4).map((contact) => (
                      <Button key={contact.id} asChild variant="outline" size="sm">
                        <a href={`tel:${contact.phone}`}>
                          <PhoneCall className="mr-2 h-4 w-4" />
                          {contact.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {canManageSecurity ? (
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <Field label="Update status">
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as SecurityIncident["status"])}
                    >
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
                      rows={4}
                      value={resolutionNotes}
                      onChange={(event) => setResolutionNotes(event.target.value)}
                      placeholder="What was done, who handled it, and the final outcome."
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
              ) : null}
            </div>
          ) : null}
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "amber" | "slate";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/8"
      : tone === "red"
        ? "bg-red-500/8"
        : tone === "amber"
          ? "bg-amber-500/8"
          : "bg-secondary/40";

  return (
    <div className={`rounded-lg border border-border p-4 ${toneClass}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: SecurityIncident["severity"] }) {
  const tone =
    severity === "critical"
      ? "bg-red-500/15 text-red-700"
      : severity === "high"
        ? "bg-amber-500/15 text-amber-700"
        : severity === "medium"
          ? "bg-sky-500/15 text-sky-700"
          : "bg-emerald-500/15 text-emerald-700";

  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${tone}`}>{severity}</span>;
}

function StatusPill({ status }: { status: SecurityIncident["status"] }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
      {status.replace("_", " ")}
    </span>
  );
}
