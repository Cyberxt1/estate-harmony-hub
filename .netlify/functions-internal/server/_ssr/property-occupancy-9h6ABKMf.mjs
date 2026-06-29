import { t as supabase } from "./client-yydkHmVi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/property-occupancy-9h6ABKMf.js
function getResidentHousingDetails(resident) {
	const submitted = resident.onboarding_data && typeof resident.onboarding_data === "object" ? resident.onboarding_data : {};
	return {
		compoundName: String(submitted.compoundName || "").trim(),
		houseOrApartment: String(submitted.houseOrApartment || "").trim(),
		landlordName: String(submitted.landlordName || "").trim(),
		landlordPhone: String(submitted.landlordPhone || "").trim(),
		stayDuration: String(submitted.stayDuration || "").trim()
	};
}
function getPropertyLabel(property) {
	return property.apartment_name ? `${property.house_number} - ${property.apartment_name}` : property.house_number;
}
function groupResidentsByHouse(residents) {
	const grouped = /* @__PURE__ */ new Map();
	residents.forEach((resident) => {
		const details = getResidentHousingDetails(resident);
		const house = details.houseOrApartment || "No house set";
		const compound = details.compoundName || "";
		const houseLabel = compound ? `${compound} - ${house}` : house;
		const key = normalizeText(`${compound}::${house}`);
		const current = grouped.get(key) ?? {
			houseLabel,
			houseSort: normalizeText(houseLabel),
			members: []
		};
		current.members.push({
			...resident,
			memberNumber: current.members.length + 1
		});
		grouped.set(key, current);
	});
	return [...grouped.values()].sort((a, b) => a.houseSort.localeCompare(b.houseSort, void 0, { numeric: true }));
}
function sortPropertiesByHouse(properties) {
	return [...properties].sort((a, b) => {
		const aLabel = normalizeText(`${a.compound_name || ""} ${getPropertyLabel(a)}`);
		const bLabel = normalizeText(`${b.compound_name || ""} ${getPropertyLabel(b)}`);
		return aLabel.localeCompare(bLabel, void 0, { numeric: true });
	});
}
function classifyPropertyOccupants(occupants) {
	return {
		currentLandlords: occupants.filter((occupant) => occupant.occupant_type === "landlord" && occupant.is_current),
		currentTenants: occupants.filter((occupant) => occupant.occupant_type === "tenant" && occupant.is_current),
		previousTenants: occupants.filter((occupant) => occupant.occupant_type === "tenant" && !occupant.is_current)
	};
}
async function syncResidentPropertyOccupancy(resident) {
	if (!resident.estate_id || !resident.resident_type) return { matched: false };
	const details = getResidentHousingDetails(resident);
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const { data: currentOccupancies, error: currentError } = await supabase.from("property_occupants").select("*").eq("resident_id", resident.id).eq("is_current", true);
	if (currentError) throw currentError;
	const { data: properties, error: propertyError } = await supabase.from("properties").select("id, estate_id, compound_name, house_number, apartment_name").eq("estate_id", resident.estate_id);
	if (propertyError) throw propertyError;
	const matchingProperty = findMatchingProperty(properties ?? [], details);
	const occupanciesToClose = (currentOccupancies ?? []).filter((occupancy) => !matchingProperty || occupancy.property_id !== matchingProperty.id);
	if (occupanciesToClose.length > 0) {
		const { error: closeError } = await supabase.from("property_occupants").update({
			is_current: false,
			move_out_date: today
		}).in("id", occupanciesToClose.map((occupancy) => occupancy.id));
		if (closeError) throw closeError;
	}
	if (!matchingProperty) return { matched: false };
	const payload = {
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
		move_out_date: null
	};
	const existingOnTarget = (currentOccupancies ?? []).find((occupancy) => occupancy.property_id === matchingProperty.id);
	if (existingOnTarget) {
		const { error: updateError } = await supabase.from("property_occupants").update(payload).eq("id", existingOnTarget.id);
		if (updateError) throw updateError;
	} else {
		const { error: insertError } = await supabase.from("property_occupants").insert(payload);
		if (insertError) throw insertError;
	}
	return {
		matched: true,
		propertyId: matchingProperty.id
	};
}
function findMatchingProperty(properties, details) {
	const house = normalizeText(details.houseOrApartment);
	const compound = normalizeText(details.compoundName);
	if (!house) return null;
	const directMatches = properties.filter((property) => {
		return [
			property.house_number,
			property.apartment_name || "",
			getPropertyLabel(property),
			`${property.house_number} ${property.apartment_name || ""}`
		].map(normalizeText).includes(house);
	});
	if (directMatches.length === 0) return null;
	if (!compound) return directMatches[0];
	return directMatches.find((property) => normalizeText(property.compound_name || "") === compound) ?? directMatches[0];
}
function normalizeText(value) {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}
//#endregion
export { sortPropertiesByHouse as a, groupResidentsByHouse as i, getPropertyLabel as n, syncResidentPropertyOccupancy as o, getResidentHousingDetails as r, classifyPropertyOccupants as t };
