import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as CircleX, I as CircleCheck, h as Plus, l as Share2, m as QrCode, w as Download } from "../_libs/lucide-react.mjs";
import { r as useAuth } from "./use-auth-CJoPS59J.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.visitors-Bpt1JFjc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VisitorsPage() {
	const { user, profile, isSecurity, isAdmin } = useAuth();
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [purpose, setPurpose] = (0, import_react.useState)("");
	const [expectedAt, setExpectedAt] = (0, import_react.useState)("");
	const [selectedVisitor, setSelectedVisitor] = (0, import_react.useState)(null);
	const [shareVisitor, setShareVisitor] = (0, import_react.useState)(null);
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["visitors"],
		queryFn: async () => {
			const { data, error } = await supabase.from("visitors").select("*").order("created_at", { ascending: false }).limit(100);
			if (error) throw error;
			return data ?? [];
		}
	});
	const invite = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
			if (!fullName.trim()) throw new Error("Enter the visitor's full name.");
			if (!phone.trim()) throw new Error("Enter the visitor's phone number.");
			const qr = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
			const { data: visitor, error } = await supabase.from("visitors").insert({
				estate_id: profile.estate_id,
				host_id: user.id,
				full_name: fullName.trim(),
				phone: phone.trim(),
				purpose: purpose.trim() || null,
				expected_at: expectedAt ? new Date(expectedAt).toISOString() : null,
				qr_code: qr,
				status: "expected"
			}).select("*").single();
			if (error) throw error;
			return visitor;
		},
		onSuccess: async (visitor) => {
			toast.success("Visitor invite created.");
			setShareVisitor(visitor);
			setOpen(false);
			setFullName("");
			setPhone("");
			setPurpose("");
			setExpectedAt("");
			await qc.invalidateQueries({ queryKey: ["visitors"] });
			openWhatsAppShare(visitor, profile?.full_name || "Resident");
		},
		onError: (e) => toast.error(e.message)
	});
	const updateStatus = useMutation({
		mutationFn: async ({ id, status }) => {
			const patch = { status };
			if (status === "checked_in") {
				patch.checked_in_at = (/* @__PURE__ */ new Date()).toISOString();
				if (user?.id) patch.checked_in_by = user.id;
			} else {
				patch.checked_out_at = (/* @__PURE__ */ new Date()).toISOString();
				if (user?.id) patch.checked_out_by = user.id;
			}
			const { error } = await supabase.from("visitors").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Visitors",
			description: "Invite, generate QR codes, check in and out.",
			icon: QrCode,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Invite visitor"] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Invite a visitor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create the invite, download the QR, and send it straight to the visitor." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: fullName,
									onChange: (e) => setFullName(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Visitor phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: phone,
									onChange: (e) => setPhone(e.target.value),
									placeholder: "08012345678"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Purpose" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: purpose,
									onChange: (e) => setPurpose(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Expected arrival" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "datetime-local",
									value: expectedAt,
									onChange: (e) => setExpectedAt(e.target.value)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => invite.mutate(),
						disabled: !fullName.trim() || !phone.trim(),
						loading: invite.isPending,
						loadingLabel: "Generating visitor QR",
						children: "Generate QR"
					}) })
				] })]
			})
		}),
		isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() }) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading visitors",
			onRetry: () => void refetch()
		}) : data && data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-md border border-border bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[820px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Purpose"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Expected"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "QR"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "cursor-pointer border-t border-border transition hover:bg-secondary/30",
					onClick: () => setSelectedVisitor(v),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 font-medium",
							children: v.full_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-muted-foreground",
							children: v.purpose || "-"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-muted-foreground",
							children: v.expected_at ? new Date(v.expected_at).toLocaleString() : "-"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 font-mono text-xs",
							children: v.qr_code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground",
								children: v.status.replace("_", " ")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap justify-end gap-2",
								onClick: (event) => event.stopPropagation(),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setShareVisitor(v),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "mr-1 h-3.5 w-3.5" }), " Share"]
									}),
									(isSecurity || isAdmin) && v.status === "expected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => updateStatus.mutate({
											id: v.id,
											status: "checked_in"
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1 h-3.5 w-3.5" }), " Check in"]
									}),
									(isSecurity || isAdmin) && v.status === "checked_in" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => updateStatus.mutate({
											id: v.id,
											status: "checked_out"
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-1 h-3.5 w-3.5" }), " Check out"]
									})
								]
							})
						})
					]
				}, v.id)) })]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "No visitors yet",
			description: "Invite a visitor to generate a QR code. Security can scan and check them in at the gate."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!selectedVisitor,
			onOpenChange: (open) => !open && setSelectedVisitor(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: selectedVisitor?.full_name || "Visitor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Expanded visitor invite and gate activity." })] }), selectedVisitor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Name",
							value: selectedVisitor.full_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Phone",
							value: selectedVisitor.phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Purpose",
							value: selectedVisitor.purpose,
							wide: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Expected arrival",
							value: formatDateTime(selectedVisitor.expected_at)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Status",
							value: selectedVisitor.status.replace("_", " ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "QR code",
							value: selectedVisitor.qr_code,
							wide: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Checked in",
							value: formatDateTime(selectedVisitor.checked_in_at)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
							label: "Checked out",
							value: formatDateTime(selectedVisitor.checked_out_at)
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!shareVisitor,
			onOpenChange: (open) => !open && setShareVisitor(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: shareVisitor?.full_name || "Visitor invite" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Download the QR code or send the invite straight to the visitor." })] }), shareVisitor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-border bg-secondary/20 p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: getVisitorQrImageUrl(shareVisitor),
								alt: `QR code for ${shareVisitor.full_name}`,
								className: "mx-auto h-64 w-64 rounded-xl bg-white p-3"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Code",
									value: shareVisitor.qr_code
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Phone",
									value: shareVisitor.phone
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Purpose",
									value: shareVisitor.purpose,
									wide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
									label: "Expected arrival",
									value: formatDateTime(shareVisitor.expected_at),
									wide: true
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "flex-1",
								variant: "outline",
								onClick: () => void downloadQrCode(shareVisitor),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-2 h-4 w-4" }), "Download QR"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "flex-1",
								onClick: () => openWhatsAppShare(shareVisitor, profile?.full_name || "Resident"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "mr-2 h-4 w-4" }), "Share on WhatsApp"]
							})]
						})
					]
				})]
			})
		})
	] });
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
function formatDateTime(value) {
	return value ? new Date(value).toLocaleString() : "Not provided";
}
function getVisitorInvitePayload(visitor) {
	return [
		`Estate visitor invite for ${visitor.full_name}`,
		`Gate code: ${visitor.qr_code || "Not available"}`,
		`Purpose: ${visitor.purpose || "Visitor entry"}`,
		`Expected time: ${formatDateTime(visitor.expected_at)}`
	].join("\n");
}
function getVisitorQrImageUrl(visitor) {
	const payload = getVisitorInvitePayload(visitor);
	return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(payload)}`;
}
function getVisitorWhatsAppLink(visitor, hostName) {
	const phone = normalizeWhatsAppPhone(visitor.phone);
	if (!phone) return null;
	const text = [
		`Hello ${visitor.full_name},`,
		`${hostName} invited you to Oyesile Estate.`,
		"",
		`Gate code: ${visitor.qr_code || "Not available"}`,
		`Purpose: ${visitor.purpose || "Visitor entry"}`,
		`Expected time: ${formatDateTime(visitor.expected_at)}`,
		"",
		`QR code: ${getVisitorQrImageUrl(visitor)}`,
		"Please show the QR code or gate code at the entrance."
	].join("\n");
	return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
function normalizeWhatsAppPhone(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith("+")) return trimmed.slice(1).replace(/\D/g, "");
	const digits = trimmed.replace(/\D/g, "");
	if (!digits) return null;
	if (digits.startsWith("234")) return digits;
	if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
	return digits;
}
function openWhatsAppShare(visitor, hostName) {
	const link = getVisitorWhatsAppLink(visitor, hostName);
	if (!link) {
		toast.error("Enter a valid visitor phone number with country code or a working mobile number.");
		return;
	}
	window.open(link, "_blank", "noopener,noreferrer");
}
async function downloadQrCode(visitor) {
	try {
		const response = await fetch(getVisitorQrImageUrl(visitor));
		if (!response.ok) throw new Error("QR download failed");
		const blob = await response.blob();
		const fileUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = fileUrl;
		link.download = `${visitor.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "visitor"}-qr.png`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(fileUrl);
	} catch {
		toast.error("QR code could not be downloaded right now.");
	}
}
//#endregion
export { VisitorsPage as component };
