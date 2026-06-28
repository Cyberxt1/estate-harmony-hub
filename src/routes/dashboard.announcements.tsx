import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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

function AnnouncementsPage() {
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
      const { error } = await supabase.from("announcements").insert({
        estate_id: profile.estate_id,
        author_id: user.id,
        title,
        body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement published");
      setOpen(false);
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (announcement: Announcement) => {
      const { error } = await supabase.from("announcements").delete().eq("id", announcement.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Announcement deleted");
      setAnnouncementToDelete(null);
      setSelectedAnnouncement(null);
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader title="Announcements" description="Broadcast notices, updates and emergency alerts." icon={Megaphone}>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!title || !body || create.isPending}>
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((a) => (
            <article
              key={a.id}
              className="cursor-pointer rounded-md border border-border bg-card p-5 transition hover:bg-secondary/30"
              onClick={() => setSelectedAnnouncement(a)}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">{a.priority}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {a.published_at ? new Date(a.published_at).toLocaleString() : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No announcements yet" description="Admins can post estate-wide notices here." />
      )}

      <Dialog open={!!selectedAnnouncement} onOpenChange={(nextOpen) => !nextOpen && setSelectedAnnouncement(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title || "Announcement"}</DialogTitle>
            <DialogDescription>Expanded estate announcement.</DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-secondary/20 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Priority</p>
                <p className="mt-1 text-sm capitalize">{selectedAnnouncement.priority}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/20 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Message</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{selectedAnnouncement.body}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/20 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Published</p>
                <p className="mt-1 text-sm">
                  {selectedAnnouncement.published_at ? new Date(selectedAnnouncement.published_at).toLocaleString() : "Not provided"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setAnnouncementToDelete(selectedAnnouncement)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete announcement
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
              It will disappear for everyone in the community. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep announcement</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => announcementToDelete && remove.mutate(announcementToDelete)}
            >
              Delete announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
