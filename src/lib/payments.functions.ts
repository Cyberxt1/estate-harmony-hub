import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type VerifyResponse = {
  status: boolean;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    metadata?: {
      invoice_id?: string;
      resident_id?: string;
    };
  };
};

function getPaystackSecretKey() {
  return (
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET ||
    process.env.PAYSTACK_SK ||
    process.env.SECRET_PAYSTACK_KEY ||
    null
  );
}

export const getDuePaymentAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      available: Boolean(getPaystackSecretKey()),
    };
  });

export const verifyDuePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { invoiceId: string; reference: string }) => {
    if (!input.invoiceId || !input.reference) throw new Error("Payment details are incomplete.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) throw new Error("Online payment confirmation is temporarily unavailable.");

    const { data: invoice, error: invoiceError } = await context.supabase
      .from("invoices")
      .select("*")
      .eq("id", data.invoiceId)
      .eq("resident_id", context.userId)
      .single();

    if (invoiceError || !invoice) throw new Error("This due could not be found.");

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const result = (await response.json()) as VerifyResponse;
    const amountDue = Math.round((Number(invoice.amount) - Number(invoice.amount_paid ?? 0)) * 100);

    if (
      !response.ok ||
      !result.status ||
      result.data?.status !== "success" ||
      result.data.amount !== amountDue ||
      result.data.currency !== invoice.currency ||
      result.data.metadata?.invoice_id !== invoice.id ||
      result.data.metadata?.resident_id !== context.userId
    ) {
      throw new Error("We could not confirm this payment. You have not been charged twice.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("complete_verified_due_payment", {
      _amount: amountDue / 100,
      _invoice_id: invoice.id,
      _reference: result.data.reference ?? data.reference,
    });

    if (error) throw error;

    return {
      title: invoice.description || "Estate due",
      amount: amountDue / 100,
      currency: invoice.currency,
    };
  });
