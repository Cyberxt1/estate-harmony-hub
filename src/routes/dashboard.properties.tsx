import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Home, Loader2, MessageCircle, Phone, Plus, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
type NewOccupant = { fullName: string; phone: string; whatsappNumber: string };

const emptyOccupant = (): NewOccupant => ({ fullName: "", phone: "", whatsappNumber: "" });

function PropertiesPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
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
  const [occupants, setOccupants] = useState<NewOccupant[]>([emptyOccupant()]);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", profile?.estate_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("compound_name", { ascending: true })
        .order("house_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allOccupants = [] } = useQuery({
    queryKey: ["property-occupants", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_occupants")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const occupantsByProperty = useMemo(() => {
    const grouped = new Map<string, Occupant[]>();
    allOccupants.forEach((occupant) => {
      grouped.set(occupant.property_id, [...(grouped.get(occupant.property_id) ?? []), occupant]);
    });
    return grouped;
  }, [allOccupants]);

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
    setOccupants([emptyOccupant()]);
  };

  const createProperty = useMutation({
    mutationFn: async () => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
      if (!houseNumber.trim()) throw new Error("Enter a house or unit number.");
      const validOccupants = occupants.filter((occupant) => occupant.fullName.trim());

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

      if (validOccupants.length > 0) {
        const { error: occupantError } = await supabase.from("property_occupants").insert(
          validOccupants.map((occupant, index) => ({
            estate_id: profile.estate_id!,
            property_id: property.id,
            full_name: occupant.fullName.trim(),
            phone: occupant.phone.trim() || null,
            whatsapp_number: occupant.whatsappNumber.trim() || occupant.phone.trim() || null,
            is_primary: index === 0,
          })),
        );
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

  const updateOccupant = (index: number, patch: Partial<NewOccupant>) => {
    setOccupants((current) =>
      current.map((occupant, occupantIndex) =>
        occupantIndex === index ? { ...occupant, ...patch } : occupant,
      ),
    );
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Every compound, house, apartment and the people living there."
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
        <Stat
          label="Compounds"
          value={new Set(properties.map((property) => property.compound_name).filter(Boolean)).size}
        />
        <Stat label="Known occupants" value={allOccupants.length} />
      </div>

      {isLoading ? (
        <Loading />
      ) : properties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => {
            const propertyOccupants = occupantsByProperty.get(property.id) ?? [];
            return (
              <button
                key={property.id}
                type="button"
                className="rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
                onClick={() => setSelectedProperty(property)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {property.compound_name || "Standalone property"}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold">
                      {property.apartment_name || property.house_number}
                    </h2>
                    {property.apartment_name && (
                      <p className="mt-1 text-sm text-muted-foreground">{property.house_number}</p>
                    )}
                  </div>
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {property.street || "Street not provided"}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span>{propertyOccupants.length} living here</span>
                  <span className="capitalize text-muted-foreground">{property.status}</span>
                </div>
              </button>
            );
          })}
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
            <DialogDescription>
              Each apartment or house is one property. Use the same compound name to group several
              apartments together.
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

            <FormSection title="People living here">
              <p className="text-sm text-muted-foreground">
                Add the name and contact of each known occupant. The first person is treated as the
                main contact.
              </p>
              <div className="space-y-3">
                {occupants.map((occupant, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {index === 0 ? "Main contact" : `Occupant ${index + 1}`}
                      </p>
                      {occupants.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setOccupants((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        value={occupant.fullName}
                        onChange={(event) =>
                          updateOccupant(index, { fullName: event.target.value })
                        }
                        placeholder="Full name"
                      />
                      <Input
                        type="tel"
                        value={occupant.phone}
                        onChange={(event) => updateOccupant(index, { phone: event.target.value })}
                        placeholder="Phone"
                      />
                      <Input
                        type="tel"
                        value={occupant.whatsappNumber}
                        onChange={(event) =>
                          updateOccupant(index, { whatsappNumber: event.target.value })
                        }
                        placeholder="WhatsApp"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOccupants((current) => [...current, emptyOccupant()])}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add another person
              </Button>
            </FormSection>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createProperty.mutate()} disabled={createProperty.isPending}>
              {createProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  return (
    <Dialog open={Boolean(property)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {property?.apartment_name || property?.house_number || "Property"}
          </DialogTitle>
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
                <Detail label="People recorded" value={occupants.length} />
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
              <h3 className="font-display text-lg font-semibold">People living here</h3>
              {occupants.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {occupants.map((occupant) => {
                    const whatsapp = occupant.whatsapp_number || occupant.phone;
                    return (
                      <div
                        key={occupant.id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">{occupant.full_name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {occupant.is_primary ? "Main contact" : "Occupant"}
                            {occupant.phone ? ` · ${occupant.phone}` : ""}
                          </p>
                        </div>
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No occupants have been added.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading properties
    </div>
  );
}

function getWhatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
