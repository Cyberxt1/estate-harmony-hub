import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getResidentHousingDetails, syncResidentPropertyOccupancy } from "@/lib/property-occupancy";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/onboarding")({
  component: ResidentFormPage,
});

type ResidentType = "landlord" | "tenant";

function ResidentFormPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const saved = useMemo(
    () => (profile?.onboarding_data ?? {}) as Record<string, unknown>,
    [profile?.onboarding_data],
  );
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [residentType, setResidentType] = useState<ResidentType>("tenant");
  const [compoundName, setCompoundName] = useState("");
  const [houseOrApartment, setHouseOrApartment] = useState("");
  const [householdMembers, setHouseholdMembers] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [stayDuration, setStayDuration] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setWhatsappNumber(profile.whatsapp_number || profile.phone || "");
    setResidentType(profile.resident_type || "tenant");
    const housing = getResidentHousingDetails(profile);
    setCompoundName(housing.compoundName);
    setHouseOrApartment(housing.houseOrApartment);
    setLandlordName(housing.landlordName);
    setLandlordPhone(housing.landlordPhone);
    setStayDuration(housing.stayDuration);
    setHouseholdMembers(String(saved.householdMembers || ""));
    setEmergencyName(profile.emergency_contact_name || "");
    setEmergencyPhone(profile.emergency_contact_phone || "");
  }, [profile, saved]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in again.");
      if (!fullName.trim()) throw new Error("Enter your full name.");
      if (!phone.trim()) throw new Error("Enter your phone number.");
      if (!whatsappNumber.trim()) throw new Error("Enter your WhatsApp number.");
      if (!houseOrApartment.trim()) throw new Error("Enter your house or apartment.");

      const onboardingData = {
        compoundName: compoundName.trim(),
        houseOrApartment: houseOrApartment.trim(),
        householdMembers: householdMembers.trim(),
        landlordName: residentType === "tenant" ? landlordName.trim() : "",
        landlordPhone: residentType === "tenant" ? landlordPhone.trim() : "",
        stayDuration: residentType === "tenant" ? stayDuration.trim() : "",
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          whatsapp_number: whatsappNumber.trim(),
          resident_type: residentType,
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_data: onboardingData,
          status: "active",
        })
        .eq("id", user.id);
      if (error) throw error;

      await syncResidentPropertyOccupancy({
        id: user.id,
        estate_id: profile?.estate_id || null,
        full_name: fullName.trim(),
        phone: phone.trim(),
        whatsapp_number: whatsappNumber.trim(),
        resident_type: residentType,
        onboarding_data: onboardingData,
      });
    },
    onSuccess: async () => {
      toast.success(profile?.onboarding_completed ? "Details updated" : "Welcome to the community");
      setSubmitted(true);
      setEditing(false);
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const completed = (profile?.onboarding_completed || submitted) && !editing;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Your details"
        description={
          completed
            ? "Your community contact and home information."
            : "A few simple details so the community can identify and contact you."
        }
        icon={ClipboardList}
      />

      {completed ? (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-4 w-4" />
                Details complete
              </span>
              <h2 className="mt-3 font-display text-2xl font-semibold">{fullName}</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{residentType}</p>
            </div>
            <Button onClick={() => setEditing(true)}>Edit details</Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Summary label="Phone" value={phone} />
            <Summary label="WhatsApp" value={whatsappNumber} />
            <Summary label="Compound" value={compoundName || "Not provided"} />
            <Summary label="House or apartment" value={houseOrApartment} />
            {residentType === "tenant" && (
              <>
                <Summary label="Landlord name" value={landlordName || "Not provided"} />
                <Summary label="Landlord phone" value={landlordPhone || "Not provided"} />
                <Summary label="Duration of stay" value={stayDuration || "Not provided"} />
              </>
            )}
            <Summary
              label="Emergency contact"
              value={
                emergencyName || emergencyPhone
                  ? `${emergencyName}${emergencyPhone ? ` · ${emergencyPhone}` : ""}`
                  : "Not provided"
              }
            />
            <Summary label="People living with you" value={householdMembers || "Not provided"} />
          </div>

          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="space-y-7">
            <FormSection
              title="About you"
              description="Your name and the two numbers community administrators may use."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </Field>
                <Field label="You are a" required>
                  <Select
                    value={residentType}
                    onValueChange={(value) => setResidentType(value as ResidentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="landlord">Landlord</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phone number" hint="For normal calls" required>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="080..."
                  />
                </Field>
                <Field label="WhatsApp number" hint="Can be the same number" required>
                  <Input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value)}
                    placeholder="080..."
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Your home" description="Tell us where to find your household.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Compound name">
                  <Input
                    value={compoundName}
                    onChange={(event) => setCompoundName(event.target.value)}
                    placeholder="For example, Adebayo Compound"
                  />
                </Field>
                <Field label="House or apartment" required>
                  <Input
                    value={houseOrApartment}
                    onChange={(event) => setHouseOrApartment(event.target.value)}
                    placeholder="For example, House 4 or Flat B"
                  />
                </Field>
              </div>
              {residentType === "tenant" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Landlord name">
                    <Input
                      value={landlordName}
                      onChange={(event) => setLandlordName(event.target.value)}
                      placeholder="Who owns this property?"
                    />
                  </Field>
                  <Field label="Landlord phone">
                    <Input
                      type="tel"
                      value={landlordPhone}
                      onChange={(event) => setLandlordPhone(event.target.value)}
                      placeholder="080..."
                    />
                  </Field>
                  <Field label="Duration of stay" hint="For example, 1 year or Since March 2026">
                    <Input
                      value={stayDuration}
                      onChange={(event) => setStayDuration(event.target.value)}
                    />
                  </Field>
                </div>
              )}
              <Field label="Names of people living with you" hint="Optional">
                <Textarea
                  rows={3}
                  value={householdMembers}
                  onChange={(event) => setHouseholdMembers(event.target.value)}
                  placeholder="Write their names, separated by commas"
                />
              </Field>
            </FormSection>

            <FormSection
              title="Emergency contact"
              description="Optional, but useful if we cannot reach you."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact name">
                  <Input
                    value={emergencyName}
                    onChange={(event) => setEmergencyName(event.target.value)}
                  />
                </Field>
                <Field label="Contact phone">
                  <Input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(event) => setEmergencyPhone(event.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {profile?.onboarding_completed && (
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
            <Button
              onClick={() => save.mutate()}
              loading={save.isPending}
              loadingLabel="Saving your details"
            >
              Save my details
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/35 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap font-medium">{value}</p>
    </div>
  );
}
