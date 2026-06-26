import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BnC4vHJN.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Settings } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./use-auth-DEi8cmgE.mjs";
import { n as PageHeader } from "./page-header-CGNtK6Vg.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings-ByiMA3rw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const { user, profile, isAdmin } = useAuth();
	const qc = useQueryClient();
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [estateName, setEstateName] = (0, import_react.useState)("");
	const [estateAddress, setEstateAddress] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (profile) {
			setFullName(profile.full_name || "");
			setPhone(profile.phone || "");
		}
	}, [profile]);
	const { data: estate } = useQuery({
		queryKey: ["my-estate", profile?.estate_id],
		enabled: !!profile?.estate_id,
		queryFn: async () => {
			const { data } = await supabase.from("estates").select("*").eq("id", profile.estate_id).maybeSingle();
			return data;
		}
	});
	(0, import_react.useEffect)(() => {
		if (estate) {
			setEstateName(estate.name);
			setEstateAddress(estate.address || "");
		}
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
	const createOrUpdateEstate = useMutation({
		mutationFn: async () => {
			if (profile?.estate_id) {
				const { error } = await supabase.from("estates").update({
					name: estateName,
					address: estateAddress
				}).eq("id", profile.estate_id);
				if (error) throw error;
			} else {
				const { data: e, error } = await supabase.from("estates").insert({
					name: estateName,
					address: estateAddress
				}).select().single();
				if (error) throw error;
				await supabase.from("profiles").update({ estate_id: e.id }).eq("id", user.id);
				await supabase.from("user_roles").insert({
					user_id: user.id,
					estate_id: e.id,
					role: "estate_admin"
				});
			}
		},
		onSuccess: () => {
			toast.success("Estate saved");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		title: "Settings",
		description: "Your profile, estate details, roles and preferences.",
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
					children: profile?.estate_id ? "Estate details" : "Create your estate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 text-sm text-muted-foreground",
					children: profile?.estate_id ? "Update your estate's name and address." : "Set up your estate to unlock properties, residents, visitors and dues. You'll become the estate admin."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Estate name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: estateName,
								onChange: (e) => setEstateName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: estateAddress,
								onChange: (e) => setEstateAddress(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => createOrUpdateEstate.mutate(),
							disabled: !estateName || createOrUpdateEstate.isPending || !!profile?.estate_id && !isAdmin,
							children: profile?.estate_id ? "Save estate" : "Create estate"
						})
					]
				})
			]
		})]
	})] });
}
//#endregion
export { SettingsPage as component };
