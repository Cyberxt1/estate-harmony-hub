import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as Megaphone, g as Plus, o as Trash2 } from "../_libs/lucide-react.mjs";
import { a as useAuth } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-DyVDz4Ba.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader, t as EmptyState } from "./page-header-DnpF6lGt.mjs";
import { t as Checkbox } from "./checkbox-JVQXDHxI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DMNUCmq6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.announcements-CEVIjBxs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AnnouncementsPage() {
	const { user, profile, isAdmin } = useAuth();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [selectedAnnouncement, setSelectedAnnouncement] = (0, import_react.useState)(null);
	const [announcementToDelete, setAnnouncementToDelete] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [audience, setAudience] = (0, import_react.useState)("all");
	const [selectedMemberIds, setSelectedMemberIds] = (0, import_react.useState)([]);
	const { data: announcements = [], isLoading, isError } = useQuery({
		queryKey: [
			"announcements",
			profile?.estate_id,
			user?.id
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("announcements").select("*").order("published_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: members = [], isLoading: membersLoading, isError: membersError } = useQuery({
		queryKey: ["announcement-members", profile?.estate_id],
		enabled: isAdmin,
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, full_name, email, resident_type").eq("estate_id", profile.estate_id).order("full_name", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const createAnnouncement = useMutation({
		mutationFn: async () => {
			if (!user || !profile?.estate_id) throw new Error("Your account is not linked to the estate.");
			if (!title.trim() || !body.trim()) throw new Error("Add a title and message.");
			if (audience === "selected" && selectedMemberIds.length === 0) throw new Error("Select at least one member.");
			const { data: announcement, error } = await supabase.from("announcements").insert({
				estate_id: profile.estate_id,
				author_id: user.id,
				title: title.trim(),
				body: body.trim(),
				audience
			}).select().single();
			if (error) throw error;
			if (audience === "selected") {
				const { error: recipientError } = await supabase.from("announcement_recipients").insert(selectedMemberIds.map((memberId) => ({
					announcement_id: announcement.id,
					user_id: memberId
				})));
				if (recipientError) {
					await supabase.from("announcements").delete().eq("id", announcement.id);
					throw recipientError;
				}
			}
		},
		onSuccess: async () => {
			toast.success("Announcement published");
			setCreateOpen(false);
			setTitle("");
			setBody("");
			setAudience("all");
			setSelectedMemberIds([]);
			await queryClient.invalidateQueries({ queryKey: ["announcements"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const removeAnnouncement = useMutation({
		mutationFn: async (announcement) => {
			const { error } = await supabase.from("announcements").delete().eq("id", announcement.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			toast.success("Announcement deleted");
			setAnnouncementToDelete(null);
			setSelectedAnnouncement(null);
			await queryClient.invalidateQueries({ queryKey: ["announcements"] });
		},
		onError: (error) => toast.error(error.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Announcements",
			description: isAdmin ? "Send notices to everyone or to the exact group that needs them." : "Community notices meant for you.",
			icon: Megaphone,
			children: isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => setCreateOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), "New announcement"]
			})
		}),
		isError || isAdmin && membersError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void queryClient.refetchQueries() }) : isLoading || isAdmin && membersLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
			label: "Loading announcements",
			onRetry: () => void queryClient.refetchQueries()
		}) : announcements.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: announcements.map((announcement) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "w-full rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40",
				onClick: () => setSelectedAnnouncement(announcement),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-semibold",
							children: announcement.title
						}), isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground",
							children: formatAudience(announcement.audience)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground",
						children: announcement.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: announcement.published_at ? new Date(announcement.published_at).toLocaleString() : ""
					})
				]
			}, announcement.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "No announcements",
			description: isAdmin ? "Publish a notice when the community needs an update." : "There are no new notices for you."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New announcement" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Only the audience you choose will see this notice." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: title,
									onChange: (event) => setTitle(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Message" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 5,
									value: body,
									onChange: (event) => setBody(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Who should see this?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: audience,
									onValueChange: (value) => setAudience(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "Everyone"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "tenant",
											children: "All tenants"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "landlord",
											children: "All landlords"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "selected",
											children: "Selected members"
										})
									] })]
								})]
							}),
							audience === "selected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2",
								children: members.map((member) => {
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary/40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
											checked: selectedMemberIds.includes(member.id),
											onCheckedChange: (next) => setSelectedMemberIds(next ? [...selectedMemberIds, member.id] : selectedMemberIds.filter((id) => id !== member.id))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block truncate font-medium",
												children: member.full_name || member.email || "Member"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-xs capitalize text-muted-foreground",
												children: member.resident_type || "Member"
											})]
										})]
									}, member.id);
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setCreateOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => createAnnouncement.mutate(),
						loading: createAnnouncement.isPending,
						loadingLabel: "Publishing announcement",
						children: "Publish"
					})] })
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: Boolean(selectedAnnouncement),
			onOpenChange: (open) => !open && setSelectedAnnouncement(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-y-auto sm:max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: selectedAnnouncement?.title || "Announcement" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: selectedAnnouncement?.published_at ? new Date(selectedAnnouncement.published_at).toLocaleString() : "" })] }), selectedAnnouncement && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-wrap text-sm leading-6",
						children: selectedAnnouncement.body
					}), isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 border-t border-border pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted-foreground",
							children: ["Sent to ", formatAudience(selectedAnnouncement.audience).toLowerCase()]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "text-destructive hover:text-destructive",
							onClick: () => setAnnouncementToDelete(selectedAnnouncement),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"]
						})]
					})]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
			open: Boolean(announcementToDelete),
			onOpenChange: (open) => !open && setAnnouncementToDelete(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this announcement?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "It will disappear for everyone who received it. This cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Keep it" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
				className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				onClick: () => announcementToDelete && removeAnnouncement.mutate(announcementToDelete),
				children: "Delete announcement"
			})] })] })
		})
	] });
}
function formatAudience(audience) {
	return {
		all: "Everyone",
		tenant: "All tenants",
		landlord: "All landlords",
		selected: "Selected members"
	}[audience] || "Everyone";
}
//#endregion
export { AnnouncementsPage as component };
