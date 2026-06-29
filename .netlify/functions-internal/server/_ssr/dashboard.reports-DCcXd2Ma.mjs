import { t as supabase } from "./client-yydkHmVi.mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { L as ChartColumn } from "../_libs/lucide-react.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { n as PageHeader } from "./page-header-DnpF6lGt.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.reports-DCcXd2Ma.js
var import_jsx_runtime = require_jsx_runtime();
function ReportsPage() {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["report-stats"],
		queryFn: async () => {
			const [residents, properties, invoices, payments, complaints, visitors, incidents] = await Promise.all([
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("properties").select("status"),
				supabase.from("invoices").select("amount, amount_paid, status"),
				supabase.from("payments").select("amount, status"),
				supabase.from("complaints").select("status"),
				supabase.from("visitors").select("status"),
				supabase.from("security_incidents").select("severity, status")
			]);
			const revenue = (payments.data ?? []).filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
			const outstanding = (invoices.data ?? []).reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid ?? 0)), 0);
			const occupied = (properties.data ?? []).filter((p) => p.status === "occupied").length;
			const total = (properties.data ?? []).length;
			return {
				residents: residents.count ?? 0,
				revenue,
				outstanding,
				occupancy: total > 0 ? Math.round(occupied / total * 100) : 0,
				openComplaints: (complaints.data ?? []).filter((c) => c.status !== "resolved" && c.status !== "closed").length,
				visitorsToday: (visitors.data ?? []).filter((v) => v.status === "checked_in").length,
				criticalIncidents: (incidents.data ?? []).filter((i) => i.severity === "critical" || i.severity === "high").length
			};
		}
	});
	const tiles = [
		{
			label: "Total residents",
			value: data?.residents ?? 0
		},
		{
			label: "Revenue collected",
			value: `₦${(data?.revenue ?? 0).toLocaleString()}`
		},
		{
			label: "Outstanding dues",
			value: `₦${(data?.outstanding ?? 0).toLocaleString()}`
		},
		{
			label: "Occupancy",
			value: `${data?.occupancy ?? 0}%`
		},
		{
			label: "Open complaints",
			value: data?.openComplaints ?? 0
		},
		{
			label: "Visitors on site",
			value: data?.visitorsToday ?? 0
		},
		{
			label: "High/critical incidents",
			value: data?.criticalIncidents ?? 0
		}
	];
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
		label: "Preparing reports",
		onRetry: () => void refetch()
	});
	if (isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Reports",
		description: "Revenue, occupancy, complaints, visitor and security analytics.",
		icon: ChartColumn
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
		children: tiles.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: t.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-2xl font-semibold",
				children: t.value
			})]
		}, t.label))
	})] });
}
//#endregion
export { ReportsPage as component };
