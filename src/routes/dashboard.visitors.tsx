import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { QrCode, Plus, CheckCircle2, Download, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, getVisitorQrDataUrl, getVisitorWhatsAppLink } from "@/lib/visitor-qr";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
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

export const Route = createFileRoute("/dashboard/visitors")({
  component: VisitorsPage,
});

type Visitor = Tables<"visitors">;

function VisitorsPage() {
  const { user, profile, isSecurity, isAdmin, primaryRole } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [shareVisitor, setShareVisitor] = useState<Visitor | null>(null);
  const [shareQrUrl, setShareQrUrl] = useState("");

  const canInvite = primaryRole !== "security_gateman";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

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

      const qr = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const { data: visitor, error } = await supabase
        .from("visitors")
        .insert({
          estate_id: profile.estate_id,
          host_id: user.id,
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
      return visitor;
    },
    onSuccess: async (visitor) => {
      toast.success("Visitor invite created.");
      setShareVisitor(visitor);
      setOpen(false);
      setFullName("");
      setPhone("");
      setPurpose("");
      setExpectedAt("");
      await qc.invalidateQueries({ queryKey: ["visitors"] });
      openWhatsAppShare(visitor, profile?.full_name || "Resident");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "checked_in" | "checked_out" }) => {
      const patch: {
        status: "checked_in" | "checked_out";
        checked_in_at?: string;
        checked_in_by?: string;
        checked_out_at?: string;
        checked_out_by?: string;
      } = { status };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Visitors"
        description={
          canInvite
            ? "Invite, generate QR codes, check in and out."
            : "Scan, check in and log visitors at the gate."
        }
        icon={QrCode}
      >
        {canInvite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Invite visitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a visitor</DialogTitle>
                <DialogDescription>
                  Create the invite, download the QR, and send it straight to the visitor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Full name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
                <Field label="Visitor phone">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                  />
                </Field>
                <Field label="Purpose">
                  <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                </Field>
                <Field label="Expected arrival">
                  <Input
                    type="datetime-local"
                    value={expectedAt}
                    onChange={(e) => setExpectedAt(e.target.value)}
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
        )}
      </PageHeader>

      {isError ? (
        <PageLoadError onRetry={() => void refetch()} />
      ) : isLoading ? (
        <PageLoading label="Loading visitors" onRetry={() => void refetch()} />
      ) : data && data.length > 0 ? (
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
              {data.map((visitor) => (
                <tr
                  key={visitor.id}
                  className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
                  onClick={() => setSelectedVisitor(visitor)}
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
                      <Button size="sm" variant="outline" onClick={() => setShareVisitor(visitor)}>
                        <Share2 className="mr-1 h-3.5 w-3.5" /> Share
                      </Button>
                      {(isSecurity || isAdmin) && visitor.status === "expected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatus.mutate({ id: visitor.id, status: "checked_in" })
                          }
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Check in
                        </Button>
                      )}
                      {(isSecurity || isAdmin) && visitor.status === "checked_in" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatus.mutate({ id: visitor.id, status: "checked_out" })
                          }
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Check out
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No visitors yet"
          description="Invite a visitor to generate a QR code. Security can scan and check them in at the gate."
        />
      )}

      <Dialog open={!!selectedVisitor} onOpenChange={(open) => !open && setSelectedVisitor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedVisitor?.full_name || "Visitor"}</DialogTitle>
            <DialogDescription>Expanded visitor invite and gate activity.</DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Name" value={selectedVisitor.full_name} />
              <Detail label="Phone" value={selectedVisitor.phone} />
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
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareVisitor} onOpenChange={(open) => !open && setShareVisitor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{shareVisitor?.full_name || "Visitor invite"}</DialogTitle>
            <DialogDescription>
              Download the QR code or send the invite straight to the visitor.
            </DialogDescription>
          </DialogHeader>
          {shareVisitor && (
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
                  onClick={() => openWhatsAppShare(shareVisitor, profile?.full_name || "Resident")}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </Button>
              </div>
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
