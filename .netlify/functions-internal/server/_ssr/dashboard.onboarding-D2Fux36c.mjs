import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as CircleCheck, O as ClipboardList } from "../_libs/lucide-react.mjs";
import { r as useAuth } from "./use-auth-CJoPS59J.mjs";
import { n as PageHeader } from "./page-header-DnpF6lGt.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { o as syncResidentPropertyOccupancy, r as getResidentHousingDetails } from "./property-occupancy-9h6ABKMf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.onboarding-D2Fux36c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResidentFormPage() {
	const { user, profile } = useAuth();
	const queryClient = useQueryClient();
	const saved = (0, import_react.useMemo)(() => profile?.onboarding_data ?? {}, [profile?.onboarding_data]);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [whatsappNumber, setWhatsappNumber] = (0, import_react.useState)("");
	const [residentType, setResidentType] = (0, import_react.useState)("tenant");
	const [compoundName, setCompoundName] = (0, import_react.useState)("");
	const [houseOrApartment, setHouseOrApartment] = (0, import_react.useState)("");
	const [householdMembers, setHouseholdMembers] = (0, import_react.useState)("");
	const [landlordName, setLandlordName] = (0, import_react.useState)("");
	const [landlordPhone, setLandlordPhone] = (0, import_react.useState)("");
	const [stayDuration, setStayDuration] = (0, import_react.useState)("");
	const [emergencyName, setEmergencyName] = (0, import_react.useState)("");
	const [emergencyPhone, setEmergencyPhone] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!profile) return;
		setFullName(profile.full_name || "");
		setPhone(profile.phone || "");
		setWhatsappNumber(profile.whatsapp_number || profile.phone || "");
		setResidentType(profile.resident_type || "tenant");
		const housing = getResidentHousingDetails(profile);
		setCompoundName(housing.compoundName);
		setHouseOrApartment(housing.houseOrApartment);
		setLandlordName(housing.landlordName);
		setLandlordPhone(housing.landlordPhone);
		setStayDuration(housing.stayDuration);
		setHouseholdMembers(String(saved.householdMembers || ""));
		setEmergencyName(profile.emergency_contact_name || "");
		setEmergencyPhone(profile.emergency_contact_phone || "");
	}, [profile, saved]);
	const save = useMutation({
		mutationFn: async () => {
			if (!user) throw new Error("Please sign in again.");
			if (!fullName.trim()) throw new Error("Enter your full name.");
			if (!phone.trim()) throw new Error("Enter your phone number.");
			if (!whatsappNumber.trim()) throw new Error("Enter your WhatsApp number.");
			if (!houseOrApartment.trim()) throw new Error("Enter your house or apartment.");
			const onboardingData = {
				compoundName: compoundName.trim(),
				houseOrApartment: houseOrApartment.trim(),
				householdMembers: householdMembers.trim(),
				landlordName: residentType === "tenant" ? landlordName.trim() : "",
				landlordPhone: residentType === "tenant" ? landlordPhone.trim() : "",
				stayDuration: residentType === "tenant" ? stayDuration.trim() : ""
			};
			const { error } = await supabase.from("profiles").update({
				full_name: fullName.trim(),
				phone: phone.trim(),
				whatsapp_number: whatsappNumber.trim(),
				resident_type: residentType,
				emergency_contact_name: emergencyName.trim() || null,
				emergency_contact_phone: emergencyPhone.trim() || null,
				onboarding_completed: true,
				onboarding_completed_at: (/* @__PURE__ */ new Date()).toISOString(),
				onboarding_data: onboardingData,
				status: "active"
			}).eq("id", user.id);
			if (error) throw error;
			await syncResidentPropertyOccupancy({
				id: user.id,
				estate_id: profile?.estate_id || null,
				full_name: fullName.trim(),
				phone: phone.trim(),
				whatsapp_number: whatsappNumber.trim(),
				resident_type: residentType,
				onboarding_data: onboardingData
			});
		},
		onSuccess: async () => {
			toast.success(profile?.onboarding_completed ? "Details updated" : "Welcome to the community");
			setSubmitted(true);
			setEditing(false);
			await queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message)
	});
	const completed = (profile?.onboarding_completed || submitted) && !editing;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Your details",
			description: completed ? "Your community contact and home information." : "A few simple details so the community can identify and contact you.",
			icon: ClipboardList
		}), completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-xl border border-border bg-card p-5 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), "Details complete"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-2xl font-semibold",
							children: fullName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm capitalize text-muted-foreground",
							children: residentType
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => setEditing(true),
						children: "Edit details"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "Phone",
							value: phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "WhatsApp",
							value: whatsappNumber
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "Compound",
							value: compoundName || "Not provided"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "House or apartment",
							value: houseOrApartment
						}),
						residentType === "tenant" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Landlord name",
								value: landlordName || "Not provided"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Landlord phone",
								value: landlordPhone || "Not provided"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								label: "Duration of stay",
								value: stayDuration || "Not provided"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "Emergency contact",
							value: emergencyName || emergencyPhone ? `${emergencyName}${emergencyPhone ? ` · ${emergencyPhone}` : ""}` : "Not provided"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							label: "People living with you",
							value: householdMembers || "Not provided"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dashboard",
						children: "Back to dashboard"
					})
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-xl border border-border bg-card p-5 sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSection, {
						title: "About you",
						description: "Your name and the two numbers community administrators may use.",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Full name",
									required: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: fullName,
										onChange: (event) => setFullName(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "You are a",
									required: true,
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
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Phone number",
									hint: "For normal calls",
									required: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "tel",
										value: phone,
										onChange: (event) => setPhone(event.target.value),
										placeholder: "080..."
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "WhatsApp number",
									hint: "Can be the same number",
									required: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "tel",
										value: whatsappNumber,
										onChange: (event) => setWhatsappNumber(event.target.value),
										placeholder: "080..."
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormSection, {
						title: "Your home",
						description: "Tell us where to find your household.",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Compound name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: compoundName,
										onChange: (event) => setCompoundName(event.target.value),
										placeholder: "For example, Adebayo Compound"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "House or apartment",
									required: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: houseOrApartment,
										onChange: (event) => setHouseOrApartment(event.target.value),
										placeholder: "For example, House 4 or Flat B"
									})
								})]
							}),
							residentType === "tenant" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Landlord name",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: landlordName,
											onChange: (event) => setLandlordName(event.target.value),
											placeholder: "Who owns this property?"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Landlord phone",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "tel",
											value: landlordPhone,
											onChange: (event) => setLandlordPhone(event.target.value),
											placeholder: "080..."
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Duration of stay",
										hint: "For example, 1 year or Since March 2026",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: stayDuration,
											onChange: (event) => setStayDuration(event.target.value)
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Names of people living with you",
								hint: "Optional",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 3,
									value: householdMembers,
									onChange: (event) => setHouseholdMembers(event.target.value),
									placeholder: "Write their names, separated by commas"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSection, {
						title: "Emergency contact",
						description: "Optional, but useful if we cannot reach you.",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Contact name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: emergencyName,
									onChange: (event) => setEmergencyName(event.target.value)
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Contact phone",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "tel",
									value: emergencyPhone,
									onChange: (event) => setEmergencyPhone(event.target.value)
								})
							})]
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				children: [profile?.onboarding_completed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setEditing(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => save.mutate(),
					loading: save.isPending,
					loadingLabel: "Saving your details",
					children: "Save my details"
				})]
			})]
		})]
	});
}
function FormSection({ title, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-lg font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: description
		})] }), children]
	});
}
function Field({ label, hint, required, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-destructive",
				children: " *"
			})] }),
			children,
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: hint
			})
		]
	});
}
function Summary({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-secondary/35 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 whitespace-pre-wrap font-medium",
			children: value
		})]
	});
}
//#endregion
export { ResidentFormPage as component };
