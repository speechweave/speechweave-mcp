import fs from "node:fs";
import path from "node:path";
import {
	BUNDLED_DOC_SLUGS,
	DOC_SLUG_DESCRIPTIONS,
	isBundledDocSlug,
	listFetchDocSlugs,
} from "./catalog.js";
import {
	findOpenApiOperation,
	formatOpenApiOperation,
	formatOpenApiOverview,
} from "./openapi-format.js";

function resolvePackageRoot() : string {

	const starts : string[] = [];

	if ( typeof __dirname !== "undefined" ) {

		starts.push( path.resolve( __dirname, ".." ) );

	}

	starts.push( process.cwd() );

	for ( const start of starts ) {

		let dir = start;
		for ( let depth = 0; depth < 6; depth += 1 ) {

			const probe = path.join( dir, "reference", "quickstart.md" );
			try {

				fs.readFileSync( probe, "utf8" );
				return dir;

			}
			catch {

				// Keep walking up.
			}

			const parent = path.dirname( dir );
			if ( parent === dir ) {

				break;

			}

			dir = parent;

		}

	}

	throw new Error( "Cannot locate bundled reference docs (missing reference/ directory)." );

}

const PACKAGE_ROOT = resolvePackageRoot();

function bundledDocPath( slug : string ) : string {

	return path.join( PACKAGE_ROOT, "reference", `${ slug }.md` );

}

/** Resolve OpenAPI JSON URL from env (honors SPEECHWEAVE_BASE_URL when set). */
export function openApiSpecUrl( env : NodeJS.ProcessEnv = process.env ) : string {

	const base = env.SPEECHWEAVE_BASE_URL?.trim();
	if ( base ) {

		return `${ base.replace( /\/+$/, "" ) }/openapi.json`;

	}

	return "https://speechweave.com/v1/openapi.json";

}

async function fetchOpenApi(
	fetchFn : typeof fetch,
	env : NodeJS.ProcessEnv,
) {

	const url = openApiSpecUrl( env );
	const res = await fetchFn( url );

	if ( ! res.ok ) {

		throw new Error( `OpenAPI fetch failed (${ res.status }) from ${ url }` );

	}

	return res.json() as Promise<Record<string, unknown>>;

}

function readBundledDoc( slug : string ) : string {

	const filePath = bundledDocPath( slug );
	return fs.readFileSync( filePath, "utf8" );

}

export type FetchDocResult = {
	slug : string;
	source : "bundled" | "openapi";
	content : string;
	url ?: string;
};

/** Fetch a public SpeechWeave doc page by slug. */
export async function fetchDoc(
	slug : string,
	env : NodeJS.ProcessEnv = process.env,
	fetchFn : typeof fetch = fetch,
) : Promise<FetchDocResult> {

	const normalized = slug.trim().replace( /^\/+|\/+$/g, "" );

	if ( normalized === "" || normalized === "list" ) {

		const catalog = BUNDLED_DOC_SLUGS.map( ( s ) => ( {
			slug: s,
			description: DOC_SLUG_DESCRIPTIONS[ s ],
		} ) );

		return {
			slug: normalized || "list",
			source: "bundled",
			content: [
				"# Available SpeechWeave docs",
				"",
				"Bundled pages:",
				...catalog.map( ( entry ) => `- \`${ entry.slug }\`: ${ entry.description }` ),
				"",
				"Live API reference:",
				"- `api`: OpenAPI overview and operation index",
				"- `api/<operation_slug>`: one operation (e.g. `api/get_v1_limits`, `api/post_v1_jobs`)",
				"",
				"Full list:",
				...listFetchDocSlugs().map( ( s ) => `- ${ s }` ),
			].join( "\n" ),
		};

	}

	if ( isBundledDocSlug( normalized ) ) {

		return {
			slug: normalized,
			source: "bundled",
			content: readBundledDoc( normalized ),
			url: `https://speechweave.com/docs/${ normalized === "quickstart" ? "" : normalized.replace( /^migration_/, "migration/" ) }`,
		};

	}

	if ( normalized === "api" ) {

		const spec = await fetchOpenApi( fetchFn, env );
		const url = openApiSpecUrl( env );

		return {
			slug: normalized,
			source: "openapi",
			content: formatOpenApiOverview( spec ),
			url,
		};

	}

	if ( normalized.startsWith( "api/" ) ) {

		const operationSlug = normalized.slice( "api/".length );
		const spec = await fetchOpenApi( fetchFn, env );
		const match = findOpenApiOperation( spec, operationSlug );

		if ( ! match ) {

			throw new Error(
				`Unknown API operation slug "${ operationSlug }". Call fetch_doc with slug "api" for the full index.`,
			);

		}

		return {
			slug: normalized,
			source: "openapi",
			content: formatOpenApiOperation( match.method, match.path, match.operation ),
			url: openApiSpecUrl( env ),
		};

	}

	throw new Error(
		`Unknown doc slug "${ normalized }". Call fetch_doc with slug "list" for available pages.`,
	);

}
