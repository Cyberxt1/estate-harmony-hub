import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ImagePlus, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, isAdmin, hasRole, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [estateAddress, setEstateAddress] = useState("");
  const [manualPaymentEnabled, setManualPaymentEnabled] = useState(false);
  const [manualAccountName, setManualAccountName] = useState("");
  const [manualAccountNumber, setManualAccountNumber] = useState("");
  const [manualBankName, setManualBankName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const canManageDuesSettings =
    hasRole("community_chairman") ||
    hasRole("treasurer") ||
    hasRole("chief_security_officer") ||
    hasRole("estate_admin") ||
    hasRole("super_admin");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
  }, [profile]);

  const {
    data: estate,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["oyesile-estate", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estates")
        .select("*")
        .eq("id", profile!.estate_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (estate) setEstateAddress(estate.address || "");
    setManualPaymentEnabled(Boolean(estate?.manual_payment_enabled));
    setManualAccountName(estate?.manual_account_name || "");
    setManualAccountNumber(estate?.manual_account_number || "");
    setManualBankName(estate?.manual_bank_name || "");
  }, [estate]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in again.");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadProfilePhoto = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in again.");
      if (!profilePhoto) throw new Error("Choose a photograph first.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(profilePhoto.type)) {
        throw new Error("Use a JPG, PNG or WebP image.");
      }
      if (profilePhoto.size > 5 * 1024 * 1024) {
        throw new Error("The photograph must be smaller than 5 MB.");
      }

      const storagePath = `${user.id}/profile-image`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(storagePath, profilePhoto, {
          upsert: true,
          contentType: profilePhoto.type,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("profile-images").getPublicUrl(storagePath);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      toast.success("Profile photograph updated");
      setProfilePhoto(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-directory"] });
      await refreshAuth();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveEstateDetails = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate.");
      if (
        canManageDuesSettings &&
        manualPaymentEnabled &&
        (!manualAccountName.trim() || !manualAccountNumber.trim())
      ) {
        throw new Error("Add the account name and account number before enabling manual payments.");
      }
      const { error } = await supabase
        .from("estates")
        .update({
          address: estateAddress.trim() || null,
          manual_payment_enabled: canManageDuesSettings ? manualPaymentEnabled : undefined,
          manual_account_name: canManageDuesSettings ? manualAccountName.trim() || null : undefined,
          manual_account_number: canManageDuesSettings
            ? manualAccountNumber.trim() || null
            : undefined,
          manual_bank_name: canManageDuesSettings ? manualBankName.trim() || null : undefined,
        })
        .eq("id", profile.estate_id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Estate details saved");
      await queryClient.invalidateQueries({ queryKey: ["oyesile-estate"] });
      await queryClient.invalidateQueries({ queryKey: ["estate-payment-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <PageLoading label="Loading settings" onRetry={() => void refetch()} />;
  if (isError) return <PageLoadError onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and estate contact details."
        icon={SettingsIcon}
      />

      {isAdmin && !profile?.avatar_url && (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <p className="font-medium">Add your administrator photograph</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your photograph is required so residents can identify you on the Know your admins page.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Your profile</h2>
          <div className="mt-4 space-y-4">
            {isAdmin && (
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 border border-border">
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.full_name || "Administrator"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                    {(profile?.full_name || "OA")
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Label htmlFor="profile-photo">Profile photograph</Label>
                  <Input
                    id="profile-photo"
                    className="mt-2"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Clear portrait, JPG, PNG or WebP. Maximum 5 MB.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    disabled={!profilePhoto}
                    onClick={() => uploadProfilePhoto.mutate()}
                    loading={uploadProfilePhoto.isPending}
                    loadingLabel="Uploading photograph"
                  >
                    <ImagePlus />
                    Upload photograph
                  </Button>
                </div>
              </div>
            )}
            <Field label="Full name">
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={profile?.email || ""} disabled />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Button
              onClick={() => saveProfile.mutate()}
              loading={saveProfile.isPending}
              loadingLabel="Saving profile"
            >
              Save profile
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Oyesile Estate</h2>
          <div className="mt-4 space-y-4">
            <Field label="Estate name">
              <Input value={estate?.name || "Oyesile Estate"} disabled />
            </Field>
            <Field label="Address">
              <Input
                value={estateAddress}
                onChange={(event) => setEstateAddress(event.target.value)}
                disabled={!isAdmin}
              />
            </Field>
            {canManageDuesSettings && (
              <div className="space-y-4 rounded-lg border border-border/80 bg-secondary/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Manual due payments</p>
                    <p className="text-sm text-muted-foreground">
                      Let residents pay into the estate account and wait for confirmation.
                    </p>
                  </div>
                  <Switch
                    checked={manualPaymentEnabled}
                    onCheckedChange={setManualPaymentEnabled}
                  />
                </div>
                <Field label="Account name">
                  <Input
                    value={manualAccountName}
                    onChange={(event) => setManualAccountName(event.target.value)}
                    placeholder="Oyesile Estate Residents Account"
                  />
                </Field>
                <Field label="Account number">
                  <Input
                    inputMode="numeric"
                    value={manualAccountNumber}
                    onChange={(event) => setManualAccountNumber(event.target.value)}
                    placeholder="0123456789"
                  />
                </Field>
                <Field label="Bank name (optional)">
                  <Input
                    value={manualBankName}
                    onChange={(event) => setManualBankName(event.target.value)}
                    placeholder="Bank name"
                  />
                </Field>
              </div>
            )}
            {isAdmin && (
              <Button
                onClick={() => saveEstateDetails.mutate()}
                loading={saveEstateDetails.isPending}
                loadingLabel="Saving estate details"
              >
                Save estate details
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
