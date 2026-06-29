import { r as __toESM } from "../_runtime.mjs";
import { l as createServerFn } from "./esm-9EjmF9OT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DZO41X7i.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as PenLine, _ as Phone, b as MessageCircle, f as Search, i as UserCheck, n as Users, o as Trash2, s as ShieldOff } from "../_libs/lucide-react.mjs";
import { a as useAuth, n as createSsrRpc } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DMNUCmq6.mjs";
import { i as groupResidentsByHouse, o as syncResidentPropertyOccupancy, r as getResidentHousingDetails } from "./property-occupancy-9h6ABKMf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.residents-Bv9XA87d.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var removeCommunityMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => {
	if (!input.memberId) throw new Error("Choose a member to remove.");
	return input;
}).handler(createSsrRpc("3d3e332faf33a8bfa78ec415f3035f866c74e32115a35a146c03e0c735f874aa"));
function ResidentsPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [selectedResident, setSelectedResident] = (0, import_react.useState)(null);
	const [editingResident, setEditingResident] = (0, import_react.useState)(null);
	const [residentToRemove, setResidentToRemove] = (0, import_react.useState)(null);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [whatsappNumber, setWhatsappNumber] = (0, import_react.useState)("");
	const [residentType, setResidentType] = (0, import_react.useState)("tenant");
	const [compoundName, setCompoundName] = (0, import_react.useState)("");
	const [houseOrApartment, setHouseOrApartment] = (0, import_react.useState)("");
	const [landlordName, setLandlordName] = (0, import_react.useState)("");
	const [landlordPhone, setLandlordPhone] = (0, import_react.useState)("");
	const [stayDuration, setStayDuration] = (0, import_react.useState)("");
	const { data: residents = [], isLoading, isError, refetch } = useQuery({
		queryKey: ["residents"],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const filteredResidents = (0, import_react.useMemo)(() => {
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
				housing.houseOrApartment
			].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
		});
	}, [residents, search]);
	const groupedResidents = (0, import_react.useMemo)(() => groupResidentsByHouse(filteredResidents), [filteredResidents]);
	const activeCount = residents.filter((resident) => resident.status === "active").length;
	const suspendedCount = residents.filter((resident) => resident.status === "suspended").length;
	const updateStatus = useMutation({
		mutationFn: async ({ resident, status }) => {
			const { error } = await supabase.from("profiles").update({ status }).eq("id", resident.id);
			if (error) throw error;
		},
		onSuccess: async (_, variables) => {
			toast.success(variables.status === "suspended" ? "Member suspended" : "Member reactivated");
			await queryClient.invalidateQueries({ queryKey: ["residents"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const saveEdit = useMutation({
		mutationFn: async () => {
			if (!editingResident) throw new Error("Choose a member to edit.");
			if (!fullName.trim()) throw new Error("Enter the member's name.");
			const onboardingData = {
				...editingResident.onboarding_data && typeof editingResident.onboarding_data === "object" ? editingResident.onboarding_data : {},
				compoundName: compoundName.trim(),
				houseOrApartment: houseOrApartment.trim(),
				landlordName: residentType === "tenant" ? landlordName.trim() : "",
				landlordPhone: residentType === "tenant" ? landlordPhone.trim() : "",
				stayDuration: residentType === "tenant" ? stayDuration.trim() : ""
			};
			const { error } = await supabase.from("profiles").update({
				full_name: fullName.trim(),
				phone: phone.trim() || null,
				whatsapp_number: whatsappNumber.trim() || phone.trim() || null,
				resident_type: residentType,
				onboarding_data: onboardingData
			}).eq("id", editingResident.id);
			if (error) throw error;
			await syncResidentPropertyOccupancy({
				id: editingResident.id,
				estate_id: editingResident.estate_id,
				full_name: fullName.trim(),
				phone: phone.trim() || null,
				whatsapp_number: whatsappNumber.trim() || phone.trim() || null,
				resident_type: residentType,
				onboarding_data: onboardingData
			});
		},
		onSuccess: async () => {
			toast.success("Member details updated");
			setEditingResident(null);
			await queryClient.invalidateQueries({ queryKey: ["residents"] });
			await queryClient.invalidateQueries({ queryKey: ["property-occupants"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const removeMember = useMutation({
		mutationFn: async (resident) => {
			await removeCommunityMember({ data: { memberId: resident.id } });
		},
		onSuccess: async () => {
			toast.success("Member removed");
			setResidentToRemove(null);
			setSelectedResident(null);
			await queryClient.invalidateQueries({ queryKey: ["residents"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const openEditor = (resident) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Community members",
			description: "Smaller house-by-house view of everyone in the estate.",
			icon: Users
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Total members",
					value: residents.length
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Active",
					value: activeCount
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Suspended",
					value: suspendedCount
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mb-5 max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "pl-9",
				value: search,
				onChange: (event) => setSearch(event.target.value),
				placeholder: "Search name, phone or house"
			})]
		}),
		isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() }) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading community members",
			onRetry: () => void refetch()
		}) : filteredResidents.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4",
			children: groupedResidents.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-xl border border-border bg-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase text-muted-foreground",
						children: "House"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: group.houseLabel
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-muted-foreground",
						children: [
							group.members.length,
							" ",
							group.members.length === 1 ? "member" : "members"
						]
					})]
				}), group.members.map((resident, index) => {
					const whatsapp = resident.whatsapp_number || resident.phone;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
						className: `px-4 py-3 sm:px-5 ${index !== group.members.length - 1 ? "border-b border-border" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "min-w-0 text-left",
								onClick: () => setSelectedResident(resident),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/80",
											children: resident.memberNumber
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-semibold sm:text-base",
											children: resident.full_name || "Unnamed member"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2 py-0.5 text-xs capitalize ${resident.status === "suspended" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`,
											children: resident.status
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs capitalize text-muted-foreground sm:text-sm",
									children: [resident.resident_type || "Details incomplete", resident.phone ? ` · ${resident.phone}` : ""]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "ghost",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: getWhatsAppLink(whatsapp),
											target: "_blank",
											rel: "noreferrer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mr-2 h-4 w-4" }), "WhatsApp"]
										})
									}),
									resident.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "ghost",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `tel:${resident.phone}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "mr-2 h-4 w-4" }), "Call"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => openEditor(resident),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "mr-2 h-4 w-4" }), "Edit"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => updateStatus.mutate({
											resident,
											status: resident.status === "suspended" ? "active" : "suspended"
										}),
										children: [resident.status === "suspended" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCheck, { className: "mr-2 h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { className: "mr-2 h-4 w-4" }), resident.status === "suspended" ? "Reactivate" : "Suspend"]
									}),
									resident.id !== user?.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										className: "text-destructive hover:text-destructive",
										onClick: () => setResidentToRemove(resident),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), "Remove"]
									})
								]
							})]
						})
					}, resident.id);
				})]
			}, group.houseLabel))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: search ? "No matching members" : "No community members",
			description: search ? "Try another name, number or house." : "New members will appear here."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberDetails, {
			resident: selectedResident,
			onClose: () => setSelectedResident(null)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: Boolean(editingResident),
			onOpenChange: (open) => !open && setEditingResident(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit member" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Update contact, house and tenant details." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Full name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: fullName,
									onChange: (event) => setFullName(event.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Member type",
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
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "tel",
									value: phone,
									onChange: (event) => setPhone(event.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "WhatsApp number",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "tel",
									value: whatsappNumber,
									onChange: (event) => setWhatsappNumber(event.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Compound",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: compoundName,
									onChange: (event) => setCompoundName(event.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "House or apartment",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: houseOrApartment,
									onChange: (event) => setHouseOrApartment(event.target.value)
								})
							}),
							residentType === "tenant" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
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
										type: "tel",
										value: landlordPhone,
										onChange: (event) => setLandlordPhone(event.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Duration of stay",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: stayDuration,
										onChange: (event) => setStayDuration(event.target.value)
									})
								})
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setEditingResident(null),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => saveEdit.mutate(),
						loading: saveEdit.isPending,
						loadingLabel: "Saving member",
						children: "Save changes"
					})] })
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
			open: Boolean(residentToRemove),
			onOpenChange: (open) => !open && setResidentToRemove(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Remove this member?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [residentToRemove?.full_name || "This member", " will lose access to the community platform. This cannot be undone."] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Keep member" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
				className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				onClick: () => residentToRemove && removeMember.mutate(residentToRemove),
				children: "Remove member"
			})] })] })
		})
	] });
}
function MemberDetails({ resident, onClose }) {
	const submitted = resident ? getSubmittedData(resident) : {};
	const housing = resident ? getResidentHousingDetails(resident) : emptyHousingDetails();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(resident),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: resident?.full_name || "Community member" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Contact, home and account details." })] }), resident && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Type",
						value: resident.resident_type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Status",
						value: resident.status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Phone",
						value: resident.phone
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "WhatsApp",
						value: resident.whatsapp_number || resident.phone
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Email",
						value: resident.email
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Compound",
						value: String(submitted.compoundName || "")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "House or apartment",
						value: String(submitted.houseOrApartment || "")
					}),
					resident.resident_type === "tenant" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Landlord name",
							value: housing.landlordName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Landlord phone",
							value: housing.landlordPhone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Duration of stay",
							value: housing.stayDuration
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "People living with member",
						value: String(submitted.householdMembers || ""),
						wide: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Emergency contact",
						value: `${resident.emergency_contact_name || ""}${resident.emergency_contact_phone ? ` · ${resident.emergency_contact_phone}` : ""}`,
						wide: true
					})
				]
			})]
		})
	});
}
function getSubmittedData(resident) {
	return resident.onboarding_data && typeof resident.onboarding_data === "object" ? resident.onboarding_data : {};
}
function emptyHousingDetails() {
	return {
		compoundName: "",
		houseOrApartment: "",
		landlordName: "",
		landlordPhone: "",
		stayDuration: ""
	};
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function Detail({ label, value, wide = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-lg border border-border p-3 ${wide ? "sm:col-span-2" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 whitespace-pre-wrap capitalize",
			children: value || "Not provided"
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
export { ResidentsPage as component };
