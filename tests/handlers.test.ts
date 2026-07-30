import {
	describe, expect, it, vi, 
} from "vitest";
import { SpeechWeaveError } from "@speechweave/node";
import { createHandlers, type WaitForJobFn } from "../src/tools/handlers.js";

vi.mock( "node:fs", () => {

	const existsSync = vi.fn( () => true );

	return {
		default: { existsSync },
		existsSync,
	};

} );

function mockClient( overrides : {
	create ?: ReturnType<typeof vi.fn>;
	get ?: ReturnType<typeof vi.fn>;
	cancel ?: ReturnType<typeof vi.fn>;
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

	return {
		jobs: {
			create,
			get,
			cancel, 
		},
		create,
		get,
		cancel,
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

	it( "cancel_job returns cancel ack", async () => {

		const client = mockClient();
		const handlers = createHandlers( () => client as never );
		const result = await handlers.cancel_job( { job_id: "job_1" } );
		const body = JSON.parse( result.content[ 0 ]!.text );
		expect( body.success ).toBe( true );
		expect( body.status ).toBe( "cancelled" );

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
