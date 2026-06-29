import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as ShieldCheck, g as Plus, v as PhoneCall } from "../_libs/lucide-react.mjs";
import { a as useAuth } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.security-CmFnsswx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SecurityPage() {
	const { user, profile, hasRole } = useAuth();
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [contactOpen, setContactOpen] = (0, import_react.useState)(false);
	const [type, setType] = (0, import_react.useState)("");
	const [severity, setSeverity] = (0, import_react.useState)("low");
	const [location, setLocation] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [selectedIncident, setSelectedIncident] = (0, import_react.useState)(null);
	const [resolutionNotes, setResolutionNotes] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("reported");
	const [contactLabel, setContactLabel] = (0, import_react.useState)("");
	const [contactPhone, setContactPhone] = (0, import_react.useState)("");
	const [contactAddress, setContactAddress] = (0, import_react.useState)("");
	const [contactNotes, setContactNotes] = (0, import_react.useState)("");
	const [contactPriority, setContactPriority] = (0, import_react.useState)("1");
	const canManageSecurity = hasRole("chief_security_officer") || hasRole("community_chairman") || hasRole("estate_admin");
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["incidents"],
		queryFn: async () => {
			const { data, error } = await supabase.from("security_incidents").select("*").order("occurred_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: contacts = [], isLoading: contactsLoading } = useQuery({
		queryKey: ["emergency-contacts", profile?.estate_id],
		enabled: Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("emergency_contacts").select("*").order("priority", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
			const { error } = await supabase.from("security_incidents").insert({
				estate_id: profile.estate_id,
				reporter_id: user.id,
				type,
				severity,
				location,
				description,
				occurred_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Incident reported");
			setOpen(false);
			setType("");
			setLocation("");
			setDescription("");
			qc.invalidateQueries({ queryKey: ["incidents"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const updateIncident = useMutation({
		mutationFn: async () => {
			if (!selectedIncident) throw new Error("Choose an incident first.");
			const payload = {
				status,
				resolution_notes: status === "resolved" ? resolutionNotes.trim() || null : null,
				resolved_at: status === "resolved" ? (/* @__PURE__ */ new Date()).toISOString() : null
			};
			const { error } = await supabase.from("security_incidents").update(payload).eq("id", selectedIncident.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Incident updated");
			setSelectedIncident(null);
			setResolutionNotes("");
			await qc.invalidateQueries({ queryKey: ["incidents"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const addContact = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id || !user?.id) throw new Error("No estate linked.");
			const { error } = await supabase.from("emergency_contacts").insert({
				estate_id: profile.estate_id,
				created_by: user.id,
				label: contactLabel.trim(),
				phone: contactPhone.trim(),
				address: contactAddress.trim() || null,
				notes: contactNotes.trim() || null,
				priority: Number(contactPriority) || 0
			});
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Emergency contact saved");
			setContactOpen(false);
			setContactLabel("");
			setContactPhone("");
			setContactAddress("");
			setContactNotes("");
			setContactPriority("1");
			await qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
		},
		onError: (error) => toast.error(error.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Security",
			description: "Incidents, emergency contacts, patrol records and resident help tools.",
			icon: ShieldCheck,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [canManageSecurity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: contactOpen,
					onOpenChange: setContactOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneCall, { className: "mr-1 h-4 w-4" }), " Emergency contact"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add emergency contact" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Label",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: contactLabel,
										onChange: (e) => setContactLabel(e.target.value),
										placeholder: "Estate security line"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Phone",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: contactPhone,
										onChange: (e) => setContactPhone(e.target.value),
										placeholder: "080..."
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Address",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: contactAddress,
										onChange: (e) => setContactAddress(e.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Priority",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: "0",
										value: contactPriority,
										onChange: (e) => setContactPriority(e.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Notes",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										value: contactNotes,
										onChange: (e) => setContactNotes(e.target.value)
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => addContact.mutate(),
							loading: addContact.isPending,
							loadingLabel: "Saving contact",
							children: "Save contact"
						}) })
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open,
					onOpenChange: setOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Report incident"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Report incident" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Type",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: type,
										onChange: (e) => setType(e.target.value),
										placeholder: "e.g. Trespass, theft, suspicious activity"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Severity",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: severity,
										onValueChange: setSeverity,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"low",
											"medium",
											"high",
											"critical"
										].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: s,
											className: "capitalize",
											children: s
										}, s)) })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Location",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: location,
										onChange: (e) => setLocation(e.target.value)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Description",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 4,
										value: description,
										onChange: (e) => setDescription(e.target.value)
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => create.mutate(),
							disabled: !type,
							loading: create.isPending,
							loadingLabel: "Reporting incident",
							children: "Report"
						}) })
					] })]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Incident reports"
				}), isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() }) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
					label: "Loading security records",
					onRetry: () => void refetch()
				}) : data && data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: data.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "cursor-pointer rounded-md border border-border bg-card p-4 transition hover:bg-secondary/30",
						onClick: () => {
							setSelectedIncident(i);
							setStatus(i.status);
							setResolutionNotes(i.resolution_notes || "");
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: i.type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: i.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [
										i.location,
										" ·",
										" ",
										i.occurred_at ? new Date(i.occurred_at).toLocaleString() : ""
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground",
									children: i.severity
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground",
									children: i.status
								})]
							})]
						})
					}, i.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					title: "No incidents reported",
					description: "Security can log incidents, patrol activity and suspicious events here."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Emergency contacts"
				}), contactsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, { label: "Loading emergency contacts" }) : contacts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: contacts.map((contact) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `tel:${contact.phone}`,
						className: "block rounded-lg border border-border p-3 transition hover:bg-secondary/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: contact.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: contact.phone
							}),
							contact.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: contact.address
							})
						]
					}, contact.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "No emergency contacts have been added yet."
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!selectedIncident,
			onOpenChange: (nextOpen) => !nextOpen && setSelectedIncident(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: selectedIncident?.type || "Security incident" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Expanded security incident record." })] }), selectedIncident && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Type",
								value: selectedIncident.type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Status",
								value: selectedIncident.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Severity",
								value: selectedIncident.severity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Location",
								value: selectedIncident.location
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Occurred",
								value: selectedIncident.occurred_at ? new Date(selectedIncident.occurred_at).toLocaleString() : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Resolved",
								value: selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Description",
								value: selectedIncident.description,
								wide: true
							})
						]
					}), canManageSecurity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 rounded-lg border border-border p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Update status",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: status,
									onValueChange: setStatus,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
										"reported",
										"investigating",
										"resolved",
										"archived"
									].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: item,
										className: "capitalize",
										children: item.replace("_", " ")
									}, item)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Resolution notes",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 3,
									value: resolutionNotes,
									onChange: (e) => setResolutionNotes(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => updateIncident.mutate(),
								loading: updateIncident.isPending,
								loadingLabel: "Saving incident",
								children: "Save incident update"
							})
						]
					})]
				})]
			})
		})
	] });
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function Detail({ label, value, wide = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-md border border-border bg-secondary/20 p-3 ${wide ? "sm:col-span-2" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium uppercase text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 whitespace-pre-wrap break-words text-sm",
			children: value || "Not provided"
		})]
	});
}
//#endregion
export { SecurityPage as component };
