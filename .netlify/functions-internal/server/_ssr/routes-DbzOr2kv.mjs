import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-yydkHmVi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { j as Building2 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DbzOr2kv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SplashScreen() {
	const navigate = useNavigate();
	const [leaving, setLeaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		let redirectTimer;
		const boot = async () => {
			const userResult = await Promise.race([supabase.auth.getUser().catch(() => null), new Promise((resolve) => window.setTimeout(() => resolve(null), 1800))]);
			await new Promise((resolve) => window.setTimeout(resolve, 650));
			if (cancelled) return;
			setLeaving(true);
			redirectTimer = window.setTimeout(() => {
				if (cancelled) return;
				navigate({
					to: userResult?.data.user ? "/dashboard" : "/auth",
					replace: true
				});
			}, 280);
		};
		boot();
		return () => {
			cancelled = true;
			if (redirectTimer) window.clearTimeout(redirectTimer);
		};
	}, [navigate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: `grid min-h-screen place-items-center bg-background px-6 transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-20 w-20 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-9 w-9" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 font-display text-3xl font-semibold text-foreground",
					children: "Welcome to Oyesile Estate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-1/2 animate-[splash-progress_1s_ease-in-out_infinite] rounded-full bg-primary" })
				})
			]
		})
	});
}
//#endregion
export { SplashScreen as component };
