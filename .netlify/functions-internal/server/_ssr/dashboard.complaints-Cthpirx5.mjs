import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-C3Tr9JFK.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as Clock3, L as CircleCheck, _ as MessageSquareWarning, g as Phone, h as Plus, v as MessageCircle } from "../_libs/lucide-react.mjs";
import { r as useAuth } from "./use-auth-CJoPS59J.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.complaints-Cthpirx5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ComplaintsPage() {
	const { user, profile, isAdmin } = useAuth();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [subject, setSubject] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [priority, setPriority] = (0, import_react.useState)("medium");
	const [selectedComplaint, setSelectedComplaint] = (0, import_react.useState)(null);
	const [resolutionNotes, setResolutionNotes] = (0, import_react.useState)("");
	const { data: complaints = [], isLoading, isError } = useQuery({
		queryKey: [
			"complaints",
			profile?.estate_id,
			user?.id,
			isAdmin
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: complainants = [], isLoading: complainantsLoading, isError: complainantsError } = useQuery({
		queryKey: ["complaint-people", profile?.estate_id],
		enabled: isAdmin,
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, full_name, email, phone, whatsapp_number, resident_type").eq("estate_id", profile.estate_id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const peopleById = (0, import_react.useMemo)(() => new Map(complainants.map((person) => [person.id, person])), [complainants]);
	const openComplaints = complaints.filter((item) => [
		"open",
		"assigned",
		"in_progress"
	].includes(item.status));
	const resolvedComplaints = complaints.filter((item) => ["resolved", "closed"].includes(item.status));
	const createComplaint = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Your account is not linked to the estate.");
			if (!subject.trim()) throw new Error("Tell us what the complaint is about.");
			if (!description.trim()) throw new Error("Add a short description.");
			const { error } = await supabase.from("complaints").insert({
				estate_id: profile.estate_id,
				reporter_id: user.id,
				subject: subject.trim(),
				description: description.trim(),
				priority
			});
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Complaint sent");
			setCreateOpen(false);
			setSubject("");
			setDescription("");
			setPriority("medium");
			await queryClient.invalidateQueries({ queryKey: ["complaints"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const updateStatus = useMutation({
		mutationFn: async ({ complaint, status }) => {
			const { error } = await supabase.from("complaints").update({
				status,
				resolution_notes: status === "resolved" ? resolutionNotes.trim() || complaint.resolution_notes : null,
				resolved_at: status === "resolved" ? (/* @__PURE__ */ new Date()).toISOString() : null
			}).eq("id", complaint.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Complaint updated");
			setSelectedComplaint(null);
			setResolutionNotes("");
			await queryClient.invalidateQueries({ queryKey: ["complaints"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const openDetails = (complaint) => {
		setSelectedComplaint(complaint);
		setResolutionNotes(complaint.resolution_notes || "");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: isAdmin ? "Complaint desk" : "Complaints",
			description: isAdmin ? "See who complained, contact them and move each issue to resolution." : "Report a community issue and follow its progress.",
			icon: MessageSquareWarning,
			children: !isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => setCreateOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), "New complaint"]
			})
		}),
		isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
				icon: Clock3,
				label: "Open complaints",
				value: openComplaints.length
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
				icon: CircleCheck,
				label: "Resolved complaints",
				value: resolvedComplaints.length
			})]
		}),
		isError || isAdmin && complainantsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading || isAdmin && complainantsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading complaints",
			onRetry: () => void queryClient.refetchQueries()
		}) : isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "open",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "mb-4 grid w-full grid-cols-2 sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "open",
						children: [
							"Open (",
							openComplaints.length,
							")"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "resolved",
						children: [
							"Resolved (",
							resolvedComplaints.length,
							")"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "open",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComplaintList, {
						complaints: openComplaints,
						peopleById,
						onSelect: openDetails,
						emptyTitle: "No open complaints"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "resolved",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComplaintList, {
						complaints: resolvedComplaints,
						peopleById,
						onSelect: openDetails,
						emptyTitle: "No resolved complaints"
					})
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComplaintList, {
			complaints,
			peopleById,
			onSelect: openDetails,
			emptyTitle: "No complaints"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "sm:max-w-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New complaint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Explain the issue briefly and clearly." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "What is the issue?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: subject,
									onChange: (event) => setSubject(event.target.value),
									placeholder: "For example, broken street light"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Short description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 4,
									value: description,
									onChange: (event) => setDescription(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "How urgent is it?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: priority,
									onValueChange: (value) => setPriority(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "low",
											children: "Low"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "medium",
											children: "Normal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "high",
											children: "High"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "urgent",
											children: "Urgent"
										})
									] })]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setCreateOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => createComplaint.mutate(),
						loading: createComplaint.isPending,
						loadingLabel: "Sending complaint",
						children: "Send complaint"
					})] })
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComplaintDetails, {
			complaint: selectedComplaint,
			complainant: selectedComplaint ? peopleById.get(selectedComplaint.reporter_id) : void 0,
			isAdmin,
			resolutionNotes,
			setResolutionNotes,
			updating: updateStatus.isPending,
			onStatusChange: (status) => selectedComplaint && updateStatus.mutate({
				complaint: selectedComplaint,
				status
			}),
			onClose: () => setSelectedComplaint(null)
		})
	] });
}
function ComplaintList({ complaints, peopleById, onSelect, emptyTitle }) {
	if (complaints.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: emptyTitle,
		description: "Nothing needs attention here right now."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: complaints.map((complaint) => {
			const person = peopleById.get(complaint.reporter_id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "w-full rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40",
				onClick: () => onSelect(complaint),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-semibold",
							children: complaint.subject
						}), person && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: ["From ", person.full_name || person.email || "Community member"]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: complaint.status })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 line-clamp-2 text-sm text-muted-foreground",
						children: complaint.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: new Date(complaint.created_at).toLocaleString()
					})
				]
			}, complaint.id);
		})
	});
}
function ComplaintDetails({ complaint, complainant, isAdmin, resolutionNotes, setResolutionNotes, updating, onStatusChange, onClose }) {
	const phone = complainant?.phone || "";
	const whatsapp = complainant?.whatsapp_number || phone;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(complaint),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: complaint?.subject || "Complaint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: complaint ? `Submitted ${new Date(complaint.created_at).toLocaleString()}` : "" })] }), complaint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl bg-secondary/35 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-6",
							children: complaint.description || "No description provided."
						})
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold",
							children: "Complainant"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Name",
									value: complainant?.full_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Resident type",
									value: complainant?.resident_type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Phone",
									value: phone
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "WhatsApp",
									value: whatsapp
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: getWhatsAppLink(whatsapp),
									target: "_blank",
									rel: "noreferrer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mr-2 h-4 w-4" }), "WhatsApp"]
								})
							}), phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `tel:${phone}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "mr-2 h-4 w-4" }), "Call"]
								})
							})]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Status",
								value: complaint.status.replace("_", " ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Priority",
								value: complaint.priority
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
								label: "Category",
								value: complaint.category
							})
						]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-3 border-t border-border pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Resolution note" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 3,
								value: resolutionNotes,
								onChange: (event) => setResolutionNotes(event.target.value),
								placeholder: "What was done to resolve this complaint?"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => onStatusChange("in_progress"),
								disabled: updating,
								children: "Mark in progress"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => onStatusChange("resolved"),
								loading: updating,
								loadingLabel: "Updating complaint",
								children: "Mark resolved"
							})]
						})]
					}),
					!isAdmin && complaint.resolution_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
						label: "Resolution",
						value: complaint.resolution_notes
					})
				]
			})]
		})
	});
}
function SummaryCard({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between rounded-xl border border-border bg-card p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-display text-3xl font-semibold",
			children: value
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-6 w-6 text-primary" })]
	});
}
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-full px-2.5 py-1 text-xs font-medium capitalize ${["resolved", "closed"].includes(status) ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`,
		children: status.replace("_", " ")
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
			children: value || "Not provided"
		})]
	});
}
function getWhatsAppLink(number) {
	const digits = number.replace(/\D/g, "");
	return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
}
//#endregion
export { ComplaintsPage as component };
