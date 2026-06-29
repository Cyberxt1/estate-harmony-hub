import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/announcements")({
  component: AnnouncementsPage,
});

type Announcement = Tables<"announcements">;
type Audience = "all" | "tenant" | "landlord" | "selected";
type Member = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "resident_type">;

function AnnouncementsPage() {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const {
    data: announcements = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["announcements", profile?.estate_id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
  } = useQuery({
    queryKey: ["announcement-members", profile?.estate_id],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, resident_type")
        .eq("estate_id", profile!.estate_id!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id)
        throw new Error("Your account is not linked to the estate.");
      if (!title.trim() || !body.trim()) throw new Error("Add a title and message.");
      if (audience === "selected" && selectedMemberIds.length === 0) {
        throw new Error("Select at least one member.");
      }

      const { data: announcement, error } = await supabase
        .from("announcements")
        .insert({
          estate_id: profile.estate_id,
          author_id: user.id,
          title: title.trim(),
          body: body.trim(),
          audience,
        })
        .select()
        .single();
      if (error) throw error;

      if (audience === "selected") {
        const { error: recipientError } = await supabase.from("announcement_recipients").insert(
          selectedMemberIds.map((memberId) => ({
            announcement_id: announcement.id,
            user_id: memberId,
          })),
        );
        if (recipientError) {
          await supabase.from("announcements").delete().eq("id", announcement.id);
          throw recipientError;
        }
      }
    },
    onSuccess: async () => {
      toast.success("Announcement published");
      setCreateOpen(false);
      setTitle("");
      setBody("");
      setAudience("all");
      setSelectedMemberIds([]);
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAnnouncement = useMutation({
    mutationFn: async (announcement: Announcement) => {
      const { error } = await supabase.from("announcements").delete().eq("id", announcement.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Announcement deleted");
      setAnnouncementToDelete(null);
      setSelectedAnnouncement(null);
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        description={
          isAdmin
            ? "Send notices to everyone or to the exact group that needs them."
            : "Community notices meant for you."
        }
        icon={Megaphone}
      >
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New announcement
          </Button>
        )}
      </PageHeader>

      {isError || (isAdmin && membersError) ? (
        <PageLoadError onRetry={() => void queryClient.refetchQueries()} />
      ) : isLoading || (isAdmin && membersLoading) ? (
        <PageLoading
          label="Loading announcements"
          onRetry={() => void queryClient.refetchQueries()}
        />
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <button
              key={announcement.id}
              type="button"
              className="w-full rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
              onClick={() => setSelectedAnnouncement(announcement)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">{announcement.title}</h2>
                {isAdmin && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
                    {formatAudience(announcement.audience)}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {announcement.body}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {announcement.published_at
                  ? new Date(announcement.published_at).toLocaleString()
                  : ""}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No announcements"
          description={
            isAdmin
              ? "Publish a notice when the community needs an update."
              : "There are no new notices for you."
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>
              Only the audience you choose will see this notice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Who should see this?</Label>
              <Select value={audience} onValueChange={(value) => setAudience(value as Audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="tenant">All tenants</SelectItem>
                  <SelectItem value="landlord">All landlords</SelectItem>
                  <SelectItem value="selected">Selected members</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience === "selected" && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {members.map((member) => {
                  const checked = selectedMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          setSelectedMemberIds(
                            next
                              ? [...selectedMemberIds, member.id]
                              : selectedMemberIds.filter((id) => id !== member.id),
                          )
                        }
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium">
                          {member.full_name || member.email || "Member"}
                        </span>
                        <span className="block text-xs capitalize text-muted-foreground">
                          {member.resident_type || "Member"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createAnnouncement.mutate()}
              loading={createAnnouncement.isPending}
              loadingLabel="Publishing announcement"
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedAnnouncement)}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title || "Announcement"}</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement?.published_at
                ? new Date(selectedAnnouncement.published_at).toLocaleString()
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-5">
              <p className="whitespace-pre-wrap text-sm leading-6">{selectedAnnouncement.body}</p>
              {isAdmin && (
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    Sent to {formatAudience(selectedAnnouncement.audience).toLowerCase()}
                  </span>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setAnnouncementToDelete(selectedAnnouncement)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(announcementToDelete)}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear for everyone who received it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                announcementToDelete && removeAnnouncement.mutate(announcementToDelete)
              }
            >
              Delete announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatAudience(audience: string) {
  const labels: Record<string, string> = {
    all: "Everyone",
    tenant: "All tenants",
    landlord: "All landlords",
    selected: "Selected members",
  };
  return labels[audience] || "Everyone";
}
