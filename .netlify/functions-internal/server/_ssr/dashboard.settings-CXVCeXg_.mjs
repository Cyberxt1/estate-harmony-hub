import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DNwKaOJw.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Settings } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-CP7XOnjs.mjs";
import { n as PageHeader } from "./page-header-CGNtK6Vg.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings-CXVCeXg_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const { user, profile, isAdmin } = useAuth();
	const qc = useQueryClient();
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [estateAddress, setEstateAddress] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (profile) {
			setFullName(profile.full_name || "");
			setPhone(profile.phone || "");
		}
	}, [profile]);
	const { data: estate } = useQuery({
		queryKey: ["oyesile-estate", profile?.estate_id],
		enabled: !!profile?.estate_id,
		queryFn: async () => {
			const { data } = await supabase.from("estates").select("*").eq("id", profile.estate_id).maybeSingle();
			return data;
		}
	});
	(0, import_react.useEffect)(() => {
		if (estate) setEstateAddress(estate.address || "");
	}, [estate]);
	const saveProfile = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("profiles").update({
				full_name: fullName,
				phone
			}).eq("id", user.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Profile updated");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const saveEstateDetails = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
			const { error } = await supabase.from("estates").update({ address: estateAddress }).eq("id", profile.estate_id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Oyesile Estate details saved");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Settings",
		description: "Your profile, Oyesile Estate details, roles and preferences.",
		icon: Settings
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-4 font-display text-lg font-semibold",
				children: "Your profile"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: fullName,
							onChange: (e) => setFullName(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: profile?.email || "",
							disabled: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: phone,
							onChange: (e) => setPhone(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => saveProfile.mutate(),
						disabled: saveProfile.isPending,
						children: "Save profile"
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl border border-border bg-card p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-1 font-display text-lg font-semibold",
					children: "Oyesile Estate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 text-sm text-muted-foreground",
					children: "This platform is for Oyesile Estate only. New residents are linked to this estate automatically after signup."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Estate name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: estate?.name || "Oyesile Estate",
								disabled: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: estateAddress,
								onChange: (e) => setEstateAddress(e.target.value),
								disabled: !isAdmin
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => saveEstateDetails.mutate(),
							disabled: !isAdmin || !profile?.estate_id || saveEstateDetails.isPending,
							children: "Save Oyesile details"
						}),
						!profile?.estate_id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Your account is not linked to Oyesile Estate yet. Ask an admin to review the account or run the fixed-estate migration."
						})
					]
				})
			]
		})]
	})] });
}
//#endregion
export { SettingsPage as component };
