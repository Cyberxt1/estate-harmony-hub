import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const Route = createFileRoute("/dashboard/onboarding")({
  component: ResidentFormPage,
});

type ResidentType = "landlord" | "tenant";

function ResidentFormPage() {
  const { user, profile, refreshAuth } = useAuth();
  const navigate = useNavigate();
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
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [compoundName, setCompoundName] = useState("");
  const [houseOrApartment, setHouseOrApartment] = useState("");
  const [numberOfHouses, setNumberOfHouses] = useState("");
  const [peopleInCompound, setPeopleInCompound] = useState("");
  const [peopleInHouse, setPeopleInHouse] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const { data: properties = [] } = useQuery({
    queryKey: ["onboarding-properties", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, compound_name, house_number, apartment_name, owner_name, owner_phone, status")
        .order("compound_name", { ascending: true })
        .order("house_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );
  const availableProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.id === selectedPropertyId ||
          property.status === "vacant" ||
          property.status === "occupied",
      ),
    [properties, selectedPropertyId],
  );

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setWhatsappNumber(profile.whatsapp_number || profile.phone || "");
    setResidentType(profile.resident_type || "tenant");
    const housing = getResidentHousingDetails(profile);
    setSelectedPropertyId(housing.propertyId);
    setCompoundName(housing.compoundName);
    setHouseOrApartment(housing.houseOrApartment);
    setNumberOfHouses(housing.numberOfHouses);
    setPeopleInCompound(housing.peopleInCompound);
    setPeopleInHouse(housing.peopleInHouse);
    setLandlordName(housing.landlordName);
    setLandlordPhone(housing.landlordPhone);
    setEmergencyName(profile.emergency_contact_name || "");
    setEmergencyPhone(profile.emergency_contact_phone || "");
  }, [profile, saved]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in again.");
      if (!fullName.trim()) throw new Error("Enter your full name.");
      if (!phone.trim()) throw new Error("Enter your phone number.");
      if (!whatsappNumber.trim()) throw new Error("Enter your WhatsApp number.");
      if (residentType === "tenant" && !selectedProperty) {
        throw new Error("Choose the house where you live.");
      }
      if (residentType === "tenant" && Number(peopleInHouse) < 1) {
        throw new Error("Enter how many people live in the house.");
      }
      if (residentType === "landlord" && !compoundName.trim()) {
        throw new Error("Enter your compound name.");
      }
      if (residentType === "landlord" && Number(numberOfHouses) < 1) {
        throw new Error("Enter how many houses are in your compound.");
      }
      if (residentType === "landlord" && Number(peopleInCompound) < 1) {
        throw new Error("Enter how many people live in your compound.");
      }

      const onboardingData = {
        propertyId: residentType === "tenant" ? selectedProperty?.id || "" : "",
        compoundName:
          residentType === "tenant" ? selectedProperty?.compound_name || "" : compoundName.trim(),
        houseOrApartment: residentType === "tenant" ? selectedProperty?.house_number || "" : "",
        numberOfHouses: residentType === "landlord" ? Number(numberOfHouses) : null,
        peopleInCompound: residentType === "landlord" ? Number(peopleInCompound) : null,
        peopleInHouse: residentType === "tenant" ? Number(peopleInHouse) : null,
        landlordName: residentType === "tenant" ? selectedProperty?.owner_name || "" : "",
        landlordPhone: residentType === "tenant" ? selectedProperty?.owner_phone || "" : "",
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
      await refreshAuth();
      void navigate({ to: "/dashboard", replace: true });
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
            {residentType === "tenant" && <Summary label="House number" value={houseOrApartment} />}
            {residentType === "landlord" && (
              <>
                <Summary label="Houses in compound" value={numberOfHouses || "Not provided"} />
                <Summary
                  label="People living in compound"
                  value={peopleInCompound || "Not provided"}
                />
              </>
            )}
            {residentType === "tenant" && (
              <>
                <Summary label="Landlord name" value={landlordName || "Not provided"} />
                <Summary label="Landlord phone" value={landlordPhone || "Not provided"} />
                <Summary label="People living in house" value={peopleInHouse || "Not provided"} />
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

            <FormSection
              title="Property details"
              description={
                residentType === "tenant"
                  ? "Choose the house already created by an estate administrator."
                  : "Tell us the size of your compound. Administrators create and assign its houses."
              }
            >
              {residentType === "landlord" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Compound name" required>
                    <Input
                      value={compoundName}
                      onChange={(event) => setCompoundName(event.target.value)}
                      placeholder="For example, Adebayo Compound"
                    />
                  </Field>
                  <Field label="How many houses are in the compound?" required>
                    <Input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={numberOfHouses}
                      onChange={(event) => setNumberOfHouses(event.target.value)}
                    />
                  </Field>
                  <Field label="How many people live in the compound?" required>
                    <Input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={peopleInCompound}
                      onChange={(event) => setPeopleInCompound(event.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="House" required>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableProperties.length
                              ? "Choose your compound and house"
                              : "No houses have been created yet"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.compound_name || "Unnamed compound"} · {property.house_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProperty && (
                      <p className="text-xs text-muted-foreground">
                        Main owner: {selectedProperty.owner_name || "Not assigned yet"}
                      </p>
                    )}
                  </Field>
                  <Field label="How many people live in this house?" required>
                    <Input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={peopleInHouse}
                      onChange={(event) => setPeopleInHouse(event.target.value)}
                    />
                  </Field>
                </div>
              )}
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
