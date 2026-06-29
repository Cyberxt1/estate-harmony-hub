import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as useNavigate, f as Outlet, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-CelYkufv.mjs";
import { E as CreditCard, F as House, M as Building2, R as ChartColumn, S as LayoutDashboard, _ as MessageSquareWarning, b as Megaphone, c as ShieldCheck, m as QrCode, n as Users, t as X, u as Settings, w as FileText, x as LogOut, y as Menu } from "../_libs/lucide-react.mjs";
import { n as signOut, r as useAuth } from "./use-auth-CJoPS59J.mjs";
import { n as PageLoading } from "./page-loading-BzoD1xkC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-CdpTndvg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var nav = [
	{
		to: "/dashboard",
		label: "Overview",
		icon: LayoutDashboard,
		exact: true,
		groups: [
			"resident",
			"operations",
			"cso"
		]
	},
	{
		to: "/dashboard/onboarding",
		label: "My details",
		icon: Users,
		groups: ["resident"]
	},
	{
		to: "/dashboard/residents",
		label: "Community members",
		icon: Users,
		groups: ["operations", "cso"]
	},
	{
		to: "/dashboard/properties",
		label: "Properties",
		icon: House,
		groups: ["operations", "cso"]
	},
	{
		to: "/dashboard/visitors",
		label: "Visitors",
		icon: QrCode,
		groups: ["resident", "cso"]
	},
	{
		to: "/dashboard/payments",
		label: "Dues",
		icon: CreditCard,
		groups: [
			"resident",
			"operations",
			"cso"
		]
	},
	{
		to: "/dashboard/announcements",
		label: "Announcements",
		icon: Megaphone,
		groups: [
			"resident",
			"operations",
			"cso"
		]
	},
	{
		to: "/dashboard/complaints",
		label: "Complaints",
		icon: MessageSquareWarning,
		groups: [
			"resident",
			"operations",
			"cso"
		]
	},
	{
		to: "/dashboard/security",
		label: "Security",
		icon: ShieldCheck,
		groups: ["cso"]
	},
	{
		to: "/dashboard/documents",
		label: "Documents",
		icon: FileText,
		groups: ["resident", "operations"]
	},
	{
		to: "/dashboard/reports",
		label: "Reports",
		icon: ChartColumn,
		groups: ["operations", "cso"]
	},
	{
		to: "/dashboard/settings",
		label: "Settings",
		icon: Settings,
		groups: [
			"resident",
			"operations",
			"cso"
		]
	}
];
function DashboardLayout() {
	const { profile, primaryRole, loading } = useAuth();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const workspace = getWorkspace(primaryRole);
	(0, import_react.useEffect)(() => setMobileOpen(false), [pathname]);
	(0, import_react.useEffect)(() => {
		if (!loading && profile && !profile.onboarding_completed && pathname !== "/dashboard/onboarding") navigate({
			to: "/dashboard/onboarding",
			replace: true
		});
	}, [
		loading,
		navigate,
		pathname,
		profile
	]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
		fullScreen: true,
		label: "Preparing your dashboard"
	});
	const initials = (profile?.full_name || profile?.email || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("fixed inset-y-0 left-0 z-50 w-56 transform border-r border-sidebar-border bg-sidebar transition-transform md:relative md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-14 items-center justify-between border-b border-sidebar-border px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/dashboard",
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-lg font-semibold",
								children: "Oyesile"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "md:hidden",
							onClick: () => setMobileOpen(false),
							"aria-label": "Close menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-col gap-0.5 p-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-3 pb-2 pt-1 text-xs font-medium uppercase text-sidebar-foreground/50",
							children: workspace.label
						}), nav.filter((item) => item.groups.includes(workspace.key)).map((item) => {
							const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-4 w-4" }), item.label]
							}, item.to);
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-2.5 bottom-2.5 rounded-lg border border-sidebar-border bg-card p-2.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold",
									children: initials
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-medium",
										children: profile?.full_name || profile?.email
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs capitalize text-muted-foreground",
										children: formatRole(primaryRole)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
									onClick: async () => {
										await signOut();
										navigate({ to: "/" });
									},
									"aria-label": "Sign out",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
								})
							]
						})
					})
				]
			}),
			mobileOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 bg-foreground/40 md:hidden",
				onClick: () => setMobileOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 items-center gap-3 border-b border-border bg-background/90 px-3.5 backdrop-blur md:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "md:hidden",
							onClick: () => setMobileOpen(true),
							"aria-label": "Open menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: workspace.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "hidden truncate text-xs text-muted-foreground sm:block",
								children: workspace.description
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden text-sm text-muted-foreground md:block",
							children: profile?.full_name || profile?.email
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 p-3.5 sm:p-5 md:p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "app-content mx-auto w-full max-w-7xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					})
				})]
			})
		]
	});
}
function getWorkspace(role) {
	if (role === "chief_security_officer" || role === "security_officer") return {
		key: "cso",
		label: "CSO view",
		title: "Security workspace",
		description: "Visitors, incidents and security reports."
	};
	if (role === "community_secretary" || role === "community_chairman" || role === "treasurer" || role === "estate_admin" || role === "super_admin") return {
		key: "operations",
		label: {
			community_chairman: "Chairman view",
			community_secretary: "Secretary view",
			treasurer: "Treasurer view",
			estate_admin: "Estate admin view",
			super_admin: "Super admin view"
		}[role] ?? "Estate operations view",
		title: {
			community_chairman: "Chairman workspace",
			community_secretary: "Secretary workspace",
			treasurer: "Treasurer workspace",
			estate_admin: "Estate operations workspace",
			super_admin: "Estate operations workspace"
		}[role] ?? "Estate operations workspace",
		description: "Residents, properties, payments and estate records."
	};
	return {
		key: "resident",
		label: "Resident view",
		title: "Resident workspace",
		description: "Your dues, visitors, notices and household records."
	};
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
export { DashboardLayout as component };
