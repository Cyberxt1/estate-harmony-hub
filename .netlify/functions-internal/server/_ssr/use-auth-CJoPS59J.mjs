import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-CJoPS59J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
			if (!mounted) return;
			setProfile(p);
			setRoles((r ?? []).map((x) => x.role));
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
	const isSecurity = hasRole("security_officer") || hasRole("chief_security_officer");
	const primaryRole = isAdmin ? roles.find((role) => adminRoles.includes(role)) ?? "estate_admin" : isSecurity ? "security_officer" : roles[0] ?? "resident";
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
export { signOut as n, useAuth as r, AuthProvider as t };
