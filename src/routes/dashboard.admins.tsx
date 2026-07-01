import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Phone, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/admins")({
  component: AdminDirectoryPage,
});

function AdminDirectoryPage() {
  const {
    data: admins = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-directory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_estate_admin_directory");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <PageLoading label="Loading your estate administrators" onRetry={() => void refetch()} />
    );
  }
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Know your admins"
        description="The people currently serving Oyesile Estate."
        icon={UsersRound}
      />

      {admins.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {admins.map((admin) => (
            <article
              key={`${admin.id}-${admin.role}`}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="grid min-h-52 place-items-center bg-gradient-to-br from-accent/70 to-secondary/40 p-5">
                <Avatar className="h-36 w-36 border-4 border-background shadow-md">
                  <AvatarImage
                    src={admin.avatar_url || undefined}
                    alt={admin.full_name || formatRole(admin.role)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-3xl font-semibold text-primary-foreground">
                    {getInitials(admin.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="p-4">
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {formatRole(admin.role)}
                </Badge>
                <h2 className="mt-3 font-display text-lg font-semibold">
                  {admin.full_name || "Name not added"}
                </h2>
                {admin.phone && (
                  <a
                    href={`tel:${admin.phone}`}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {admin.phone}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Admin profiles are being prepared"
          description="The current estate administrators will appear here once their positions and photographs are complete."
        />
      )}
    </div>
  );
}

function getInitials(name: string | null) {
  return (name || "OA")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    community_chairman: "Chairman",
    community_secretary: "Secretary",
    treasurer: "Treasurer",
    chief_security_officer: "Chief Security Officer",
  };
  return labels[role] ?? role.replaceAll("_", " ");
}
