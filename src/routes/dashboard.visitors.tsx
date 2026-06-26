import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QrCode, Plus, CheckCircle2, XCircle } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/visitors")({
  component: VisitorsPage,
});

function VisitorsPage() {
  const { user, profile, isSecurity, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedAt, setExpectedAt] = useState("");

  const { data, isLoading } = useQuery({
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

  const invite = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("Your estate isn't configured yet.");
      const qr = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const { error } = await supabase.from("visitors").insert({
        estate_id: profile.estate_id,
        host_id: user.id,
        full_name: fullName,
        phone,
        purpose,
        expected_at: expectedAt ? new Date(expectedAt).toISOString() : null,
        qr_code: qr,
        status: "expected",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visitor invited. Share the QR code with them.");
      setOpen(false);
      setFullName("");
      setPhone("");
      setPurpose("");
      setExpectedAt("");
      qc.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "checked_in" | "checked_out" }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "checked_in") {
        patch.checked_in_at = new Date().toISOString();
        patch.checked_in_by = user?.id;
      } else {
        patch.checked_out_at = new Date().toISOString();
        patch.checked_out_by = user?.id;
      }
      const { error } = await supabase.from("visitors").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Visitors" description="Invite, generate QR codes, check in and out." icon={QrCode}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Invite visitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a visitor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expected arrival</Label>
                <Input type="datetime-local" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => invite.mutate()} disabled={!fullName || invite.isPending}>
                Generate QR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data && data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
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
              {data.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{v.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.purpose || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.expected_at ? new Date(v.expected_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.qr_code}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(isSecurity || isAdmin) && v.status === "expected" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: "checked_in" })}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Check in
                      </Button>
                    )}
                    {(isSecurity || isAdmin) && v.status === "checked_in" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: "checked_out" })}>
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Check out
                      </Button>
                    )}
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
    </div>
  );
}
