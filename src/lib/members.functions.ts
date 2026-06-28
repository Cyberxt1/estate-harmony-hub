import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const memberAdminRoles = new Set([
  "community_chairman",
  "community_secretary",
  "chief_security_officer",
  "estate_admin",
  "super_admin",
]);

export const removeCommunityMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { memberId: string }) => {
    if (!input.memberId) throw new Error("Choose a member to remove.");
    return input;
  })
  .handler(async ({ data, context }) => {
    if (data.memberId === context.userId) throw new Error("You cannot remove your own account.");

    const [{ data: roles }, { data: member }] = await Promise.all([
      context.supabase.from("user_roles").select("role, estate_id").eq("user_id", context.userId),
      context.supabase.from("profiles").select("estate_id").eq("id", data.memberId).single(),
    ]);

    const permitted = (roles ?? []).some(
      (role) =>
        memberAdminRoles.has(role.role) &&
        (role.role === "super_admin" || role.estate_id === member?.estate_id),
    );
    if (!permitted || !member) throw new Error("You do not have permission to remove this member.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.memberId);
    if (error) throw error;
    return { removed: true };
  });
