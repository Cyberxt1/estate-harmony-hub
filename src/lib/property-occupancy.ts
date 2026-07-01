import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

type ResidentProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "estate_id"
  | "full_name"
  | "phone"
  | "whatsapp_number"
  | "resident_type"
  | "onboarding_data"
>;

type PropertyRecord = Pick<
  Tables<"properties">,
  | "id"
  | "estate_id"
  | "compound_name"
  | "house_number"
  | "apartment_name"
  | "owner_name"
  | "owner_phone"
>;

type PropertyOccupant = Tables<"property_occupants">;

export type ResidentHousingDetails = {
  propertyId: string;
  compoundName: string;
  houseOrApartment: string;
  numberOfHouses: string;
  peopleInCompound: string;
  peopleInHouse: string;
  landlordName: string;
  landlordPhone: string;
  stayDuration: string;
};

export function getResidentHousingDetails(resident: Pick<Tables<"profiles">, "onboarding_data">) {
  const submitted =
    resident.onboarding_data && typeof resident.onboarding_data === "object"
      ? (resident.onboarding_data as Record<string, unknown>)
      : {};

  const legacyHouseholdCount = /^\d+$/.test(String(submitted.householdMembers || "").trim())
    ? String(submitted.householdMembers).trim()
    : "";

  return {
    propertyId: String(submitted.propertyId || "").trim(),
    compoundName: String(submitted.compoundName || "").trim(),
    houseOrApartment: String(submitted.houseOrApartment || "").trim(),
    numberOfHouses: String(submitted.numberOfHouses || "").trim(),
    peopleInCompound: String(submitted.peopleInCompound || "").trim(),
    peopleInHouse: String(submitted.peopleInHouse || legacyHouseholdCount).trim(),
    landlordName: String(submitted.landlordName || "").trim(),
    landlordPhone: String(submitted.landlordPhone || "").trim(),
    stayDuration: String(submitted.stayDuration || "").trim(),
  } satisfies ResidentHousingDetails;
}

export function getPropertyLabel(
  property: Pick<Tables<"properties">, "house_number" | "apartment_name">,
) {
  return property.apartment_name
    ? `${property.house_number} - ${property.apartment_name}`
    : property.house_number;
}

export function groupResidentsByHouse<
  T extends Pick<Tables<"profiles">, "id" | "full_name" | "onboarding_data">,
>(residents: T[]) {
  const grouped = new Map<
    string,
    {
      houseLabel: string;
      houseSort: string;
      members: Array<T & { memberNumber: number }>;
    }
  >();

  residents.forEach((resident) => {
    const details = getResidentHousingDetails(resident);
    const house = details.houseOrApartment || "No house set";
    const compound = details.compoundName || "";
    const houseLabel = compound ? `${compound} - ${house}` : house;
    const key = details.propertyId || normalizeText(`${compound}::${house}`);
    const current = grouped.get(key) ?? {
      houseLabel,
      houseSort: normalizeText(houseLabel),
      members: [],
    };
    current.members.push({
      ...resident,
      memberNumber: current.members.length + 1,
    });
    grouped.set(key, current);
  });

  return [...grouped.values()].sort((a, b) =>
    a.houseSort.localeCompare(b.houseSort, undefined, { numeric: true }),
  );
}

export function sortPropertiesByHouse<
  T extends Pick<Tables<"properties">, "compound_name" | "house_number" | "apartment_name">,
>(properties: T[]) {
  return [...properties].sort((a, b) => {
    const aLabel = normalizeText(`${a.compound_name || ""} ${getPropertyLabel(a)}`);
    const bLabel = normalizeText(`${b.compound_name || ""} ${getPropertyLabel(b)}`);
    return aLabel.localeCompare(bLabel, undefined, { numeric: true });
  });
}

export function classifyPropertyOccupants(occupants: PropertyOccupant[]) {
  const currentLandlords = occupants.filter(
    (occupant) => occupant.occupant_type === "landlord" && occupant.is_current,
  );
  const currentTenants = occupants.filter(
    (occupant) => occupant.occupant_type === "tenant" && occupant.is_current,
  );
  const previousTenants = occupants.filter(
    (occupant) => occupant.occupant_type === "tenant" && !occupant.is_current,
  );

  return { currentLandlords, currentTenants, previousTenants };
}

export async function syncResidentPropertyOccupancy(resident: ResidentProfile) {
  if (!resident.estate_id) return { matched: false as const };

  const details = getResidentHousingDetails(resident);
  const today = new Date().toISOString().slice(0, 10);

  const { data: currentOccupancies, error: currentError } = await supabase
    .from("property_occupants")
    .select("*")
    .eq("resident_id", resident.id)
    .eq("is_current", true);

  if (currentError) throw currentError;

  // A landlord owns a house through properties.owner_id. Do not create a
  // resident occupancy that could incorrectly make relatives co-owners.
  if (resident.resident_type !== "tenant") {
    await closeOccupancies(currentOccupancies ?? [], today);
    return { matched: false as const };
  }

  const { data: properties, error: propertyError } = await supabase
    .from("properties")
    .select("id, estate_id, compound_name, house_number, apartment_name, owner_name, owner_phone")
    .eq("estate_id", resident.estate_id);

  if (propertyError) throw propertyError;

  const matchingProperty = findMatchingProperty(properties ?? [], details);
  const occupanciesToClose = (currentOccupancies ?? []).filter(
    (occupancy) => !matchingProperty || occupancy.property_id !== matchingProperty.id,
  );
  await closeOccupancies(occupanciesToClose, today);

  if (!matchingProperty) return { matched: false as const };

  const payload: Database["public"]["Tables"]["property_occupants"]["Update"] = {
    estate_id: resident.estate_id,
    property_id: matchingProperty.id,
    resident_id: resident.id,
    full_name: resident.full_name?.trim() || "Unnamed resident",
    phone: resident.phone?.trim() || null,
    whatsapp_number: resident.whatsapp_number?.trim() || resident.phone?.trim() || null,
    occupant_type: "tenant",
    household_size: toPositiveInteger(details.peopleInHouse),
    landlord_name: matchingProperty.owner_name,
    landlord_phone: matchingProperty.owner_phone,
    stay_duration: null,
    is_primary: true,
    is_current: true,
    move_in_date: today,
    move_out_date: null,
  };

  const existingOnTarget = (currentOccupancies ?? []).find(
    (occupancy) => occupancy.property_id === matchingProperty.id,
  );

  if (existingOnTarget) {
    const { error: updateError } = await supabase
      .from("property_occupants")
      .update(payload)
      .eq("id", existingOnTarget.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("property_occupants")
      .insert(payload as Database["public"]["Tables"]["property_occupants"]["Insert"]);

    if (insertError) throw insertError;
  }

  return { matched: true as const, propertyId: matchingProperty.id };
}

async function closeOccupancies(occupancies: PropertyOccupant[], today: string) {
  if (occupancies.length === 0) return;

  const { error } = await supabase
    .from("property_occupants")
    .update({ is_current: false, move_out_date: today })
    .in(
      "id",
      occupancies.map((occupancy) => occupancy.id),
    );
  if (error) throw error;
}

function findMatchingProperty(properties: PropertyRecord[], details: ResidentHousingDetails) {
  if (details.propertyId) {
    return properties.find((property) => property.id === details.propertyId) ?? null;
  }

  // Keep old completed profiles working until they choose a house from the
  // new dropdown during their next edit.
  const house = normalizeText(details.houseOrApartment);
  const compound = normalizeText(details.compoundName);
  if (!house) return null;

  const directMatches = properties.filter((property) => {
    const labels = [
      property.house_number,
      property.apartment_name || "",
      getPropertyLabel(property),
      `${property.house_number} ${property.apartment_name || ""}`,
    ].map(normalizeText);
    return labels.includes(house);
  });

  if (directMatches.length === 0) return null;
  if (!compound) return directMatches[0];
  return (
    directMatches.find((property) => normalizeText(property.compound_name || "") === compound) ??
    directMatches[0]
  );
}

function toPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
