import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-yydkHmVi.js
function isNewSupabaseApiKey(value) {
	return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
	return (input, init) => {
		const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
		if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
		if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
		headers.set("apikey", supabaseKey);
		return fetch(input, {
			...init,
			headers
		});
	};
}
function getBrowserStorage() {
	if (typeof window === "undefined") return void 0;
	try {
		const testKey = "__oyesile_storage_check__";
		window.localStorage.setItem(testKey, testKey);
		window.localStorage.removeItem(testKey);
		return window.localStorage;
	} catch {
		return;
	}
}
function createSupabaseClient() {
	const SUPABASE_URL = "https://cubrmvtbyryqvkgseqrm.supabase.co";
	const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1YnJtdnRieXJ5cXZrZ3NlcXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Njc4NTYsImV4cCI6MjA5ODA0Mzg1Nn0.0pvvOscsuF7iEafNVk7m4NH7O6H99YCMcHCJV_ii7Jw";
	return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
		auth: {
			storage: getBrowserStorage(),
			persistSession: true,
			autoRefreshToken: true
		}
	});
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
