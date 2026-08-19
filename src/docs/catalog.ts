/** Bundled public doc pages (markdown under package `reference/`). */
export const BUNDLED_DOC_SLUGS = [
	"quickstart",
	"mcp",
	"models",
	"billing",
	"data_retention",
	"migration_openai",
	"migration_deepgram",
	"migration_assemblyai",
] as const;

export type BundledDocSlug = ( typeof BUNDLED_DOC_SLUGS )[ number ];

export const DOC_SLUG_DESCRIPTIONS : Record<BundledDocSlug, string> = {
	quickstart: "SDK install, auth, and first transcription",
	mcp: "MCP server setup, tools, and example prompts",
	models: "core vs max tiers and standard vs deferred service modes",
	billing: "Wallet, trust tiers, spend caps, and upload limits overview",
	data_retention: "Audio, transcript, and webhook retention tiers",
	migration_openai: "Migrating from OpenAI Whisper transcription",
	migration_deepgram: "Migrating from Deepgram",
	migration_assemblyai: "Migrating from AssemblyAI",
};

/** Slugs agents can pass to fetch_doc. */
export function listFetchDocSlugs() : string[] {

	return [
		...BUNDLED_DOC_SLUGS,
		"api",
		"api/<operation_slug> (e.g. api/post_v1_jobs, api/get_v1_limits)",
	];

}

export function isBundledDocSlug( slug : string ) : slug is BundledDocSlug {

	return ( BUNDLED_DOC_SLUGS as readonly string[] ).includes( slug );

}
