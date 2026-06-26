import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/onboarding")({
  component: ResidentOnboardingPage,
});

type ResidentType = "landlord" | "tenant";

const steps = ["Identity", "Home", "Household", "Review"];

function ResidentOnboardingPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const saved = (profile?.onboarding_data ?? {}) as Record<string, string | boolean | number | undefined>;

  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [residentType, setResidentType] = useState<ResidentType>("tenant");
  const [currentHouseNumber, setCurrentHouseNumber] = useState("");
  const [currentStreet, setCurrentStreet] = useState("");
  const [livesInEstate, setLivesInEstate] = useState(true);
  const [ownedHouseCount, setOwnedHouseCount] = useState("1");
  const [ownedHouses, setOwnedHouses] = useState("");
  const [tenantHouseNumber, setTenantHouseNumber] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [occupants, setOccupants] = useState("");
  const [vehicles, setVehicles] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setResidentType(profile.resident_type || "tenant");
    setCurrentHouseNumber(String(saved.currentHouseNumber || ""));
    setCurrentStreet(String(saved.currentStreet || ""));
    setLivesInEstate(saved.livesInEstate !== false);
    setOwnedHouseCount(String(saved.ownedHouseCount || "1"));
    setOwnedHouses(String(saved.ownedHouses || ""));
    setTenantHouseNumber(String(saved.tenantHouseNumber || ""));
    setLandlordName(String(saved.landlordName || ""));
    setLandlordPhone(String(saved.landlordPhone || ""));
    setHouseholdSize(String(saved.householdSize || ""));
    setOccupants(String(saved.occupants || ""));
    setVehicles(String(saved.vehicles || ""));
    setEmergencyName(String(saved.emergencyName || ""));
    setEmergencyPhone(String(saved.emergencyPhone || ""));
    setNotes(String(saved.notes || ""));
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in again to complete the resident form.");

      const onboardingData = {
        currentHouseNumber,
        currentStreet,
        livesInEstate,
        ownedHouseCount: residentType === "landlord" ? Number(ownedHouseCount || 0) : 0,
        ownedHouses,
        tenantHouseNumber,
        landlordName,
        landlordPhone,
        householdSize: Number(householdSize || 0),
        occupants,
        vehicles,
        emergencyName,
        emergencyPhone,
        notes,
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          resident_type: residentType,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_data: onboardingData,
          status: "active",
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(profile?.onboarding_completed || submitted ? "Resident form updated" : "Resident form submitted");
      setSubmitted(true);
      setEditing(false);
      setStep(0);
      await queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  const canMoveNext =
    step === 0
      ? Boolean(fullName && phone && residentType)
      : step === 1
        ? residentType === "landlord"
          ? Boolean(ownedHouseCount && ownedHouses)
          : Boolean(tenantHouseNumber && landlordName)
        : step === 2
          ? Boolean(householdSize && occupants && emergencyName && emergencyPhone)
          : true;

  const completed = (profile?.onboarding_completed || submitted) && !editing;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Resident Form"
        description={completed ? "Your submitted resident information for Oyesile Estate." : "Complete this before using the Oyesile Estate dashboard."}
        icon={ClipboardList}
      />

      {completed ? (
        <section className="rounded-md border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-success/15 px-2 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submitted
              </div>
              <h2 className="font-display text-xl font-semibold">Your resident details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last saved {profile?.onboarding_completed_at ? new Date(profile.onboarding_completed_at).toLocaleString() : "recently"}.
              </p>
            </div>
            <Button onClick={() => setEditing(true)}>Edit</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Detail label="Full name" value={fullName} />
            <Detail label="Phone number" value={phone} />
            <Detail label="Resident type" value={residentType} />
            <Detail label="House number" value={residentType === "landlord" ? currentHouseNumber || ownedHouses : tenantHouseNumber} />
            <Detail label="Street" value={currentStreet} />
            <Detail label="Lives in estate" value={residentType === "landlord" ? (livesInEstate ? "Yes" : "No") : "Yes"} />
            <Detail label="Owned houses" value={residentType === "landlord" ? ownedHouses : "Not applicable"} wide />
            <Detail label="Landlord" value={residentType === "tenant" ? landlordName : "Not applicable"} />
            <Detail label="Landlord phone" value={residentType === "tenant" ? landlordPhone : "Not applicable"} />
            <Detail label="Household size" value={householdSize} />
            <Detail label="Occupants" value={occupants} wide />
            <Detail label="Vehicles" value={vehicles || "None"} wide />
            <Detail label="Emergency contact" value={`${emergencyName}${emergencyPhone ? ` - ${emergencyPhone}` : ""}`} wide />
            <Detail label="Notes" value={notes || "None"} wide />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </section>
      ) : (
        <>

      <div className="mb-6 rounded-md border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium">{steps[step]}</span>
          <span className="text-muted-foreground">
            {step + 1} of {steps.length}
          </span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} />
      </div>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-5">
            <SectionTitle title="Your Identity" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </Field>
              <Field label="Phone number">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </Field>
              <Field label="Resident type">
                <Select value={residentType} onValueChange={(value) => setResidentType(value as ResidentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <SectionTitle title={residentType === "landlord" ? "Owned Houses" : "Rented Home"} />
            {residentType === "landlord" ? (
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox checked={livesInEstate} onCheckedChange={(checked) => setLivesInEstate(checked === true)} />
                  I currently live inside Oyesile Estate
                </label>
                {livesInEstate && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="House number where you live">
                      <Input value={currentHouseNumber} onChange={(event) => setCurrentHouseNumber(event.target.value)} />
                    </Field>
                    <Field label="Street">
                      <Input value={currentStreet} onChange={(event) => setCurrentStreet(event.target.value)} />
                    </Field>
                  </div>
                )}
                <Field label="How many houses do you own?">
                  <Input
                    type="number"
                    min="1"
                    value={ownedHouseCount}
                    onChange={(event) => setOwnedHouseCount(event.target.value)}
                  />
                </Field>
                <Field label="List the houses you own">
                  <Textarea
                    value={ownedHouses}
                    onChange={(event) => setOwnedHouses(event.target.value)}
                    placeholder="Example: House 4, Adewale Close - occupied by me. House 9, Oyesile Road - tenant: Mrs. Adebayo."
                    className="min-h-28"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="House number where you live">
                  <Input value={tenantHouseNumber} onChange={(event) => setTenantHouseNumber(event.target.value)} />
                </Field>
                <Field label="Street">
                  <Input value={currentStreet} onChange={(event) => setCurrentStreet(event.target.value)} />
                </Field>
                <Field label="Landlord name">
                  <Input value={landlordName} onChange={(event) => setLandlordName(event.target.value)} />
                </Field>
                <Field label="Landlord phone">
                  <Input value={landlordPhone} onChange={(event) => setLandlordPhone(event.target.value)} />
                </Field>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionTitle title="People And Vehicles" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="How many people live there?">
                <Input
                  type="number"
                  min="1"
                  value={householdSize}
                  onChange={(event) => setHouseholdSize(event.target.value)}
                />
              </Field>
              <Field label="Emergency contact name">
                <Input value={emergencyName} onChange={(event) => setEmergencyName(event.target.value)} />
              </Field>
              <Field label="Emergency contact phone">
                <Input value={emergencyPhone} onChange={(event) => setEmergencyPhone(event.target.value)} />
              </Field>
            </div>
            <Field label="Names of people living there">
              <Textarea
                value={occupants}
                onChange={(event) => setOccupants(event.target.value)}
                placeholder="List names and relationship, one per line."
                className="min-h-28"
              />
            </Field>
            <Field label="Vehicles">
              <Textarea
                value={vehicles}
                onChange={(event) => setVehicles(event.target.value)}
                placeholder="Plate number, car model and owner. Leave blank if none."
                className="min-h-24"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <SectionTitle title="Management Notes" />
            <Field label="Anything management should know">
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add details about vacant homes, tenants not yet registered, staff living in the home, or special security notes."
                className="min-h-32"
              />
            </Field>
            <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              Submitting confirms this information is accurate enough for Oyesile
              Estate management to understand who lives where.
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((current) => current + 1)} disabled={!canMoveNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => save.mutate()} disabled={save.isPending || !canMoveNext}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {profile?.onboarding_completed || submitted ? "Save changes" : "Submit form"}
            </Button>
          )}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-display text-xl font-semibold">{title}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value?: string | number | boolean | null; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-border bg-secondary/20 p-3 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value || "Not provided"}</p>
    </div>
  );
}
