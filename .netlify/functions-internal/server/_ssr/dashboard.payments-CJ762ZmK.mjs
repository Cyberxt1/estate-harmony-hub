import { t as supabase } from "./client-BnC4vHJN.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as CreditCard, o as Send, s as Repeat2, w as LoaderCircle, x as CalendarClock } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-DEi8cmgE.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-CGNtK6Vg.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payments-CJ762ZmK.js
var import_jsx_runtime = require_jsx_runtime();
function PaymentsPage() {
	const queryClient = useQueryClient();
	const { profile, isAdmin } = useAuth();
	const { data: invoices, isLoading } = useQuery({
		queryKey: ["invoices", profile?.estate_id],
		queryFn: async () => {
			const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const reviewInvoice = useMutation({
		mutationFn: async (invoice) => {
			const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", invoice.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["invoices"] });
			toast.success("Payment request sent to residents");
		},
		onError: (error) => toast.error(error.message)
	});
	const pendingCount = invoices?.filter((invoice) => invoice.status === "draft").length ?? 0;
	const outstanding = (invoices ?? []).reduce((sum, invoice) => sum + Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0), 0);
	const nextDue = (invoices ?? []).filter((invoice) => invoice.due_date && invoice.status !== "paid" && invoice.status !== "cancelled").sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0]?.due_date;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Payments",
			description: "Reviewed dues, repeating estate charges and Paystack payments for Oyesile Estate.",
			icon: CreditCard
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 grid gap-3 md:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
					icon: CreditCard,
					label: "Outstanding",
					value: formatMoney(outstanding)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
					icon: CalendarClock,
					label: "Next due date",
					value: formatDate(nextDue)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
					icon: Repeat2,
					label: "Awaiting review",
					value: String(pendingCount)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-6 rounded-md border border-border bg-card p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Recurring payment flow"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Admins create and review repeating dues for tenants and landlords. Once sent, residents can pay with Paystack and the payment remains visible for admin verification."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-border px-3 py-2 text-xs text-muted-foreground",
					children: ["Paystack public key: ", "Not configured"]
				})]
			})
		}),
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-48 items-center justify-center text-sm text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Loading payments"]
		}) : invoices && invoices.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-md border border-border bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[760px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-secondary/40 text-left text-xs uppercase text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Invoice"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Charge"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Period"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Due"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Outstanding"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 text-right",
							children: "Action"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: invoices.map((invoice) => {
					const balance = Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-medium",
								children: invoice.invoice_number
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted-foreground",
								children: invoice.description || "Estate dues"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted-foreground",
								children: formatPeriod(invoice.period_start, invoice.period_end)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted-foreground",
								children: formatDate(invoice.due_date)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: formatMoney(balance, invoice.currency)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: invoice.status })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-end gap-2",
									children: isAdmin && invoice.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => reviewInvoice.mutate(invoice),
										disabled: reviewInvoice.isPending,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "mr-2 h-4 w-4" }), "Send"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => void startPaystackPayment(invoice),
										disabled: balance <= 0 || invoice.status === "draft",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "mr-2 h-4 w-4" }), "Pay"]
									})
								})
							})
						]
					}, invoice.id);
				}) })]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "No dues yet",
			description: "When community admins create monthly dues, service charges or landlord levies, they will appear here for review and payment."
		})
	] });
}
function SummaryTile({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md border border-border bg-card p-4 shadow-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-semibold",
				children: value
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
			})]
		})
	});
}
function StatusPill({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-md px-2 py-1 text-xs capitalize ${status === "paid" ? "bg-success/15 text-success" : status === "draft" ? "bg-warning/20 text-warning-foreground" : "bg-accent text-accent-foreground"}`,
		children: status
	});
}
function formatMoney(amount, currency = "NGN") {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}
function formatDate(value) {
	if (!value) return "Not set";
	return new Intl.DateTimeFormat("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}).format(new Date(value));
}
function formatPeriod(start, end) {
	if (!start && !end) return "Repeating";
	if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
	return formatDate(start ?? end);
}
async function startPaystackPayment(invoice) {
	toast.error("Add VITE_PAYSTACK_PUBLIC_KEY to enable Paystack checkout.");
}
//#endregion
export { PaymentsPage as component };
