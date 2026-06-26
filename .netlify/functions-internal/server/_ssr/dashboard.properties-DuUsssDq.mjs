import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BnC4vHJN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as House, l as Plus } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-DEi8cmgE.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-CGNtK6Vg.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-DFjnKMNx.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.properties-DuUsssDq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PropertiesPage() {
	const { profile, isAdmin } = useAuth();
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [houseNumber, setHouseNumber] = (0, import_react.useState)("");
	const [street, setStreet] = (0, import_react.useState)("");
	const { data, isLoading } = useQuery({
		queryKey: ["properties"],
		queryFn: async () => {
			const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("You're not assigned to an estate yet. Configure it in Settings.");
			const { error } = await supabase.from("properties").insert({
				estate_id: profile.estate_id,
				house_number: houseNumber,
				street
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Property added");
			setOpen(false);
			setHouseNumber("");
			setStreet("");
			qc.invalidateQueries({ queryKey: ["properties"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Properties",
		description: "Houses, ownership, occupancy and meters.",
		icon: House,
		children: isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add property"] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New property" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "House number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: houseNumber,
							onChange: (e) => setHouseNumber(e.target.value),
							placeholder: "e.g. B12"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Street" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: street,
							onChange: (e) => setStreet(e.target.value)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => create.mutate(),
					disabled: !houseNumber || create.isPending,
					children: "Create"
				}) })
			] })]
		})
	}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Loading…"
	}) : data && data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: data.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg font-semibold",
					children: p.house_number
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: p.street || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-accent px-2 py-0.5 capitalize text-accent-foreground",
						children: p.status
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground",
						children: p.property_type
					})]
				})
			]
		}, p.id))
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "No properties yet",
		description: isAdmin ? "Add the houses in your estate to start managing occupancy." : "Properties will appear here once your admin adds them."
	})] });
}
//#endregion
export { PropertiesPage as component };
