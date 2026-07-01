import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, History, Home, MessageCircle, Phone, Plus, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  classifyPropertyOccupants,
  getResidentHousingDetails,
  getPropertyLabel,
  sortPropertiesByHouse,
} from "@/lib/property-occupancy";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/properties")({
  component: PropertiesPage,
});

type Property = Tables<"properties">;
type Occupant = Tables<"property_occupants">;
type MemberProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "phone" | "whatsapp_number" | "resident_type" | "onboarding_data"
>;
type NewTenant = { fullName: string; phone: string; whatsappNumber: string; stayDuration: string };

const emptyTenant = (): NewTenant => ({
  fullName: "",
  phone: "",
  whatsappNumber: "",
  stayDuration: "",
});

function PropertiesPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [peopleTab, setPeopleTab] = useState<"landlords" | "tenants">("landlords");
  const [compoundName, setCompoundName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [apartmentName, setApartmentName] = useState("");
  const [street, setStreet] = useState("");
  const [propertyType, setPropertyType] = useState<Property["property_type"]>("apartment");
  const [status, setStatus] = useState<Property["status"]>("occupied");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [electricityMeter, setElectricityMeter] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [occupantCapacity, setOccupantCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [tenants, setTenants] = useState<NewTenant[]>([emptyTenant()]);

  const {
    data: properties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["properties", profile?.estate_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("compound_name", { ascending: true })
        .order("house_number", { ascending: true });
      if (error) throw error;
      return sortPropertiesByHouse(data ?? []);
    },
  });

  const {
    data: allOccupants = [],
    isLoading: occupantsLoading,
    isError: occupantsError,
  } = useQuery({
    queryKey: ["property-occupants", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_occupants")
        .select("*")
        .order("is_current", { ascending: false })
        .order("occupant_type", { ascending: true })
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: memberProfiles = [],
    isLoading: membersLoading,
    isError: membersError,
  } = useQuery({
    queryKey: ["property-member-profiles", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, whatsapp_number, resident_type, onboarding_data")
        .in("resident_type", ["landlord", "tenant"])
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MemberProfile[];
    },
  });

  const occupantsByProperty = useMemo(() => {
    const grouped = new Map<string, Occupant[]>();
    allOccupants.forEach((occupant) => {
      grouped.set(occupant.property_id, [...(grouped.get(occupant.property_id) ?? []), occupant]);
    });
    return grouped;
  }, [allOccupants]);

  const landlordProfiles = useMemo(
    () => memberProfiles.filter((member) => member.resident_type === "landlord"),
    [memberProfiles],
  );
  const tenantProfiles = useMemo(
    () => memberProfiles.filter((member) => member.resident_type === "tenant"),
    [memberProfiles],
  );

  const resetForm = () => {
    setCompoundName("");
    setHouseNumber("");
    setApartmentName("");
    setStreet("");
    setPropertyType("apartment");
    setStatus("occupied");
    setBedrooms("");
    setBathrooms("");
    setElectricityMeter("");
    setWaterMeter("");
    setOccupantCapacity("");
    setNotes("");
    setLandlordName("");
    setLandlordPhone("");
    setTenants([emptyTenant()]);
  };

  const createProperty = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
      if (!houseNumber.trim()) throw new Error("Enter a house or unit number.");

      const validTenants = tenants.filter((tenant) => tenant.fullName.trim());

      const { data: property, error } = await supabase
        .from("properties")
        .insert({
          estate_id: profile.estate_id,
          compound_name: compoundName.trim() || null,
          house_number: houseNumber.trim(),
          apartment_name: apartmentName.trim() || null,
          street: street.trim() || null,
          property_type: propertyType,
          status,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          electricity_meter: electricityMeter.trim() || null,
          water_meter: waterMeter.trim() || null,
          occupant_capacity: occupantCapacity ? Number(occupantCapacity) : null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const occupantRows: Tables<"property_occupants">["Insert"][] = [];

      if (landlordName.trim()) {
        occupantRows.push({
          estate_id: profile.estate_id,
          property_id: property.id,
          full_name: landlordName.trim(),
          phone: landlordPhone.trim() || null,
          whatsapp_number: landlordPhone.trim() || null,
          occupant_type: "landlord",
          is_primary: true,
          is_current: true,
        });
      }

      validTenants.forEach((tenant, index) => {
        occupantRows.push({
          estate_id: profile.estate_id!,
          property_id: property.id,
          full_name: tenant.fullName.trim(),
          phone: tenant.phone.trim() || null,
          whatsapp_number: tenant.whatsappNumber.trim() || tenant.phone.trim() || null,
          occupant_type: "tenant",
          landlord_name: landlordName.trim() || null,
          landlord_phone: landlordPhone.trim() || null,
          stay_duration: tenant.stayDuration.trim() || null,
          is_primary: !landlordName.trim() && index === 0,
          is_current: true,
        });
      });

      if (occupantRows.length > 0) {
        const { error: occupantError } = await supabase
          .from("property_occupants")
          .insert(occupantRows);
        if (occupantError) {
          await supabase.from("properties").delete().eq("id", property.id);
          throw occupantError;
        }
      }
    },
    onSuccess: async () => {
      toast.success("Property added");
      setCreateOpen(false);
      resetForm();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["property-occupants"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTenant = (index: number, patch: Partial<NewTenant>) => {
    setTenants((current) =>
      current.map((tenant, tenantIndex) =>
        tenantIndex === index ? { ...tenant, ...patch } : tenant,
      ),
    );
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Property records, house numbers, landlords and tenants across the estate."
        icon={Home}
      >
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add property
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Properties" value={properties.length} />
        <Stat label="Landlords" value={landlordProfiles.length} />
        <Stat label="Tenants" value={tenantProfiles.length} />
      </div>

      {isError || occupantsError || membersError ? (
        <PageLoadError onRetry={() => void queryClient.refetchQueries()} />
      ) : isLoading || occupantsLoading || membersLoading ? (
        <PageLoading label="Loading properties" onRetry={() => void queryClient.refetchQueries()} />
      ) : properties.length > 0 ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <Tabs
              value={peopleTab}
              onValueChange={(value) => setPeopleTab(value as typeof peopleTab)}
            >
              <TabsList>
                <TabsTrigger value="landlords">Landlords</TabsTrigger>
                <TabsTrigger value="tenants">Tenants</TabsTrigger>
              </TabsList>

              <TabsContent value="landlords" className="mt-4">
                <RoleList
                  members={landlordProfiles}
                  emptyText="No landlords have been added yet."
                />
              </TabsContent>

              <TabsContent value="tenants" className="mt-4">
                <RoleList members={tenantProfiles} emptyText="No tenants have been added yet." />
              </TabsContent>
            </Tabs>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Property records</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => {
                const propertyOccupants = occupantsByProperty.get(property.id) ?? [];
                const { currentLandlords, currentTenants, previousTenants } =
                  classifyPropertyOccupants(propertyOccupants);
                const landlord = currentLandlords[0];

                return (
                  <button
                    key={property.id}
                    type="button"
                    className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40"
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {property.compound_name || "Standalone property"}
                        </p>
                        <h2 className="mt-1 truncate text-base font-semibold">
                          {getPropertyLabel(property)}
                        </h2>
                        {property.street && (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {property.street}
                          </p>
                        )}
                      </div>
                      <Building2 className="h-5 w-5 shrink-0 text-primary" />
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Landlord:</span>{" "}
                        <span className="font-medium">{landlord?.full_name || "Not added"}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Current tenants:</span>{" "}
                        <span className="font-medium">
                          {currentTenants.length > 0
                            ? currentTenants.map((tenant) => tenant.full_name).join(", ")
                            : "None"}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="capitalize">{property.status.replace("_", " ")}</span>
                      <span>
                        {previousTenants.length} previous tenant
                        {previousTenants.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState
          title="No properties yet"
          description="Add compounds, houses and apartments to build the community property list."
        />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
            <DialogDescription>
              Add the property itself, then record the landlord and any current tenants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <FormSection title="Location">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Compound name">
                  <Input
                    value={compoundName}
                    onChange={(event) => setCompoundName(event.target.value)}
                    placeholder="Adebayo Compound"
                  />
                </Field>
                <Field label="House or unit number">
                  <Input
                    value={houseNumber}
                    onChange={(event) => setHouseNumber(event.target.value)}
                    placeholder="House 4"
                  />
                </Field>
                <Field label="Apartment name">
                  <Input
                    value={apartmentName}
                    onChange={(event) => setApartmentName(event.target.value)}
                    placeholder="Flat B"
                  />
                </Field>
                <Field label="Street">
                  <Input value={street} onChange={(event) => setStreet(event.target.value)} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Property details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Property type">
                  <Select
                    value={propertyType}
                    onValueChange={(value) => setPropertyType(value as Property["property_type"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "apartment",
                        "detached",
                        "semi_detached",
                        "terrace",
                        "duplex",
                        "bungalow",
                      ].map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as Property["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="under_maintenance">Under maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Bedrooms">
                  <Input
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  />
                </Field>
                <Field label="Bathrooms">
                  <Input
                    type="number"
                    min="0"
                    value={bathrooms}
                    onChange={(event) => setBathrooms(event.target.value)}
                  />
                </Field>
                <Field label="Maximum occupants">
                  <Input
                    type="number"
                    min="0"
                    value={occupantCapacity}
                    onChange={(event) => setOccupantCapacity(event.target.value)}
                  />
                </Field>
                <Field label="Electricity meter">
                  <Input
                    value={electricityMeter}
                    onChange={(event) => setElectricityMeter(event.target.value)}
                  />
                </Field>
                <Field label="Water meter">
                  <Input
                    value={waterMeter}
                    onChange={(event) => setWaterMeter(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Other details">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>
            </FormSection>

            <FormSection title="Landlord">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Landlord name">
                  <Input
                    value={landlordName}
                    onChange={(event) => setLandlordName(event.target.value)}
                    placeholder="Owner of this property"
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
              </div>
            </FormSection>

            <FormSection title="Current tenants">
              <p className="text-sm text-muted-foreground">
                Tenants do not own the property. Add their stay details here if they are already
                living in it.
              </p>
              <div className="space-y-3">
                {tenants.map((tenant, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Tenant {index + 1}</p>
                      {tenants.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setTenants((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={tenant.fullName}
                        onChange={(event) => updateTenant(index, { fullName: event.target.value })}
                        placeholder="Full name"
                      />
                      <Input
                        type="tel"
                        value={tenant.phone}
                        onChange={(event) => updateTenant(index, { phone: event.target.value })}
                        placeholder="Phone"
                      />
                      <Input
                        type="tel"
                        value={tenant.whatsappNumber}
                        onChange={(event) =>
                          updateTenant(index, { whatsappNumber: event.target.value })
                        }
                        placeholder="WhatsApp"
                      />
                      <Input
                        value={tenant.stayDuration}
                        onChange={(event) =>
                          updateTenant(index, { stayDuration: event.target.value })
                        }
                        placeholder="Duration of stay"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTenants((current) => [...current, emptyTenant()])}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add another tenant
              </Button>
            </FormSection>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createProperty.mutate()}
              loading={createProperty.isPending}
              loadingLabel="Adding property"
            >
              Add property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PropertyDetails
        property={selectedProperty}
        occupants={selectedProperty ? (occupantsByProperty.get(selectedProperty.id) ?? []) : []}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
}

function PropertyDetails({
  property,
  occupants,
  onClose,
}: {
  property: Property | null;
  occupants: Occupant[];
  onClose: () => void;
}) {
  const { currentLandlords, currentTenants, previousTenants } =
    classifyPropertyOccupants(occupants);

  return (
    <Dialog open={Boolean(property)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{property ? getPropertyLabel(property) : "Property"}</DialogTitle>
          <DialogDescription>
            {property
              ? [property.compound_name, property.house_number, property.street]
                  .filter(Boolean)
                  .join(" · ")
              : ""}
          </DialogDescription>
        </DialogHeader>

        {property && (
          <div className="space-y-6">
            <section>
              <h3 className="font-display text-lg font-semibold">Property details</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Type" value={property.property_type.replace("_", " ")} />
                <Detail label="Status" value={property.status.replace("_", " ")} />
                <Detail label="Bedrooms" value={property.bedrooms} />
                <Detail label="Bathrooms" value={property.bathrooms} />
                <Detail label="Occupant capacity" value={property.occupant_capacity} />
                <Detail label="Electricity meter" value={property.electricity_meter} />
                <Detail label="Water meter" value={property.water_meter} />
              </div>
              {property.notes && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-secondary/35 p-4 text-sm">
                  {property.notes}
                </p>
              )}
            </section>

            <OccupantSection
              title="Landlord"
              emptyText="No landlord has been added."
              occupants={currentLandlords}
            />

            <OccupantSection
              title="Current tenants"
              emptyText="No current tenants have been added."
              occupants={currentTenants}
            />

            <section>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold">Previous tenants</h3>
              </div>
              {previousTenants.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {previousTenants.map((occupant) => (
                    <OccupantRow key={occupant.id} occupant={occupant} previous />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No previous tenant history yet.
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OccupantSection({
  title,
  occupants,
  emptyText,
}: {
  title: string;
  occupants: Occupant[];
  emptyText: string;
}) {
  return (
    <section>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {occupants.length > 0 ? (
        <div className="mt-3 space-y-3">
          {occupants.map((occupant) => (
            <OccupantRow key={occupant.id} occupant={occupant} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}

function OccupantRow({ occupant, previous = false }: { occupant: Occupant; previous?: boolean }) {
  const whatsapp = occupant.whatsapp_number || occupant.phone;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{occupant.full_name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {occupant.occupant_type === "landlord" ? "Landlord" : "Tenant"}
          {occupant.phone ? ` · ${occupant.phone}` : ""}
          {occupant.stay_duration ? ` · ${occupant.stay_duration}` : ""}
        </p>
        {occupant.occupant_type === "tenant" &&
          (occupant.landlord_name || occupant.landlord_phone) && (
            <p className="mt-1 text-sm text-muted-foreground">
              Landlord: {occupant.landlord_name || "Not provided"}
              {occupant.landlord_phone ? ` · ${occupant.landlord_phone}` : ""}
            </p>
          )}
        {previous && occupant.move_out_date && (
          <p className="mt-1 text-sm text-muted-foreground">
            Moved out: {formatDate(occupant.move_out_date)}
          </p>
        )}
      </div>
      {!previous && (
        <div className="flex gap-2">
          {whatsapp && (
            <Button asChild size="sm" variant="outline">
              <a href={getWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          {occupant.phone && (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${occupant.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {children}
    </section>
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

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 capitalize">{value ?? "Not provided"}</p>
    </div>
  );
}

function RoleList({ members, emptyText }: { members: MemberProfile[]; emptyText: string }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(120px,0.9fr)] gap-3 border-b border-border bg-secondary/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Name</span>
        <span>House number</span>
      </div>
      {members.map((member, index) => {
        const housing = getResidentHousingDetails(member);
        const houseLabel = housing.compoundName
          ? `${housing.houseOrApartment || "No house set"} · ${housing.compoundName}`
          : housing.houseOrApartment || "No house set";

        return (
          <div
            key={member.id}
            className={`grid grid-cols-[minmax(0,1.3fr)_minmax(120px,0.9fr)] gap-3 px-4 py-3 text-sm ${index !== members.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{member.full_name || "Unnamed member"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {member.whatsapp_number || member.phone || "No contact number"}
              </p>
            </div>
            <p className="text-muted-foreground">{houseLabel}</p>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function getWhatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
