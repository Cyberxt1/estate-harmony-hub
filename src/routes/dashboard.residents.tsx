import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import { removeCommunityMember } from "@/lib/members.functions";
import {
  getResidentHousingDetails,
  groupResidentsByHouse,
  syncResidentPropertyOccupancy,
} from "@/lib/property-occupancy";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/page-header";
import { PageLoadError, PageLoading } from "@/components/page-loading";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [compoundName, setCompoundName] = useState("");
  const [houseOrApartment, setHouseOrApartment] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [stayDuration, setStayDuration] = useState("");

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

  const groupedResidents = useMemo(
    () => groupResidentsByHouse(filteredResidents),
    [filteredResidents],
  );
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

      const oldData =
        editingResident.onboarding_data && typeof editingResident.onboarding_data === "object"
          ? editingResident.onboarding_data
          : {};

      const onboardingData = {
        ...oldData,
        compoundName: compoundName.trim(),
        houseOrApartment: houseOrApartment.trim(),
        landlordName: residentType === "tenant" ? landlordName.trim() : "",
        landlordPhone: residentType === "tenant" ? landlordPhone.trim() : "",
        stayDuration: residentType === "tenant" ? stayDuration.trim() : "",
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
    setFullName(resident.full_name || "");
    setPhone(resident.phone || "");
    setWhatsappNumber(resident.whatsapp_number || resident.phone || "");
    setResidentType(resident.resident_type || "tenant");
    setCompoundName(housing.compoundName);
    setHouseOrApartment(housing.houseOrApartment);
    setLandlordName(housing.landlordName);
    setLandlordPhone(housing.landlordPhone);
    setStayDuration(housing.stayDuration);
  };

  return (
    <div>
      <PageHeader
        title="Community members"
        description="Smaller house-by-house view of everyone in the estate."
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
          placeholder="Search name, phone or house"
        />
      </div>

      {isError ? (
        <PageLoadError onRetry={() => void refetch()} />
      ) : isLoading ? (
        <PageLoading label="Loading community members" onRetry={() => void refetch()} />
      ) : filteredResidents.length > 0 ? (
        <div className="space-y-4">
          {groupedResidents.map((group) => (
            <section
              key={group.houseLabel}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">House</p>
                  <h2 className="text-sm font-semibold">{group.houseLabel}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.members.length} {group.members.length === 1 ? "member" : "members"}
                </span>
              </div>

              {group.members.map((resident, index) => {
                const whatsapp = resident.whatsapp_number || resident.phone;
                return (
                  <article
                    key={resident.id}
                    className={`px-4 py-3 sm:px-5 ${index !== group.members.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setSelectedResident(resident)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/80">
                            {resident.memberNumber}
                          </span>
                          <h3 className="text-sm font-semibold sm:text-base">
                            {resident.full_name || "Unnamed member"}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                              resident.status === "suspended"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {resident.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs capitalize text-muted-foreground sm:text-sm">
                          {resident.resident_type || "Details incomplete"}
                          {resident.phone ? ` · ${resident.phone}` : ""}
                        </p>
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {whatsapp && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={getWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                        {resident.phone && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={`tel:${resident.phone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEditor(resident)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStatus.mutate({
                              resident,
                              status: resident.status === "suspended" ? "active" : "suspended",
                            })
                          }
                        >
                          {resident.status === "suspended" ? (
                            <UserCheck className="mr-2 h-4 w-4" />
                          ) : (
                            <ShieldOff className="mr-2 h-4 w-4" />
                          )}
                          {resident.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                        {resident.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setResidentToRemove(resident)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? "No matching members" : "No community members"}
          description={
            search ? "Try another name, number or house." : "New members will appear here."
          }
        />
      )}

      <MemberDetails resident={selectedResident} onClose={() => setSelectedResident(null)} />

      <Dialog
        open={Boolean(editingResident)}
        onOpenChange={(open) => !open && setEditingResident(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>Update contact, house and tenant details.</DialogDescription>
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
            <Field label="Compound">
              <Input
                value={compoundName}
                onChange={(event) => setCompoundName(event.target.value)}
              />
            </Field>
            <Field label="House or apartment">
              <Input
                value={houseOrApartment}
                onChange={(event) => setHouseOrApartment(event.target.value)}
              />
            </Field>
            {residentType === "tenant" && (
              <>
                <Field label="Landlord name">
                  <Input
                    value={landlordName}
                    onChange={(event) => setLandlordName(event.target.value)}
                  />
                </Field>
                <Field label="Landlord phone">
                  <Input
                    type="tel"
                    value={landlordPhone}
                    onChange={(event) => setLandlordPhone(event.target.value)}
                  />
                </Field>
                <Field label="Duration of stay">
                  <Input
                    value={stayDuration}
                    onChange={(event) => setStayDuration(event.target.value)}
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

function MemberDetails({ resident, onClose }: { resident: Resident | null; onClose: () => void }) {
  const submitted = resident ? getSubmittedData(resident) : {};
  const housing = resident ? getResidentHousingDetails(resident) : emptyHousingDetails();

  return (
    <Dialog open={Boolean(resident)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{resident?.full_name || "Community member"}</DialogTitle>
          <DialogDescription>Contact, home and account details.</DialogDescription>
        </DialogHeader>
        {resident && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Type" value={resident.resident_type} />
            <Detail label="Status" value={resident.status} />
            <Detail label="Phone" value={resident.phone} />
            <Detail label="WhatsApp" value={resident.whatsapp_number || resident.phone} />
            <Detail label="Email" value={resident.email} />
            <Detail label="Compound" value={String(submitted.compoundName || "")} />
            <Detail label="House or apartment" value={String(submitted.houseOrApartment || "")} />
            {resident.resident_type === "tenant" && (
              <>
                <Detail label="Landlord name" value={housing.landlordName} />
                <Detail label="Landlord phone" value={housing.landlordPhone} />
                <Detail label="Duration of stay" value={housing.stayDuration} />
              </>
            )}
            <Detail
              label="People living with member"
              value={String(submitted.householdMembers || "")}
              wide
            />
            <Detail
              label="Emergency contact"
              value={`${resident.emergency_contact_name || ""}${
                resident.emergency_contact_phone ? ` · ${resident.emergency_contact_phone}` : ""
              }`}
              wide
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getSubmittedData(resident: Resident) {
  return resident.onboarding_data && typeof resident.onboarding_data === "object"
    ? (resident.onboarding_data as Record<string, unknown>)
    : {};
}

function emptyHousingDetails() {
  return {
    compoundName: "",
    houseOrApartment: "",
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

function getWhatsAppLink(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
