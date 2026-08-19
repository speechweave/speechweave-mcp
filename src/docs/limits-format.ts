import type { AccountLimits } from "@speechweave/node";

function bytesToMb( bytes : number ) : number {

	return Math.round( ( bytes / ( 1024 * 1024 ) ) * 100 ) / 100;

}

/** Enrich raw GET /v1/limits bytes with human-readable MB fields for agents. */
export function summarizeLimits( limits : AccountLimits ) : Record<string, unknown> {

	return {
		...limits,
		max_input_mb: bytesToMb( limits.max_input_bytes ),
		sync_max_mb: bytesToMb( limits.sync_max_bytes ),
		proxy_max_mb: bytesToMb( limits.proxy_max_bytes ),
		hint:
			"These caps vary per account. Files above sync_max_bytes need deferred mode or the presigned upload + jobs flow (SDK). MCP file tools use the native upload path.",
	};

}
