import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CreditCard, Loader2, Plus, Repeat2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsPage,
});

type Invoice = Tables<"invoices">;
type ResidentProfile = Pick<Tables<"profiles">, "id" | "estate_id" | "full_name" | "email" | "resident_type">;
type PaymentTarget = "tenant" | "landlord";
type PaymentFrequency = "one_time" | "monthly" | "quarterly" | "yearly";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { profile, isAdmin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [target, setTarget] = useState<PaymentTarget>("tenant");
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate());

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", profile?.estate_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: residents } = useQuery({
    queryKey: ["payment-residents", profile?.estate_id],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, estate_id, full_name, email, resident_type")
        .in("resident_type", ["tenant", "landlord"])
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ResidentProfile[];
    },
  });

  const targetResidents = useMemo(
    () => (residents ?? []).filter((resident) => resident.resident_type === target),
    [residents, target],
  );

  const reviewInvoice = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoice.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment request sent to residents");
    },
    onError: (error) => toast.error(error.message),
  });

  const createPaymentRequest = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate.");
      const numericAmount = Number(amount);
      if (!description.trim()) throw new Error("Enter a payment title.");
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error("Enter a valid amount.");
      if (targetResidents.length === 0) throw new Error(`No ${target}s found yet.`);

      const period = getPaymentPeriod(dueDate, frequency);
      const stamp = Date.now().toString().slice(-6);
      const rows = targetResidents.map((resident, index) => ({
        estate_id: profile.estate_id!,
        resident_id: resident.id,
        invoice_number: `OYE-${target.toUpperCase()}-${stamp}-${String(index + 1).padStart(3, "0")}`,
        description: description.trim(),
        amount: numericAmount,
        currency: "NGN",
        due_date: dueDate,
        period_start: period.start,
        period_end: period.end,
        status: "draft" as const,
        line_items: [
          {
            title: description.trim(),
            amount: numericAmount,
            target,
            frequency,
            resident_name: resident.full_name || resident.email || "Resident",
          },
        ],
      }));

      const { error } = await supabase.from("invoices").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: async (count) => {
      toast.success(`${count} payment request${count === 1 ? "" : "s"} created as draft`);
      setCreateOpen(false);
      setDescription("");
      setAmount("");
      setTarget("tenant");
      setFrequency("monthly");
      setDueDate(getDefaultDueDate());
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const pendingCount = invoices?.filter((invoice) => invoice.status === "draft").length ?? 0;
  const outstanding = (invoices ?? []).reduce(
    (sum, invoice) => sum + Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0),
    0,
  );
  const nextDue = (invoices ?? [])
    .filter((invoice) => invoice.due_date && invoice.status !== "paid" && invoice.status !== "cancelled")
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0]?.due_date;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Reviewed dues, repeating estate charges and Paystack payments for Oyesile Estate."
        icon={CreditCard}
      />

      {isAdmin && (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Create new payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a draft charge for tenants or landlords, set its frequency, then publish it when reviewed.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create payment
          </Button>
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <SummaryTile icon={CreditCard} label="Outstanding" value={formatMoney(outstanding)} />
        <SummaryTile icon={CalendarClock} label="Next due date" value={formatDate(nextDue)} />
        <SummaryTile icon={Repeat2} label="Awaiting review" value={String(pendingCount)} />
      </div>

      <div className="mb-6 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Recurring payment flow</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admins create and review repeating dues for tenants and landlords.
              Once sent, residents can pay with Paystack and the payment remains
              visible for admin verification.
            </p>
          </div>
          <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
            Paystack public key: {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? "Configured" : "Not configured"}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading payments
        </div>
      ) : invoices && invoices.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Charge</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const balance = Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
                return (
                  <tr key={invoice.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.description || "Estate dues"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPeriod(invoice.period_start, invoice.period_end)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3">{formatMoney(balance, invoice.currency)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isAdmin && invoice.status === "draft" ? (
                          <Button
                            size="sm"
                            onClick={() => reviewInvoice.mutate(invoice)}
                            disabled={reviewInvoice.isPending}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void startPaystackPayment(invoice)}
                            disabled={balance <= 0 || invoice.status === "draft"}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No dues yet"
          description="When community admins create monthly dues, service charges or landlord levies, they will appear here for review and payment."
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create new payment</DialogTitle>
            <DialogDescription>
              Save as draft first. Use Send to publish the payment to residents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-title">Payment title</Label>
              <Input
                id="payment-title"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Monthly security dues"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-due">Due date</Label>
                <Input
                  id="payment-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Publish for</Label>
                <Select value={target} onValueChange={(value) => setTarget(value as PaymentTarget)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenants</SelectItem>
                    <SelectItem value="landlord">Landlords</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as PaymentFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                readOnly
                value={`${targetResidents.length} ${targetResidents.length === 1 ? target : `${target}s`} will receive this ${formatFrequency(frequency)} payment request.`}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createPaymentRequest.mutate()}
                disabled={createPaymentRequest.isPending}
              >
                {createPaymentRequest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-success/15 text-success"
      : status === "draft"
        ? "bg-warning/20 text-warning-foreground"
        : "bg-accent text-accent-foreground";

  return <span className={`rounded-md px-2 py-1 text-xs capitalize ${tone}`}>{status}</span>;
}

function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return "Repeating";
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  return formatDate(start ?? end);
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function getPaymentPeriod(dueDate: string, frequency: PaymentFrequency) {
  if (frequency === "one_time") return { start: dueDate, end: dueDate };

  const start = new Date(dueDate);
  const end = new Date(start);
  const monthStep = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  end.setMonth(end.getMonth() + monthStep);
  end.setDate(end.getDate() - 1);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatFrequency(frequency: PaymentFrequency) {
  return frequency === "one_time" ? "one-time" : frequency;
}

async function startPaystackPayment(invoice: Invoice) {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!key) {
    toast.error("Add VITE_PAYSTACK_PUBLIC_KEY to enable Paystack checkout.");
    return;
  }

  try {
    await loadPaystack();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Paystack failed to load");
    return;
  }

  if (!window.PaystackPop) {
    toast.error("Paystack could not load. Check your connection and try again.");
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) {
    toast.error("Your account needs an email before payment can start.");
    return;
  }

  const balance = Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
  const ref = `oyesile-${invoice.invoice_number}-${Date.now()}`;

  window.PaystackPop.setup({
    key,
    email,
    amount: Math.round(balance * 100),
    currency: invoice.currency,
    ref,
    metadata: {
      invoice_id: invoice.id,
      estate_id: invoice.estate_id,
      resident_id: invoice.resident_id,
    },
    callback: async (response) => {
      const { error } = await supabase.from("payments").insert({
        estate_id: invoice.estate_id,
        invoice_id: invoice.id,
        resident_id: invoice.resident_id,
        amount: balance,
        currency: invoice.currency,
        method: "card",
        reference: response.reference,
        status: "pending",
        notes: "Paystack payment submitted for admin review.",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Payment submitted for admin review");
    },
    onClose: () => toast.info("Payment was not completed"),
  }).openIframe();
}

function loadPaystack() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-paystack]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Paystack failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.dataset.paystack = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paystack failed to load"));
    document.head.appendChild(script);
  });
}
