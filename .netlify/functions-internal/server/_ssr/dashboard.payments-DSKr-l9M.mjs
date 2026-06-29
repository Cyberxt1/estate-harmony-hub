import { r as __toESM } from "../_runtime.mjs";
import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-C3Tr9JFK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { H as CircleCheck, O as CreditCard, R as PenLine, g as Plus, m as ReceiptText, n as Users, o as Trash2 } from "../_libs/lucide-react.mjs";
import { a as useAuth, n as createSsrRpc } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { t as Checkbox } from "./checkbox-JVQXDHxI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DMNUCmq6.mjs";
import { t as downloadDueReceipt } from "./receipts-C46lC8Qz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.payments-DSKr-l9M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getDuePaymentAvailability = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("653a259b4cd88e3c21eda318568c8894b375f36bb5a4495214446e2c1bb77d9b"));
var verifyDuePayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.invoiceId || !input.reference) throw new Error("Payment details are incomplete.");
	return input;
}).handler(createSsrRpc("d799e55b122f282039c09a8743e49835ec17f0ac277978bf6f10e0422027270d"));
var PENDING_DUE_PAYMENT_KEY = "pendingDuePayments";
var categories = [
	"Estate levy",
	"Security",
	"Maintenance",
	"Utilities",
	"Other"
];
function PaymentsPage() {
	const queryClient = useQueryClient();
	const { user, profile, isAdmin, primaryRole } = useAuth();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [selectedInvoice, setSelectedInvoice] = (0, import_react.useState)(null);
	const [editingGroup, setEditingGroup] = (0, import_react.useState)(null);
	const [deletingGroup, setDeletingGroup] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)(categories[0]);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [dueDate, setDueDate] = (0, import_react.useState)(() => getDefaultDueDate());
	const [audience, setAudience] = (0, import_react.useState)("all");
	const [selectedMemberIds, setSelectedMemberIds] = (0, import_react.useState)([]);
	const [note, setNote] = (0, import_react.useState)("");
	const { data: invoices = [], isLoading, isError } = useQuery({
		queryKey: [
			"dues",
			profile?.estate_id,
			user?.id,
			isAdmin
		],
		enabled: Boolean(user?.id),
		queryFn: async () => {
			let query = supabase.from("invoices").select("*").order("due_date", { ascending: true });
			if (!isAdmin && user?.id) query = query.eq("resident_id", user.id);
			const { data, error } = await query;
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: residents = [], isLoading: residentsLoading, isError: residentsError } = useQuery({
		queryKey: ["due-members", profile?.estate_id],
		enabled: isAdmin && Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, full_name, email, resident_type").eq("estate_id", profile.estate_id).order("full_name", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: paymentRecords = [] } = useQuery({
		queryKey: [
			"payments-records",
			user?.id,
			isAdmin
		],
		enabled: Boolean(user?.id) && !isAdmin,
		queryFn: async () => {
			const { data, error } = await supabase.from("payments").select("*").order("paid_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const groups = (0, import_react.useMemo)(() => groupDues(invoices), [invoices]);
	const pendingDues = (0, import_react.useMemo)(() => invoices.filter((invoice) => getBalance(invoice) > 0 && isPayable(invoice)).sort(compareDues), [invoices]);
	const paidDues = (0, import_react.useMemo)(() => invoices.filter((invoice) => invoice.status === "paid" || getBalance(invoice) === 0), [invoices]);
	const targetMembers = (0, import_react.useMemo)(() => {
		if (audience === "all") return residents;
		if (audience === "selected") return residents.filter((resident) => selectedMemberIds.includes(resident.id));
		return residents.filter((resident) => resident.resident_type === audience);
	}, [
		audience,
		residents,
		selectedMemberIds
	]);
	(0, import_react.useEffect)(() => {
		if (isAdmin || isLoading || invoices.length === 0) return;
		const pendingPayments = readPendingDuePayments();
		if (pendingPayments.length === 0) return;
		pendingPayments.forEach((payment) => {
			const invoice = invoices.find((item) => item.id === payment.invoiceId);
			if (invoice && getBalance(invoice) === 0) clearPendingDuePayment(payment.invoiceId, payment.reference);
		});
		const pendingInvoice = pendingPayments.map((payment) => ({
			payment,
			invoice: invoices.find((invoice) => invoice.id === payment.invoiceId)
		})).find(({ invoice }) => invoice && getBalance(invoice) > 0);
		if (!pendingInvoice?.invoice) return;
		confirmCompletedPayment(pendingInvoice.invoice, pendingInvoice.payment.reference, true);
	}, [
		invoices,
		isAdmin,
		isLoading
	]);
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
			if (targetMembers.length === 0) throw new Error("Choose at least one person to pay this due.");
			const groupId = `DUE-${Date.now()}`;
			const rows = targetMembers.map((resident, index) => ({
				estate_id: profile.estate_id,
				resident_id: resident.id,
				invoice_number: `${groupId}-${String(index + 1).padStart(3, "0")}`,
				description: title.trim(),
				amount: numericAmount,
				currency: "NGN",
				due_date: dueDate,
				status: "sent",
				line_items: [{
					category,
					note: note.trim(),
					audience,
					payment_group_id: groupId
				}]
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
		onError: (error) => toast.error(error.message)
	});
	const updateDue = useMutation({
		mutationFn: async () => {
			if (!editingGroup) throw new Error("Choose a due to edit.");
			const numericAmount = validateDueForm(title, amount, dueDate);
			const meta = getDueMeta(editingGroup.invoices[0]);
			const editableIds = editingGroup.invoices.filter((invoice) => invoice.status !== "paid").map((invoice) => invoice.id);
			if (editableIds.length === 0) throw new Error("A fully paid due cannot be edited.");
			const { error } = await supabase.from("invoices").update({
				description: title.trim(),
				amount: numericAmount,
				due_date: dueDate,
				line_items: [{
					...meta,
					category,
					note: note.trim()
				}]
			}).in("id", editableIds);
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Due updated");
			setEditingGroup(null);
			resetForm();
			await queryClient.invalidateQueries({ queryKey: ["dues"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const deleteDue = useMutation({
		mutationFn: async (group) => {
			const { error } = await supabase.from("invoices").delete().in("id", group.invoices.map((invoice) => invoice.id));
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Due deleted");
			setDeletingGroup(null);
			await queryClient.invalidateQueries({ queryKey: ["dues"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const openEditor = (group) => {
		setEditingGroup(group);
		setTitle(group.title);
		setCategory(group.category);
		setAmount(String(group.amountEach));
		setDueDate(group.dueDate || getDefaultDueDate());
		setNote(group.note);
	};
	if (isAdmin) {
		const payablePeople = invoices.filter((invoice) => getBalance(invoice) > 0 && isPayable(invoice));
		const totalExpected = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
		const paidCount = invoices.filter((invoice) => invoice.status === "paid").length;
		const fullyPaidGroups = groups.filter((group) => group.paidCount === group.peopleCount);
		const owingGroups = groups.filter((group) => group.paidCount < group.peopleCount);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Dues",
				description: primaryRole === "community_chairman" ? "Chairman overview of community dues and payments." : "Create dues and see who has paid.",
				icon: ReceiptText,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setCreateOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), "Create due"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: ReceiptText,
						label: "Number of dues",
						value: String(groups.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: Users,
						label: "People yet to pay",
						value: String(payablePeople.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: CircleCheck,
						label: "Payments received",
						value: String(paidCount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: CreditCard,
						label: "Total expected",
						value: formatMoney(totalExpected)
					})
				]
			}),
			isError || residentsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading || residentsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
				label: "Loading dues",
				onRetry: () => void queryClient.refetchQueries()
			}) : groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No dues created",
				description: "Use Create due to request a payment from residents."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "created",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "mb-4 grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1 sm:w-[520px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "created",
								children: [
									"Created dues (",
									groups.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "paid",
								children: [
									"Paid (",
									fullyPaidGroups.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "owing",
								children: [
									"Owing (",
									owingGroups.length,
									")"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "created",
						className: "mt-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDueList, {
							groups,
							emptyTitle: "No created dues",
							emptyDescription: "Create a due and it will show here.",
							onEdit: openEditor,
							onDelete: setDeletingGroup
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "paid",
						className: "mt-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDueList, {
							groups: fullyPaidGroups,
							emptyTitle: "No paid dues yet",
							emptyDescription: "Fully paid dues will show here.",
							onEdit: openEditor,
							onDelete: setDeletingGroup
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "owing",
						className: "mt-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDueList, {
							groups: owingGroups,
							emptyTitle: "No dues are owing",
							emptyDescription: "Any due with unpaid residents will show here.",
							onEdit: openEditor,
							onDelete: setDeletingGroup
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DueFormDialog, {
				open: createOpen,
				onOpenChange: (open) => {
					setCreateOpen(open);
					if (!open) resetForm();
				},
				title: "Create due",
				submitLabel: "Create due",
				submitting: createDue.isPending,
				onSubmit: () => createDue.mutate(),
				form: {
					title,
					setTitle,
					category,
					setCategory,
					amount,
					setAmount,
					dueDate,
					setDueDate,
					note,
					setNote
				},
				audience,
				setAudience,
				residents,
				selectedMemberIds,
				setSelectedMemberIds,
				targetCount: targetMembers.length
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DueFormDialog, {
				open: Boolean(editingGroup),
				onOpenChange: (open) => {
					if (!open) {
						setEditingGroup(null);
						resetForm();
					}
				},
				title: "Edit due",
				submitLabel: "Save changes",
				submitting: updateDue.isPending,
				onSubmit: () => updateDue.mutate(),
				form: {
					title,
					setTitle,
					category,
					setCategory,
					amount,
					setAmount,
					dueDate,
					setDueDate,
					note,
					setNote
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(deletingGroup),
				onOpenChange: (open) => !open && setDeletingGroup(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this due?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "It will be removed from every person it was sent to. This cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Keep due" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
					onClick: () => deletingGroup && deleteDue.mutate(deletingGroup),
					children: "Delete due"
				})] })] })
			})
		] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "My dues",
			description: "See what you need to pay and when it is due.",
			icon: ReceiptText
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					icon: ReceiptText,
					label: "Dues to pay",
					value: String(pendingDues.length)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					icon: CreditCard,
					label: "Amount to pay",
					value: formatMoney(pendingDues.reduce((sum, invoice) => sum + getBalance(invoice), 0))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					icon: CircleCheck,
					label: "Payments made",
					value: String(paidDues.length)
				})
			]
		}),
		isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading your dues",
			onRetry: () => void queryClient.refetchQueries()
		}) : pendingDues.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "No dues to pay",
			description: "You are all caught up."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: pendingDues.map((invoice) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-secondary/20",
					onClick: () => setSelectedInvoice(invoice),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase text-muted-foreground",
								children: getDueMeta(invoice).category || "Estate due"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 truncate font-display text-lg font-semibold",
								children: invoice.description || "Estate due"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: ["Due ", formatDate(invoice.due_date)]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg font-semibold",
							children: formatMoney(getBalance(invoice), invoice.currency)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs font-medium text-primary",
							children: "View due"
						})]
					})]
				}, invoice.id);
			})
		}),
		paidDues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 font-display text-lg font-semibold",
				children: "Paid dues"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: paidDues.map((invoice) => {
					const payment = paymentRecords.find((item) => item.invoice_id === invoice.id && item.status === "completed");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex-1 text-left",
							onClick: () => setSelectedInvoice(invoice),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: invoice.description || "Estate due"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: payment?.paid_at ? `Paid ${formatDateTime(payment.paid_at)}` : "Paid"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-success",
								children: "Paid"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => downloadDueReceipt({
									title: invoice.description || "Estate due",
									amount: Number(payment?.amount ?? invoice.amount),
									currency: payment?.currency || invoice.currency,
									reference: payment?.reference,
									paidAt: payment?.paid_at,
									residentName: profile?.full_name || profile?.email
								}),
								children: "Receipt"
							})]
						})]
					}, invoice.id);
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResidentDueDialog, {
			invoice: selectedInvoice,
			onClose: () => setSelectedInvoice(null)
		})
	] });
}
function AdminDueList({ groups, emptyTitle, emptyDescription, onEdit, onDelete }) {
	if (groups.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: emptyTitle,
		description: emptyDescription
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-hidden rounded-xl border border-border bg-card",
		children: groups.map((group, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: `px-4 py-3 sm:px-5 ${index !== groups.length - 1 ? "border-b border-border" : ""}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-secondary px-2 py-1 font-medium text-foreground/80",
								children: group.category
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								group.paidCount,
								" of ",
								group.peopleCount,
								" paid"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Due ", formatDate(group.dueDate)] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "truncate text-sm font-semibold text-foreground sm:text-base",
							children: group.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 sm:shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-foreground",
								children: formatMoney(group.totalExpected)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DueStatus, {
								paid: group.paidCount,
								total: group.peopleCount
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 lg:pl-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => onEdit(group),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "mr-2 h-4 w-4" }), "Edit"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						className: "text-destructive hover:text-destructive",
						onClick: () => onDelete(group),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"]
					})]
				})]
			})
		}, group.id))
	});
}
function DueFormDialog({ open, onOpenChange, title, submitLabel, submitting, onSubmit, form, audience, setAudience, residents = [], selectedMemberIds = [], setSelectedMemberIds, targetCount }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto sm:max-w-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Use plain details residents will understand." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `${title}-name`,
								children: "Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `${title}-name`,
								value: form.title,
								onChange: (event) => form.setTitle(event.target.value),
								placeholder: "June security due"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.category,
									onValueChange: form.setCategory,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categories.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: item,
										children: item
									}, item)) })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `${title}-amount`,
									children: "Amount per person"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: `${title}-amount`,
									inputMode: "numeric",
									value: form.amount,
									onChange: (event) => form.setAmount(event.target.value),
									placeholder: "5000"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `${title}-date`,
								children: "Due date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `${title}-date`,
								type: "date",
								min: getDateKey(/* @__PURE__ */ new Date()),
								value: form.dueDate,
								onChange: (event) => form.setDueDate(event.target.value)
							})]
						}),
						audience && setAudience && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Who should pay?" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: audience,
									onValueChange: (value) => setAudience(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All members"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "tenant",
											children: "Tenants"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "landlord",
											children: "Landlords"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "selected",
											children: "Selected members"
										})
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										targetCount,
										" ",
										targetCount === 1 ? "person will" : "people will",
										" receive this due."
									]
								})
							]
						}),
						audience === "selected" && setSelectedMemberIds && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2",
							children: residents.map((resident) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary/40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: selectedMemberIds.includes(resident.id),
										onCheckedChange: (next) => setSelectedMemberIds(next ? [...selectedMemberIds, resident.id] : selectedMemberIds.filter((id) => id !== resident.id))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate font-medium",
											children: resident.full_name || resident.email || "Member"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs capitalize text-muted-foreground",
											children: resident.resident_type || "Member"
										})]
									})]
								}, resident.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `${title}-note`,
								children: "Short note (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: `${title}-note`,
								rows: 3,
								value: form.note,
								onChange: (event) => form.setNote(event.target.value),
								placeholder: "A short explanation of what this due covers."
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => onOpenChange(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: onSubmit,
					loading: submitting,
					loadingLabel: submitLabel,
					children: submitLabel
				})] })
			]
		})
	});
}
function ResidentDueDialog({ invoice, onClose }) {
	const meta = invoice ? getDueMeta(invoice) : {};
	const paid = invoice ? invoice.status === "paid" || getBalance(invoice) === 0 : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(invoice),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: invoice?.description || "Due details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: meta.category || "Estate due" })] }), invoice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-secondary/40 p-5 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Amount"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-3xl font-semibold",
							children: formatMoney(paid ? Number(invoice.amount) : getBalance(invoice), invoice.currency)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SimpleDetail, {
							label: "Due date",
							value: formatDate(invoice.due_date)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SimpleDetail, {
							label: "Status",
							value: paid ? "Paid" : getDueStatus(invoice)
						})]
					}),
					meta.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6 text-muted-foreground",
						children: meta.note
					}),
					!paid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-11 w-full",
						onClick: () => void startOnlinePayment(invoice),
						children: "Pay now"
					})
				]
			})]
		})
	});
}
function Stat({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-semibold",
				children: value
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
			})]
		})
	});
}
function SimpleDetail({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 font-medium",
		children: value
	})] });
}
function DueStatus({ paid, total }) {
	const complete = total > 0 && paid === total;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${complete ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`,
		children: complete ? "Fully paid" : `${total - paid} to pay`
	});
}
function validateDueForm(title, amount, dueDate) {
	const numericAmount = Number(amount);
	if (!title.trim()) throw new Error("Enter a title for this due.");
	if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error("Enter a valid amount.");
	if (!dueDate) throw new Error("Choose a due date.");
	if (getDateKey(dueDate) < getDateKey(/* @__PURE__ */ new Date())) throw new Error("The due date cannot be in the past.");
	return numericAmount;
}
function groupDues(invoices) {
	const grouped = /* @__PURE__ */ new Map();
	invoices.forEach((invoice) => {
		const id = getDueMeta(invoice).payment_group_id || invoice.invoice_number.replace(/-\d{3}$/, "");
		grouped.set(id, [...grouped.get(id) ?? [], invoice]);
	});
	return Array.from(grouped.entries()).map(([id, items]) => {
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
			paidCount: items.filter((invoice) => invoice.status === "paid" || getBalance(invoice) === 0).length,
			totalExpected: items.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
			invoices: items
		};
	}).sort((a, b) => String(b.dueDate || "").localeCompare(String(a.dueDate || "")));
}
function getDueMeta(invoice) {
	const item = Array.isArray(invoice.line_items) ? invoice.line_items[0] : null;
	return item && typeof item === "object" ? item : {};
}
function getBalance(invoice) {
	return Math.max(Number(invoice.amount) - Number(invoice.amount_paid ?? 0), 0);
}
function isPayable(invoice) {
	return ![
		"draft",
		"paid",
		"cancelled"
	].includes(invoice.status);
}
function compareDues(a, b) {
	return String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31"));
}
function getDueStatus(invoice) {
	if (!invoice.due_date) return "To pay";
	const due = getDateKey(invoice.due_date);
	const today = getDateKey(/* @__PURE__ */ new Date());
	if (due < today) return "Overdue";
	if (due === today) return "Due today";
	return "To pay";
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
	}).format(toLocalDate(value));
}
function formatDateTime(value) {
	return value ? new Date(value).toLocaleString() : "Not set";
}
function getDefaultDueDate() {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() + 7);
	return getDateKey(date);
}
function toLocalDate(value) {
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	return new Date(year, month - 1, day);
}
function getDateKey(value) {
	const date = typeof value === "string" ? toLocalDate(value) : value;
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
async function startOnlinePayment(invoice) {
	const key = "pk_test_0c7e5f90f3379108f446343afef81ca4d6509dbe";
	try {
		if (!(await getDuePaymentAvailability()).available) throw new Error("Online payment confirmation is not ready yet. Add the Paystack secret key on the server first.");
		await loadPaymentWindow();
		const { data } = await supabase.auth.getUser();
		const Paystack = window.PaystackPop;
		if (!data.user?.email || typeof Paystack !== "function") throw new Error("Online payment is temporarily unavailable.");
		const balance = getBalance(invoice);
		new Paystack().newTransaction({
			key,
			email: data.user.email,
			amount: Math.round(balance * 100),
			currency: invoice.currency,
			reference: `due-${invoice.id}-${Date.now()}`,
			metadata: {
				invoice_id: invoice.id,
				resident_id: invoice.resident_id
			},
			onSuccess: ({ reference }) => {
				savePendingDuePayment(invoice.id, reference);
				confirmCompletedPayment(invoice, reference);
			},
			onCancel: () => void 0,
			onError: (paymentError) => {
				toast.error(paymentError.message || "Payment could not be started.");
			}
		});
	} catch (error) {
		toast.error(error instanceof Error ? error.message : "Online payment is temporarily unavailable.");
	}
}
function loadPaymentWindow() {
	return new Promise((resolve, reject) => {
		if (typeof window.PaystackPop === "function" && "newTransaction" in window.PaystackPop.prototype) {
			resolve();
			return;
		}
		const existing = document.querySelector("script[data-payment-window='v2']");
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener("error", () => reject(/* @__PURE__ */ new Error("Payment window failed to load.")), { once: true });
			return;
		}
		document.querySelector("script[data-payment-window]")?.remove();
		window.PaystackPop = void 0;
		const script = document.createElement("script");
		script.src = "https://js.paystack.co/v2/inline.js";
		script.async = true;
		script.dataset.paymentWindow = "v2";
		script.onload = () => resolve();
		script.onerror = () => reject(/* @__PURE__ */ new Error("Payment window failed to load."));
		document.head.appendChild(script);
	});
}
async function confirmCompletedPayment(invoice, reference, silent = false) {
	try {
		const receipt = await verifyDuePayment({ data: {
			invoiceId: invoice.id,
			reference
		} });
		clearPendingDuePayment(invoice.id, reference);
		sessionStorage.setItem("duePaymentReceipt", JSON.stringify(receipt));
		window.location.href = "/dashboard";
	} catch (error) {
		const message = error instanceof Error ? error.message : "Payment could not be confirmed.";
		if (message.includes("temporarily unavailable")) {
			if (!silent) toast.error("Payment completed but confirmation is waiting", { description: "We saved your payment reference and will retry confirmation when you open Payments again." });
			return;
		}
		if (!silent) toast.error(message);
	}
}
function readPendingDuePayments() {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(PENDING_DUE_PAYMENT_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writePendingDuePayments(payments) {
	if (typeof window === "undefined") return;
	localStorage.setItem(PENDING_DUE_PAYMENT_KEY, JSON.stringify(payments.slice(-10)));
}
function savePendingDuePayment(invoiceId, reference) {
	writePendingDuePayments([...readPendingDuePayments().filter((payment) => payment.invoiceId !== invoiceId || payment.reference !== reference), {
		invoiceId,
		reference,
		savedAt: Date.now()
	}]);
}
function clearPendingDuePayment(invoiceId, reference) {
	writePendingDuePayments(readPendingDuePayments().filter((payment) => payment.invoiceId !== invoiceId || payment.reference !== reference));
}
//#endregion
export { PaymentsPage as component };
