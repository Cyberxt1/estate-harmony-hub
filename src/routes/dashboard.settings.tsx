import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, isAdmin, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [estateAddress, setEstateAddress] = useState("");
  const [manualPaymentEnabled, setManualPaymentEnabled] = useState(false);
  const [manualAccountName, setManualAccountName] = useState("");
  const [manualAccountNumber, setManualAccountNumber] = useState("");
  const [manualBankName, setManualBankName] = useState("");
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

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Your profile</h2>
          <div className="mt-4 space-y-4">
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
