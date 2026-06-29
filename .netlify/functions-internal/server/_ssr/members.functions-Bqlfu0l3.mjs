import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
import { t as createServerRpc } from "./createServerRpc-TAUNrjZd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/members.functions-Bqlfu0l3.js
var memberAdminRoles = /* @__PURE__ */ new Set([
	"community_chairman",
	"community_secretary",
	"chief_security_officer",
	"estate_admin",
	"super_admin"
]);
var removeCommunityMember_createServerFn_handler = createServerRpc({
	id: "3d3e332faf33a8bfa78ec415f3035f866c74e32115a35a146c03e0c735f874aa",
	name: "removeCommunityMember",
	filename: "src/lib/members.functions.ts"
}, (opts) => removeCommunityMember.__executeServer(opts));
var removeCommunityMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.memberId) throw new Error("Choose a member to remove.");
	return input;
}).handler(removeCommunityMember_createServerFn_handler, async ({ data, context }) => {
	if (data.memberId === context.userId) throw new Error("You cannot remove your own account.");
	const [{ data: roles }, { data: member }] = await Promise.all([context.supabase.from("user_roles").select("role, estate_id").eq("user_id", context.userId), context.supabase.from("profiles").select("estate_id").eq("id", data.memberId).single()]);
	if (!(roles ?? []).some((role) => memberAdminRoles.has(role.role) && (role.role === "super_admin" || role.estate_id === member?.estate_id)) || !member) throw new Error("You do not have permission to remove this member.");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.auth.admin.deleteUser(data.memberId);
	if (error) throw error;
	return { removed: true };
});
//#endregion
export { removeCommunityMember_createServerFn_handler };
