import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [estateAddress, setEstateAddress] = useState("");

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

  if (isLoading) {
    return <PageLoading label="Loading settings" onRetry={() => void refetch()} />;
  }
  if (isError) {
    return <PageLoadError onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your profile, Oyesile Estate details, roles and preferences."
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
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
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
              disabled={!isAdmin || !profile?.estate_id || saveEstateDetails.isPending}
            >
              Save Oyesile details
            </Button>
            {!profile?.estate_id && (
              <p className="text-xs text-muted-foreground">
                Your account is not linked to Oyesile Estate yet. Ask an admin to review the account
                or run the fixed-estate migration.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
