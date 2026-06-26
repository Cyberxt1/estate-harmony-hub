import { t as supabase } from "./client-BnC4vHJN.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { T as House, _ as CreditCard, c as QrCode, i as ShieldCheck, n as Users, r as TrendingUp, u as MessageSquareWarning } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-DEi8cmgE.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.index-BKtSX6C-.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardHome() {
	const { profile, primaryRole, isAdmin, isSecurity } = useAuth();
	const { data: stats } = useQuery({
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
			return {
				residents: residents.count ?? 0,
				properties: properties.count ?? 0,
				visitors: visitors.count ?? 0,
				complaints: complaints.count ?? 0,
				incidents: incidents.count ?? 0,
				outstanding
			};
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
			label: "Outstanding dues",
			value: formatMoney(stats?.outstanding ?? 0),
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "font-display text-3xl font-semibold",
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
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: cards.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-5",
					style: { boxShadow: "var(--shadow-soft)" },
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
						className: "mt-3 font-display text-2xl font-semibold",
						children: c.value
					})]
				}, c.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 font-display text-lg font-semibold",
							children: "Getting started"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Oyesile Estate is ready for resident records, properties, visitors, reviewed payments and community announcements."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2 text-sm",
							children: [
								"Confirm Oyesile Estate details in Settings",
								"Add properties and assign households",
								"Assign community officers and security roles",
								"Create repeating dues for tenants and landlords"
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
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 font-display text-lg font-semibold",
						children: "Your role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"You're signed in as ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground",
								children: formatRole(primaryRole)
							}),
							". Your dashboard, navigation and permissions adapt automatically to this role."
						]
					})]
				})]
			})
		]
	});
}
function formatMoney(n) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
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
