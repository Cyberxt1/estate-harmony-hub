import { N as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-CelYkufv.mjs";
import { N as LoaderCircle, f as RotateCw } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/page-loading-BzoD1xkC.js
var import_jsx_runtime = require_jsx_runtime();
function PageLoading({ label = "Loading page", fullScreen = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `grid place-items-center px-5 ${fullScreen ? "min-h-screen bg-background" : "min-h-[28vh]"}`,
		role: "status",
		"aria-live": "polite",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
		})
	});
}
function PageLoadError({ onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-[28vh] place-items-center px-5 text-center",
		role: "alert",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm rounded-lg border border-border bg-card px-5 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "Couldn't load this page."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "mt-3",
				size: "sm",
				variant: "outline",
				onClick: onRetry,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "h-3.5 w-3.5" }), "Retry"]
			})]
		})
	});
}
//#endregion
export { PageLoading as n, PageLoadError as t };
