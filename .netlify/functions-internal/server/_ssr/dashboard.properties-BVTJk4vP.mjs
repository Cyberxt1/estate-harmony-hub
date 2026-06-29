import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as House, P as Building2, T as History, _ as Phone, b as MessageCircle, g as Plus, r as UserPlus, t as X } from "../_libs/lucide-react.mjs";
import { a as useAuth } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as sortPropertiesByHouse, n as getPropertyLabel, t as classifyPropertyOccupants } from "./property-occupancy-9h6ABKMf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.properties-BVTJk4vP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyTenant = () => ({
	fullName: "",
	phone: "",
	whatsappNumber: "",
	stayDuration: ""
});
function PropertiesPage() {
	const { profile, isAdmin } = useAuth();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [selectedProperty, setSelectedProperty] = (0, import_react.useState)(null);
	const [compoundName, setCompoundName] = (0, import_react.useState)("");
	const [houseNumber, setHouseNumber] = (0, import_react.useState)("");
	const [apartmentName, setApartmentName] = (0, import_react.useState)("");
	const [street, setStreet] = (0, import_react.useState)("");
	const [propertyType, setPropertyType] = (0, import_react.useState)("apartment");
	const [status, setStatus] = (0, import_react.useState)("occupied");
	const [bedrooms, setBedrooms] = (0, import_react.useState)("");
	const [bathrooms, setBathrooms] = (0, import_react.useState)("");
	const [electricityMeter, setElectricityMeter] = (0, import_react.useState)("");
	const [waterMeter, setWaterMeter] = (0, import_react.useState)("");
	const [occupantCapacity, setOccupantCapacity] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [landlordName, setLandlordName] = (0, import_react.useState)("");
	const [landlordPhone, setLandlordPhone] = (0, import_react.useState)("");
	const [tenants, setTenants] = (0, import_react.useState)([emptyTenant()]);
	const { data: properties = [], isLoading, isError } = useQuery({
		queryKey: ["properties", profile?.estate_id],
		queryFn: async () => {
			const { data, error } = await supabase.from("properties").select("*").order("compound_name", { ascending: true }).order("house_number", { ascending: true });
			if (error) throw error;
			return sortPropertiesByHouse(data ?? []);
		}
	});
	const { data: allOccupants = [], isLoading: occupantsLoading, isError: occupantsError } = useQuery({
		queryKey: ["property-occupants", profile?.estate_id],
		enabled: Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("property_occupants").select("*").order("is_current", { ascending: false }).order("occupant_type", { ascending: true }).order("full_name", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const occupantsByProperty = (0, import_react.useMemo)(() => {
		const grouped = /* @__PURE__ */ new Map();
		allOccupants.forEach((occupant) => {
			grouped.set(occupant.property_id, [...grouped.get(occupant.property_id) ?? [], occupant]);
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
		setLandlordName("");
		setLandlordPhone("");
		setTenants([emptyTenant()]);
	};
	const createProperty = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
			if (!houseNumber.trim()) throw new Error("Enter a house or unit number.");
			const validTenants = tenants.filter((tenant) => tenant.fullName.trim());
			const { data: property, error } = await supabase.from("properties").insert({
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
				notes: notes.trim() || null
			}).select().single();
			if (error) throw error;
			const occupantRows = [];
			if (landlordName.trim()) occupantRows.push({
				estate_id: profile.estate_id,
				property_id: property.id,
				full_name: landlordName.trim(),
				phone: landlordPhone.trim() || null,
				whatsapp_number: landlordPhone.trim() || null,
				occupant_type: "landlord",
				is_primary: true,
				is_current: true
			});
			validTenants.forEach((tenant, index) => {
				occupantRows.push({
					estate_id: profile.estate_id,
					property_id: property.id,
					full_name: tenant.fullName.trim(),
					phone: tenant.phone.trim() || null,
					whatsapp_number: tenant.whatsappNumber.trim() || tenant.phone.trim() || null,
					occupant_type: "tenant",
					landlord_name: landlordName.trim() || null,
					landlord_phone: landlordPhone.trim() || null,
					stay_duration: tenant.stayDuration.trim() || null,
					is_primary: !landlordName.trim() && index === 0,
					is_current: true
				});
			});
			if (occupantRows.length > 0) {
				const { error: occupantError } = await supabase.from("property_occupants").insert(occupantRows);
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
			await Promise.all([queryClient.invalidateQueries({ queryKey: ["properties"] }), queryClient.invalidateQueries({ queryKey: ["property-occupants"] })]);
		},
		onError: (error) => toast.error(error.message)
	});
	const updateTenant = (index, patch) => {
		setTenants((current) => current.map((tenant, tenantIndex) => tenantIndex === index ? {
			...tenant,
			...patch
		} : tenant));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Properties",
			description: "Every property, the landlord in charge, the tenants there now, and the tenants who have moved out.",
			icon: House,
			children: isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => setCreateOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), "Add property"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Properties",
					value: properties.length
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Landlords shown",
					value: allOccupants.filter((occupant) => occupant.occupant_type === "landlord" && occupant.is_current).length
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Current tenants",
					value: allOccupants.filter((occupant) => occupant.occupant_type === "tenant" && occupant.is_current).length
				})
			]
		}),
		isError || occupantsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading || occupantsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading properties",
			onRetry: () => void queryClient.refetchQueries()
		}) : properties.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
			children: properties.map((property) => {
				const { currentLandlords, currentTenants, previousTenants } = classifyPropertyOccupants(occupantsByProperty.get(property.id) ?? []);
				const landlord = currentLandlords[0];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40",
					onClick: () => setSelectedProperty(property),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase text-muted-foreground",
										children: property.compound_name || "Standalone property"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-1 truncate text-base font-semibold",
										children: getPropertyLabel(property)
									}),
									property.street && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 truncate text-sm text-muted-foreground",
										children: property.street
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-5 w-5 shrink-0 text-primary" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Landlord:"
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: landlord?.full_name || "Not added"
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Current tenants:"
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: currentTenants.length > 0 ? currentTenants.map((tenant) => tenant.full_name).join(", ") : "None"
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "capitalize",
								children: property.status.replace("_", " ")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								previousTenants.length,
								" previous tenant",
								previousTenants.length === 1 ? "" : "s"
							] })]
						})
					]
				}, property.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "No properties yet",
			description: "Add compounds, houses and apartments to build the community property list."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: createOpen,
			onOpenChange: (open) => {
				setCreateOpen(open);
				if (!open) resetForm();
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add property" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Add the property itself, then record the landlord and any current tenants." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSection, {
								title: "Location",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Compound name",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: compoundName,
												onChange: (event) => setCompoundName(event.target.value),
												placeholder: "Adebayo Compound"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "House or unit number",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: houseNumber,
												onChange: (event) => setHouseNumber(event.target.value),
												placeholder: "House 4"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Apartment name",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: apartmentName,
												onChange: (event) => setApartmentName(event.target.value),
												placeholder: "Flat B"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Street",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: street,
												onChange: (event) => setStreet(event.target.value)
											})
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormSection, {
								title: "Property details",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Property type",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: propertyType,
												onValueChange: (value) => setPropertyType(value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
													"apartment",
													"detached",
													"semi_detached",
													"terrace",
													"duplex",
													"bungalow"
												].map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: type,
													className: "capitalize",
													children: type.replace("_", " ")
												}, type)) })]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Status",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: status,
												onValueChange: (value) => setStatus(value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "occupied",
														children: "Occupied"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "vacant",
														children: "Vacant"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "under_maintenance",
														children: "Under maintenance"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "reserved",
														children: "Reserved"
													})
												] })]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Bedrooms",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												value: bedrooms,
												onChange: (event) => setBedrooms(event.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Bathrooms",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												value: bathrooms,
												onChange: (event) => setBathrooms(event.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Maximum occupants",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												value: occupantCapacity,
												onChange: (event) => setOccupantCapacity(event.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Electricity meter",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: electricityMeter,
												onChange: (event) => setElectricityMeter(event.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Water meter",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: waterMeter,
												onChange: (event) => setWaterMeter(event.target.value)
											})
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Other details",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										value: notes,
										onChange: (event) => setNotes(event.target.value)
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSection, {
								title: "Landlord",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Landlord name",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: landlordName,
											onChange: (event) => setLandlordName(event.target.value),
											placeholder: "Owner of this property"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Landlord phone",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "tel",
											value: landlordPhone,
											onChange: (event) => setLandlordPhone(event.target.value),
											placeholder: "080..."
										})
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormSection, {
								title: "Current tenants",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Tenants do not own the property. Add their stay details here if they are already living in it."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-3",
										children: tenants.map((tenant, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-3 flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm font-medium",
													children: ["Tenant ", index + 1]
												}), tenants.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "icon",
													variant: "ghost",
													onClick: () => setTenants((current) => current.filter((_, itemIndex) => itemIndex !== index)),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-3 sm:grid-cols-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: tenant.fullName,
														onChange: (event) => updateTenant(index, { fullName: event.target.value }),
														placeholder: "Full name"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "tel",
														value: tenant.phone,
														onChange: (event) => updateTenant(index, { phone: event.target.value }),
														placeholder: "Phone"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "tel",
														value: tenant.whatsappNumber,
														onChange: (event) => updateTenant(index, { whatsappNumber: event.target.value }),
														placeholder: "WhatsApp"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: tenant.stayDuration,
														onChange: (event) => updateTenant(index, { stayDuration: event.target.value }),
														placeholder: "Duration of stay"
													})
												]
											})]
										}, index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "outline",
										onClick: () => setTenants((current) => [...current, emptyTenant()]),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "mr-2 h-4 w-4" }), "Add another tenant"]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setCreateOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => createProperty.mutate(),
						loading: createProperty.isPending,
						loadingLabel: "Adding property",
						children: "Add property"
					})] })
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropertyDetails, {
			property: selectedProperty,
			occupants: selectedProperty ? occupantsByProperty.get(selectedProperty.id) ?? [] : [],
			onClose: () => setSelectedProperty(null)
		})
	] });
}
function PropertyDetails({ property, occupants, onClose }) {
	const { currentLandlords, currentTenants, previousTenants } = classifyPropertyOccupants(occupants);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(property),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto sm:max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: property ? getPropertyLabel(property) : "Property" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: property ? [
				property.compound_name,
				property.house_number,
				property.street
			].filter(Boolean).join(" · ") : "" })] }), property && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Property details"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Type",
									value: property.property_type.replace("_", " ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Status",
									value: property.status.replace("_", " ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Bedrooms",
									value: property.bedrooms
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Bathrooms",
									value: property.bathrooms
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Occupant capacity",
									value: property.occupant_capacity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Electricity meter",
									value: property.electricity_meter
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Water meter",
									value: property.water_meter
								})
							]
						}),
						property.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 whitespace-pre-wrap rounded-lg bg-secondary/35 p-4 text-sm",
							children: property.notes
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OccupantSection, {
						title: "Landlord",
						emptyText: "No landlord has been added.",
						occupants: currentLandlords
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OccupantSection, {
						title: "Current tenants",
						emptyText: "No current tenants have been added.",
						occupants: currentTenants
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Previous tenants"
						})]
					}), previousTenants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 space-y-3",
						children: previousTenants.map((occupant) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OccupantRow, {
							occupant,
							previous: true
						}, occupant.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "No previous tenant history yet."
					})] })
				]
			})]
		})
	});
}
function OccupantSection({ title, occupants, emptyText }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "font-display text-lg font-semibold",
		children: title
	}), occupants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 space-y-3",
		children: occupants.map((occupant) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OccupantRow, { occupant }, occupant.id))
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-3 text-sm text-muted-foreground",
		children: emptyText
	})] });
}
function OccupantRow({ occupant, previous = false }) {
	const whatsapp = occupant.whatsapp_number || occupant.phone;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: occupant.full_name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					occupant.occupant_type === "landlord" ? "Landlord" : "Tenant",
					occupant.phone ? ` · ${occupant.phone}` : "",
					occupant.stay_duration ? ` · ${occupant.stay_duration}` : ""
				]
			}),
			occupant.occupant_type === "tenant" && (occupant.landlord_name || occupant.landlord_phone) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					"Landlord: ",
					occupant.landlord_name || "Not provided",
					occupant.landlord_phone ? ` · ${occupant.landlord_phone}` : ""
				]
			}),
			previous && occupant.move_out_date && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: ["Moved out: ", formatDate(occupant.move_out_date)]
			})
		] }), !previous && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				variant: "outline",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: getWhatsAppLink(whatsapp),
					target: "_blank",
					rel: "noreferrer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mr-2 h-4 w-4" }), "WhatsApp"]
				})
			}), occupant.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				variant: "outline",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: `tel:${occupant.phone}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "mr-2 h-4 w-4" }), "Call"]
				})
			})]
		})]
	});
}
function FormSection({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "font-display text-lg font-semibold",
			children: title
		}), children]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function Detail({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 capitalize",
			children: value ?? "Not provided"
		})]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-2xl font-semibold",
			children: value
		})]
	});
}
function getWhatsAppLink(number) {
	const digits = number.replace(/\D/g, "");
	return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
}
function formatDate(value) {
	if (!value) return "Not provided";
	return new Date(value).toLocaleDateString("en-NG", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
//#endregion
export { PropertiesPage as component };
