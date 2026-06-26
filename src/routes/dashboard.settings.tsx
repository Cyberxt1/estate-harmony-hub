import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
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
  const [estateName, setEstateName] = useState("");
  const [estateAddress, setEstateAddress] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const { data: estate } = useQuery({
    queryKey: ["my-estate", profile?.estate_id],
    enabled: !!profile?.estate_id,
    queryFn: async () => {
      const { data } = await supabase.from("estates").select("*").eq("id", profile!.estate_id!).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (estate) {
      setEstateName(estate.name);
      setEstateAddress(estate.address || "");
    }
  }, [estate]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createOrUpdateEstate = useMutation({
    mutationFn: async () => {
      if (profile?.estate_id) {
        const { error } = await supabase
          .from("estates")
          .update({ name: estateName, address: estateAddress })
          .eq("id", profile.estate_id);
        if (error) throw error;
      } else {
        const { data: e, error } = await supabase
          .from("estates")
          .insert({ name: estateName, address: estateAddress })
          .select()
          .single();
        if (error) throw error;
        // Link this user as admin of the new estate
        await supabase.from("profiles").update({ estate_id: e.id }).eq("id", user!.id);
        await supabase.from("user_roles").insert({ user_id: user!.id, estate_id: e.id, role: "estate_admin" });
      }
    },
    onSuccess: () => {
      toast.success("Estate saved");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, estate details, roles and preferences." icon={SettingsIcon} />

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
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>Save profile</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">
            {profile?.estate_id ? "Estate details" : "Create your estate"}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {profile?.estate_id
              ? "Update your estate's name and address."
              : "Set up your estate to unlock properties, residents, visitors and dues. You'll become the estate admin."}
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estate name</Label>
              <Input value={estateName} onChange={(e) => setEstateName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={estateAddress} onChange={(e) => setEstateAddress(e.target.value)} />
            </div>
            <Button
              onClick={() => createOrUpdateEstate.mutate()}
              disabled={!estateName || createOrUpdateEstate.isPending || (!!profile?.estate_id && !isAdmin)}
            >
              {profile?.estate_id ? "Save estate" : "Create estate"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
