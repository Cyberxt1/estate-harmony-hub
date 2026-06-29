import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inviteAdminTeamMember } from "@/lib/admin.functions";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Resident = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">;
type UserRole = Tables<"user_roles">;
type StaffTask = Tables<"staff_tasks">;
type AdminInvitation = Tables<"admin_invitations">;

const manageableRoles: AppRole[] = [
  "estate_admin",
  "community_chairman",
  "community_secretary",
  "treasurer",
  "chief_security_officer",
  "security_officer",
  "security_gateman",
];

function SettingsPage() {
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [estateAddress, setEstateAddress] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("community_secretary");
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [selectedResidentRole, setSelectedResidentRole] = useState<AppRole>("security_officer");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedRole, setTaskAssignedRole] = useState<AppRole>("chief_security_officer");
  const [taskAssignedUserId, setTaskAssignedUserId] = useState("none");
  const [taskDueDate, setTaskDueDate] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const {
    data: estate,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["oyesile-estate", profile?.estate_id],
    enabled: !!profile?.estate_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("estates")
        .select("*")
        .eq("id", profile!.estate_id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["settings-residents", profile?.estate_id],
    enabled: isAdmin && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("estate_id", profile!.estate_id!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Resident[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["settings-user-roles", profile?.estate_id],
    enabled: isAdmin && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("estate_id", profile!.estate_id!);
      if (error) throw error;
      return (data ?? []) as UserRole[];
    },
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["admin-invitations", profile?.estate_id],
    enabled: isAdmin && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invitations")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("invited_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as AdminInvitation[];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["staff-tasks", profile?.estate_id],
    enabled: isAdmin && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_tasks")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as StaffTask[];
    },
  });

  useEffect(() => {
    if (estate) {
      setEstateAddress(estate.address || "");
    }
  }, [estate]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEstateDetails = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
      const { error } = await supabase
        .from("estates")
        .update({ address: estateAddress })
        .eq("id", profile.estate_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oyesile Estate details saved");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteAdmin = useMutation({
    mutationFn: async () => {
      await inviteAdminTeamMember({
        data: {
          email: inviteEmail,
          role: inviteRole,
          redirectTo: `${window.location.origin}/auth`,
        },
      });
    },
    onSuccess: async (result) => {
      toast.success(result.mode === "assigned" ? "Role assigned immediately" : "Invite email sent");
      setInviteEmail("");
      await qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      await qc.invalidateQueries({ queryKey: ["settings-user-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignExistingRole = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("No estate linked.");
      if (!selectedResidentId) throw new Error("Choose a resident first.");
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedResidentId,
        estate_id: profile.estate_id,
        role: selectedResidentRole,
      });
      if (error && !error.message.toLowerCase().includes("duplicate")) throw error;

      const { error: notifyError } = await supabase.from("notifications").insert({
        estate_id: profile.estate_id,
        user_id: selectedResidentId,
        title: "New estate role assigned",
        body: `You have been assigned as ${formatRole(selectedResidentRole)}.`,
        link: "/dashboard/settings",
      });
      if (notifyError) throw notifyError;
    },
    onSuccess: async () => {
      toast.success("Role assigned");
      setSelectedResidentId("");
      await qc.invalidateQueries({ queryKey: ["settings-user-roles"] });
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id || !user?.id) throw new Error("No estate linked.");
      if (!taskTitle.trim()) throw new Error("Enter a task title.");
      const targetUserId = taskAssignedUserId === "none" ? null : taskAssignedUserId;
      const { error } = await supabase.from("staff_tasks").insert({
        estate_id: profile.estate_id,
        created_by: user.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        assigned_role: taskAssignedRole,
        assigned_user_id: targetUserId,
        due_date: taskDueDate || null,
      });
      if (error) throw error;

      if (targetUserId) {
        const { error: notifyError } = await supabase.from("notifications").insert({
          estate_id: profile.estate_id,
          user_id: targetUserId,
          title: "New delegated task",
          body: taskTitle.trim(),
          link: "/dashboard",
        });
        if (notifyError) throw notifyError;
      }
    },
    onSuccess: async () => {
      toast.success("Task delegated");
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignedUserId("none");
      setTaskDueDate("");
      await qc.invalidateQueries({ queryKey: ["staff-tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roleSummary = useMemo(() => {
    const byUser = new Map<string, string[]>();
    roles.forEach((role) => {
      byUser.set(role.user_id, [...(byUser.get(role.user_id) ?? []), formatRole(role.role)]);
    });
    return byUser;
  }, [roles]);

  if (isLoading) return <PageLoading label="Loading settings" onRetry={() => void refetch()} />;
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your profile, Oyesile Estate details, notifications and admin delegation."
        icon={SettingsIcon}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Your profile</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button
              onClick={() => saveProfile.mutate()}
              loading={saveProfile.isPending}
              loadingLabel="Saving profile"
            >
              Save profile
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Oyesile Estate</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This platform is for Oyesile Estate only. New residents are linked to this estate
            automatically after signup.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estate name</Label>
              <Input value={estate?.name || "Oyesile Estate"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={estateAddress}
                onChange={(e) => setEstateAddress(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <Button
              onClick={() => saveEstateDetails.mutate()}
              disabled={!isAdmin || !profile?.estate_id}
              loading={saveEstateDetails.isPending}
              loadingLabel="Saving estate details"
            >
              Save Oyesile details
            </Button>
          </div>
        </section>
      </div>

      {isAdmin && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Invite admin by email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an email invite to the CSO, gateman, secretary or any other estate officer.
            </p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {manageableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => inviteAdmin.mutate()}
                loading={inviteAdmin.isPending}
                loadingLabel="Sending invite"
              >
                Send invite
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Assign role to existing resident</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select
                  value={selectedResidentId || undefined}
                  onValueChange={setSelectedResidentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.full_name || resident.email || resident.phone || "Resident"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedResidentRole}
                  onValueChange={(value) => setSelectedResidentRole(value as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {manageableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => assignExistingRole.mutate()}
                loading={assignExistingRole.isPending}
                loadingLabel="Assigning role"
              >
                Assign role
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Delegate task</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Task title</Label>
                <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign by role</Label>
                <Select
                  value={taskAssignedRole}
                  onValueChange={(value) => setTaskAssignedRole(value as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {manageableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specific person</Label>
                <Select value={taskAssignedUserId} onValueChange={setTaskAssignedUserId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Role only</SelectItem>
                    {residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.full_name || resident.email || resident.phone || "Resident"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
              <Button
                onClick={() => createTask.mutate()}
                loading={createTask.isPending}
                loadingLabel="Saving task"
              >
                Delegate task
              </Button>
            </div>
          </section>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-6 xl:col-span-2">
            <h2 className="font-display text-lg font-semibold">Current admin team</h2>
            <div className="mt-4 space-y-3">
              {residents
                .filter((resident) => roleSummary.has(resident.id))
                .map((resident) => (
                  <div key={resident.id} className="rounded-lg border border-border px-4 py-3">
                    <p className="font-medium">
                      {resident.full_name || resident.email || "Resident"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(roleSummary.get(resident.id) ?? []).join(", ")}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Recent invites</h2>
            <div className="mt-4 space-y-3">
              {invitations.length > 0 ? (
                invitations.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-border px-4 py-3">
                    <p className="font-medium">{invite.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatRole(invite.role)} · {invite.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No invitations yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {isAdmin && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Recent delegated tasks</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.assigned_role ? formatRole(task.assigned_role) : "No role"} ·{" "}
                    {task.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tasks delegated yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function formatRole(role: AppRole | string) {
  return role.replaceAll("_", " ");
}
