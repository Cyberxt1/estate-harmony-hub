import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, LogIn, LogOut, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/visitor-log")({
  component: VisitorLogPage,
});

type Visitor = Tables<"visitors">;
type LogTab = "inside" | "left" | "never";

function VisitorLogPage() {
  const { profile, hasRole } = useAuth();
  const [tab, setTab] = useState<LogTab>("inside");
  const gateman = hasRole("security_gateman");
  const {
    data: visitors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["gate-visitors", profile?.estate_id],
    enabled: gateman && Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("estate_id", profile!.estate_id!)
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data ?? []) as Visitor[];
    },
  });

  const groups = useMemo(
    () => ({
      inside: visitors.filter((visitor) => visitor.status === "checked_in"),
      left: visitors.filter((visitor) => visitor.status === "checked_out"),
      never: visitors.filter((visitor) =>
        ["expected", "expired", "denied"].includes(visitor.status),
      ),
    }),
    [visitors],
  );

  if (!gateman) {
    return (
      <div className="grid min-h-[28vh] place-items-center text-center">
        <div className="rounded-lg border border-border bg-card p-5">
          <h1 className="font-display text-lg font-semibold">Gateman access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This visitor log is reserved for the estate gate team.
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) return <PageLoading label="Loading visitor log" onRetry={() => void refetch()} />;
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Visitor log"
        description="See who is inside, who has left, and who never arrived."
        icon={ClipboardList}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary icon={LogIn} label="Still inside" value={groups.inside.length} />
        <Summary icon={LogOut} label="Came and left" value={groups.left.length} />
        <Summary icon={UserX} label="Never came" value={groups.never.length} />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as LogTab)}>
        <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 p-1 sm:w-[520px]">
          <TabsTrigger value="inside">Still inside</TabsTrigger>
          <TabsTrigger value="left">Came and left</TabsTrigger>
          <TabsTrigger value="never">Never came</TabsTrigger>
        </TabsList>
        {(["inside", "left", "never"] as LogTab[]).map((group) => (
          <TabsContent key={group} value={group} className="mt-0">
            <VisitorTable visitors={groups[group]} group={group} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LogIn;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function VisitorTable({ visitors, group }: { visitors: Visitor[]; group: LogTab }) {
  if (!visitors.length) {
    return (
      <EmptyState
        title="No visitors here"
        description={
          group === "inside"
            ? "Visitors who check in will appear here until they leave."
            : group === "left"
              ? "Visitors who have checked out will appear here."
              : "Unused, expired, or denied visitor invitations will appear here."
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Visitor</th>
            <th className="px-4 py-3">Purpose</th>
            <th className="px-4 py-3">Expected</th>
            <th className="px-4 py-3">Checked in</th>
            <th className="px-4 py-3">Checked out</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor) => (
            <tr key={visitor.id} className="border-t border-border">
              <td className="px-4 py-3">
                <p className="font-medium">{visitor.full_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{visitor.phone || "-"}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{visitor.purpose || "-"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatTime(visitor.expected_at)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatTime(visitor.checked_in_at)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatTime(visitor.checked_out_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}
