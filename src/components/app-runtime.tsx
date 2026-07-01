import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const FALLBACK_REFRESH_MS = 60_000;

export function AppRuntime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    registerSW({ immediate: true });
  }, []);

  useEffect(() => {
    if (!user) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshVisibleData = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;

      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ refetchType: "active" });
      }, 250);
    };

    const channel = supabase
      .channel(`oyesile-live-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public" }, refreshVisibleData)
      .subscribe();

    const fallbackRefresh = window.setInterval(refreshVisibleData, FALLBACK_REFRESH_MS);
    window.addEventListener("online", refreshVisibleData);
    document.addEventListener("visibilitychange", refreshVisibleData);

    return () => {
      clearTimeout(refreshTimer);
      window.clearInterval(fallbackRefresh);
      window.removeEventListener("online", refreshVisibleData);
      document.removeEventListener("visibilitychange", refreshVisibleData);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  return null;
}
