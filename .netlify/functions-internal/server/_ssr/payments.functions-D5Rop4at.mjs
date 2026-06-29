import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as createServerRpc } from "./createServerRpc-TAUNrjZd.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments.functions-D5Rop4at.js
function getPaystackSecretKey() {
	return process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SK || process.env.SECRET_PAYSTACK_KEY || null;
}
var getDuePaymentAvailability_createServerFn_handler = createServerRpc({
	id: "653a259b4cd88e3c21eda318568c8894b375f36bb5a4495214446e2c1bb77d9b",
	name: "getDuePaymentAvailability",
	filename: "src/lib/payments.functions.ts"
}, (opts) => getDuePaymentAvailability.__executeServer(opts));
var getDuePaymentAvailability = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getDuePaymentAvailability_createServerFn_handler, async () => {
	return { available: Boolean(getPaystackSecretKey()) };
});
var verifyDuePayment_createServerFn_handler = createServerRpc({
	id: "d799e55b122f282039c09a8743e49835ec17f0ac277978bf6f10e0422027270d",
	name: "verifyDuePayment",
	filename: "src/lib/payments.functions.ts"
}, (opts) => verifyDuePayment.__executeServer(opts));
var verifyDuePayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.invoiceId || !input.reference) throw new Error("Payment details are incomplete.");
	return input;
}).handler(verifyDuePayment_createServerFn_handler, async ({ data, context }) => {
	const secretKey = getPaystackSecretKey();
	if (!secretKey) throw new Error("Online payment confirmation is temporarily unavailable.");
	const { data: invoice, error: invoiceError } = await context.supabase.from("invoices").select("*").eq("id", data.invoiceId).eq("resident_id", context.userId).single();
	if (invoiceError || !invoice) throw new Error("This due could not be found.");
	const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, { headers: { Authorization: `Bearer ${secretKey}` } });
	const result = await response.json();
	const amountDue = Math.round((Number(invoice.amount) - Number(invoice.amount_paid ?? 0)) * 100);
	if (!response.ok || !result.status || result.data?.status !== "success" || result.data.amount !== amountDue || result.data.currency !== invoice.currency || result.data.metadata?.invoice_id !== invoice.id || result.data.metadata?.resident_id !== context.userId) throw new Error("We could not confirm this payment. You have not been charged twice.");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.rpc("complete_verified_due_payment", {
		_amount: amountDue / 100,
		_invoice_id: invoice.id,
		_reference: result.data.reference ?? data.reference
	});
	if (error) throw error;
	return {
		title: invoice.description || "Estate due",
		amount: amountDue / 100,
		currency: invoice.currency,
		reference: result.data.reference ?? data.reference,
		paidAt: (/* @__PURE__ */ new Date()).toISOString()
	};
});
//#endregion
export { getDuePaymentAvailability_createServerFn_handler, verifyDuePayment_createServerFn_handler };
