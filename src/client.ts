import { SpeechWeave } from "@speechweave/node";
import { VERSION } from "./version.js";

/**
 * Fetch wrapper that prepends our own UA token ahead of the underlying
 * `@speechweave/node` one, so MCP-originated jobs can be told apart
 * from direct Node SDK usage.
 */
function mcpFetch(
	input : Parameters<typeof fetch>[ 0 ],
	init : RequestInit = {},
) : Promise<Response> {

	const h = new Headers( init.headers );
	const host_ua = h.get( "User-Agent" ) || undefined;
	h.set( "User-Agent", `speechweave-mcp/${ VERSION }${ host_ua ? ` ${ host_ua }` : "" }` );

	return fetch( input, {
		...init,
		headers: h, 
	} );

}

/** Build a SpeechWeave client from process env. Throws if SPEECHWEAVE_API_KEY is missing. */
export function createClientFromEnv( env : NodeJS.ProcessEnv = process.env ) : SpeechWeave {

	const api_key = env.SPEECHWEAVE_API_KEY?.trim();
	if ( ! api_key ) {

		throw new Error( "SPEECHWEAVE_API_KEY is not set. Add it to your MCP server env (e.g. Cursor mcp.json)." );

	}

	const base_url = env.SPEECHWEAVE_BASE_URL?.trim() || undefined;

	return new SpeechWeave( {
		api_key,
		...( base_url ? { base_url } : {} ),
		fetch_func: mcpFetch,
	} );

}

/** Default wait timeout for wait-first tools (ms). Honors SPEECHWEAVE_JOB_WAIT_MS when set; otherwise 1 hour. */
export function defaultWaitTimeoutMs( env : NodeJS.ProcessEnv = process.env ) : number {

	const raw = env.SPEECHWEAVE_JOB_WAIT_MS;
	if ( raw != null && String( raw ).trim() !== "" ) {

		const n = Number( raw );
		if ( Number.isFinite( n ) && n > 0 ) {

			return n;

		}

	}

	return 3_600_000;

}
