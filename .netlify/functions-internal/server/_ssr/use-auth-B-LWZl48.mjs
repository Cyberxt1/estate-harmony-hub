import { r as __toESM } from "../_runtime.mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-Cp3xBhYN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-B-LWZl48.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function canManageRole(role) {
	return [
		"estate_admin",
		"community_chairman",
		"community_secretary",
		"treasurer",
		"chief_security_officer",
		"security_officer",
		"security_gateman"
	].includes(role);
}
var inviteAdminTeamMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.email?.trim()) throw new Error("Enter an email address.");
	if (!canManageRole(input.role)) throw new Error("Choose a valid role.");
	return input;
}).handler(createSsrRpc("ca653b3af0d1d953fbf46f37d354eb2d3ee6da0a16e71148f7aca5eb9baf1e9c"));
var claimPendingAdminInvitations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("7f132d13beebc62da4ca0b48ff2c5c20920577788526eddc57d4df6f412efc40"));
var adminRoles = [
	"community_chairman",
	"community_secretary",
	"chief_security_officer",
	"super_admin",
	"estate_admin",
	"treasurer"
];
var AuthContext = (0, import_react.createContext)(null);
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [roles, setRoles] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let mounted = true;
		const load = async (u) => {
			if (!u) {
				setProfile(null);
				setRoles([]);
				return;
			}
			const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(), supabase.from("user_roles").select("role").eq("user_id", u.id)]);
			await claimPendingAdminInvitations();
			const { data: refreshedRoles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
			if (!mounted) return;
			setProfile(p);
			setRoles((refreshedRoles ?? r ?? []).map((x) => x.role));
		};
		supabase.auth.getSession().then(({ data }) => {
			if (!mounted) return;
			const initialUser = data.session?.user ?? null;
			setUser(initialUser);
			load(initialUser).finally(() => mounted && setLoading(false));
		});
		const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
			if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
			const next = session?.user ?? null;
			setUser(next);
			setTimeout(() => void load(next), 0);
		});
		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	const hasRole = (r) => roles.includes(r);
	const isAdmin = roles.some((role) => adminRoles.includes(role));
	const isSecurity = hasRole("security_officer") || hasRole("chief_security_officer") || hasRole("security_gateman");
	const primaryRole = isAdmin ? roles.find((role) => adminRoles.includes(role)) ?? "estate_admin" : isSecurity ? roles.find((role) => [
		"chief_security_officer",
		"security_officer",
		"security_gateman"
	].includes(role)) ?? "security_officer" : roles[0] ?? "resident";
	return (0, import_react.createElement)(AuthContext.Provider, { value: {
		user,
		profile,
		roles,
		hasRole,
		isAdmin,
		isSecurity,
		primaryRole,
		loading
	} }, children);
}
function useAuth() {
	const context = (0, import_react.useContext)(AuthContext);
	if (!context) throw new Error("useAuth must be used inside AuthProvider");
	return context;
}
async function signOut() {
	await supabase.auth.signOut();
	window.location.href = "/";
}
//#endregion
export { useAuth as a, signOut as i, createSsrRpc as n, inviteAdminTeamMember as r, AuthProvider as t };
