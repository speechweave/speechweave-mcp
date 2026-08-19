import {
	describe, expect, it, vi, 
} from "vitest";
import { SpeechWeaveError } from "@speechweave/node";
import { createHandlers, type WaitForJobFn } from "../src/tools/handlers.js";

vi.mock( "node:fs", async ( importActual ) => {

	const actual = await importActual<typeof import( "node:fs" )>();
	const existsSync = vi.fn( () => true );

	return {
		default: {
			existsSync,
			readFileSync: actual.readFileSync,
		},
		existsSync,
		readFileSync: actual.readFileSync,
	};

} );

function mockClient( overrides : {
	create ?: ReturnType<typeof vi.fn>;
	get ?: ReturnType<typeof vi.fn>;
	cancel ?: ReturnType<typeof vi.fn>;
	getJobFormatted ?: ReturnType<typeof vi.fn>;
	getLimits ?: ReturnType<typeof vi.fn>;
} = {} ) {

	const create = overrides.create ?? vi.fn( async () => ( {
		id: "job_1",
		status: "queued",
		model: "core",
		service_mode: "deferred",
	} ) );
	const get = overrides.get ?? vi.fn( async () => ( {
		id: "job_1",
		status: "completed",
		transcript: "hello world",
		duration: 1.5,
	} ) );
	const cancel = overrides.cancel ?? vi.fn( async () => ( {
		success: true,
		status: "cancelled",
	} ) );
	const getJobFormatted = overrides.getJobFormatted ?? vi.fn( async () => "formatted-output" );
	const getLimits = overrides.getLimits ?? vi.fn( async () => ( {
		max_input_bytes: 262_144_000,
		sync_max_bytes: 94_371_840,
		proxy_max_bytes: 94_371_840,
	} ) );

	return {
		jobs: {
			create,
			get,
			cancel,
		},
		create,
		get,
		cancel,
		getJobFormatted,
		getLimits,
	};

}

describe( "createHandlers", () => {

	it( "rejects relative paths on file tools", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.start_job_file( {
			path: "./relative.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
		} );

		expect( result.isError ).toBe( true );
		expect( result.content[ 0 ]!.text ).toMatch( /absolute/i );
		expect( client.create ).not.toHaveBeenCalled();

	} );

	it( "rejects file paths that do not exist on disk", async () => {

		const fs = await import( "node:fs" );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.start_job_file( {
			path: "/tmp/missing.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
		} );

		expect( result.isError ).toBe( true );
		expect( result.content[ 0 ]!.text ).toMatch( /file not found/i );
		expect( client.create ).not.toHaveBeenCalled();

	} );

	it( "start_job_file returns immediately without waiting", async () => {

		const client = mockClient();
		const waitForJob = vi.fn() as unknown as WaitForJobFn;
		const handlers = createHandlers( () => client as never, {}, { waitForJob } );
		const result = await handlers.start_job_file( {
			path: "/tmp/clip.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
		} );

		expect( result.isError ).toBeUndefined();
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.id ).toBe( "job_1" );
		expect( body.hint ).toMatch( /get_job_status/ );
		expect( client.create ).toHaveBeenCalledOnce();
		expect( waitForJob ).not.toHaveBeenCalled();

	} );

	it( "start_job_url creates with input_url", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		await handlers.start_job_url( {
			url: "https://example.com/a.mp3",
			model: "max",
			service_mode: "synchronous",
			language: "en",
			task: "transcribe",
		} );

		expect( client.create ).toHaveBeenCalledWith( {
			input_url: "https://example.com/a.mp3",
			model: "max",
			service_mode: "synchronous",
			language: "en",
		} );

	} );

	it( "transcribe_url waits and returns transcript", async () => {

		const client = mockClient();
		const waitForJob : WaitForJobFn = vi.fn( async () => ( {
			id: "job_1",
			status: "completed",
			transcript: "done",
			duration: 9,
		} ) );
		const handlers = createHandlers( () => client as never, {}, { waitForJob } );
		const result = await handlers.transcribe_url( {
			url: "https://example.com/a.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
			timeout_ms: 5_000,
		} );

		expect( result.isError ).toBeUndefined();
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.transcript ).toBe( "done" );
		expect( waitForJob ).toHaveBeenCalledOnce();

	} );

	it( "transcribe_file on wait timeout returns job_id hint", async () => {

		const client = mockClient( {
			get: vi.fn( async () => ( {
				id: "job_1",
				status: "processing",
				progress: 40,
			} ) ),
		} );
		const waitForJob : WaitForJobFn = vi.fn( async () => {

			throw new SpeechWeaveError(
				"Timed out waiting for job",
				504,
				"JOB_WAIT_TIMEOUT",
				{ job_id: "job_1" },
			);

		} );
		const handlers = createHandlers( () => client as never, {}, { waitForJob } );
		const result = await handlers.transcribe_file( {
			path: "/tmp/long.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
			timeout_ms: 100,
		} );

		expect( result.isError ).toBeUndefined();
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.timed_out ).toBe( true );
		expect( body.job_id ).toBe( "job_1" );
		expect( body.status ).toBe( "processing" );
		expect( body.hint ).toMatch( /get_job_status/ );

	} );

	it( "get_job_status returns job payload", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1" } );
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.transcript ).toBe( "hello world" );

	} );

	it( "get_job_status with response_format on a completed job delegates to getJobFormatted", async () => {

		const client = mockClient( {
			getJobFormatted: vi.fn( async () => "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n" ),
		} );
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1",
			response_format: "vtt" } );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( client.getJobFormatted ).toHaveBeenCalledWith( "job_1", "vtt" );
		expect( body.transcript ).toBe( "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n" );
		expect( body.format ).toBe( "vtt" );

	} );

	it( "get_job_status with response_format on an incomplete job skips getJobFormatted", async () => {

		const client = mockClient( {
			get: vi.fn( async () => ( { id: "job_1",
				status: "processing" } ) ),
		} );
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1",
			response_format: "vtt" } );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( client.getJobFormatted ).not.toHaveBeenCalled();
		expect( body.status ).toBe( "processing" );

	} );

	it( "get_job_status with response_format 'verbose_json' folds segments/words into the result", async () => {

		const client = mockClient( {
			getJobFormatted: vi.fn( async () => ( {
				task: "transcribe",
				text: "hello world",
				segments: [ { start: 0, end: 1, text: "hello world" } ],
				words: [ { word: "hello", start: 0, end: 0.5 } ],
			} ) ),
		} );
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1",
			response_format: "verbose_json" } );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( body.transcript ).toBe( "hello world" );
		expect( body.segments ).toEqual( [ { start: 0, end: 1, text: "hello world" } ] );
		expect( body.words ).toEqual( [ { word: "hello", start: 0, end: 0.5 } ] );

	} );

	it( "transcribe_file forwards task=translate and prompt, and omits language for translation", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		await handlers.transcribe_file( {
			path: "/tmp/clip.mp3",
			model: "core",
			service_mode: "deferred",
			task: "translate",
			prompt: "SpeechWeave, Acme Corp",
			language: "es",
		} );

		expect( client.create ).toHaveBeenCalledWith( {
			file: "/tmp/clip.mp3",
			model: "core",
			service_mode: "deferred",
			task: "translate",
			prompt: "SpeechWeave, Acme Corp",
		} );

	} );

	it( "transcribe_file with response_format delegates to getJobFormatted after waiting", async () => {

		const client = mockClient( {
			getJobFormatted: vi.fn( async () => "1\n00:00:00,000 --> 00:00:01,000\nhello\n" ),
		} );
		const waitForJob : WaitForJobFn = vi.fn( async () => ( {
			id: "job_1",
			status: "completed",
			transcript: "hello",
			duration: 1,
		} ) );
		const handlers = createHandlers( () => client as never, {}, { waitForJob } );
		const result = await handlers.transcribe_file( {
			path: "/tmp/clip.mp3",
			model: "core",
			service_mode: "deferred",
			task: "transcribe",
			response_format: "srt",
		} );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( client.getJobFormatted ).toHaveBeenCalledWith( "job_1", "srt" );
		expect( body.transcript ).toBe( "1\n00:00:00,000 --> 00:00:01,000\nhello\n" );

	} );

	it( "cancel_job returns cancel ack", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.cancel_job( { job_id: "job_1" } );
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.success ).toBe( true );
		expect( body.status ).toBe( "cancelled" );

	} );

	it( "get_limits returns enriched account limits", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_limits( {} );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( client.getLimits ).toHaveBeenCalledOnce();
		expect( body.max_input_bytes ).toBe( 262_144_000 );
		expect( body.max_input_mb ).toBe( 250 );
		expect( body.hint ).toMatch( /sync_max_bytes/ );

	} );

	it( "fetch_doc returns bundled documentation", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.fetch_doc( { slug: "mcp" } );
		const body = JSON.parse( result.content[ 0 ]!.text );

		expect( body.source ).toBe( "bundled" );
		expect( body.content ).toMatch( /@speechweave\/mcp/ );

	} );

	it( "maps SpeechWeaveError to tool error payload", async () => {

		const client = mockClient( {
			get: vi.fn( async () => {

				throw new SpeechWeaveError( "Insufficient balance", 402, "INSUFFICIENT_BALANCE" );

			} ),
		} );
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1" } );
		expect( result.isError ).toBe( true );
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.status ).toBe( 402 );
		expect( body.code ).toBe( "INSUFFICIENT_BALANCE" );
		expect( body.hint ).toMatch( /wallet/i );

	} );

	it( "maps PLATFORM_SPEND_CAP_REACHED to a non-retry hint", async () => {

		const client = mockClient( {
			get: vi.fn( async () => {

				throw new SpeechWeaveError(
					"Platform monthly spend cap reached for this account tier.",
					402,
					"PLATFORM_SPEND_CAP_REACHED",
					undefined,
					undefined,
					"insufficient_quota",
				);

			} ),
		} );
		const handlers = createHandlers( () => client as never );
		const result = await handlers.get_job_status( { job_id: "job_1" } );
		expect( result.isError ).toBe( true );
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.status ).toBe( 402 );
		expect( body.code ).toBe( "PLATFORM_SPEND_CAP_REACHED" );
		expect( body.type ).toBe( "insufficient_quota" );
		expect( body.hint ).toMatch( /not lift it/i );
		expect( body.hint ).not.toMatch( /then retry/i );

	} );

	it( "createClientFromEnv requires SPEECHWEAVE_API_KEY", async () => {

		const { createClientFromEnv } = await import( "../src/client.js" );
		expect( () => createClientFromEnv( {} ) ).toThrow( /SPEECHWEAVE_API_KEY/ );

	} );

	it( "urlSchema rejects non-HTTPS URLs", async () => {

		const { urlSchema } = await import( "../src/tools/schemas.js" );
		expect( () => urlSchema.parse( "http://example.com/a.mp3" ) ).toThrow( /HTTPS/ );
		expect( urlSchema.parse( "https://example.com/a.mp3" ) ).toBe( "https://example.com/a.mp3" );

	} );

} );
