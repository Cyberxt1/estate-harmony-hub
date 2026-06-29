import { r as __toESM } from "../_runtime.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as House, O as CreditCard, a as TrendingUp, c as ShieldCheck, h as QrCode, n as Users, y as MessageSquareWarning } from "../_libs/lucide-react.mjs";
import { a as useAuth } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as downloadDueReceipt } from "./receipts-C46lC8Qz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.index-CN8u6Bhk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DashboardHome() {
	const { profile, primaryRole, isAdmin, isSecurity, user, roles } = useAuth();
	(0, import_react.useEffect)(() => {
		const rawReceipt = sessionStorage.getItem("duePaymentReceipt");
		if (!rawReceipt) return;
		sessionStorage.removeItem("duePaymentReceipt");
		try {
			const receipt = JSON.parse(rawReceipt);
			toast.success(`You paid ${receipt.title}`, {
				description: formatMoney(receipt.amount, receipt.currency),
				action: {
					label: "Receipt",
					onClick: () => downloadDueReceipt(receipt)
				}
			});
		} catch {
			toast.success("Your due was paid successfully");
		}
	}, []);
	const { data: stats, isLoading, isError, refetch } = useQuery({
		queryKey: [
			"dashboard-stats",
			profile?.estate_id,
			primaryRole
		],
		queryFn: async () => {
			const [residents, properties, visitors, invoices, complaints, incidents] = await Promise.all([
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("properties").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("visitors").select("id", {
					count: "exact",
					head: true
				}).eq("status", "expected"),
				supabase.from("invoices").select("amount, amount_paid, status"),
				supabase.from("complaints").select("id", {
					count: "exact",
					head: true
				}).in("status", [
					"open",
					"assigned",
					"in_progress"
				]),
				supabase.from("security_incidents").select("id", {
					count: "exact",
					head: true
				}).in("status", ["reported", "investigating"])
			]);
			const outstanding = (invoices.data ?? []).reduce((sum, i) => sum + (Number(i.amount) - Number(i.amount_paid ?? 0)), 0);
			const duesToPay = (invoices.data ?? []).filter((invoice) => Number(invoice.amount) > Number(invoice.amount_paid ?? 0) && ![
				"draft",
				"paid",
				"cancelled"
			].includes(invoice.status)).length;
			return {
				residents: residents.count ?? 0,
				properties: properties.count ?? 0,
				visitors: visitors.count ?? 0,
				complaints: complaints.count ?? 0,
				incidents: incidents.count ?? 0,
				outstanding,
				duesToPay
			};
		}
	});
	const { data: assignedTasks = [] } = useQuery({
		queryKey: [
			"assigned-tasks",
			user?.id,
			roles.join(",")
		],
		enabled: Boolean(user?.id),
		queryFn: async () => {
			const { data, error } = await supabase.from("staff_tasks").select("*").in("status", ["pending", "in_progress"]).order("created_at", { ascending: false });
			if (error) throw error;
			return (data ?? []).filter((task) => task.assigned_user_id === user?.id || task.assigned_role && roles.includes(task.assigned_role));
		}
	});
	const cards = isSecurity ? [
		{
			label: "Expected visitors today",
			value: stats?.visitors ?? 0,
			icon: QrCode
		},
		{
			label: "Open incidents",
			value: stats?.incidents ?? 0,
			icon: ShieldCheck
		},
		{
			label: "Total residents",
			value: stats?.residents ?? 0,
			icon: Users
		},
		{
			label: "Total properties",
			value: stats?.properties ?? 0,
			icon: House
		}
	] : isAdmin ? [
		{
			label: "Residents",
			value: stats?.residents ?? 0,
			icon: Users
		},
		{
			label: "Properties",
			value: stats?.properties ?? 0,
			icon: House
		},
		{
			label: "Open complaints",
			value: stats?.complaints ?? 0,
			icon: MessageSquareWarning
		},
		{
			label: "Outstanding dues",
			value: formatMoney(stats?.outstanding ?? 0),
			icon: CreditCard
		}
	] : [
		{
			label: "Expected visitors",
			value: stats?.visitors ?? 0,
			icon: QrCode
		},
		{
			label: "Dues to pay",
			value: stats?.duesToPay ?? 0,
			icon: CreditCard
		},
		{
			label: "Open complaints",
			value: stats?.complaints ?? 0,
			icon: MessageSquareWarning
		},
		{
			label: "Announcements",
			value: "—",
			icon: TrendingUp
		}
	];
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
		label: "Loading your overview",
		onRetry: () => void refetch()
	});
	if (isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "font-display text-2xl font-semibold",
				children: [
					"Welcome back",
					profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : "",
					"."
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground capitalize",
				children: [formatRole(primaryRole), " workspace for Oyesile Estate"]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: cards.map((c) => {
					const card = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-card p-4 shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: c.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c.icon, { className: "h-4 w-4" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-display text-xl font-semibold",
							children: c.value
						})]
					});
					return c.label === "Outstanding dues" || c.label === "Dues to pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard/payments",
						className: "block",
						children: card
					}, c.label) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: card }, c.label);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-card p-4 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 font-display text-lg font-semibold",
							children: "Getting started"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Oyesile Estate is ready for resident records, properties, visitors, dues and community announcements."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-1.5 text-sm",
							children: [
								"Confirm Oyesile Estate details in Settings",
								"Add properties and assign households",
								"Assign community officers and security roles",
								"Create dues for all members or selected residents"
							].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary",
									children: i + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: s
								})]
							}, s))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 font-display text-lg font-semibold",
						children: "Your role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"You're signed in as",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground",
								children: formatRole(primaryRole)
							}),
							". Your dashboard, navigation and permissions adapt automatically to this role."
						]
					})]
				})]
			}),
			assignedTasks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg border border-border bg-card p-4 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Assigned tasks"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Tasks delegated to your role or account."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground",
						children: assignedTasks.length
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-2",
					children: assignedTasks.slice(0, 4).map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: task.title
						}), task.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: task.description
						})]
					}, task.id))
				})]
			})
		]
	});
}
function formatMoney(n, currency = "NGN") {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 0
	}).format(n);
}
function formatRole(role) {
	return {
		super_admin: "Super admin",
		estate_admin: "Estate admin",
		community_chairman: "Community chairman",
		community_secretary: "Community secretary",
		treasurer: "Treasurer",
		chief_security_officer: "Chief Security Officer",
		security_officer: "Security officer",
		resident: "Resident",
		household_member: "Household member",
		domestic_staff: "Domestic staff"
	}[role] ?? role.replaceAll("_", " ");
}
//#endregion
export { DashboardHome as component };
