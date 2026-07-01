import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Library, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/documents")({
  component: DocumentsPage,
});

const categories = [
  { value: "bylaws", label: "Estate bylaws" },
  { value: "policy", label: "Policy" },
  { value: "meeting_minutes", label: "Meeting minutes" },
  { value: "notice", label: "Official notice" },
  { value: "other", label: "Other" },
] as const;

function DocumentsPage() {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("bylaws");
  const [file, setFile] = useState<File | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["documents", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("scope", "estate")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) {
        throw new Error("Your account is not linked to Oyesile Estate.");
      }
      if (!name.trim()) throw new Error("Enter a document title.");
      if (!file) throw new Error("Choose a document to upload.");
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        throw new Error("Upload a PDF or Microsoft Word document.");
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("The document must be smaller than 10 MB.");
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${profile.estate_id}/${crypto.randomUUID()}-${safeFileName}`;
      const { error: storageError } = await supabase.storage
        .from("estate-documents")
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (storageError) throw storageError;

      const { error: recordError } = await supabase.from("documents").insert({
        estate_id: profile.estate_id,
        uploaded_by: user.id,
        name: name.trim(),
        category,
        scope: "estate",
        file_url: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
      });

      if (recordError) {
        await supabase.storage.from("estate-documents").remove([storagePath]);
        throw recordError;
      }
    },
    onSuccess: async () => {
      toast.success("Document uploaded");
      setName("");
      setCategory("bylaws");
      setFile(null);
      const input = document.getElementById("estate-document") as HTMLInputElement | null;
      if (input) input.value = "";
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: Tables<"documents">) => {
      const { error: recordError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);
      if (recordError) throw recordError;

      if (!document.file_url.startsWith("http")) {
        const { error: storageError } = await supabase.storage
          .from("estate-documents")
          .remove([document.file_url]);
        if (storageError) throw storageError;
      }
    },
    onSuccess: async () => {
      toast.success("Document removed");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openDocument = async (document: Tables<"documents">) => {
    setOpeningId(document.id);
    try {
      let url = document.file_url;
      if (!url.startsWith("http")) {
        const { data, error } = await supabase.storage
          .from("estate-documents")
          .createSignedUrl(url, 120);
        if (error) throw error;
        url = data.signedUrl;
      }

      const link = window.document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be opened.");
    } finally {
      setOpeningId(null);
    }
  };

  if (isLoading) {
    return <PageLoading label="Loading estate documents" onRetry={() => void refetch()} />;
  }
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Oyesile Estate bylaws, policies, minutes and official notices."
        icon={Library}
      />

      {isAdmin && (
        <section className="mb-5 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Upload estate document</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Residents will see the document in this library immediately.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="document-name">Document title</Label>
              <Input
                id="document-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Oyesile Estate Bylaws 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="estate-document">Choose file</Label>
              <Input
                id="estate-document"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">PDF or Word document, up to 10 MB.</p>
            </div>
          </div>

          <Button
            className="mt-4"
            disabled={!name.trim() || !file}
            onClick={() => uploadDocument.mutate()}
            loading={uploadDocument.isPending}
            loadingLabel="Uploading document"
          >
            <Upload />
            Upload document
          </Button>
        </section>
      )}

      {documents.length ? (
        <div className="grid gap-3">
          {documents.map((document) => (
            <article
              key={document.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{document.name}</h2>
                  <Badge variant="secondary">{formatCategory(document.category)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatFileSize(document.size_bytes)} · Added{" "}
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void openDocument(document)}
                  loading={openingId === document.id}
                  loadingLabel="Opening document"
                >
                  <Download />
                  Open
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${document.name}`}
                    disabled={deleteDocument.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove “${document.name}” from the library?`)) {
                        deleteDocument.mutate(document);
                      }
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No estate documents yet"
          description={
            isAdmin
              ? "Upload the first bylaw, policy, meeting minute or official notice."
              : "Estate bylaws and other official documents will appear here once an administrator uploads them."
          }
        />
      )}
    </div>
  );
}

function formatCategory(category: string | null) {
  return categories.find((item) => item.value === category)?.label ?? "Estate document";
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "File";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
