import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DashboardNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id);
      if (!unreadIds.length) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">Latest updates for your account</p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <Link
                key={item.id}
                to={item.link || "/dashboard"}
                className={`block border-b border-border px-4 py-3 transition hover:bg-secondary/30 ${
                  item.read_at ? "" : "bg-accent/25"
                }`}
              >
                <p className="text-sm font-medium">{item.title}</p>
                {item.body && <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </Link>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-muted-foreground">No notifications yet.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
