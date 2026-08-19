const HTTP_METHODS = new Set( [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"head",
	"options",
] );

type OpenApiDocument = {
	info ?: { title ?: string;
		version ?: string;
		description ?: string; };
	servers ?: Array<{ url : string;
		description ?: string; }>;
	paths ?: Record<string, Record<string, unknown>>;
};

type OpenApiOperation = {
	summary ?: string;
	description ?: string;
	tags ?: string[];
	parameters ?: unknown[];
	requestBody ?: unknown;
	responses ?: Record<string, unknown>;
};

/** Stable slug: post_v1_jobs, get_v1_limits, post_v1_audio_transcriptions */
export function operationSlug( method : string, path : string ) : string {

	const segments = path
		.replace( /^\//, "" )
		.split( "/" )
		.map( ( seg ) => seg.replace( /^\{|\}$/g, "" ) )
		.filter( Boolean );

	return `${ method.toLowerCase() }_${ segments.join( "_" ) }`;

}

function listOperations( spec : OpenApiDocument ) : Array<{
	slug : string;
	method : string;
	path : string;
	summary : string;
}> {

	const out : Array<{
		slug : string;
		method : string;
		path : string;
		summary : string;
	}> = [];

	for ( const [ apiPath, pathItem ] of Object.entries( spec.paths ?? {} ) ) {

		if ( apiPath === "/v1/openapi.json" ) {

			continue;

		}

		for ( const [ method, rawOp ] of Object.entries( pathItem ?? {} ) ) {

			if ( ! HTTP_METHODS.has( method ) ) {

				continue;

			}

			const op = rawOp as OpenApiOperation;
			out.push( {
				slug: operationSlug( method, apiPath ),
				method: method.toUpperCase(),
				path: apiPath,
				summary: op.summary ?? "",
			} );

		}

	}

	out.sort( ( a, b ) => a.slug.localeCompare( b.slug ) );

	return out;

}

export function formatOpenApiOverview( spec : OpenApiDocument ) : string {

	const lines : string[] = [];
	const title = spec.info?.title ?? "SpeechWeave API";
	lines.push( `# ${ title }` );

	if ( spec.info?.version ) {

		lines.push( "", `Version: ${ spec.info.version }` );

	}

	if ( spec.info?.description ) {

		lines.push( "", spec.info.description.trim() );

	}

	if ( spec.servers?.length ) {

		lines.push( "", "## Base URLs" );
		for ( const server of spec.servers ) {

			const desc = server.description ? ` (${ server.description })` : "";
			lines.push( `- \`${ server.url }\`${ desc }` );

		}

	}

	lines.push(
		"",
		"## Authentication",
		"Send `Authorization: Bearer sk_live_…` on every request.",
		"",
		"## Operations",
		"Pass `slug: api/<operation_slug>` to fetch_doc for one endpoint.",
		"",
	);

	for ( const op of listOperations( spec ) ) {

		const summary = op.summary ? `: ${ op.summary }` : "";
		lines.push( `- \`${ op.slug }\` — ${ op.method } ${ op.path }${ summary }` );

	}

	return lines.join( "\n" );

}

export function findOpenApiOperation(
	spec : OpenApiDocument,
	targetSlug : string,
) : { method : string;
	path : string;
	operation : OpenApiOperation; } | null {

	for ( const [ apiPath, pathItem ] of Object.entries( spec.paths ?? {} ) ) {

		for ( const [ method, rawOp ] of Object.entries( pathItem ?? {} ) ) {

			if ( ! HTTP_METHODS.has( method ) ) {

				continue;

			}

			if ( operationSlug( method, apiPath ) !== targetSlug ) {

				continue;

			}

			return {
				method: method.toUpperCase(),
				path: apiPath,
				operation: rawOp as OpenApiOperation,
			};

		}

	}

	return null;

}

export function formatOpenApiOperation(
	method : string,
	path : string,
	operation : OpenApiOperation,
) : string {

	const lines : string[] = [
		`# ${ method } ${ path }`,
	];

	if ( operation.summary ) {

		lines.push( "", operation.summary );

	}

	if ( operation.description ) {

		lines.push( "", operation.description.trim() );

	}

	if ( operation.tags?.length ) {

		lines.push( "", `Tags: ${ operation.tags.join( ", " ) }` );

	}

	if ( operation.parameters?.length ) {

		lines.push( "", "## Parameters", "```json", JSON.stringify( operation.parameters, null, 2 ), "```" );

	}

	if ( operation.requestBody ) {

		lines.push( "", "## Request body", "```json", JSON.stringify( operation.requestBody, null, 2 ), "```" );

	}

	if ( operation.responses ) {

		lines.push( "", "## Responses", "```json", JSON.stringify( operation.responses, null, 2 ), "```" );

	}

	return lines.join( "\n" );

}
