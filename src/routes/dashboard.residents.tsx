import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Edit3,
  MessageCircle,
  Phone,
  Search,
  ShieldOff,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { removeCommunityMember } from "@/lib/members.functions";
import { getResidentHousingDetails, syncResidentPropertyOccupancy } from "@/lib/property-occupancy";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/residents")({
  component: ResidentsPage,
});

type Resident = Tables<"profiles">;
type ResidentType = "tenant" | "landlord";

function ResidentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [residentToRemove, setResidentToRemove] = useState<Resident | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [residentType, setResidentType] = useState<ResidentType>("tenant");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [compoundName, setCompoundName] = useState("");
  const [numberOfHouses, setNumberOfHouses] = useState("");
  const [peopleInCompound, setPeopleInCompound] = useState("");
  const [peopleInHouse, setPeopleInHouse] = useState("");

  const {
    data: residents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["resident-editor-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, compound_name, house_number, owner_name, owner_phone, status")
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

  const filteredResidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residents;

    return residents.filter((resident) => {
      const housing = getResidentHousingDetails(resident);
      return [
        resident.full_name,
        resident.phone,
        resident.whatsapp_number,
        resident.email,
        housing.compoundName,
        housing.houseOrApartment,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [residents, search]);

  const activeCount = residents.filter((resident) => resident.status === "active").length;
  const suspendedCount = residents.filter((resident) => resident.status === "suspended").length;

  const updateStatus = useMutation({
    mutationFn: async ({
      resident,
      status,
    }: {
      resident: Resident;
      status: "active" | "suspended";
    }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", resident.id);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      toast.success(variables.status === "suspended" ? "Member suspended" : "Member reactivated");
      await queryClient.invalidateQueries({ queryKey: ["residents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editingResident) throw new Error("Choose a member to edit.");
      if (!fullName.trim()) throw new Error("Enter the member's name.");
      if (residentType === "tenant" && !selectedProperty) {
        throw new Error("Choose the tenant's house.");
      }
      if (residentType === "tenant" && Number(peopleInHouse) < 1) {
        throw new Error("Enter how many people live in the house.");
      }
      if (residentType === "landlord" && !compoundName.trim()) {
        throw new Error("Enter the landlord's compound.");
      }

      const oldData =
        editingResident.onboarding_data && typeof editingResident.onboarding_data === "object"
          ? editingResident.onboarding_data
          : {};

      const onboardingData = {
        ...oldData,
        propertyId: residentType === "tenant" ? selectedProperty?.id || "" : "",
        compoundName:
          residentType === "tenant" ? selectedProperty?.compound_name || "" : compoundName.trim(),
        houseOrApartment: residentType === "tenant" ? selectedProperty?.house_number || "" : "",
        numberOfHouses: residentType === "landlord" ? Number(numberOfHouses) || null : null,
        peopleInCompound: residentType === "landlord" ? Number(peopleInCompound) || null : null,
        peopleInHouse: residentType === "tenant" ? Number(peopleInHouse) : null,
        landlordName: residentType === "tenant" ? selectedProperty?.owner_name || "" : "",
        landlordPhone: residentType === "tenant" ? selectedProperty?.owner_phone || "" : "",
        stayDuration: "",
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          whatsapp_number: whatsappNumber.trim() || phone.trim() || null,
          resident_type: residentType,
          onboarding_data: onboardingData,
        })
        .eq("id", editingResident.id);

      if (error) throw error;

      await syncResidentPropertyOccupancy({
        id: editingResident.id,
        estate_id: editingResident.estate_id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || phone.trim() || null,
        resident_type: residentType,
        onboarding_data: onboardingData,
      });
    },
    onSuccess: async () => {
      toast.success("Member details updated");
      setEditingResident(null);
      await queryClient.invalidateQueries({ queryKey: ["residents"] });
      await queryClient.invalidateQueries({ queryKey: ["property-occupants"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMember = useMutation({
    mutationFn: async (resident: Resident) => {
      await removeCommunityMember({ data: { memberId: resident.id } });
    },
    onSuccess: async () => {
      toast.success("Member removed");
      setResidentToRemove(null);
      setSelectedResident(null);
      await queryClient.invalidateQueries({ queryKey: ["residents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEditor = (resident: Resident) => {
    const housing = getResidentHousingDetails(resident);
    setEditingResident(resident);
    setSelectedResident(null);
    setFullName(resident.full_name || "");
    setPhone(resident.phone || "");
    setWhatsappNumber(resident.whatsapp_number || resident.phone || "");
    setResidentType(resident.resident_type || "tenant");
    setSelectedPropertyId(housing.propertyId);
    setCompoundName(housing.compoundName);
    setNumberOfHouses(housing.numberOfHouses);
    setPeopleInCompound(housing.peopleInCompound);
    setPeopleInHouse(housing.peopleInHouse);
  };

  return (
    <div>
      <PageHeader
        title="Community members"
        description="Simple name list with house numbers for everyone in the estate."
        icon={Users}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Total members" value={residents.length} />
        <Stat label="Active" value={activeCount} />
        <Stat label="Suspended" value={suspendedCount} />
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone or house number"
        />
      </div>

      {isError ? (
        <PageLoadError onRetry={() => void refetch()} />
      ) : isLoading ? (
        <PageLoading label="Loading community members" onRetry={() => void refetch()} />
      ) : filteredResidents.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(88px,0.7fr)_auto] gap-3 border-b border-border bg-secondary/30 px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.9fr)_auto] sm:px-5 sm:text-xs">
            <span>Name</span>
            <span>House number</span>
            <span className="text-right">WhatsApp</span>
          </div>

          {filteredResidents.map((resident, index) => {
            const housing = getResidentHousingDetails(resident);
            const houseLabel =
              resident.resident_type === "landlord"
                ? housing.compoundName || "No compound set"
                : housing.houseOrApartment || "No house set";
            const whatsapp = resident.whatsapp_number || resident.phone;
            const profileComplete = Boolean(
              resident.onboarding_completed &&
              resident.full_name &&
              (resident.resident_type === "landlord"
                ? housing.compoundName
                : housing.houseOrApartment),
            );

            return (
              <div
                key={resident.id}
                className={`grid grid-cols-[minmax(0,1.4fr)_minmax(88px,0.7fr)_auto] items-center gap-3 px-3 py-2.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.9fr)_auto] sm:px-5 ${
                  index !== filteredResidents.length - 1 ? "border-b border-border" : ""
                } ${profileComplete ? "bg-emerald-500/5" : "bg-red-500/5"}`}
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => setSelectedResident(resident)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 flex-none rounded-full ${
                        profileComplete ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <p className="truncate text-sm font-semibold">
                      {resident.full_name || "Unnamed member"}
                    </p>
                    {profileComplete ? (
                      <BadgeCheck className="hidden h-4 w-4 flex-none text-emerald-600 sm:block" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] capitalize text-muted-foreground sm:text-xs">
                    {resident.status === "suspended"
                      ? "Suspended"
                      : resident.resident_type || "Profile pending"}
                  </p>
                </button>

                <button
                  type="button"
                  className="truncate text-left text-sm text-muted-foreground"
                  onClick={() => setSelectedResident(resident)}
                >
                  {houseLabel}
                </button>

                <div className="flex justify-end">
                  {whatsapp ? (
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                      <a href={getWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">Open WhatsApp</span>
                      </a>
                    </Button>
                  ) : (
                    <span className="inline-block h-8 w-8" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={search ? "No matching members" : "No community members"}
          description={
            search ? "Try another name, number or house number." : "New members will appear here."
          }
        />
      )}

      <MemberDetails
        resident={selectedResident}
        isCurrentUser={selectedResident?.id === user?.id}
        onClose={() => setSelectedResident(null)}
        onEdit={openEditor}
        onToggleStatus={(resident) =>
          updateStatus.mutate({
            resident,
            status: resident.status === "suspended" ? "active" : "suspended",
          })
        }
        onRemove={(resident) => setResidentToRemove(resident)}
      />

      <Dialog
        open={Boolean(editingResident)}
        onOpenChange={(open) => !open && setEditingResident(null)}
      >
        <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>Update contact and compound or house details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </Field>
            <Field label="Member type">
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
            <Field label="Phone number">
              <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="WhatsApp number">
              <Input
                type="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
              />
            </Field>
            {residentType === "landlord" ? (
              <>
                <Field label="Compound">
                  <Input
                    value={compoundName}
                    onChange={(event) => setCompoundName(event.target.value)}
                  />
                </Field>
                <Field label="Houses in compound">
                  <Input
                    type="number"
                    min="1"
                    value={numberOfHouses}
                    onChange={(event) => setNumberOfHouses(event.target.value)}
                  />
                </Field>
                <Field label="People living in compound">
                  <Input
                    type="number"
                    min="1"
                    value={peopleInCompound}
                    onChange={(event) => setPeopleInCompound(event.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="House">
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a compound and house" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.compound_name || "Unnamed compound"} · {property.house_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="People living in house">
                  <Input
                    type="number"
                    min="1"
                    value={peopleInHouse}
                    onChange={(event) => setPeopleInHouse(event.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResident(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveEdit.mutate()}
              loading={saveEdit.isPending}
              loadingLabel="Saving member"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(residentToRemove)}
        onOpenChange={(open) => !open && setResidentToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>
              {residentToRemove?.full_name || "This member"} will lose access to the community
              platform. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => residentToRemove && removeMember.mutate(residentToRemove)}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberDetails({
  resident,
  isCurrentUser,
  onClose,
  onEdit,
  onToggleStatus,
  onRemove,
}: {
  resident: Resident | null;
  isCurrentUser: boolean;
  onClose: () => void;
  onEdit: (resident: Resident) => void;
  onToggleStatus: (resident: Resident) => void;
  onRemove: (resident: Resident) => void;
}) {
  const housing = resident ? getResidentHousingDetails(resident) : emptyHousingDetails();
  const whatsapp = resident?.whatsapp_number || resident?.phone;
  const profileComplete = Boolean(
    resident?.onboarding_completed &&
    resident?.full_name &&
    (resident.resident_type === "landlord" ? housing.compoundName : housing.houseOrApartment),
  );

  return (
    <Dialog open={Boolean(resident)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[82dvh] overflow-y-auto sm:max-h-[92vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{resident?.full_name || "Community member"}</DialogTitle>
          <DialogDescription>Contact, home and account details.</DialogDescription>
        </DialogHeader>
        {resident && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  profileComplete
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-red-500/15 text-red-700"
                }`}
              >
                {profileComplete ? "Profile complete" : "Profile incomplete"}
              </span>
              {resident.status === "suspended" ? (
                <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-700">
                  Suspended
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {whatsapp ? (
                <Button asChild size="sm" variant="outline">
                  <a href={getWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              {resident.phone ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${resident.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => onEdit(resident)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onToggleStatus(resident)}>
                {resident.status === "suspended" ? (
                  <UserCheck className="mr-2 h-4 w-4" />
                ) : (
                  <ShieldOff className="mr-2 h-4 w-4" />
                )}
                {resident.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
              {!isCurrentUser ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(resident)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Name" value={resident.full_name} />
              <Detail label="Type" value={resident.resident_type} />
              <Detail label="Status" value={resident.status} />
              <Detail label="Compound" value={housing.compoundName} />
              {resident.resident_type === "tenant" && (
                <Detail label="House number" value={housing.houseOrApartment} />
              )}
              <Detail label="Phone" value={resident.phone} />
              <Detail label="WhatsApp" value={resident.whatsapp_number || resident.phone} />
              <Detail label="Email" value={resident.email} />
              {resident.resident_type === "tenant" && (
                <>
                  <Detail label="Landlord name" value={housing.landlordName} />
                  <Detail label="Landlord phone" value={housing.landlordPhone} />
                  <Detail label="People living in house" value={housing.peopleInHouse} />
                </>
              )}
              {resident.resident_type === "landlord" && (
                <>
                  <Detail label="Houses in compound" value={housing.numberOfHouses} />
                  <Detail label="People living in compound" value={housing.peopleInCompound} />
                </>
              )}
              <Detail
                label="Emergency contact"
                value={formatContact(
                  resident.emergency_contact_name,
                  resident.emergency_contact_phone,
                )}
                wide
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function emptyHousingDetails() {
  return {
    propertyId: "",
    compoundName: "",
    houseOrApartment: "",
    numberOfHouses: "",
    peopleInCompound: "",
    peopleInHouse: "",
    landlordName: "",
    landlordPhone: "",
    stayDuration: "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap capitalize">{value || "Not provided"}</p>
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

function formatContact(name?: string | null, phone?: string | null) {
  if (name && phone) return `${name} - ${phone}`;
  return name || phone || "";
}

function getWhatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
