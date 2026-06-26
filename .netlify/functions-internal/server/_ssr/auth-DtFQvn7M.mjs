import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DNwKaOJw.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { n as Label, t as Input } from "./label-CmIE8x5o.mjs";
import { P as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as Building2, w as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as createLovableAuth } from "../_libs/lovable.dev__cloud-auth-js.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DtFQvn7M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var lovableAuth = createLovableAuth();
var lovable = { auth: { signInWithOAuth: async (provider, opts) => {
	const result = await lovableAuth.signInWithOAuth(provider, {
		redirect_uri: opts?.redirect_uri,
		extraParams: { ...opts?.extraParams }
	});
	if (result.redirected) return result;
	if (result.error) return result;
	try {
		await supabase.auth.setSession(result.tokens);
	} catch (e) {
		return { error: e instanceof Error ? e : new Error(String(e)) };
	}
	return result;
} } };
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function AuthPage() {
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) navigate({ to: "/dashboard" });
		});
	}, [navigate]);
	const handleSignIn = async (e) => {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		toast.success("Welcome back to Oyesile Estate");
		navigate({ to: "/dashboard" });
	};
	const handleSignUp = async (e) => {
		e.preventDefault();
		setLoading(true);
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: window.location.origin,
				data: { full_name: fullName }
			}
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		toast.success("Account created. Check your email to confirm.");
	};
	const handleGoogle = async () => {
		setLoading(true);
		const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
		if (result.error) {
			setLoading(false);
			toast.error(result.error.message ?? "Google sign-in failed");
			return;
		}
		if (result.redirected) return;
		navigate({ to: "/dashboard" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-screen md:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative hidden flex-col justify-between p-12 md:flex",
			style: { background: "var(--gradient-hero)" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg font-semibold",
						children: "Oyesile Estate"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-semibold leading-tight",
					children: "Welcome to the Oyesile Estate community app."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-muted-foreground",
					children: "Sign in to see dues, Paystack-ready payments, visitors, security updates and announcements for your home."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" Oyesile Estate"
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center p-6 md:p-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "mb-8 inline-flex items-center gap-2 md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg font-semibold",
							children: "Oyesile Estate"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "Welcome to Oyesile Estate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Sign in or create your resident account to continue."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: tab,
						onValueChange: (v) => setTab(v),
						className: "mt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "signin",
									children: "Sign in"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "signup",
									children: "Create account"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "signin",
								className: "mt-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSignIn,
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "email",
												children: "Email"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email",
												type: "email",
												required: true,
												value: email,
												onChange: (e) => setEmail(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "password",
												children: "Password"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "password",
												type: "password",
												required: true,
												value: password,
												onChange: (e) => setPassword(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: loading,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Sign in"
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "signup",
								className: "mt-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSignUp,
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "name",
												children: "Full name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "name",
												required: true,
												value: fullName,
												onChange: (e) => setFullName(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "email2",
												children: "Email"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email2",
												type: "email",
												required: true,
												value: email,
												onChange: (e) => setEmail(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "password2",
												children: "Password"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "password2",
												type: "password",
												required: true,
												minLength: 8,
												value: password,
												onChange: (e) => setPassword(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: loading,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Create account"
										})
									]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "my-6 flex items-center gap-3 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-border" }),
							"OR",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-border" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "w-full",
						onClick: handleGoogle,
						disabled: loading,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							className: "mr-2 h-4 w-4",
							viewBox: "0 0 24 24",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "#4285F4",
									d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "#34A853",
									d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "#FBBC05",
									d: "M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "#EA4335",
									d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
								})
							]
						}), "Continue with Google"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-center text-xs text-muted-foreground",
						children: "By continuing you agree to our terms and privacy policy."
					})
				]
			})
		})]
	});
}
//#endregion
export { AuthPage as component };
