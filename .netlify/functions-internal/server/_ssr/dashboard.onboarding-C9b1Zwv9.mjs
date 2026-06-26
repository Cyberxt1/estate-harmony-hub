import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DNwKaOJw.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { P as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as ArrowLeft, k as CircleCheck, v as ClipboardList, w as ArrowRight, x as Check } from "../_libs/lucide-react.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./use-auth-CP7XOnjs.mjs";
import { n as PageHeader } from "./page-header-CGNtK6Vg.mjs";
import { t as Textarea } from "./textarea-DBn9CRiI.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUy71i1r.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.onboarding-C9b1Zwv9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
var steps = [
	"Identity",
	"Home",
	"Household",
	"Review"
];
function ResidentOnboardingPage() {
	const { user, profile } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const saved = profile?.onboarding_data ?? {};
	const [step, setStep] = (0, import_react.useState)(0);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [residentType, setResidentType] = (0, import_react.useState)("tenant");
	const [currentHouseNumber, setCurrentHouseNumber] = (0, import_react.useState)("");
	const [currentStreet, setCurrentStreet] = (0, import_react.useState)("");
	const [livesInEstate, setLivesInEstate] = (0, import_react.useState)(true);
	const [ownedHouseCount, setOwnedHouseCount] = (0, import_react.useState)("1");
	const [ownedHouses, setOwnedHouses] = (0, import_react.useState)("");
	const [tenantHouseNumber, setTenantHouseNumber] = (0, import_react.useState)("");
	const [landlordName, setLandlordName] = (0, import_react.useState)("");
	const [landlordPhone, setLandlordPhone] = (0, import_react.useState)("");
	const [householdSize, setHouseholdSize] = (0, import_react.useState)("");
	const [occupants, setOccupants] = (0, import_react.useState)("");
	const [vehicles, setVehicles] = (0, import_react.useState)("");
	const [emergencyName, setEmergencyName] = (0, import_react.useState)("");
	const [emergencyPhone, setEmergencyPhone] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!profile) return;
		setFullName(profile.full_name || "");
		setPhone(profile.phone || "");
		setResidentType(profile.resident_type || "tenant");
		setCurrentHouseNumber(String(saved.currentHouseNumber || ""));
		setCurrentStreet(String(saved.currentStreet || ""));
		setLivesInEstate(saved.livesInEstate !== false);
		setOwnedHouseCount(String(saved.ownedHouseCount || "1"));
		setOwnedHouses(String(saved.ownedHouses || ""));
		setTenantHouseNumber(String(saved.tenantHouseNumber || ""));
		setLandlordName(String(saved.landlordName || ""));
		setLandlordPhone(String(saved.landlordPhone || ""));
		setHouseholdSize(String(saved.householdSize || ""));
		setOccupants(String(saved.occupants || ""));
		setVehicles(String(saved.vehicles || ""));
		setEmergencyName(String(saved.emergencyName || ""));
		setEmergencyPhone(String(saved.emergencyPhone || ""));
		setNotes(String(saved.notes || ""));
	}, [profile]);
	const save = useMutation({
		mutationFn: async () => {
			if (!user) throw new Error("Sign in again to complete the resident form.");
			const onboardingData = {
				currentHouseNumber,
				currentStreet,
				livesInEstate,
				ownedHouseCount: residentType === "landlord" ? Number(ownedHouseCount || 0) : 0,
				ownedHouses,
				tenantHouseNumber,
				landlordName,
				landlordPhone,
				householdSize: Number(householdSize || 0),
				occupants,
				vehicles,
				emergencyName,
				emergencyPhone,
				notes
			};
			const { error } = await supabase.from("profiles").update({
				full_name: fullName,
				phone,
				resident_type: residentType,
				emergency_contact_name: emergencyName,
				emergency_contact_phone: emergencyPhone,
				onboarding_completed: true,
				onboarding_completed_at: (/* @__PURE__ */ new Date()).toISOString(),
				onboarding_data: onboardingData,
				status: "active"
			}).eq("id", user.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Resident form submitted");
			await queryClient.invalidateQueries();
			navigate({ to: "/dashboard" });
		},
		onError: (error) => toast.error(error.message)
	});
	const canMoveNext = step === 0 ? Boolean(fullName && phone && residentType) : step === 1 ? residentType === "landlord" ? Boolean(ownedHouseCount && ownedHouses) : Boolean(tenantHouseNumber && landlordName) : step === 2 ? Boolean(householdSize && occupants && emergencyName && emergencyPhone) : true;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Resident Form",
				description: "Complete this before using the Oyesile Estate dashboard.",
				icon: ClipboardList
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 rounded-md border border-border bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: steps[step]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: [
							step + 1,
							" of ",
							steps.length
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: (step + 1) / steps.length * 100 })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-md border border-border bg-card p-5 shadow-sm",
				children: [
					step === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "Your Identity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Full name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: fullName,
										onChange: (event) => setFullName(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Phone number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: phone,
										onChange: (event) => setPhone(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Resident type",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: residentType,
										onValueChange: (value) => setResidentType(value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "tenant",
											children: "Tenant"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "landlord",
											children: "Landlord"
										})] })]
									})
								})
							]
						})]
					}),
					step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: residentType === "landlord" ? "Owned Houses" : "Rented Home" }), residentType === "landlord" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: livesInEstate,
										onCheckedChange: (checked) => setLivesInEstate(checked === true)
									}), "I currently live inside Oyesile Estate"]
								}),
								livesInEstate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 md:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "House number where you live",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: currentHouseNumber,
											onChange: (event) => setCurrentHouseNumber(event.target.value)
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Street",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: currentStreet,
											onChange: (event) => setCurrentStreet(event.target.value)
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "How many houses do you own?",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: "1",
										value: ownedHouseCount,
										onChange: (event) => setOwnedHouseCount(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "List the houses you own",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										value: ownedHouses,
										onChange: (event) => setOwnedHouses(event.target.value),
										placeholder: "Example: House 4, Adewale Close - occupied by me. House 9, Oyesile Road - tenant: Mrs. Adebayo.",
										className: "min-h-28"
									})
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "House number where you live",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: tenantHouseNumber,
										onChange: (event) => setTenantHouseNumber(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Street",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: currentStreet,
										onChange: (event) => setCurrentStreet(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Landlord name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: landlordName,
										onChange: (event) => setLandlordName(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Landlord phone",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: landlordPhone,
										onChange: (event) => setLandlordPhone(event.target.value)
									})
								})
							]
						})]
					}),
					step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "People And Vehicles" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 md:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "How many people live there?",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: "1",
											value: householdSize,
											onChange: (event) => setHouseholdSize(event.target.value)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Emergency contact name",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: emergencyName,
											onChange: (event) => setEmergencyName(event.target.value)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Emergency contact phone",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: emergencyPhone,
											onChange: (event) => setEmergencyPhone(event.target.value)
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Names of people living there",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: occupants,
									onChange: (event) => setOccupants(event.target.value),
									placeholder: "List names and relationship, one per line.",
									className: "min-h-28"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Vehicles",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: vehicles,
									onChange: (event) => setVehicles(event.target.value),
									placeholder: "Plate number, car model and owner. Leave blank if none.",
									className: "min-h-24"
								})
							})
						]
					}),
					step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { title: "Management Notes" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Anything management should know",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: notes,
									onChange: (event) => setNotes(event.target.value),
									placeholder: "Add details about vacant homes, tenants not yet registered, staff living in the home, or special security notes.",
									className: "min-h-32"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground",
								children: "Submitting confirms this information is accurate enough for Oyesile Estate management to understand who lives where."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => setStep((current) => Math.max(current - 1, 0)),
							disabled: step === 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back"]
						}), step < steps.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => setStep((current) => current + 1),
							disabled: !canMoveNext,
							children: ["Next", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-2 h-4 w-4" })]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => save.mutate(),
							disabled: save.isPending || !canMoveNext,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-2 h-4 w-4" }), "Submit form"]
						})]
					})
				]
			})
		]
	});
}
function SectionTitle({ title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "font-display text-xl font-semibold",
		children: title
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
//#endregion
export { ResidentOnboardingPage as component };
