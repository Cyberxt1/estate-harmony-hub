import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-BsnON3VI.js
var $$splitComponentImporter = () => import("./auth-DiDJGFbE.mjs");
var Route = createFileRoute("/auth")({
	validateSearch: (search) => ({ tab: search.tab === "signup" ? "signup" : "signin" }),
	head: () => ({ meta: [{ title: "Sign in - Oyesile Estate" }, {
		name: "description",
		content: "Sign in or create your Oyesile Estate account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
