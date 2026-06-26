import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oyesile Estate" },
      {
        name: "description",
        content: "The private resident and community officer app for Oyesile Estate.",
      },
      { property: "og:title", content: "Welcome to Oyesile Estate" },
      {
        property: "og:description",
        content: "Sign in to manage dues, visitors, announcements, complaints, security and community records.",
      },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: number | undefined;

    const boot = async () => {
      const userResult = await Promise.race([
        supabase.auth.getUser().catch(() => null),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1800)),
      ]);

      await new Promise((resolve) => window.setTimeout(resolve, 650));

      if (cancelled) return;
      setLeaving(true);

      redirectTimer = window.setTimeout(() => {
        if (cancelled) return;
        void navigate({
          to: userResult?.data.user ? "/dashboard" : "/auth",
          replace: true,
        });
      }, 280);
    };

    void boot();

    return () => {
      cancelled = true;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <main
      className={`grid min-h-screen place-items-center bg-background px-6 transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Building2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
          Welcome to Oyesile Estate
        </h1>
        <div className="mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[splash-progress_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </main>
  );
}
