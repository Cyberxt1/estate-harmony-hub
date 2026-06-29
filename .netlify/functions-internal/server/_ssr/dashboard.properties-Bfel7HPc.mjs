import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { P as House, g as Phone, h as Plus, j as Building2, r as UserPlus, t as X, v as MessageCircle } from "../_libs/lucide-react.mjs";
import { r as useAuth } from "./use-auth-CJoPS59J.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.properties-Bfel7HPc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyOccupant = () => ({
	fullName: "",
	phone: "",
	whatsappNumber: ""
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
	const [occupants, setOccupants] = (0, import_react.useState)([emptyOccupant()]);
	const { data: properties = [], isLoading, isError } = useQuery({
		queryKey: ["properties", profile?.estate_id],
		queryFn: async () => {
			const { data, error } = await supabase.from("properties").select("*").order("compound_name", { ascending: true }).order("house_number", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: allOccupants = [], isLoading: occupantsLoading, isError: occupantsError } = useQuery({
		queryKey: ["property-occupants", profile?.estate_id],
		enabled: Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("property_occupants").select("*").order("is_primary", { ascending: false }).order("full_name", { ascending: true });
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
		setOccupants([emptyOccupant()]);
	};
	const createProperty = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
			if (!houseNumber.trim()) throw new Error("Enter a house or unit number.");
			const validOccupants = occupants.filter((occupant) => occupant.fullName.trim());
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
			if (validOccupants.length > 0) {
				const { error: occupantError } = await supabase.from("property_occupants").insert(validOccupants.map((occupant, index) => ({
					estate_id: profile.estate_id,
					property_id: property.id,
					full_name: occupant.fullName.trim(),
					phone: occupant.phone.trim() || null,
					whatsapp_number: occupant.whatsappNumber.trim() || occupant.phone.trim() || null,
					is_primary: index === 0
				})));
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
	const updateOccupant = (index, patch) => {
		setOccupants((current) => current.map((occupant, occupantIndex) => occupantIndex === index ? {
			...occupant,
			...patch
		} : occupant));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Properties",
			description: "Every compound, house, apartment and the people living there.",
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
					label: "Compounds",
					value: new Set(properties.map((property) => property.compound_name).filter(Boolean)).size
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Known occupants",
					value: allOccupants.length
				})
			]
		}),
		isError || occupantsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading || occupantsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading properties",
			onRetry: () => void queryClient.refetchQueries()
		}) : properties.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: properties.map((property) => {
				const propertyOccupants = occupantsByProperty.get(property.id) ?? [];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40",
					onClick: () => setSelectedProperty(property),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium uppercase text-muted-foreground",
									children: property.compound_name || "Standalone property"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 font-display text-xl font-semibold",
									children: property.apartment_name || property.house_number
								}),
								property.apartment_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: property.house_number
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-5 w-5 text-primary" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-muted-foreground",
							children: property.street || "Street not provided"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-center justify-between border-t border-border pt-4 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [propertyOccupants.length, " living here"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "capitalize text-muted-foreground",
								children: property.status
							})]
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add property" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Each apartment or house is one property. Use the same compound name to group several apartments together." })] }),
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormSection, {
								title: "People living here",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Add the name and contact of each known occupant. The first person is treated as the main contact."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-3",
										children: occupants.map((occupant, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-3 flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-medium",
													children: index === 0 ? "Main contact" : `Occupant ${index + 1}`
												}), occupants.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "icon",
													variant: "ghost",
													onClick: () => setOccupants((current) => current.filter((_, itemIndex) => itemIndex !== index)),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-3 sm:grid-cols-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: occupant.fullName,
														onChange: (event) => updateOccupant(index, { fullName: event.target.value }),
														placeholder: "Full name"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "tel",
														value: occupant.phone,
														onChange: (event) => updateOccupant(index, { phone: event.target.value }),
														placeholder: "Phone"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "tel",
														value: occupant.whatsappNumber,
														onChange: (event) => updateOccupant(index, { whatsappNumber: event.target.value }),
														placeholder: "WhatsApp"
													})
												]
											})]
										}, index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "outline",
										onClick: () => setOccupants((current) => [...current, emptyOccupant()]),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "mr-2 h-4 w-4" }), "Add another person"]
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(property),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto sm:max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: property?.apartment_name || property?.house_number || "Property" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: property ? [
				property.compound_name,
				property.house_number,
				property.street
			].filter(Boolean).join(" · ") : "" })] }), property && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
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
								label: "People recorded",
								value: occupants.length
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
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg font-semibold",
					children: "People living here"
				}), occupants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-3",
					children: occupants.map((occupant) => {
						const whatsapp = occupant.whatsapp_number || occupant.phone;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: occupant.full_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: [occupant.is_primary ? "Main contact" : "Occupant", occupant.phone ? ` · ${occupant.phone}` : ""]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
						}, occupant.id);
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "No occupants have been added."
				})] })]
			})]
		})
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
//#endregion
export { PropertiesPage as component };
