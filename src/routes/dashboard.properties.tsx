import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, History, Home, MessageCircle, Phone, Plus } from "lucide-react";
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
function PropertiesPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [ownerEditProperty, setOwnerEditProperty] = useState<Property | null>(null);
  const [editOwnerId, setEditOwnerId] = useState("unassigned");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editOwnerPhone, setEditOwnerPhone] = useState("");
  const [peopleTab, setPeopleTab] = useState<"landlords" | "tenants">("landlords");
  const [compoundName, setCompoundName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [propertyType, setPropertyType] = useState<Property["property_type"]>("bungalow");
  const [status, setStatus] = useState<Property["status"]>("vacant");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [electricityMeter, setElectricityMeter] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [occupantCapacity, setOccupantCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("unassigned");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");

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
  const propertiesByCompound = useMemo(() => {
    const grouped = new Map<string, Property[]>();
    properties.forEach((property) => {
      const compound = property.compound_name || "Unnamed compound";
      grouped.set(compound, [...(grouped.get(compound) ?? []), property]);
    });
    return [...grouped.entries()];
  }, [properties]);

  const resetForm = () => {
    setCompoundName("");
    setHouseNumber("");
    setStreet("");
    setPropertyType("bungalow");
    setStatus("vacant");
    setBedrooms("");
    setBathrooms("");
    setElectricityMeter("");
    setWaterMeter("");
    setOccupantCapacity("");
    setNotes("");
    setSelectedOwnerId("unassigned");
    setLandlordName("");
    setLandlordPhone("");
  };

  const createProperty = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
      if (!compoundName.trim()) throw new Error("Enter the compound name.");
      if (!Number.isInteger(Number(houseNumber)) || Number(houseNumber) < 1) {
        throw new Error("Enter a valid house number.");
      }

      const ownerProfile = landlordProfiles.find((member) => member.id === selectedOwnerId);

      const { error } = await supabase.from("properties").insert({
        estate_id: profile.estate_id,
        compound_name: compoundName.trim(),
        house_number: `House ${Number(houseNumber)}`,
        apartment_name: null,
        street: street.trim() || null,
        property_type: propertyType,
        status,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        electricity_meter: electricityMeter.trim() || null,
        water_meter: waterMeter.trim() || null,
        occupant_capacity: occupantCapacity ? Number(occupantCapacity) : null,
        notes: notes.trim() || null,
        owner_id: ownerProfile?.id || null,
        owner_name: ownerProfile?.full_name || landlordName.trim() || null,
        owner_phone: ownerProfile?.phone || landlordPhone.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("House added");
      setCreateOpen(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateOwner = useMutation({
    mutationFn: async () => {
      if (!ownerEditProperty) throw new Error("Choose a house.");
      const ownerProfile = landlordProfiles.find((member) => member.id === editOwnerId);
      const { error } = await supabase
        .from("properties")
        .update({
          owner_id: ownerProfile?.id || null,
          owner_name: ownerProfile?.full_name || editOwnerName.trim() || null,
          owner_phone: ownerProfile?.phone || editOwnerPhone.trim() || null,
        })
        .eq("id", ownerEditProperty.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Main owner updated");
      setOwnerEditProperty(null);
      setSelectedProperty(null);
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openOwnerEditor = (property: Property) => {
    setSelectedProperty(null);
    setOwnerEditProperty(property);
    setEditOwnerId(property.owner_id || (property.owner_name ? "manual" : "unassigned"));
    setEditOwnerName(property.owner_name || "");
    setEditOwnerPhone(property.owner_phone || "");
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Compounds, numbered houses, main owners and current tenants."
        icon={Home}
      >
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add house
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Houses" value={properties.length} />
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
              <h2 className="text-base font-semibold">Compounds and houses</h2>
            </div>
            <div className="space-y-5">
              {propertiesByCompound.map(([compound, compoundProperties]) => (
                <div key={compound} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{compound}</h3>
                      <p className="text-sm text-muted-foreground">
                        {compoundProperties.length} house
                        {compoundProperties.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {compoundProperties.map((property) => {
                      const propertyOccupants = occupantsByProperty.get(property.id) ?? [];
                      const { currentLandlords, currentTenants, previousTenants } =
                        classifyPropertyOccupants(propertyOccupants);
                      const legacyLandlord = currentLandlords[0];

                      return (
                        <button
                          key={property.id}
                          type="button"
                          className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/40"
                          onClick={() => setSelectedProperty(property)}
                        >
                          <h4 className="text-base font-semibold">{getPropertyLabel(property)}</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Main owner:</span>{" "}
                              <span className="font-medium">
                                {property.owner_name || legacyLandlord?.full_name || "Not assigned"}
                              </span>
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
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState
          title="No houses yet"
          description="An administrator can add each compound and create its numbered houses."
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
            <DialogTitle>Add house</DialogTitle>
            <DialogDescription>
              Create a numbered house inside a compound and assign its main owner.
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
                <Field label="House number">
                  <Input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={houseNumber}
                    onChange={(event) => setHouseNumber(event.target.value)}
                    placeholder="1"
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

            <FormSection title="Main owner">
              <p className="text-sm text-muted-foreground">
                Choose the landlord who owns this house. Their relatives may have separate platform
                accounts without becoming the main owner.
              </p>
              <Field label="Platform landlord">
                <Select
                  value={selectedOwnerId}
                  onValueChange={(value) => {
                    setSelectedOwnerId(value);
                    const owner = landlordProfiles.find((member) => member.id === value);
                    setLandlordName(owner?.full_name || "");
                    setLandlordPhone(owner?.phone || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No owner assigned yet</SelectItem>
                    <SelectItem value="manual">Owner is not on the platform</SelectItem>
                    {landlordProfiles.map((landlord) => (
                      <SelectItem key={landlord.id} value={landlord.id}>
                        {landlord.full_name || landlord.phone || "Unnamed landlord"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedOwnerId === "manual" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Owner's full name">
                    <Input
                      value={landlordName}
                      onChange={(event) => setLandlordName(event.target.value)}
                      placeholder="Main owner of this house"
                    />
                  </Field>
                  <Field label="Owner's phone number">
                    <Input
                      type="tel"
                      value={landlordPhone}
                      onChange={(event) => setLandlordPhone(event.target.value)}
                      placeholder="080..."
                    />
                  </Field>
                </div>
              )}

              {selectedOwnerId !== "manual" && selectedOwnerId !== "unassigned" && (
                <div className="rounded-lg border border-border bg-secondary/25 p-4 text-sm">
                  <p className="font-medium">{landlordName || "Unnamed landlord"}</p>
                  <p className="mt-1 text-muted-foreground">
                    {landlordPhone || "No phone number added"}
                  </p>
                </div>
              )}
            </FormSection>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createProperty.mutate()}
              loading={createProperty.isPending}
              loadingLabel="Adding house"
            >
              Add house
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PropertyDetails
        property={selectedProperty}
        occupants={selectedProperty ? (occupantsByProperty.get(selectedProperty.id) ?? []) : []}
        isAdmin={isAdmin}
        onClose={() => setSelectedProperty(null)}
        onEditOwner={openOwnerEditor}
      />

      <Dialog
        open={Boolean(ownerEditProperty)}
        onOpenChange={(open) => !open && setOwnerEditProperty(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change main owner</DialogTitle>
            <DialogDescription>
              {ownerEditProperty
                ? `${ownerEditProperty.compound_name || "Compound"} · ${ownerEditProperty.house_number}`
                : "Choose the landlord who owns this house."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Platform landlord">
              <Select
                value={editOwnerId}
                onValueChange={(value) => {
                  setEditOwnerId(value);
                  const owner = landlordProfiles.find((member) => member.id === value);
                  setEditOwnerName(owner?.full_name || "");
                  setEditOwnerPhone(owner?.phone || "");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No owner assigned yet</SelectItem>
                  <SelectItem value="manual">Owner is not on the platform</SelectItem>
                  {landlordProfiles.map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.full_name || landlord.phone || "Unnamed landlord"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {editOwnerId === "manual" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Owner's full name">
                  <Input
                    value={editOwnerName}
                    onChange={(event) => setEditOwnerName(event.target.value)}
                  />
                </Field>
                <Field label="Owner's phone">
                  <Input
                    type="tel"
                    value={editOwnerPhone}
                    onChange={(event) => setEditOwnerPhone(event.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnerEditProperty(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateOwner.mutate()}
              loading={updateOwner.isPending}
              loadingLabel="Updating owner"
            >
              Save owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PropertyDetails({
  property,
  occupants,
  isAdmin,
  onClose,
  onEditOwner,
}: {
  property: Property | null;
  occupants: Occupant[];
  isAdmin: boolean;
  onClose: () => void;
  onEditOwner: (property: Property) => void;
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

            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">Main owner</h3>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => onEditOwner(property)}>
                    Change owner
                  </Button>
                )}
              </div>
              <div className="mt-3 rounded-lg border border-border p-4">
                <p className="font-medium">
                  {property.owner_name || currentLandlords[0]?.full_name || "Not assigned"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {property.owner_phone ||
                    currentLandlords[0]?.phone ||
                    "No owner phone number added"}
                </p>
              </div>
            </section>

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
        {occupant.occupant_type === "tenant" && occupant.household_size && (
          <p className="mt-1 text-sm text-muted-foreground">
            {occupant.household_size} people living in this house
          </p>
        )}
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
        <span>{members[0]?.resident_type === "landlord" ? "Compound" : "House"}</span>
      </div>
      {members.map((member, index) => {
        const housing = getResidentHousingDetails(member);
        const houseLabel = housing.compoundName
          ? `${housing.houseOrApartment || "No house set"} · ${housing.compoundName}`
          : housing.houseOrApartment || "No house set";
        const displayLabel =
          member.resident_type === "landlord"
            ? housing.compoundName || "No compound set"
            : houseLabel;

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
            <div className="text-muted-foreground">
              <p>{displayLabel}</p>
              {member.resident_type === "landlord" &&
                (housing.numberOfHouses || housing.peopleInCompound) && (
                  <p className="mt-1 text-xs">
                    {housing.numberOfHouses || "0"} houses · {housing.peopleInCompound || "0"}{" "}
                    people
                  </p>
                )}
            </div>
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
