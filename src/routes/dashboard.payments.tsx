import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CreditCard, Loader2, Plus, ReceiptText, Repeat2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsPage,
});

type Invoice = Tables<"invoices">;
type ResidentProfile = Pick<
  Tables<"profiles">,
  "id" | "estate_id" | "full_name" | "email" | "resident_type"
>;
type PaymentTarget = "tenant" | "landlord";
type PaymentFrequency = "one_time" | "monthly" | "quarterly" | "yearly";
type PaymentTab = "pending" | "created" | "history";
type PaymentGroup = {
  id: string;
  title: string;
  target: string;
  frequency: string;
  expectedCount: number;
  paidCount: number;
  totalExpected: number;
  totalPaid: number;
  dueDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  statusSummary: string;
  invoices: Invoice[];
};

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        label?: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<PaymentTab>("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [target, setTarget] = useState<PaymentTarget>("tenant");
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", profile?.estate_id, user?.id, isAdmin],
    queryFn: async () => {
      const query = supabase.from("invoices").select("*").order("created_at", { ascending: false });

      if (!isAdmin && user?.id) query.eq("resident_id", user.id);

      const { data, error } = await query;
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

  const allInvoices = useMemo(() => invoices ?? [], [invoices]);
  const createdInvoices = allInvoices;
  const createdGroups = useMemo(() => groupCreatedPayments(createdInvoices), [createdInvoices]);
  const pendingInvoices = useMemo(
    () =>
      allInvoices
        .filter((invoice) => {
          const balance = getBalance(invoice);
          return balance > 0 && ["sent", "partial", "overdue"].includes(invoice.status);
        })
        .sort(comparePendingInvoices),
    [allInvoices],
  );
  const residentHistory = useMemo(
    () => allInvoices.filter((invoice) => ["paid", "cancelled"].includes(invoice.status)),
    [allInvoices],
  );
  const targetResidents = useMemo(
    () => (residents ?? []).filter((resident) => resident.resident_type === target),
    [residents, target],
  );

  const createPaymentRequest = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate.");
      const numericAmount = Number(amount);
      if (!description.trim()) throw new Error("Enter a payment title.");
      if (!Number.isFinite(numericAmount) || numericAmount <= 0)
        throw new Error("Enter a valid amount.");
      if (!dueDate) throw new Error("Choose the payment deadline.");
      if (getDateKey(dueDate) < getDateKey(new Date())) {
        throw new Error("The payment deadline cannot be in the past.");
      }
      if (targetResidents.length === 0) throw new Error(`No ${target}s found yet.`);

      const period = getPaymentPeriod(dueDate, frequency);
      const stamp = Date.now().toString().slice(-6);
      const paymentGroupId = `OYE-${target.toUpperCase()}-${stamp}`;
      const rows = targetResidents.map((resident, index) => ({
        estate_id: profile.estate_id!,
        resident_id: resident.id,
        invoice_number: `${paymentGroupId}-${String(index + 1).padStart(3, "0")}`,
        description: description.trim(),
        amount: numericAmount,
        currency: "NGN",
        due_date: dueDate,
        period_start: period.start,
        period_end: period.end,
        status: "sent" as const,
        line_items: [
          {
            title: description.trim(),
            amount: numericAmount,
            target,
            frequency,
            payment_group_id: paymentGroupId,
            resident_name: resident.full_name || resident.email || "Resident",
          },
        ],
      }));

      const { error } = await supabase.from("invoices").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: async (count) => {
      toast.success(`${count} payment request${count === 1 ? "" : "s"} created and sent`);
      setCreateOpen(false);
      setDescription("");
      setAmount("");
      setTarget("tenant");
      setFrequency("monthly");
      setDueDate(getDefaultDueDate());
      setActiveTab("created");
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const pendingCount = createdGroups.length;
  const outstanding = pendingInvoices.reduce((sum, invoice) => sum + getBalance(invoice), 0);
  const nextDue = pendingInvoices
    .filter((invoice) => invoice.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0]?.due_date;

  return (
    <div>
      <PageHeader
        title="Payments"
        description={
          isAdmin
            ? "Create, publish and monitor estate charges."
            : "View every pending payment and pay securely before its deadline."
        }
        icon={CreditCard}
      />

      {isAdmin && (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Create new payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a deadline for tenants or landlords. They can pay immediately or any time before
              it is due.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create payment
          </Button>
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <SummaryTile
          icon={CreditCard}
          label={isAdmin ? "Total outstanding" : "Pending total"}
          value={formatMoney(outstanding)}
        />
        <SummaryTile icon={CalendarClock} label="Nearest deadline" value={formatDate(nextDue)} />
        <SummaryTile
          icon={isAdmin ? Repeat2 : ReceiptText}
          label={isAdmin ? "Created payments" : "Pending payments"}
          value={String(isAdmin ? pendingCount : pendingInvoices.length)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentTab)}>
        <TabsList
          className={`mb-4 grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-2"} sm:w-auto`}
        >
          <TabsTrigger value="pending">{isAdmin ? "Outstanding" : "Pending payments"}</TabsTrigger>
          {isAdmin ? (
            <TabsTrigger value="created">Created payments</TabsTrigger>
          ) : (
            <TabsTrigger value="history">Payment history</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending">
          <PaymentTable
            invoices={pendingInvoices}
            isLoading={isLoading}
            isAdmin={isAdmin}
            onSelect={setSelectedInvoice}
            onPaymentSubmitted={() => queryClient.invalidateQueries({ queryKey: ["invoices"] })}
            emptyTitle={isAdmin ? "No outstanding payments" : "No pending payments"}
            emptyDescription={
              isAdmin
                ? "Published charges with an outstanding balance will appear here."
                : "Every unpaid charge from management will appear here with its deadline and a Pay now button."
            }
          />
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="created">
            <CreatedPaymentsTable
              groups={createdGroups}
              isLoading={isLoading}
              onSelect={setSelectedInvoice}
              emptyTitle="No created payments"
              emptyDescription="Created payments will appear here as grouped payment summaries."
            />
          </TabsContent>
        ) : (
          <TabsContent value="history">
            <PaymentTable
              invoices={residentHistory}
              isLoading={isLoading}
              isAdmin={false}
              onSelect={setSelectedInvoice}
              onPaymentSubmitted={() => queryClient.invalidateQueries({ queryKey: ["invoices"] })}
              emptyTitle="No payment history"
              emptyDescription="Your completed and cancelled payments will appear here."
            />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create new payment</DialogTitle>
            <DialogDescription>
              The charge appears immediately. Residents may pay ahead of the deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-title">Payment title</Label>
              <Input
                id="payment-title"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Transformer levy"
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
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-due">Payment deadline</Label>
                <Input
                  id="payment-due"
                  type="date"
                  min={getDateKey(new Date())}
                  required
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
                <Select
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as PaymentFrequency)}
                >
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
                {createPaymentRequest.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice?.description || selectedInvoice?.invoice_number || "Payment request"}
            </DialogTitle>
            <DialogDescription>Expanded payment, period and publishing details.</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Invoice" value={selectedInvoice.invoice_number} />
              <Detail label="Status" value={getPaymentStatus(selectedInvoice).label} />
              <Detail label="Charge" value={selectedInvoice.description || "Estate dues"} wide />
              <Detail
                label="Amount"
                value={formatMoney(Number(selectedInvoice.amount), selectedInvoice.currency)}
              />
              <Detail
                label="Paid"
                value={formatMoney(
                  Number(selectedInvoice.amount_paid ?? 0),
                  selectedInvoice.currency,
                )}
              />
              <Detail
                label="Outstanding"
                value={formatMoney(getBalance(selectedInvoice), selectedInvoice.currency)}
              />
              <Detail label="Due date" value={formatDate(selectedInvoice.due_date)} />
              <Detail
                label="Period"
                value={formatPeriod(selectedInvoice.period_start, selectedInvoice.period_end)}
                wide
              />
              <Detail label="Line items" value={formatLineItems(selectedInvoice.line_items)} wide />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentTable({
  invoices,
  isLoading,
  isAdmin,
  onSelect,
  onPaymentSubmitted,
  emptyTitle,
  emptyDescription,
}: {
  invoices: Invoice[];
  isLoading: boolean;
  isAdmin: boolean;
  onSelect: (invoice: Invoice) => void;
  onPaymentSubmitted: () => void | Promise<unknown>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading payments
      </div>
    );
  }

  if (invoices.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {!isAdmin && (
        <div className="grid gap-3 md:hidden">
          {invoices.map((invoice) => {
            const balance = getBalance(invoice);
            const paymentStatus = getPaymentStatus(invoice);

            return (
              <article
                key={invoice.id}
                className="rounded-md border border-border bg-card p-4 shadow-sm"
              >
                <button
                  className="w-full text-left"
                  type="button"
                  onClick={() => onSelect(invoice)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold">
                        {invoice.description || "Estate dues"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{invoice.invoice_number}</p>
                    </div>
                    <StatusPill status={paymentStatus.tone} label={paymentStatus.label} />
                  </div>
                  <p className="mt-5 font-display text-2xl font-semibold">
                    {formatMoney(balance, invoice.currency)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Payment deadline: {formatDate(invoice.due_date)}
                  </p>
                </button>
                {balance > 0 && !["draft", "cancelled"].includes(invoice.status) && (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => void startPaystackPayment(invoice, onPaymentSubmitted)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay now
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
      <div
        className={`${!isAdmin ? "hidden md:block" : ""} overflow-x-auto rounded-md border border-border bg-card`}
      >
        <table className="w-full min-w-[860px] text-sm">
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
              const balance = getBalance(invoice);
              return (
                <tr
                  key={invoice.id}
                  className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
                  onClick={() => onSelect(invoice)}
                >
                  <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {invoice.description || "Estate dues"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatPeriod(invoice.period_start, invoice.period_end)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{formatDate(invoice.due_date)}</p>
                    <p className="mt-0.5 text-xs">{getPaymentStatus(invoice).label}</p>
                  </td>
                  <td className="px-4 py-3">{formatMoney(balance, invoice.currency)}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      status={getPaymentStatus(invoice).tone}
                      label={getPaymentStatus(invoice).label}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!isAdmin ? (
                        <Button
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            void startPaystackPayment(invoice, onPaymentSubmitted);
                          }}
                          disabled={
                            balance <= 0 ||
                            invoice.status === "draft" ||
                            invoice.status === "cancelled"
                          }
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay now
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          View
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
    </>
  );
}

function CreatedPaymentsTable({
  groups,
  isLoading,
  onSelect,
  emptyTitle,
  emptyDescription,
}: {
  groups: PaymentGroup[];
  isLoading: boolean;
  onSelect: (invoice: Invoice) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading payments
      </div>
    );
  }

  if (groups.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">For</th>
            <th className="px-4 py-3">Expected people</th>
            <th className="px-4 py-3">Total expected</th>
            <th className="px-4 py-3">Paid so far</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr
              key={group.id}
              className="cursor-pointer border-t border-border transition hover:bg-secondary/30"
              onClick={() => onSelect(group.invoices[0])}
            >
              <td className="px-4 py-3">
                <p className="font-medium">{group.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatPeriod(group.periodStart, group.periodEnd)}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground capitalize">{group.target}</td>
              <td className="px-4 py-3">{group.expectedCount}</td>
              <td className="px-4 py-3">{formatMoney(group.totalExpected)}</td>
              <td className="px-4 py-3">
                {formatMoney(group.totalPaid)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {group.paidCount}/{group.expectedCount}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(group.dueDate)}</td>
              <td className="px-4 py-3">
                <StatusPill status={group.statusSummary} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function StatusPill({ status, label }: { status: string; label?: string }) {
  const tone =
    status === "paid"
      ? "bg-success/15 text-success"
      : status === "draft"
        ? "bg-warning/20 text-warning-foreground"
        : status === "overdue"
          ? "bg-destructive/15 text-destructive"
          : "bg-accent text-accent-foreground";

  return (
    <span className={`shrink-0 rounded-md px-2 py-1 text-xs ${tone}`}>
      {label ?? formatKey(status)}
    </span>
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

function getBalance(invoice: Invoice) {
  return Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
}

function comparePendingInvoices(a: Invoice, b: Invoice) {
  const aDate = a.due_date || "9999-12-31";
  const bDate = b.due_date || "9999-12-31";
  return aDate.localeCompare(bDate);
}

function getPaymentStatus(invoice: Invoice) {
  if (invoice.status === "paid" || getBalance(invoice) <= 0) {
    return { tone: "paid", label: "Paid" };
  }
  if (invoice.status === "cancelled") return { tone: "cancelled", label: "Cancelled" };
  if (invoice.status === "partial") return { tone: "partial", label: "Part paid" };
  if (!invoice.due_date) return { tone: "sent", label: "Pending" };

  const due = getDateKey(invoice.due_date);
  const today = getDateKey(new Date());
  if (due < today || invoice.status === "overdue") return { tone: "overdue", label: "Overdue" };
  if (due === today) return { tone: "sent", label: "Due today" };
  return { tone: "sent", label: `Due on ${formatDate(invoice.due_date)}` };
}

function groupCreatedPayments(invoices: Invoice[]): PaymentGroup[] {
  const groups = new Map<string, Invoice[]>();

  invoices.forEach((invoice) => {
    const meta = getInvoiceMeta(invoice);
    const groupId = meta.payment_group_id || invoice.invoice_number.replace(/-\d{3}$/, "");
    groups.set(groupId, [...(groups.get(groupId) ?? []), invoice]);
  });

  return Array.from(groups.entries())
    .map(([id, groupInvoices]) => {
      const first = groupInvoices[0];
      const meta = getInvoiceMeta(first);
      const expectedCount = groupInvoices.length;
      const paidCount = groupInvoices.filter((invoice) => invoice.status === "paid").length;
      const totalExpected = groupInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      const totalPaid = groupInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount_paid ?? 0),
        0,
      );

      return {
        id,
        title: first.description || meta.title || "Estate dues",
        target: meta.target || inferTargetFromInvoice(first),
        frequency: meta.frequency || "one-time",
        expectedCount,
        paidCount,
        totalExpected,
        totalPaid,
        dueDate: first.due_date,
        periodStart: first.period_start,
        periodEnd: first.period_end,
        statusSummary: getGroupStatus(groupInvoices),
        invoices: groupInvoices,
      };
    })
    .sort((a, b) => String(b.dueDate ?? "").localeCompare(String(a.dueDate ?? "")));
}

function getInvoiceMeta(invoice: Invoice) {
  const firstItem = Array.isArray(invoice.line_items) ? invoice.line_items[0] : null;
  return firstItem && typeof firstItem === "object" ? (firstItem as Record<string, string>) : {};
}

function getGroupStatus(invoices: Invoice[]) {
  if (invoices.every((invoice) => invoice.status === "paid")) return "paid";
  if (invoices.some((invoice) => invoice.status === "overdue")) return "overdue";
  if (invoices.some((invoice) => invoice.status === "partial")) return "partial";
  if (invoices.every((invoice) => invoice.status === "draft")) return "draft";
  return "sent";
}

function inferTargetFromInvoice(invoice: Invoice) {
  const match = invoice.invoice_number.match(/^OYE-([A-Z]+)-/);
  return match?.[1]?.toLowerCase() ?? "residents";
}

function formatLineItems(value: unknown) {
  if (!value) return "Not provided";
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item
          ? Object.entries(item as Record<string, unknown>)
              .map(([key, entry]) => `${formatKey(key)}: ${entry || "Not provided"}`)
              .join("\n")
          : String(item),
      )
      .join("\n\n");
  }
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
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
  }).format(toLocalDate(value));
}

function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return "Repeating";
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  return formatDate(start ?? end);
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return getDateKey(date);
}

function getPaymentPeriod(dueDate: string, frequency: PaymentFrequency) {
  if (frequency === "one_time") return { start: dueDate, end: dueDate };

  const start = toLocalDate(dueDate);
  const end = new Date(start);
  const monthStep = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  end.setMonth(end.getMonth() + monthStep);
  end.setDate(end.getDate() - 1);

  return {
    start: getDateKey(start),
    end: getDateKey(end),
  };
}

function toLocalDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDateKey(value: string | Date) {
  const date = typeof value === "string" ? toLocalDate(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFrequency(frequency: PaymentFrequency) {
  return frequency === "one_time" ? "one-time" : frequency;
}

async function startPaystackPayment(
  invoice: Invoice,
  onPaymentSubmitted: () => void | Promise<unknown>,
) {
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

  const balance = getBalance(invoice);
  const chargeTitle = invoice.description || "Estate dues";
  const ref = `oyesile-${invoice.invoice_number}-${Date.now()}`;

  window.PaystackPop.setup({
    key,
    email,
    amount: Math.round(balance * 100),
    currency: invoice.currency,
    ref,
    label: `${chargeTitle} - ${invoice.invoice_number}`,
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      charge: chargeTitle,
      amount_due: balance,
      currency: invoice.currency,
      due_date: invoice.due_date,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      estate_id: invoice.estate_id,
      resident_id: invoice.resident_id,
      custom_fields: [
        {
          display_name: "Payment for",
          variable_name: "payment_for",
          value: chargeTitle,
        },
        {
          display_name: "Invoice",
          variable_name: "invoice_number",
          value: invoice.invoice_number,
        },
        {
          display_name: "Due date",
          variable_name: "due_date",
          value: invoice.due_date || "Not set",
        },
      ],
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
        notes: `Paystack payment submitted for ${chargeTitle} (${invoice.invoice_number}).`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Payment submitted for admin review");
      await onPaymentSubmitted();
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
      existing.addEventListener("error", () => reject(new Error("Paystack failed to load")), {
        once: true,
      });
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
