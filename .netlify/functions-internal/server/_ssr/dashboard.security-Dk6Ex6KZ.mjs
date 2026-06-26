import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DNwKaOJw.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as ShieldCheck, l as Plus } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-CP7XOnjs.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-CGNtK6Vg.mjs";
import { t as Textarea } from "./textarea-DBn9CRiI.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUy71i1r.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.security-Dk6Ex6KZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SecurityPage() {
	const { user, profile } = useAuth();
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [type, setType] = (0, import_react.useState)("");
	const [severity, setSeverity] = (0, import_react.useState)("low");
	const [location, setLocation] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const { data } = useQuery({
		queryKey: ["incidents"],
		queryFn: async () => {
			const { data, error } = await supabase.from("security_incidents").select("*").order("occurred_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
			const { error } = await supabase.from("security_incidents").insert({
				estate_id: profile.estate_id,
				reporter_id: user.id,
				type,
				severity,
				location,
				description
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Incident reported");
			setOpen(false);
			setType("");
			setLocation("");
			setDescription("");
			qc.invalidateQueries({ queryKey: ["incidents"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Security",
		description: "Incident reports, patrol logs, blacklist and watchlist.",
		icon: ShieldCheck,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Report incident"] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Report incident" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: type,
								onChange: (e) => setType(e.target.value),
								placeholder: "e.g. Trespass, theft, suspicious activity"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Severity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: severity,
								onValueChange: setSeverity,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
									"low",
									"medium",
									"high",
									"critical"
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: s,
									className: "capitalize",
									children: s
								}, s)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: location,
								onChange: (e) => setLocation(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 4,
								value: description,
								onChange: (e) => setDescription(e.target.value)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => create.mutate(),
					disabled: !type || create.isPending,
					children: "Report"
				}) })
			] })]
		})
	}), data && data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: data.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-border bg-card p-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: i.type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: i.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: [
							i.location,
							" · ",
							i.occurred_at ? new Date(i.occurred_at).toLocaleString() : ""
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground",
						children: i.severity
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground",
						children: i.status
					})]
				})]
			})
		}, i.id))
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "No incidents reported",
		description: "Security can log incidents, patrol activity and suspicious events here."
	})] });
}
//#endregion
export { SecurityPage as component };
