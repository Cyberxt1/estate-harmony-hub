import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as createServerRpc } from "./createServerRpc-TAUNrjZd.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-Bc3h4NTn.js
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
var inviteAdminTeamMember_createServerFn_handler = createServerRpc({
	id: "ca653b3af0d1d953fbf46f37d354eb2d3ee6da0a16e71148f7aca5eb9baf1e9c",
	name: "inviteAdminTeamMember",
	filename: "src/lib/admin.functions.ts"
}, (opts) => inviteAdminTeamMember.__executeServer(opts));
var inviteAdminTeamMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.email?.trim()) throw new Error("Enter an email address.");
	if (!canManageRole(input.role)) throw new Error("Choose a valid role.");
	return input;
}).handler(inviteAdminTeamMember_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: profile, error: profileError } = await context.supabase.from("profiles").select("estate_id, full_name, email").eq("id", context.userId).single();
	if (profileError || !profile?.estate_id) throw new Error("Your account is not linked to the estate.");
	const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id, email").eq("estate_id", profile.estate_id).ilike("email", data.email.trim()).maybeSingle();
	if (existingProfile?.id) {
		const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
			user_id: existingProfile.id,
			estate_id: profile.estate_id,
			role: data.role
		}, {
			onConflict: "user_id,estate_id,role",
			ignoreDuplicates: true
		});
		if (roleError) throw roleError;
		await supabaseAdmin.from("notifications").insert({
			estate_id: profile.estate_id,
			user_id: existingProfile.id,
			title: "New estate role assigned",
			body: `You have been added as ${formatRole(data.role)} in Oyesile Estate.`,
			link: "/dashboard/settings"
		});
		return { mode: "assigned" };
	}
	const redirectTo = data.redirectTo?.trim() || void 0;
	const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email.trim(), {
		redirectTo,
		data: {
			estate_name: "Oyesile Estate",
			invited_role: data.role
		}
	});
	if (inviteError) throw inviteError;
	const { error: rowError } = await supabaseAdmin.from("admin_invitations").upsert({
		estate_id: profile.estate_id,
		email: data.email.trim().toLowerCase(),
		role: data.role,
		invited_by: context.userId,
		note: data.note?.trim() || null,
		status: "pending"
	}, { onConflict: "estate_id,email,role" });
	if (rowError) throw rowError;
	return { mode: "invited" };
});
var claimPendingAdminInvitations_createServerFn_handler = createServerRpc({
	id: "7f132d13beebc62da4ca0b48ff2c5c20920577788526eddc57d4df6f412efc40",
	name: "claimPendingAdminInvitations",
	filename: "src/lib/admin.functions.ts"
}, (opts) => claimPendingAdminInvitations.__executeServer(opts));
var claimPendingAdminInvitations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(claimPendingAdminInvitations_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: profile, error: profileError } = await context.supabase.from("profiles").select("id, estate_id, email").eq("id", context.userId).single();
	if (profileError || !profile?.estate_id || !profile.email) return { claimed: 0 };
	const { data: pending, error: pendingError } = await supabaseAdmin.from("admin_invitations").select("*").eq("estate_id", profile.estate_id).eq("status", "pending").ilike("email", profile.email);
	if (pendingError || !pending?.length) return { claimed: 0 };
	for (const invite of pending) {
		const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
			user_id: profile.id,
			estate_id: profile.estate_id,
			role: invite.role
		}, {
			onConflict: "user_id,estate_id,role",
			ignoreDuplicates: true
		});
		if (roleError) throw roleError;
		const { error: updateError } = await supabaseAdmin.from("admin_invitations").update({
			status: "accepted",
			user_id: profile.id,
			accepted_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", invite.id);
		if (updateError) throw updateError;
	}
	return { claimed: pending.length };
});
function formatRole(role) {
	return role.replaceAll("_", " ");
}
//#endregion
export { claimPendingAdminInvitations_createServerFn_handler, inviteAdminTeamMember_createServerFn_handler };
