import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as useRouter, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, k as redirect, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Route$16 } from "./auth-BsnON3VI.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as AuthProvider } from "./use-auth-CJoPS59J.mjs";
import { n as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-o6UPQGm5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BOKkHwm6.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$15 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Oyesile Estate" },
			{
				name: "description",
				content: "The private resident and community officer app for Oyesile Estate."
			},
			{
				property: "og:title",
				content: "Oyesile Estate"
			},
			{
				property: "og:description",
				content: "Manage residents, dues, visitors, announcements, complaints and security for Oyesile Estate."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$15.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			richColors: true,
			position: "top-right"
		})] })
	});
}
var Route$14 = createFileRoute("/signup")({ beforeLoad: () => {
	throw redirect({
		to: "/auth",
		search: { tab: "signup" }
	});
} });
var $$splitComponentImporter$13 = () => import("./dashboard-CdpTndvg.mjs");
var Route$13 = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		if (typeof window === "undefined") return;
		const { data } = await supabase.auth.getSession();
		if (!data.session) throw redirect({ to: "/auth" });
	},
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./routes-DbzOr2kv.mjs");
var Route$12 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Oyesile Estate" },
		{
			name: "description",
			content: "The private resident and community officer app for Oyesile Estate."
		},
		{
			property: "og:title",
			content: "Welcome to Oyesile Estate"
		},
		{
			property: "og:description",
			content: "Sign in to manage dues, visitors, announcements, complaints, security and community records."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./dashboard.index-DJLaiKtV.mjs");
var Route$11 = createFileRoute("/dashboard/")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./dashboard.visitors-Bpt1JFjc.mjs");
var Route$10 = createFileRoute("/dashboard/visitors")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./dashboard.settings-Dy9uFzSk.mjs");
var Route$9 = createFileRoute("/dashboard/settings")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./dashboard.security-rDGTragP.mjs");
var Route$8 = createFileRoute("/dashboard/security")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./dashboard.residents-x6oX7HAX.mjs");
var Route$7 = createFileRoute("/dashboard/residents")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./dashboard.reports-DCcXd2Ma.mjs");
var Route$6 = createFileRoute("/dashboard/reports")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./dashboard.properties-Bfel7HPc.mjs");
var Route$5 = createFileRoute("/dashboard/properties")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./dashboard.payments-B6ueXPF9.mjs");
var Route$4 = createFileRoute("/dashboard/payments")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./dashboard.onboarding-BhBwATaP.mjs");
var Route$3 = createFileRoute("/dashboard/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./dashboard.documents-Dn0uI3T1.mjs");
var Route$2 = createFileRoute("/dashboard/documents")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./dashboard.complaints-Cthpirx5.mjs");
var Route$1 = createFileRoute("/dashboard/complaints")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./dashboard.announcements-B8dZnAn2.mjs");
var Route = createFileRoute("/dashboard/announcements")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var SignupRoute = Route$14.update({
	id: "/signup",
	path: "/signup",
	getParentRoute: () => Route$15
});
var DashboardRoute = Route$13.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$15
});
var AuthRoute = Route$16.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$15
});
var IndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$15
});
var DashboardIndexRoute = Route$11.update({
	id: "/",
	path: "/",
	getParentRoute: () => DashboardRoute
});
var DashboardVisitorsRoute = Route$10.update({
	id: "/visitors",
	path: "/visitors",
	getParentRoute: () => DashboardRoute
});
var DashboardSettingsRoute = Route$9.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => DashboardRoute
});
var DashboardSecurityRoute = Route$8.update({
	id: "/security",
	path: "/security",
	getParentRoute: () => DashboardRoute
});
var DashboardResidentsRoute = Route$7.update({
	id: "/residents",
	path: "/residents",
	getParentRoute: () => DashboardRoute
});
var DashboardReportsRoute = Route$6.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => DashboardRoute
});
var DashboardPropertiesRoute = Route$5.update({
	id: "/properties",
	path: "/properties",
	getParentRoute: () => DashboardRoute
});
var DashboardPaymentsRoute = Route$4.update({
	id: "/payments",
	path: "/payments",
	getParentRoute: () => DashboardRoute
});
var DashboardOnboardingRoute = Route$3.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => DashboardRoute
});
var DashboardDocumentsRoute = Route$2.update({
	id: "/documents",
	path: "/documents",
	getParentRoute: () => DashboardRoute
});
var DashboardComplaintsRoute = Route$1.update({
	id: "/complaints",
	path: "/complaints",
	getParentRoute: () => DashboardRoute
});
var DashboardRouteChildren = {
	DashboardAnnouncementsRoute: Route.update({
		id: "/announcements",
		path: "/announcements",
		getParentRoute: () => DashboardRoute
	}),
	DashboardComplaintsRoute,
	DashboardDocumentsRoute,
	DashboardOnboardingRoute,
	DashboardPaymentsRoute,
	DashboardPropertiesRoute,
	DashboardReportsRoute,
	DashboardResidentsRoute,
	DashboardSecurityRoute,
	DashboardSettingsRoute,
	DashboardVisitorsRoute,
	DashboardIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthRoute,
	DashboardRoute: DashboardRoute._addFileChildren(DashboardRouteChildren),
	SignupRoute
};
var routeTree = Route$15._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient({ defaultOptions: { queries: {
			staleTime: 3e4,
			refetchOnWindowFocus: false,
			retry: 1
		} } }) },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
