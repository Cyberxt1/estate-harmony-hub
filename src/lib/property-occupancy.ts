import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
  "id" | "estate_id" | "compound_name" | "house_number" | "apartment_name"
>;

type PropertyOccupant = Tables<"property_occupants">;

export type ResidentHousingDetails = {
  compoundName: string;
  houseOrApartment: string;
  landlordName: string;
  landlordPhone: string;
  stayDuration: string;
};

export function getResidentHousingDetails(resident: Pick<Tables<"profiles">, "onboarding_data">) {
  const submitted =
    resident.onboarding_data && typeof resident.onboarding_data === "object"
      ? (resident.onboarding_data as Record<string, unknown>)
      : {};

  return {
    compoundName: String(submitted.compoundName || "").trim(),
    houseOrApartment: String(submitted.houseOrApartment || "").trim(),
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
    const key = normalizeText(`${compound}::${house}`);
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
  if (!resident.estate_id || !resident.resident_type) return { matched: false as const };

  const details = getResidentHousingDetails(resident);
  const today = new Date().toISOString().slice(0, 10);

  const { data: currentOccupancies, error: currentError } = await supabase
    .from("property_occupants")
    .select("*")
    .eq("resident_id", resident.id)
    .eq("is_current", true);

  if (currentError) throw currentError;

  const { data: properties, error: propertyError } = await supabase
    .from("properties")
    .select("id, estate_id, compound_name, house_number, apartment_name")
    .eq("estate_id", resident.estate_id);

  if (propertyError) throw propertyError;

  const matchingProperty = findMatchingProperty(properties ?? [], details);

  const occupanciesToClose = (currentOccupancies ?? []).filter(
    (occupancy) => !matchingProperty || occupancy.property_id !== matchingProperty.id,
  );

  if (occupanciesToClose.length > 0) {
    const { error: closeError } = await supabase
      .from("property_occupants")
      .update({
        is_current: false,
        move_out_date: today,
      })
      .in(
        "id",
        occupanciesToClose.map((occupancy) => occupancy.id),
      );

    if (closeError) throw closeError;
  }

  if (!matchingProperty) return { matched: false as const };

  const payload: Tables<"property_occupants">["Update"] = {
    estate_id: resident.estate_id,
    property_id: matchingProperty.id,
    resident_id: resident.id,
    full_name: resident.full_name?.trim() || "Unnamed resident",
    phone: resident.phone?.trim() || null,
    whatsapp_number: resident.whatsapp_number?.trim() || resident.phone?.trim() || null,
    occupant_type: resident.resident_type,
    landlord_name: resident.resident_type === "tenant" ? details.landlordName || null : null,
    landlord_phone: resident.resident_type === "tenant" ? details.landlordPhone || null : null,
    stay_duration: resident.resident_type === "tenant" ? details.stayDuration || null : null,
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
      .insert(payload as Tables<"property_occupants">["Insert"]);

    if (insertError) throw insertError;
  }

  return { matched: true as const, propertyId: matchingProperty.id };
}

function findMatchingProperty(properties: PropertyRecord[], details: ResidentHousingDetails) {
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

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
