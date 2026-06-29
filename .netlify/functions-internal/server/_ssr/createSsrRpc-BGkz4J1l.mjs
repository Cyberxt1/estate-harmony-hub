import { i as TSS_SERVER_FUNCTION } from "./esm-9EjmF9OT.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-ra8uWVQ5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-BGkz4J1l.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createSsrRpc as t };
