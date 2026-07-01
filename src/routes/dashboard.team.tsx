import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, UserCog, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { inviteAdminTeamMember, promoteResidentToAdminPosition } from "@/lib/admin.functions";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/team")({
  component: AdminTeamPage,
});

type TeamProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "phone" | "resident_type"
>;
type TeamRole = Pick<Tables<"user_roles">, "user_id" | "role">;
type Invitation = Tables<"admin_invitations">;

const inviteRoles: AppRole[] = [
  "community_secretary",
  "treasurer",
  "chief_security_officer",
  "security_gateman",
];

const officeRoles: AppRole[] = [
  "community_chairman",
  "chief_security_officer",
  "community_secretary",
  "treasurer",
];
const promotionRoles: AppRole[] = ["chief_security_officer", "community_secretary", "treasurer"];

function AdminTeamPage() {
  const { profile, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("community_secretary");
  const [promoteMemberId, setPromoteMemberId] = useState("");
  const [promoteRole, setPromoteRole] = useState<AppRole>("community_secretary");
  const isChairman = hasRole("community_chairman");
  const isCso = hasRole("chief_security_officer");
  const canManageOffice = isChairman;
  const canManageGatemen = isChairman || isCso;
  const availableInviteRoles = canManageOffice ? inviteRoles : (["security_gateman"] as AppRole[]);

  useEffect(() => {
    if (!canManageOffice && role !== "security_gateman") {
      setRole("security_gateman");
    }
  }, [canManageOffice, role]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-team", profile?.estate_id],
    enabled: canManageGatemen && Boolean(profile?.estate_id),
    queryFn: async () => {
      const [profilesResult, rolesResult, invitesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone, resident_type")
          .eq("estate_id", profile!.estate_id!),
        supabase.from("user_roles").select("user_id, role").eq("estate_id", profile!.estate_id!),
        supabase
          .from("admin_invitations")
          .select("*")
          .eq("estate_id", profile!.estate_id!)
          .order("invited_at", { ascending: false })
          .limit(12),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (invitesResult.error) throw invitesResult.error;
      return {
        profiles: (profilesResult.data ?? []) as TeamProfile[],
        roles: (rolesResult.data ?? []) as TeamRole[],
        invitations: (invitesResult.data ?? []) as Invitation[],
      };
    },
  });

  const invite = useMutation({
    mutationFn: () =>
      inviteAdminTeamMember({
        data: {
          email,
          role,
          redirectTo: `${window.location.origin}/auth`,
        },
      }),
    onSuccess: async () => {
      toast.success("Invitation sent");
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const promote = useMutation({
    mutationFn: () =>
      promoteResidentToAdminPosition({
        data: {
          memberId: promoteMemberId,
          role: promoteRole,
        },
      }),
    onSuccess: async (result) => {
      toast.success(`${result.memberName} is now ${formatRole(result.role)}.`);
      setPromoteMemberId("");
      setPromoteRole("community_secretary");
      await queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!canManageGatemen) {
    return (
      <div className="grid min-h-[28vh] place-items-center px-5 text-center">
        <div className="max-w-md rounded-lg border border-border bg-card p-5">
          <h1 className="font-display text-lg font-semibold">Chairman or CSO access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The chairman manages the office team, and the CSO manages gatemen.
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) return <PageLoading label="Loading admin team" onRetry={() => void refetch()} />;
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  const profileById = new Map(data?.profiles.map((member) => [member.id, member]) ?? []);
  const officeTeam = officeRoles.map((officeRole) => {
    const assignment = data?.roles.find((item) => item.role === officeRole);
    return { role: officeRole, member: assignment ? profileById.get(assignment.user_id) : null };
  });
  const occupiedAdminIds = new Set(
    data?.roles
      .filter((item) =>
        [
          "community_chairman",
          "chief_security_officer",
          "community_secretary",
          "treasurer",
          "security_gateman",
          "estate_admin",
          "super_admin",
        ].includes(item.role),
      )
      .map((item) => item.user_id) ?? [],
  );
  const gatemen =
    data?.roles
      .filter((item) => item.role === "security_gateman")
      .map((item) => profileById.get(item.user_id))
      .filter((member): member is TeamProfile => Boolean(member)) ?? [];
  const landlordCandidates =
    data?.profiles.filter(
      (member) => member.resident_type === "landlord" && !occupiedAdminIds.has(member.id),
    ) ?? [];

  return (
    <div>
      <PageHeader
        title="Admin team"
        description={
          canManageOffice
            ? "The office roles and the gatemen who operate the estate gate."
            : "Gate staff records and gateman invitations managed by the CSO."
        }
        icon={UserCog}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Office administrators</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {officeTeam.map((item) => (
                <div key={item.role} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {formatRole(item.role)}
                  </p>
                  <p className="mt-2 font-medium">
                    {item.member?.full_name || item.member?.email || "Position not filled"}
                  </p>
                  {item.member?.phone && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.member.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Gatemen</h2>
            </div>
            {gatemen.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {gatemen.map((member) => (
                  <div key={member.id} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-medium">{member.full_name || member.email || "Gateman"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.phone || member.email || "No contact added"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                No gateman has been added yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <h2 className="font-display text-lg font-semibold">
                {canManageOffice ? "Invite team member" : "Invite gateman"}
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {canManageOffice
                ? "Chairman can invite the secretary, treasurer, CSO and gatemen."
                : "CSO can invite and manage gatemen only."}
            </p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInviteRoles.map((item) => (
                      <SelectItem key={item} value={item}>
                        {formatRole(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!email.trim()}
                onClick={() => invite.mutate()}
                loading={invite.isPending}
                loadingLabel="Sending invitation"
              >
                Send invitation
              </Button>
            </div>
          </section>

          {canManageOffice && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">Promote landlord to admin</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Move an existing landlord resident directly into an office admin position.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Landlord resident</Label>
                  <Select value={promoteMemberId} onValueChange={setPromoteMemberId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          landlordCandidates.length
                            ? "Choose a landlord resident"
                            : "No landlord resident available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {landlordCandidates.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email || "Landlord resident"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin position</Label>
                  <Select
                    value={promoteRole}
                    onValueChange={(value) => setPromoteRole(value as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {promotionRoles.map((item) => (
                        <SelectItem key={item} value={item}>
                          {formatRole(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!promoteMemberId}
                  onClick={() => promote.mutate()}
                  loading={promote.isPending}
                  loadingLabel="Promoting resident"
                >
                  Promote resident
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-base font-semibold">Recent invitations</h2>
            <div className="mt-3 space-y-3">
              {data?.invitations.length ? (
                data.invitations.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <p className="truncate text-sm font-medium">{item.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRole(item.role)} · {item.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatRole(role: AppRole | string) {
  const labels: Record<string, string> = {
    community_chairman: "Chairman",
    chief_security_officer: "Chief Security Officer",
    community_secretary: "Secretary",
    treasurer: "Treasurer",
    security_gateman: "Gateman",
  };
  return labels[role] ?? role.replaceAll("_", " ");
}
