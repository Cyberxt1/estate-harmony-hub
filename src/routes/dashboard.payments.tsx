import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Payments" description="Invoices, recurring dues, service charges and receipts." icon={CreditCard} />
      {invoices && invoices.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{i.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.period_start} — {i.period_end}
                  </td>
                  <td className="px-4 py-3">{i.currency} {Number(i.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.currency} {Number(i.amount_paid).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">{i.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No invoices yet"
          description="When admins create invoices for monthly dues or service charges, they'll appear here."
        />
      )}
    </div>
  );
}
