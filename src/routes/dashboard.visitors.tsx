import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Plus, QrCode, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  getPropertyLabel,
  getResidentHousingDetails,
  type ResidentHousingDetails,
} from "@/lib/property-occupancy";
import { formatDateTime, getVisitorQrDataUrl, getVisitorWhatsAppLink } from "@/lib/visitor-qr";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/visitors")({
  component: VisitorsPage,
});

type Visitor = Tables<"visitors">;
type PropertyLite = Pick<
  Tables<"properties">,
  "id" | "compound_name" | "house_number" | "apartment_name"
>;
type HostProfileLite = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "onboarding_completed" | "onboarding_data"
>;
type VisitorRow = Visitor & {
  destinationLabel: string;
  hostLabel: string;
};

function VisitorsPage() {
  const { user, profile, isSecurity, isAdmin, primaryRole } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRow | null>(null);
  const [shareVisitor, setShareVisitor] = useState<VisitorRow | null>(null);
  const [shareQrUrl, setShareQrUrl] = useState("");

  const housing = profile ? getResidentHousingDetails(profile) : emptyHousingDetails();
  const residentInviteReady = Boolean(profile?.onboarding_completed && housing.houseOrApartment);
  const securityWideView = isSecurity;
  const canManageGate = isSecurity;
  const canInvite =
    primaryRole !== "security_gateman" && (isAdmin || isSecurity || residentInviteReady);

  const {
    data: visitors = [],
    isLoading: visitorsLoading,
    isError: visitorsError,
    refetch,
  } = useQuery({
    queryKey: ["visitors", profile?.estate_id, user?.id, securityWideView],
    enabled: Boolean(profile?.estate_id) && Boolean(user?.id),
    queryFn: async () => {
      let query = supabase
        .from("visitors")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("created_at", { ascending: false })
        .limit(150);
      if (!securityWideView) {
        query = query.eq("host_id", user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Visitor[];
    },
  });

  const {
    data: properties = [],
    isLoading: propertiesLoading,
    isError: propertiesError,
  } = useQuery({
    queryKey: ["visitor-properties", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, compound_name, house_number, apartment_name")
        .eq("estate_id", profile!.estate_id!)
        .order("house_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PropertyLite[];
    },
  });

  const hostIds = useMemo(
    () => [...new Set(visitors.map((visitor) => visitor.host_id).filter(Boolean))],
    [visitors],
  );

  const {
    data: hostProfiles = [],
    isLoading: hostProfilesLoading,
    isError: hostProfilesError,
  } = useQuery({
    queryKey: ["visitor-host-profiles", hostIds.join(",")],
    enabled: hostIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, onboarding_completed, onboarding_data")
        .in("id", hostIds);
      if (error) throw error;
      return (data ?? []) as HostProfileLite[];
    },
  });

  const propertyById = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  );
  const hostById = useMemo(
    () => new Map(hostProfiles.map((host) => [host.id, host])),
    [hostProfiles],
  );

  const rows = useMemo(
    () =>
      visitors.map((visitor) => {
        const property = visitor.property_id ? propertyById.get(visitor.property_id) : null;
        const host = hostById.get(visitor.host_id);
        return {
          ...visitor,
          destinationLabel: getDestinationLabel(visitor, property, host),
          hostLabel: host?.full_name || "Estate host",
        } satisfies VisitorRow;
      }),
    [hostById, propertyById, visitors],
  );

  useEffect(() => {
    if (!shareVisitor) {
      setShareQrUrl("");
      return;
    }
    getVisitorQrDataUrl(shareVisitor)
      .then(setShareQrUrl)
      .catch(() => setShareQrUrl(""));
  }, [shareVisitor]);

  const invite = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) {
        throw new Error("Your account is not linked to Oyesile Estate yet.");
      }
      if (!fullName.trim()) throw new Error("Enter the visitor's full name.");
      if (!phone.trim()) throw new Error("Enter the visitor's phone number.");
      if (!isAdmin && !isSecurity && !residentInviteReady) {
        throw new Error(
          "Complete your profile and add your house number before inviting visitors.",
        );
      }

      const propertyId = resolveHostPropertyId({
        isAdmin,
        isSecurity,
        profile,
        properties,
      });

      if (!isAdmin && !isSecurity && !propertyId) {
        throw new Error(
          "Your house number does not match any property yet. Complete your profile details first.",
        );
      }

      const qr = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const { data: visitor, error } = await supabase
        .from("visitors")
        .insert({
          estate_id: profile.estate_id,
          host_id: user.id,
          property_id: propertyId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          purpose: purpose.trim() || null,
          expected_at: expectedAt ? new Date(expectedAt).toISOString() : null,
          qr_code: qr,
          status: "expected",
        })
        .select("*")
        .single();

      if (error) throw error;
      return visitor as Visitor;
    },
    onSuccess: async (visitor) => {
      toast.success("Visitor invite created.");
      setOpen(false);
      setFullName("");
      setPhone("");
      setPurpose("");
      setExpectedAt("");
      await qc.invalidateQueries({ queryKey: ["visitors"] });
      const property = visitor.property_id ? propertyById.get(visitor.property_id) : null;
      const row = {
        ...visitor,
        destinationLabel: getDestinationLabel(
          visitor,
          property,
          profile ? toHostProfile(profile) : null,
        ),
        hostLabel: profile?.full_name || "Estate host",
      } satisfies VisitorRow;
      setShareVisitor(row);
      openWhatsAppShare(row, profile?.full_name || "Estate host");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "checked_in" | "checked_out" }) => {
      const patch: Tables<"visitors">["Update"] = { status };
      if (status === "checked_in") {
        patch.checked_in_at = new Date().toISOString();
        if (user?.id) patch.checked_in_by = user.id;
      } else {
        patch.checked_out_at = new Date().toISOString();
        if (user?.id) patch.checked_out_by = user.id;
      }
      const { error } = await supabase.from("visitors").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["visitors"] });
      await qc.invalidateQueries({ queryKey: ["gate-visitors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isLoading = visitorsLoading || propertiesLoading || hostProfilesLoading;
  const isError = visitorsError || propertiesError || hostProfilesError;

  return (
    <div>
      <PageHeader
        title="Visitors"
        description={
          securityWideView
            ? "See every visitor, destination house number and visit date for gate and security work."
            : canInvite
              ? "Invite visitors, generate QR codes and share them."
              : "Complete your profile and add your house number before inviting a visitor."
        }
        icon={QrCode}
      >
        {canInvite ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Invite visitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a visitor</DialogTitle>
                <DialogDescription>
                  Create the invite, download the QR code, and send it to the visitor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Full name">
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </Field>
                <Field label="Visitor phone">
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="08012345678"
                  />
                </Field>
                <Field label="Purpose">
                  <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} />
                </Field>
                <Field label="Expected arrival">
                  <Input
                    type="datetime-local"
                    value={expectedAt}
                    onChange={(event) => setExpectedAt(event.target.value)}
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => invite.mutate()}
                  disabled={!fullName.trim() || !phone.trim()}
                  loading={invite.isPending}
                  loadingLabel="Generating visitor QR"
                >
                  Generate QR
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </PageHeader>

      {isError ? (
        <PageLoadError onRetry={() => void refetch()} />
      ) : isLoading ? (
        <PageLoading label="Loading visitors" onRetry={() => void refetch()} />
      ) : rows.length > 0 ? (
        securityWideView ? (
          <SecurityVisitorTable
            visitors={rows}
            canManageGate={canManageGate}
            onSelect={setSelectedVisitor}
            onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
          />
        ) : (
          <InviteVisitorTable
            visitors={rows}
            canManageGate={canManageGate}
            onSelect={setSelectedVisitor}
            onShare={setShareVisitor}
            onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
          />
        )
      ) : (
        <EmptyState
          title="No visitors yet"
          description={
            securityWideView
              ? "Visitor entries will appear here for the estate security team."
              : "Invite a visitor to generate a QR code and share it before arrival."
          }
        />
      )}

      <Dialog
        open={Boolean(selectedVisitor)}
        onOpenChange={(open) => !open && setSelectedVisitor(null)}
      >
        <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedVisitor?.full_name || "Visitor"}</DialogTitle>
            <DialogDescription>Expanded visitor invite and gate activity.</DialogDescription>
          </DialogHeader>
          {selectedVisitor ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Name" value={selectedVisitor.full_name} />
              <Detail label="Destination" value={selectedVisitor.destinationLabel} />
              <Detail label="Phone" value={selectedVisitor.phone} />
              <Detail label="Host" value={selectedVisitor.hostLabel} />
              <Detail label="Purpose" value={selectedVisitor.purpose} wide />
              <Detail
                label="Expected arrival"
                value={formatDateTime(selectedVisitor.expected_at)}
              />
              <Detail label="Status" value={selectedVisitor.status.replace("_", " ")} />
              <Detail label="QR code" value={selectedVisitor.qr_code} wide />
              <Detail label="Checked in" value={formatDateTime(selectedVisitor.checked_in_at)} />
              <Detail label="Checked out" value={formatDateTime(selectedVisitor.checked_out_at)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(shareVisitor)} onOpenChange={(open) => !open && setShareVisitor(null)}>
        <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{shareVisitor?.full_name || "Visitor invite"}</DialogTitle>
            <DialogDescription>
              Download the QR code or send the invite straight to the visitor.
            </DialogDescription>
          </DialogHeader>
          {shareVisitor ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                {shareQrUrl ? (
                  <img
                    src={shareQrUrl}
                    alt={`QR code for ${shareVisitor.full_name}`}
                    className="mx-auto h-64 w-64 rounded-xl bg-white p-3"
                  />
                ) : (
                  <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                    Generating QR code...
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Code" value={shareVisitor.qr_code} />
                <Detail label="Phone" value={shareVisitor.phone} />
                <Detail label="Destination" value={shareVisitor.destinationLabel} />
                <Detail label="Purpose" value={shareVisitor.purpose} wide />
                <Detail
                  label="Expected arrival"
                  value={formatDateTime(shareVisitor.expected_at)}
                  wide
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => void downloadQrCode(shareVisitor)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    openWhatsAppShare(shareVisitor, profile?.full_name || "Estate host")
                  }
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityVisitorTable({
  visitors,
  canManageGate,
  onSelect,
  onUpdateStatus,
}: {
  visitors: VisitorRow[];
  canManageGate: boolean;
  onSelect: (visitor: VisitorRow) => void;
  onUpdateStatus: (id: string, status: "checked_in" | "checked_out") => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor) => (
            <tr
              key={visitor.id}
              className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
              onClick={() => onSelect(visitor)}
            >
              <td className="px-4 py-3 font-medium">{visitor.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{visitor.destinationLabel}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {visitor.expected_at ? new Date(visitor.expected_at).toLocaleString() : "-"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                  {visitor.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div
                  className="flex flex-wrap justify-end gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {canManageGate && visitor.status === "expected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(visitor.id, "checked_in")}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Check in
                    </Button>
                  ) : null}
                  {canManageGate && visitor.status === "checked_in" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(visitor.id, "checked_out")}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Check out
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InviteVisitorTable({
  visitors,
  canManageGate,
  onSelect,
  onShare,
  onUpdateStatus,
}: {
  visitors: VisitorRow[];
  canManageGate: boolean;
  onSelect: (visitor: VisitorRow) => void;
  onShare: (visitor: VisitorRow) => void;
  onUpdateStatus: (id: string, status: "checked_in" | "checked_out") => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Purpose</th>
            <th className="px-4 py-3">Expected</th>
            <th className="px-4 py-3">QR</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor) => (
            <tr
              key={visitor.id}
              className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
              onClick={() => onSelect(visitor)}
            >
              <td className="px-4 py-3 font-medium">{visitor.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{visitor.purpose || "-"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {visitor.expected_at ? new Date(visitor.expected_at).toLocaleString() : "-"}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{visitor.qr_code}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                  {visitor.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div
                  className="flex flex-wrap justify-end gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button size="sm" variant="outline" onClick={() => onShare(visitor)}>
                    <Share2 className="mr-1 h-3.5 w-3.5" />
                    Share
                  </Button>
                  {canManageGate && visitor.status === "expected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(visitor.id, "checked_in")}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Check in
                    </Button>
                  ) : null}
                  {canManageGate && visitor.status === "checked_in" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(visitor.id, "checked_out")}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Check out
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function getDestinationLabel(
  visitor: Visitor,
  property?: PropertyLite | null,
  host?: HostProfileLite | null,
) {
  if (property) {
    const label = getPropertyLabel(property);
    return property.compound_name ? `${label}, ${property.compound_name}` : label;
  }
  if (host) {
    const housing = getResidentHousingDetails(host);
    return housing.houseOrApartment || "Not set";
  }
  return "Not set";
}

function resolveHostPropertyId({
  isAdmin,
  isSecurity,
  profile,
  properties,
}: {
  isAdmin: boolean;
  isSecurity: boolean;
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  properties: PropertyLite[];
}) {
  const housing = getResidentHousingDetails(profile);
  if (!housing.houseOrApartment) return isAdmin || isSecurity ? null : null;

  const houseKey = normalizeText(housing.houseOrApartment);
  const compoundKey = normalizeText(housing.compoundName);
  const matches = properties.filter((property) => {
    const labels = [
      property.house_number,
      property.apartment_name || "",
      getPropertyLabel(property),
      `${property.house_number} ${property.apartment_name || ""}`,
    ].map(normalizeText);
    return labels.includes(houseKey);
  });

  if (matches.length === 0) return isAdmin || isSecurity ? null : null;
  if (!compoundKey) return matches[0].id;
  return (
    matches.find((property) => normalizeText(property.compound_name || "") === compoundKey)?.id ??
    matches[0].id
  );
}

function toHostProfile(
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>,
): HostProfileLite {
  return {
    id: profile.id,
    full_name: profile.full_name,
    onboarding_completed: profile.onboarding_completed,
    onboarding_data: profile.onboarding_data,
  };
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function emptyHousingDetails(): ResidentHousingDetails {
  return {
    compoundName: "",
    houseOrApartment: "",
    landlordName: "",
    landlordPhone: "",
    stayDuration: "",
  };
}

function openWhatsAppShare(visitor: Visitor, hostName: string) {
  const link = getVisitorWhatsAppLink(visitor, hostName);
  if (!link) {
    toast.error("Enter a valid visitor phone number with country code or a working mobile number.");
    return;
  }

  window.open(link, "_blank", "noopener,noreferrer");
}

async function downloadQrCode(visitor: Visitor) {
  try {
    const dataUrl = await getVisitorQrDataUrl(visitor);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${visitor.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "visitor"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("QR code could not be downloaded right now.");
  }
}
