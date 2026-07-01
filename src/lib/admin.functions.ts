import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type InviteRole = Database["public"]["Enums"]["app_role"];

function canManageRole(role: InviteRole) {
  return [
    "community_secretary",
    "treasurer",
    "chief_security_officer",
    "security_gateman",
  ].includes(role);
}

export const inviteAdminTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      email: string;
      role: InviteRole;
      redirectTo?: string | null;
      note?: string | null;
    }) => {
      if (!input.email?.trim()) throw new Error("Enter an email address.");
      if (!canManageRole(input.role)) throw new Error("Choose a valid role.");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("estate_id, full_name, email")
      .eq("id", context.userId)
      .single();

    if (profileError || !profile?.estate_id)
      throw new Error("Your account is not linked to the estate.");

    const { data: currentRoles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("estate_id", profile.estate_id)
      .in("role", ["community_chairman", "chief_security_officer"]);

    if (rolesError) {
      throw rolesError;
    }

    const isChairman = (currentRoles ?? []).some((item) => item.role === "community_chairman");
    const isCso = (currentRoles ?? []).some((item) => item.role === "chief_security_officer");

    if (!isChairman && !isCso) {
      throw new Error("Only the chairman or CSO can manage the admin team.");
    }

    if (!isChairman && data.role !== "security_gateman") {
      throw new Error("The CSO can only manage gatemen.");
    }

    if (data.role !== "security_gateman") {
      const [{ data: assignedRole }, { data: pendingInvite }] = await Promise.all([
        supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("estate_id", profile.estate_id)
          .eq("role", data.role)
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from("admin_invitations")
          .select("id")
          .eq("estate_id", profile.estate_id)
          .eq("role", data.role)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle(),
      ]);

      if (assignedRole) throw new Error(`The ${formatRole(data.role)} position is already filled.`);
      if (pendingInvite) {
        throw new Error(
          `An invitation for the ${formatRole(data.role)} position is already pending.`,
        );
      }
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("estate_id", profile.estate_id)
      .ilike("email", data.email.trim())
      .maybeSingle();

    if (existingProfile?.id) {
      throw new Error(
        "This email already belongs to a resident account. Administrators and gatemen must use separate staff accounts.",
      );
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const redirectTo = data.redirectTo?.trim() || undefined;

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo,
        data: {
          estate_name: "Oyesile Estate",
          invited_role: data.role,
        },
      },
    );
    if (inviteError) throw inviteError;

    const { data: existingInvite, error: existingInviteError } = await supabaseAdmin
      .from("admin_invitations")
      .select("id")
      .eq("estate_id", profile.estate_id)
      .eq("role", data.role)
      .eq("status", "pending")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingInviteError) throw existingInviteError;

    const invitationPayload = {
      estate_id: profile.estate_id,
      email: normalizedEmail,
      role: data.role,
      invited_by: context.userId,
      note: data.note?.trim() || null,
      status: "pending",
    };

    const { error: rowError } = existingInvite
      ? await supabaseAdmin
          .from("admin_invitations")
          .update({
            ...invitationPayload,
            invited_at: new Date().toISOString(),
            accepted_at: null,
            user_id: null,
          })
          .eq("id", existingInvite.id)
      : await supabaseAdmin.from("admin_invitations").insert(invitationPayload);

    if (rowError) throw rowError;

    return { mode: "invited" as const };
  });

export const claimPendingAdminInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, estate_id, email")
      .eq("id", context.userId)
      .single();

    if (profileError || !profile?.estate_id || !profile.email) return { claimed: 0 };

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("admin_invitations")
      .select("*")
      .eq("estate_id", profile.estate_id)
      .eq("status", "pending")
      .ilike("email", profile.email);

    if (pendingError || !pending?.length) return { claimed: 0 };

    for (const invite of pending) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
        {
          user_id: profile.id,
          estate_id: profile.estate_id,
          role: invite.role,
        },
        { onConflict: "user_id,estate_id,role", ignoreDuplicates: true },
      );

      if (roleError) throw roleError;

      const { error: residentRoleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", profile.id)
        .eq("estate_id", profile.estate_id)
        .eq("role", "resident");

      if (residentRoleError) throw residentRoleError;

      const { error: updateError } = await supabaseAdmin
        .from("admin_invitations")
        .update({
          status: "accepted",
          user_id: profile.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      if (updateError) throw updateError;
    }

    return { claimed: pending.length };
  });

function formatRole(role: InviteRole) {
  return role.replaceAll("_", " ");
}
