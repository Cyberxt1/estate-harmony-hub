//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-ra8uWVQ5.js
var manifest = {
	"3d3e332faf33a8bfa78ec415f3035f866c74e32115a35a146c03e0c735f874aa": {
		functionName: "removeCommunityMember_createServerFn_handler",
		importer: () => import("./_ssr/members.functions-Bqlfu0l3.mjs")
	},
	"653a259b4cd88e3c21eda318568c8894b375f36bb5a4495214446e2c1bb77d9b": {
		functionName: "getDuePaymentAvailability_createServerFn_handler",
		importer: () => import("./_ssr/payments.functions-DwAYEwCM.mjs")
	},
	"d799e55b122f282039c09a8743e49835ec17f0ac277978bf6f10e0422027270d": {
		functionName: "verifyDuePayment_createServerFn_handler",
		importer: () => import("./_ssr/payments.functions-DwAYEwCM.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
