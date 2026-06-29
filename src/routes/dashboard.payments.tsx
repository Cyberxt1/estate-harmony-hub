import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Edit3,
  Plus,
  ReceiptText,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getDuePaymentAvailability, verifyDuePayment } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
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
type ResidentProfile = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "resident_type">;
type Audience = "all" | "tenant" | "landlord" | "selected";
type DueMeta = {
  category?: string;
  note?: string;
  audience?: Audience;
  payment_group_id?: string;
};
type DueGroup = {
  id: string;
  title: string;
  category: string;
  note: string;
  audience: string;
  amountEach: number;
  dueDate: string | null;
  peopleCount: number;
  paidCount: number;
  totalExpected: number;
  invoices: Invoice[];
};

type PendingDuePayment = {
  invoiceId: string;
  reference: string;
  savedAt: number;
};

const PENDING_DUE_PAYMENT_KEY = "pendingDuePayments";

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        reference: string;
        metadata?: Record<string, unknown>;
        onSuccess: (transaction: { reference: string }) => void;
        onCancel: () => void;
        onError: (error: { message?: string }) => void;
      }) => void;
    };
  }
}

const categories = ["Estate levy", "Security", "Maintenance", "Utilities", "Other"];

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { user, profile, isAdmin, primaryRole } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingGroup, setEditingGroup] = useState<DueGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<DueGroup | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate());
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const {
    data: invoices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dues", profile?.estate_id, user?.id, isAdmin],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      let query = supabase.from("invoices").select("*").order("due_date", { ascending: true });
      if (!isAdmin && user?.id) query = query.eq("resident_id", user.id);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: residents = [],
    isLoading: residentsLoading,
    isError: residentsError,
  } = useQuery({
    queryKey: ["due-members", profile?.estate_id],
    enabled: isAdmin && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, resident_type")
        .eq("estate_id", profile!.estate_id!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ResidentProfile[];
    },
  });

  const groups = useMemo(() => groupDues(invoices), [invoices]);
  const pendingDues = useMemo(
    () =>
      invoices.filter((invoice) => getBalance(invoice) > 0 && isPayable(invoice)).sort(compareDues),
    [invoices],
  );
  const paidDues = useMemo(
    () => invoices.filter((invoice) => invoice.status === "paid" || getBalance(invoice) === 0),
    [invoices],
  );
  const targetMembers = useMemo(() => {
    if (audience === "all") return residents;
    if (audience === "selected") {
      return residents.filter((resident) => selectedMemberIds.includes(resident.id));
    }
    return residents.filter((resident) => resident.resident_type === audience);
  }, [audience, residents, selectedMemberIds]);

  useEffect(() => {
    if (isAdmin || isLoading || invoices.length === 0) return;
    const pendingPayments = readPendingDuePayments();
    if (pendingPayments.length === 0) return;

    pendingPayments.forEach((payment) => {
      const invoice = invoices.find((item) => item.id === payment.invoiceId);
      if (invoice && getBalance(invoice) === 0) {
        clearPendingDuePayment(payment.invoiceId, payment.reference);
      }
    });

    const pendingInvoice = pendingPayments
      .map((payment) => ({
        payment,
        invoice: invoices.find((invoice) => invoice.id === payment.invoiceId),
      }))
      .find(({ invoice }) => invoice && getBalance(invoice) > 0);

    if (!pendingInvoice?.invoice) return;

    void confirmCompletedPayment(pendingInvoice.invoice, pendingInvoice.payment.reference, true);
  }, [invoices, isAdmin, isLoading]);

  const resetForm = () => {
    setTitle("");
    setCategory(categories[0]);
    setAmount("");
    setDueDate(getDefaultDueDate());
    setAudience("all");
    setSelectedMemberIds([]);
    setNote("");
  };

  const createDue = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
      const numericAmount = validateDueForm(title, amount, dueDate);
      if (targetMembers.length === 0)
        throw new Error("Choose at least one person to pay this due.");

      const groupId = `DUE-${Date.now()}`;
      const rows = targetMembers.map((resident, index) => ({
        estate_id: profile.estate_id!,
        resident_id: resident.id,
        invoice_number: `${groupId}-${String(index + 1).padStart(3, "0")}`,
        description: title.trim(),
        amount: numericAmount,
        currency: "NGN",
        due_date: dueDate,
        status: "sent" as const,
        line_items: [
          {
            category,
            note: note.trim(),
            audience,
            payment_group_id: groupId,
          },
        ],
      }));

      const { error } = await supabase.from("invoices").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: async (count) => {
      toast.success(`Due created for ${count} ${count === 1 ? "person" : "people"}`);
      setCreateOpen(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["dues"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateDue = useMutation({
    mutationFn: async () => {
      if (!editingGroup) throw new Error("Choose a due to edit.");
      const numericAmount = validateDueForm(title, amount, dueDate);
      const meta = getDueMeta(editingGroup.invoices[0]);
      const editableIds = editingGroup.invoices
        .filter((invoice) => invoice.status !== "paid")
        .map((invoice) => invoice.id);

      if (editableIds.length === 0) throw new Error("A fully paid due cannot be edited.");
      const { error } = await supabase
        .from("invoices")
        .update({
          description: title.trim(),
          amount: numericAmount,
          due_date: dueDate,
          line_items: [
            {
              ...meta,
              category,
              note: note.trim(),
            },
          ],
        })
        .in("id", editableIds);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Due updated");
      setEditingGroup(null);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["dues"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDue = useMutation({
    mutationFn: async (group: DueGroup) => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .in(
          "id",
          group.invoices.map((invoice) => invoice.id),
        );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Due deleted");
      setDeletingGroup(null);
      await queryClient.invalidateQueries({ queryKey: ["dues"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEditor = (group: DueGroup) => {
    setEditingGroup(group);
    setTitle(group.title);
    setCategory(group.category);
    setAmount(String(group.amountEach));
    setDueDate(group.dueDate || getDefaultDueDate());
    setNote(group.note);
  };

  if (isAdmin) {
    const payablePeople = invoices.filter(
      (invoice) => getBalance(invoice) > 0 && isPayable(invoice),
    );
    const totalExpected = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const paidCount = invoices.filter((invoice) => invoice.status === "paid").length;
    const fullyPaidGroups = groups.filter((group) => group.paidCount === group.peopleCount);
    const owingGroups = groups.filter((group) => group.paidCount < group.peopleCount);

    return (
      <div>
        <PageHeader
          title="Dues"
          description={
            primaryRole === "community_chairman"
              ? "Chairman overview of community dues and payments."
              : "Create dues and see who has paid."
          }
          icon={ReceiptText}
        >
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create due
          </Button>
        </PageHeader>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={ReceiptText} label="Number of dues" value={String(groups.length)} />
          <Stat icon={Users} label="People yet to pay" value={String(payablePeople.length)} />
          <Stat icon={CheckCircle2} label="Payments received" value={String(paidCount)} />
          <Stat icon={CreditCard} label="Total expected" value={formatMoney(totalExpected)} />
        </div>

        {isError || residentsError ? (
          <PageLoadError onRetry={() => void queryClient.refetchQueries()} />
        ) : isLoading || residentsLoading ? (
          <PageLoading label="Loading dues" onRetry={() => void queryClient.refetchQueries()} />
        ) : groups.length === 0 ? (
          <EmptyState
            title="No dues created"
            description="Use Create due to request a payment from residents."
          />
        ) : (
          <Tabs defaultValue="created">
            <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1 sm:w-[520px]">
              <TabsTrigger value="created">Created dues ({groups.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({fullyPaidGroups.length})</TabsTrigger>
              <TabsTrigger value="owing">Owing ({owingGroups.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="created" className="mt-0">
              <AdminDueList
                groups={groups}
                emptyTitle="No created dues"
                emptyDescription="Create a due and it will show here."
                onEdit={openEditor}
                onDelete={setDeletingGroup}
              />
            </TabsContent>

            <TabsContent value="paid" className="mt-0">
              <AdminDueList
                groups={fullyPaidGroups}
                emptyTitle="No paid dues yet"
                emptyDescription="Fully paid dues will show here."
                onEdit={openEditor}
                onDelete={setDeletingGroup}
              />
            </TabsContent>

            <TabsContent value="owing" className="mt-0">
              <AdminDueList
                groups={owingGroups}
                emptyTitle="No dues are owing"
                emptyDescription="Any due with unpaid residents will show here."
                onEdit={openEditor}
                onDelete={setDeletingGroup}
              />
            </TabsContent>
          </Tabs>
        )}

        <DueFormDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetForm();
          }}
          title="Create due"
          submitLabel="Create due"
          submitting={createDue.isPending}
          onSubmit={() => createDue.mutate()}
          form={{
            title,
            setTitle,
            category,
            setCategory,
            amount,
            setAmount,
            dueDate,
            setDueDate,
            note,
            setNote,
          }}
          audience={audience}
          setAudience={setAudience}
          residents={residents}
          selectedMemberIds={selectedMemberIds}
          setSelectedMemberIds={setSelectedMemberIds}
          targetCount={targetMembers.length}
        />

        <DueFormDialog
          open={Boolean(editingGroup)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingGroup(null);
              resetForm();
            }
          }}
          title="Edit due"
          submitLabel="Save changes"
          submitting={updateDue.isPending}
          onSubmit={() => updateDue.mutate()}
          form={{
            title,
            setTitle,
            category,
            setCategory,
            amount,
            setAmount,
            dueDate,
            setDueDate,
            note,
            setNote,
          }}
        />

        <AlertDialog
          open={Boolean(deletingGroup)}
          onOpenChange={(open) => !open && setDeletingGroup(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this due?</AlertDialogTitle>
              <AlertDialogDescription>
                It will be removed from every person it was sent to. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep due</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deletingGroup && deleteDue.mutate(deletingGroup)}
              >
                Delete due
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My dues"
        description="See what you need to pay and when it is due."
        icon={ReceiptText}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={ReceiptText} label="Dues to pay" value={String(pendingDues.length)} />
        <Stat
          icon={CreditCard}
          label="Amount to pay"
          value={formatMoney(pendingDues.reduce((sum, invoice) => sum + getBalance(invoice), 0))}
        />
        <Stat icon={CheckCircle2} label="Payments made" value={String(paidDues.length)} />
      </div>

      {isError ? (
        <PageLoadError onRetry={() => void queryClient.refetchQueries()} />
      ) : isLoading ? (
        <PageLoading label="Loading your dues" onRetry={() => void queryClient.refetchQueries()} />
      ) : pendingDues.length === 0 ? (
        <EmptyState title="No dues to pay" description="You are all caught up." />
      ) : (
        <div className="space-y-3">
          {pendingDues.map((invoice) => {
            const meta = getDueMeta(invoice);
            return (
              <button
                key={invoice.id}
                type="button"
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-secondary/20"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {meta.category || "Estate due"}
                  </p>
                  <h2 className="mt-1 truncate font-display text-lg font-semibold">
                    {invoice.description || "Estate due"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-semibold">
                    {formatMoney(getBalance(invoice), invoice.currency)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-primary">View due</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {paidDues.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Paid dues</h2>
          <div className="space-y-2">
            {paidDues.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <span className="text-sm font-medium">{invoice.description || "Estate due"}</span>
                <span className="text-sm text-success">Paid</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ResidentDueDialog invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}

function AdminDueList({
  groups,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete,
}: {
  groups: DueGroup[];
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (group: DueGroup) => void;
  onDelete: (group: DueGroup) => void;
}) {
  if (groups.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {groups.map((group, index) => (
        <article
          key={group.id}
          className={`px-4 py-3 sm:px-5 ${index !== groups.length - 1 ? "border-b border-border" : ""}`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-1 font-medium text-foreground/80">
                  {group.category}
                </span>
                <span>
                  {group.paidCount} of {group.peopleCount} paid
                </span>
                <span>Due {formatDate(group.dueDate)}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {group.title}
                </h2>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoney(group.totalExpected)}
                  </p>
                  <DueStatus paid={group.paidCount} total={group.peopleCount} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:pl-4">
              <Button size="sm" variant="ghost" onClick={() => onEdit(group)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(group)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

type DueFormState = {
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
};

function DueFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  submitting,
  onSubmit,
  form,
  audience,
  setAudience,
  residents = [],
  selectedMemberIds = [],
  setSelectedMemberIds,
  targetCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: () => void;
  form: DueFormState;
  audience?: Audience;
  setAudience?: (value: Audience) => void;
  residents?: ResidentProfile[];
  selectedMemberIds?: string[];
  setSelectedMemberIds?: (ids: string[]) => void;
  targetCount?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Use plain details residents will understand.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${title}-name`}>Title</Label>
            <Input
              id={`${title}-name`}
              value={form.title}
              onChange={(event) => form.setTitle(event.target.value)}
              placeholder="June security due"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={form.setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${title}-amount`}>Amount per person</Label>
              <Input
                id={`${title}-amount`}
                inputMode="numeric"
                value={form.amount}
                onChange={(event) => form.setAmount(event.target.value)}
                placeholder="5000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${title}-date`}>Due date</Label>
            <Input
              id={`${title}-date`}
              type="date"
              min={getDateKey(new Date())}
              value={form.dueDate}
              onChange={(event) => form.setDueDate(event.target.value)}
            />
          </div>

          {audience && setAudience && (
            <div className="space-y-2">
              <Label>Who should pay?</Label>
              <Select value={audience} onValueChange={(value) => setAudience(value as Audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="tenant">Tenants</SelectItem>
                  <SelectItem value="landlord">Landlords</SelectItem>
                  <SelectItem value="selected">Selected members</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {targetCount} {targetCount === 1 ? "person will" : "people will"} receive this due.
              </p>
            </div>
          )}

          {audience === "selected" && setSelectedMemberIds && (
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {residents.map((resident) => {
                const checked = selectedMemberIds.includes(resident.id);
                return (
                  <label
                    key={resident.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary/40"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setSelectedMemberIds(
                          next
                            ? [...selectedMemberIds, resident.id]
                            : selectedMemberIds.filter((id) => id !== resident.id),
                        )
                      }
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-medium">
                        {resident.full_name || resident.email || "Member"}
                      </span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {resident.resident_type || "Member"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${title}-note`}>Short note (optional)</Label>
            <Textarea
              id={`${title}-note`}
              rows={3}
              value={form.note}
              onChange={(event) => form.setNote(event.target.value)}
              placeholder="A short explanation of what this due covers."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={submitting} loadingLabel={submitLabel}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResidentDueDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const meta = invoice ? getDueMeta(invoice) : {};
  const paid = invoice ? invoice.status === "paid" || getBalance(invoice) === 0 : false;

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{invoice?.description || "Due details"}</DialogTitle>
          <DialogDescription>{meta.category || "Estate due"}</DialogDescription>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary/40 p-5 text-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="mt-1 font-display text-3xl font-semibold">
                {formatMoney(paid ? Number(invoice.amount) : getBalance(invoice), invoice.currency)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SimpleDetail label="Due date" value={formatDate(invoice.due_date)} />
              <SimpleDetail label="Status" value={paid ? "Paid" : getDueStatus(invoice)} />
            </div>
            {meta.note && <p className="text-sm leading-6 text-muted-foreground">{meta.note}</p>}
            {!paid && (
              <Button className="h-11 w-full" onClick={() => void startOnlinePayment(invoice)}>
                Pay now
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function SimpleDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function DueStatus({ paid, total }: { paid: number; total: number }) {
  const complete = total > 0 && paid === total;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        complete ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"
      }`}
    >
      {complete ? "Fully paid" : `${total - paid} to pay`}
    </span>
  );
}

function validateDueForm(title: string, amount: string, dueDate: string) {
  const numericAmount = Number(amount);
  if (!title.trim()) throw new Error("Enter a title for this due.");
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Enter a valid amount.");
  }
  if (!dueDate) throw new Error("Choose a due date.");
  if (getDateKey(dueDate) < getDateKey(new Date())) {
    throw new Error("The due date cannot be in the past.");
  }
  return numericAmount;
}

function groupDues(invoices: Invoice[]): DueGroup[] {
  const grouped = new Map<string, Invoice[]>();
  invoices.forEach((invoice) => {
    const meta = getDueMeta(invoice);
    const id = meta.payment_group_id || invoice.invoice_number.replace(/-\d{3}$/, "");
    grouped.set(id, [...(grouped.get(id) ?? []), invoice]);
  });

  return Array.from(grouped.entries())
    .map(([id, items]) => {
      const first = items[0];
      const meta = getDueMeta(first);
      return {
        id,
        title: first.description || "Estate due",
        category: meta.category || "Estate due",
        note: meta.note || "",
        audience: meta.audience || "members",
        amountEach: Number(first.amount),
        dueDate: first.due_date,
        peopleCount: items.length,
        paidCount: items.filter((invoice) => invoice.status === "paid" || getBalance(invoice) === 0)
          .length,
        totalExpected: items.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
        invoices: items,
      };
    })
    .sort((a, b) => String(b.dueDate || "").localeCompare(String(a.dueDate || "")));
}

function getDueMeta(invoice: Invoice): DueMeta {
  const item = Array.isArray(invoice.line_items) ? invoice.line_items[0] : null;
  return item && typeof item === "object" ? (item as DueMeta) : {};
}

function getBalance(invoice: Invoice) {
  return Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
}

function isPayable(invoice: Invoice) {
  return !["draft", "paid", "cancelled"].includes(invoice.status);
}

function compareDues(a: Invoice, b: Invoice) {
  return String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31"));
}

function getDueStatus(invoice: Invoice) {
  if (!invoice.due_date) return "To pay";
  const due = getDateKey(invoice.due_date);
  const today = getDateKey(new Date());
  if (due < today) return "Overdue";
  if (due === today) return "Due today";
  return "To pay";
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

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return getDateKey(date);
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

async function startOnlinePayment(invoice: Invoice) {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!key) {
    toast.error("Online payment is temporarily unavailable.");
    return;
  }

  try {
    const availability = await getDuePaymentAvailability();
    if (!availability.available) {
      throw new Error(
        "Online payment confirmation is not ready yet. Add the Paystack secret key on the server first.",
      );
    }

    await loadPaymentWindow();
    const { data } = await supabase.auth.getUser();
    const Paystack = window.PaystackPop;
    if (!data.user?.email || typeof Paystack !== "function") {
      throw new Error("Online payment is temporarily unavailable.");
    }

    const balance = getBalance(invoice);
    const popup = new Paystack();
    popup.newTransaction({
      key,
      email: data.user.email,
      amount: Math.round(balance * 100),
      currency: invoice.currency,
      reference: `due-${invoice.id}-${Date.now()}`,
      metadata: {
        invoice_id: invoice.id,
        resident_id: invoice.resident_id,
      },
      onSuccess: ({ reference }) => {
        savePendingDuePayment(invoice.id, reference);
        void confirmCompletedPayment(invoice, reference);
      },
      onCancel: () => undefined,
      onError: (paymentError) => {
        toast.error(paymentError.message || "Payment could not be started.");
      },
    });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Online payment is temporarily unavailable.",
    );
  }
}

function loadPaymentWindow() {
  return new Promise<void>((resolve, reject) => {
    if (
      typeof window.PaystackPop === "function" &&
      "newTransaction" in window.PaystackPop.prototype
    ) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-payment-window='v2']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Payment window failed to load.")),
        {
          once: true,
        },
      );
      return;
    }
    document.querySelector<HTMLScriptElement>("script[data-payment-window]")?.remove();
    window.PaystackPop = undefined;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.dataset.paymentWindow = "v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment window failed to load."));
    document.head.appendChild(script);
  });
}

async function confirmCompletedPayment(invoice: Invoice, reference: string, silent = false) {
  try {
    const receipt = await verifyDuePayment({
      data: { invoiceId: invoice.id, reference },
    });
    clearPendingDuePayment(invoice.id, reference);
    sessionStorage.setItem("duePaymentReceipt", JSON.stringify(receipt));
    window.location.href = "/dashboard";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment could not be confirmed.";

    if (message.includes("temporarily unavailable")) {
      if (!silent) {
        toast.error("Payment completed but confirmation is waiting", {
          description:
            "We saved your payment reference and will retry confirmation when you open Payments again.",
        });
      }
      return;
    }

    if (!silent) toast.error(message);
  }
}

function readPendingDuePayments(): PendingDuePayment[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(PENDING_DUE_PAYMENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingDuePayment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingDuePayments(payments: PendingDuePayment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_DUE_PAYMENT_KEY, JSON.stringify(payments.slice(-10)));
}

function savePendingDuePayment(invoiceId: string, reference: string) {
  const others = readPendingDuePayments().filter(
    (payment) => payment.invoiceId !== invoiceId || payment.reference !== reference,
  );
  writePendingDuePayments([
    ...others,
    {
      invoiceId,
      reference,
      savedAt: Date.now(),
    },
  ]);
}

function clearPendingDuePayment(invoiceId: string, reference: string) {
  const next = readPendingDuePayments().filter(
    (payment) => payment.invoiceId !== invoiceId || payment.reference !== reference,
  );
  writePendingDuePayments(next);
}
