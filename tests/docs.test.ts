import {
	describe, expect, it, vi,
} from "vitest";
import { fetchDoc, openApiSpecUrl } from "../src/docs/fetch-doc.js";
import { summarizeLimits } from "../src/docs/limits-format.js";
import {
	findOpenApiOperation,
	formatOpenApiOverview,
	operationSlug,
} from "../src/docs/openapi-format.js";

describe( "fetchDoc", () => {

	it( "returns bundled quickstart markdown", async () => {

		const result = await fetchDoc( "quickstart" );
		expect( result.source ).toBe( "bundled" );
		expect( result.content ).toMatch( /Quickstart/i );
		expect( result.slug ).toBe( "quickstart" );

	} );

	it( "returns slug catalog for list", async () => {

		const result = await fetchDoc( "list" );
		expect( result.content ).toMatch( /Available SpeechWeave docs/ );
		expect( result.content ).toMatch( /quickstart/ );

	} );

	it( "fetches openapi overview for api slug", async () => {

		const fetchFn = vi.fn( async () => ( {
			ok: true,
			json: async () => ( {
				info: { title: "SpeechWeave API",
					version: "1.0.0" },
				paths: {
					"/v1/limits": {
						get: { summary: "Account limits" },
					},
				},
			} ),
		} ) ) as unknown as typeof fetch;

		const result = await fetchDoc( "api", {}, fetchFn );
		expect( result.source ).toBe( "openapi" );
		expect( result.content ).toMatch( /SpeechWeave API/ );
		expect( result.content ).toMatch( /get_v1_limits/ );
		expect( fetchFn ).toHaveBeenCalledOnce();

	} );

	it( "fetches one openapi operation by slug", async () => {

		const fetchFn = vi.fn( async () => ( {
			ok: true,
			json: async () => ( {
				paths: {
					"/v1/jobs": {
						post: {
							summary: "Create job",
							description: "Submit transcription job",
						},
					},
				},
			} ),
		} ) ) as unknown as typeof fetch;

		const result = await fetchDoc( "api/post_v1_jobs", {}, fetchFn );
		expect( result.content ).toMatch( /POST \/v1\/jobs/ );
		expect( result.content ).toMatch( /Create job/ );

	} );

	it( "rejects unknown slugs", async () => {

		await expect( fetchDoc( "not_a_real_page" ) ).rejects.toThrow( /Unknown doc slug/ );

	} );

	it( "derives openapi URL from SPEECHWEAVE_BASE_URL", () => {

		expect( openApiSpecUrl( { SPEECHWEAVE_BASE_URL: "https://apidev.speechweave.com/v1" } ) )
			.toBe( "https://apidev.speechweave.com/v1/openapi.json" );

	} );

} );

describe( "openapi-format", () => {

	it( "builds stable operation slugs", () => {

		expect( operationSlug( "post", "/v1/jobs" ) ).toBe( "post_v1_jobs" );
		expect( operationSlug( "get", "/v1/jobs/{id}" ) ).toBe( "get_v1_jobs_id" );

	} );

	it( "finds operations in a spec", () => {

		const spec = {
			paths: {
				"/v1/limits": {
					get: { summary: "Limits" },
				},
			},
		};
		const match = findOpenApiOperation( spec, "get_v1_limits" );
		expect( match?.method ).toBe( "GET" );
		expect( match?.operation.summary ).toBe( "Limits" );

	} );

	it( "formats overview with operation index", () => {

		const text = formatOpenApiOverview( {
			info: { title: "Test API" },
			paths: {
				"/v1/limits": {
					get: { summary: "Limits" },
				},
			},
		} );
		expect( text ).toMatch( /Test API/ );
		expect( text ).toMatch( /get_v1_limits/ );

	} );

} );

describe( "summarizeLimits", () => {

	it( "adds MB fields and hint", () => {

		const out = summarizeLimits( {
			max_input_bytes: 262_144_000,
			sync_max_bytes: 94_371_840,
			proxy_max_bytes: 94_371_840,
		} );

		expect( out.max_input_mb ).toBe( 250 );
		expect( out.sync_max_mb ).toBe( 90 );
		expect( out.hint ).toMatch( /sync_max_bytes/ );

	} );

} );
