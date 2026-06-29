import { r as __toESM } from "../_runtime.mjs";
import { _ as useNavigate, f as Outlet, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as House, C as LogOut, E as FileText, F as Bell, I as Ambulance, L as TriangleAlert, O as CreditCard, P as Building2, S as Megaphone, U as ChartColumn, c as ShieldCheck, d as Settings, h as QrCode, l as ShieldAlert, n as Users, t as X, v as PhoneCall, w as LayoutDashboard, x as Menu, y as MessageSquareWarning } from "../_libs/lucide-react.mjs";
import { a as useAuth, i as signOut } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-BcXyhtoA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
function DashboardNotifications() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { data: notifications = [] } = useQuery({
		queryKey: ["notifications", user?.id],
		enabled: Boolean(user?.id),
		queryFn: async () => {
			const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(8);
			if (error) throw error;
			return data ?? [];
		}
	});
	const unreadCount = notifications.filter((item) => !item.read_at).length;
	const markAllRead = useMutation({
		mutationFn: async () => {
			const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id);
			if (!unreadIds.length) return;
			const { error } = await supabase.from("notifications").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).in("id", unreadIds);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "ghost",
			size: "icon",
			className: "relative",
			"aria-label": "Notifications",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" }), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute right-1.5 top-1.5 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-semibold text-white",
				children: unreadCount > 9 ? "9+" : unreadCount
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
		align: "end",
		className: "w-80 p-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-border px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold",
				children: "Notifications"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Latest updates for your account"
			})] }), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => markAllRead.mutate(),
				children: "Mark all read"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-96 overflow-y-auto",
			children: notifications.length > 0 ? notifications.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.link || "/dashboard",
				className: `block border-b border-border px-4 py-3 transition hover:bg-secondary/30 ${item.read_at ? "" : "bg-accent/25"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: item.title
					}),
					item.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: item.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[11px] text-muted-foreground",
						children: new Date(item.created_at).toLocaleString()
					})
				]
			}, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 py-6 text-sm text-muted-foreground",
				children: "No notifications yet."
			})
		})]
	})] });
}
function EmergencyFab() {
	const { user, profile } = useAuth();
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [type, setType] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const { data: contacts = [] } = useQuery({
		queryKey: ["emergency-contacts", profile?.estate_id],
		enabled: Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("emergency_contacts").select("*").order("priority", { ascending: true }).limit(5);
			if (error) throw error;
			return data ?? [];
		}
	});
	const reportEmergency = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Sign in to report an emergency.");
			if (!type.trim()) throw new Error("Enter the kind of emergency.");
			const { error } = await supabase.from("security_incidents").insert({
				estate_id: profile.estate_id,
				reporter_id: user.id,
				type: type.trim(),
				severity: "critical",
				location: location.trim() || null,
				description: description.trim() || null,
				occurred_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Emergency reported");
			setOpen(false);
			setType("");
			setLocation("");
			setDescription("");
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const primarySecurity = contacts.find((item) => item.label.toLowerCase().includes("security"));
	const primaryHospital = contacts.find((item) => item.label.toLowerCase().includes("hospital"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-5 right-5 z-40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "h-12 rounded-full px-4 shadow-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mr-2 h-4 w-4" }), "Emergency"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			align: "end",
			className: "w-80",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: "Emergency help"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Quick actions for security, hospital help, or incident reports."
					})] }),
					primarySecurity && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						href: `tel:${primarySecurity.phone}`,
						icon: PhoneCall,
						title: primarySecurity.label,
						subtitle: primarySecurity.phone
					}),
					primaryHospital && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						href: `tel:${primaryHospital.phone}`,
						icon: Ambulance,
						title: primaryHospital.label,
						subtitle: primaryHospital.phone
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						variant: "outline",
						onClick: () => setOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mr-2 h-4 w-4" }), "Report an emergency"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "w-full",
						variant: "ghost",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/dashboard/visitors",
							children: "Open visitor and gate log"
						})
					})
				]
			})
		})] })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Report emergency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "This sends a critical incident report to the security workspace immediately." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Emergency type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: type,
							onChange: (event) => setType(event.target.value),
							placeholder: "Medical, fire, break-in..."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: location,
							onChange: (event) => setLocation(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							rows: 4,
							value: description,
							onChange: (event) => setDescription(event.target.value)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => reportEmergency.mutate(),
				loading: reportEmergency.isPending,
				loadingLabel: "Reporting emergency",
				children: "Send emergency report"
			}) })
		] })
	})] });
}
function QuickAction({ href, icon: Icon, title, subtitle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href,
		className: "flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition hover:bg-secondary/30",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: subtitle
		})] })]
	});
}
var nav = [
	{
		to: "/dashboard",
		label: "Overview",
		icon: LayoutDashboard,
		exact: true,
		groups: [
			"resident",
			"operations",
			"cso",
			"gate"
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
		groups: [
			"resident",
			"cso",
			"gate"
		]
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
		groups: ["cso", "gate"]
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
			"cso",
			"gate"
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
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardNotifications, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "hidden text-sm text-muted-foreground md:block",
								children: profile?.full_name || profile?.email
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex-1 p-3.5 sm:p-5 md:p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "app-content mx-auto w-full max-w-7xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmergencyFab, {})
				]
			})
		]
	});
}
function getWorkspace(role) {
	if (role === "security_gateman") return {
		key: "gate",
		label: "Gate view",
		title: "Gate workspace",
		description: "Scan, check in and log people at the gate."
	};
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
		security_gateman: "Security gateman",
		resident: "Resident",
		household_member: "Household member",
		domestic_staff: "Domestic staff"
	}[role] ?? role.replaceAll("_", " ");
}
//#endregion
export { DashboardLayout as component };
