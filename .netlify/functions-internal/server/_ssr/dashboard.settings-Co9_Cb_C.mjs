import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { n as Label, t as Input } from "./label-B2wtZvId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as Settings } from "../_libs/lucide-react.mjs";
import { a as useAuth, r as inviteAdminTeamMember } from "./use-auth-B-LWZl48.mjs";
import { n as PageLoading, t as PageLoadError } from "./page-loading-BzoD1xkC.mjs";
import { t as Textarea } from "./textarea-6e1tF3H-.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as PageHeader } from "./page-header-DnpF6lGt.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BKZRgQX9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard.settings-Co9_Cb_C.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var manageableRoles = [
	"estate_admin",
	"community_chairman",
	"community_secretary",
	"treasurer",
	"chief_security_officer",
	"security_officer",
	"security_gateman"
];
function SettingsPage() {
	const { user, profile, isAdmin } = useAuth();
	const qc = useQueryClient();
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [estateAddress, setEstateAddress] = (0, import_react.useState)("");
	const [inviteEmail, setInviteEmail] = (0, import_react.useState)("");
	const [inviteRole, setInviteRole] = (0, import_react.useState)("community_secretary");
	const [selectedResidentId, setSelectedResidentId] = (0, import_react.useState)("");
	const [selectedResidentRole, setSelectedResidentRole] = (0, import_react.useState)("security_officer");
	const [taskTitle, setTaskTitle] = (0, import_react.useState)("");
	const [taskDescription, setTaskDescription] = (0, import_react.useState)("");
	const [taskAssignedRole, setTaskAssignedRole] = (0, import_react.useState)("chief_security_officer");
	const [taskAssignedUserId, setTaskAssignedUserId] = (0, import_react.useState)("none");
	const [taskDueDate, setTaskDueDate] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (profile) {
			setFullName(profile.full_name || "");
			setPhone(profile.phone || "");
		}
	}, [profile]);
	const { data: estate, isLoading, isError, refetch } = useQuery({
		queryKey: ["oyesile-estate", profile?.estate_id],
		enabled: !!profile?.estate_id,
		queryFn: async () => {
			const { data } = await supabase.from("estates").select("*").eq("id", profile.estate_id).maybeSingle();
			return data;
		}
	});
	const { data: residents = [] } = useQuery({
		queryKey: ["settings-residents", profile?.estate_id],
		enabled: isAdmin && Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, full_name, email, phone").eq("estate_id", profile.estate_id).order("full_name", { ascending: true });
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: roles = [] } = useQuery({
		queryKey: ["settings-user-roles", profile?.estate_id],
		enabled: isAdmin && Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("user_roles").select("*").eq("estate_id", profile.estate_id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: invitations = [] } = useQuery({
		queryKey: ["admin-invitations", profile?.estate_id],
		enabled: isAdmin && Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("admin_invitations").select("*").eq("estate_id", profile.estate_id).order("invited_at", { ascending: false }).limit(8);
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: tasks = [] } = useQuery({
		queryKey: ["staff-tasks", profile?.estate_id],
		enabled: isAdmin && Boolean(profile?.estate_id),
		queryFn: async () => {
			const { data, error } = await supabase.from("staff_tasks").select("*").eq("estate_id", profile.estate_id).order("created_at", { ascending: false }).limit(10);
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (estate) setEstateAddress(estate.address || "");
	}, [estate]);
	const saveProfile = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("profiles").update({
				full_name: fullName,
				phone
			}).eq("id", user.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Profile updated");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const saveEstateDetails = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("Your account is not linked to Oyesile Estate yet.");
			const { error } = await supabase.from("estates").update({ address: estateAddress }).eq("id", profile.estate_id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Oyesile Estate details saved");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const inviteAdmin = useMutation({
		mutationFn: async () => {
			await inviteAdminTeamMember({ data: {
				email: inviteEmail,
				role: inviteRole,
				redirectTo: `${window.location.origin}/auth`
			} });
		},
		onSuccess: async (result) => {
			toast.success(result.mode === "assigned" ? "Role assigned immediately" : "Invite email sent");
			setInviteEmail("");
			await qc.invalidateQueries({ queryKey: ["admin-invitations"] });
			await qc.invalidateQueries({ queryKey: ["settings-user-roles"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const assignExistingRole = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id) throw new Error("No estate linked.");
			if (!selectedResidentId) throw new Error("Choose a resident first.");
			const { error } = await supabase.from("user_roles").insert({
				user_id: selectedResidentId,
				estate_id: profile.estate_id,
				role: selectedResidentRole
			});
			if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
			const { error: notifyError } = await supabase.from("notifications").insert({
				estate_id: profile.estate_id,
				user_id: selectedResidentId,
				title: "New estate role assigned",
				body: `You have been assigned as ${formatRole(selectedResidentRole)}.`,
				link: "/dashboard/settings"
			});
			if (notifyError) throw notifyError;
		},
		onSuccess: async () => {
			toast.success("Role assigned");
			setSelectedResidentId("");
			await qc.invalidateQueries({ queryKey: ["settings-user-roles"] });
			await qc.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const createTask = useMutation({
		mutationFn: async () => {
			if (!profile?.estate_id || !user?.id) throw new Error("No estate linked.");
			if (!taskTitle.trim()) throw new Error("Enter a task title.");
			const targetUserId = taskAssignedUserId === "none" ? null : taskAssignedUserId;
			const { error } = await supabase.from("staff_tasks").insert({
				estate_id: profile.estate_id,
				created_by: user.id,
				title: taskTitle.trim(),
				description: taskDescription.trim() || null,
				assigned_role: taskAssignedRole,
				assigned_user_id: targetUserId,
				due_date: taskDueDate || null
			});
			if (error) throw error;
			if (targetUserId) {
				const { error: notifyError } = await supabase.from("notifications").insert({
					estate_id: profile.estate_id,
					user_id: targetUserId,
					title: "New delegated task",
					body: taskTitle.trim(),
					link: "/dashboard"
				});
				if (notifyError) throw notifyError;
			}
		},
		onSuccess: async () => {
			toast.success("Task delegated");
			setTaskTitle("");
			setTaskDescription("");
			setTaskAssignedUserId("none");
			setTaskDueDate("");
			await qc.invalidateQueries({ queryKey: ["staff-tasks"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const roleSummary = (0, import_react.useMemo)(() => {
		const byUser = /* @__PURE__ */ new Map();
		roles.forEach((role) => {
			byUser.set(role.user_id, [...byUser.get(role.user_id) ?? [], formatRole(role.role)]);
		});
		return byUser;
	}, [roles]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoading, {
		label: "Loading settings",
		onRetry: () => void refetch()
	});
	if (isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoadError, { onRetry: () => void refetch() });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Settings",
			description: "Your profile, Oyesile Estate details, notifications and admin delegation.",
			icon: Settings
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 font-display text-lg font-semibold",
					children: "Your profile"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: profile?.email || "",
								disabled: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: phone,
								onChange: (e) => setPhone(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => saveProfile.mutate(),
							loading: saveProfile.isPending,
							loadingLabel: "Saving profile",
							children: "Save profile"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-1 font-display text-lg font-semibold",
						children: "Oyesile Estate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted-foreground",
						children: "This platform is for Oyesile Estate only. New residents are linked to this estate automatically after signup."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Estate name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: estate?.name || "Oyesile Estate",
									disabled: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: estateAddress,
									onChange: (e) => setEstateAddress(e.target.value),
									disabled: !isAdmin
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => saveEstateDetails.mutate(),
								disabled: !isAdmin || !profile?.estate_id,
								loading: saveEstateDetails.isPending,
								loadingLabel: "Saving estate details",
								children: "Save Oyesile details"
							})
						]
					})
				]
			})]
		}),
		isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg font-semibold",
							children: "Invite admin by email"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Send an email invite to the CSO, gateman, secretary or any other estate officer."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: inviteEmail,
										onChange: (e) => setInviteEmail(e.target.value),
										placeholder: "staff@example.com"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: inviteRole,
										onValueChange: (value) => setInviteRole(value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: manageableRoles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: role,
											children: formatRole(role)
										}, role)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => inviteAdmin.mutate(),
									loading: inviteAdmin.isPending,
									loadingLabel: "Sending invite",
									children: "Send invite"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Assign role to existing resident"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Resident" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedResidentId || void 0,
									onValueChange: setSelectedResidentId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose resident" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: residents.map((resident) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: resident.id,
										children: resident.full_name || resident.email || resident.phone || "Resident"
									}, resident.id)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedResidentRole,
									onValueChange: (value) => setSelectedResidentRole(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: manageableRoles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: role,
										children: formatRole(role)
									}, role)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => assignExistingRole.mutate(),
								loading: assignExistingRole.isPending,
								loadingLabel: "Assigning role",
								children: "Assign role"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl border border-border bg-card p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Delegate task"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Task title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: taskTitle,
									onChange: (e) => setTaskTitle(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 3,
									value: taskDescription,
									onChange: (e) => setTaskDescription(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Assign by role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: taskAssignedRole,
									onValueChange: (value) => setTaskAssignedRole(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: manageableRoles.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: role,
										children: formatRole(role)
									}, role)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Specific person" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: taskAssignedUserId,
									onValueChange: setTaskAssignedUserId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "none",
										children: "Role only"
									}), residents.map((resident) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: resident.id,
										children: resident.full_name || resident.email || resident.phone || "Resident"
									}, resident.id))] })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Due date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: taskDueDate,
									onChange: (e) => setTaskDueDate(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => createTask.mutate(),
								loading: createTask.isPending,
								loadingLabel: "Saving task",
								children: "Delegate task"
							})
						]
					})]
				})
			]
		}),
		isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 xl:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-card p-6 xl:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Current admin team"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: residents.filter((resident) => roleSummary.has(resident.id)).map((resident) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: resident.full_name || resident.email || "Resident"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: (roleSummary.get(resident.id) ?? []).join(", ")
						})]
					}, resident.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-2xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Recent invites"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: invitations.length > 0 ? invitations.map((invite) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: invite.email
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								formatRole(invite.role),
								" · ",
								invite.status
							]
						})]
					}, invite.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No invitations yet."
					})
				})]
			})]
		}),
		isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 rounded-2xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Recent delegated tasks"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3",
				children: tasks.length > 0 ? tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: task.title
						}),
						task.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: task.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: [
								task.assigned_role ? formatRole(task.assigned_role) : "No role",
								" ·",
								" ",
								task.status
							]
						})
					]
				}, task.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No tasks delegated yet."
				})
			})]
		})
	] });
}
function formatRole(role) {
	return role.replaceAll("_", " ");
}
//#endregion
export { SettingsPage as component };
