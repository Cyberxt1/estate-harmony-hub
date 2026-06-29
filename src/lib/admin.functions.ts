import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type InviteRole = Database["public"]["Enums"]["app_role"];

function canManageRole(role: InviteRole) {
  return [
    "estate_admin",
    "community_chairman",
    "community_secretary",
    "treasurer",
    "chief_security_officer",
    "security_officer",
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

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("estate_id", profile.estate_id)
      .ilike("email", data.email.trim())
      .maybeSingle();

    if (existingProfile?.id) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
        {
          user_id: existingProfile.id,
          estate_id: profile.estate_id,
          role: data.role,
        },
        { onConflict: "user_id,estate_id,role", ignoreDuplicates: true },
      );
      if (roleError) throw roleError;

      await supabaseAdmin.from("notifications").insert({
        estate_id: profile.estate_id,
        user_id: existingProfile.id,
        title: "New estate role assigned",
        body: `You have been added as ${formatRole(data.role)} in Oyesile Estate.`,
        link: "/dashboard/settings",
      });

      return { mode: "assigned" as const };
    }

    const redirectTo = data.redirectTo?.trim() || undefined;

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email.trim(),
      {
        redirectTo,
        data: {
          estate_name: "Oyesile Estate",
          invited_role: data.role,
        },
      },
    );
    if (inviteError) throw inviteError;

    const { error: rowError } = await supabaseAdmin.from("admin_invitations").upsert(
      {
        estate_id: profile.estate_id,
        email: data.email.trim().toLowerCase(),
        role: data.role,
        invited_by: context.userId,
        note: data.note?.trim() || null,
        status: "pending",
      },
      { onConflict: "estate_id,email,role" },
    );

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
