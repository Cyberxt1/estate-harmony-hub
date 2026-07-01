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
      reference: result.data.reference ?? data.reference,
      paidAt: new Date().toISOString(),
    };
  });

export const submitManualDuePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { invoiceId: string; note?: string; reference?: string }) => {
    if (!input.invoiceId) throw new Error("Choose a due first.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: invoice, error: invoiceError } = await context.supabase
      .from("invoices")
      .select("*")
      .eq("id", data.invoiceId)
      .eq("resident_id", context.userId)
      .single();

    if (invoiceError || !invoice) throw new Error("This due could not be found.");
    if (["draft", "paid", "cancelled"].includes(invoice.status)) {
      throw new Error("This due is no longer payable.");
    }

    const balance = Number(invoice.amount) - Number(invoice.amount_paid ?? 0);
    if (balance <= 0) throw new Error("This due has already been cleared.");

    const { data: estate, error: estateError } = await context.supabase
      .from("estates")
      .select(
        "manual_payment_enabled, manual_account_name, manual_account_number, manual_bank_name",
      )
      .eq("id", invoice.estate_id)
      .single();

    if (estateError || !estate) throw new Error("Estate payment settings are not available.");
    if (
      !estate.manual_payment_enabled ||
      !estate.manual_account_name?.trim() ||
      !estate.manual_account_number?.trim()
    ) {
      throw new Error("Manual payment is not available right now.");
    }

    const { data: existingPayments, error: paymentsError } = await context.supabase
      .from("payments")
      .select("id, status")
      .eq("invoice_id", invoice.id)
      .eq("resident_id", context.userId)
      .eq("method", "transfer")
      .in("status", ["pending", "completed"])
      .limit(1);

    if (paymentsError) throw paymentsError;
    if ((existingPayments ?? []).some((payment) => payment.status === "pending")) {
      throw new Error("Your manual payment is already waiting for confirmation.");
    }
    if ((existingPayments ?? []).some((payment) => payment.status === "completed")) {
      throw new Error("This due has already been paid.");
    }

    const reference =
      data.reference?.trim() ||
      `manual-${invoice.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: payment, error: insertError } = await context.supabase
      .from("payments")
      .insert({
        amount: balance,
        currency: invoice.currency,
        estate_id: invoice.estate_id,
        invoice_id: invoice.id,
        method: "transfer",
        notes: data.note?.trim() || "Manual payment awaiting confirmation",
        reference,
        resident_id: context.userId,
        status: "pending",
      })
      .select("id, reference, amount, currency")
      .single();

    if (insertError) {
      if ("code" in insertError && insertError.code === "23505") {
        throw new Error("That payment reference has already been used.");
      }
      throw insertError;
    }

    return payment;
  });

export const approveManualDuePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { paymentId: string }) => {
    if (!input.paymentId) throw new Error("Choose a payment to confirm.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("approve_manual_due_payment", {
      _payment_id: data.paymentId,
    });

    if (error) throw error;
    return { ok: true };
  });
