import fs from "node:fs";
import path from "node:path";
import {
	SpeechWeaveError,
	waitForJob as defaultWaitForJob,
	type CreateJobResponse,
	type ServiceMode,
	type SpeechWeave,
	type TranscriptionResponseFormat,
	type TranscriptionTask,
	type V1Job,
} from "@speechweave/node";
import { defaultWaitTimeoutMs } from "../client.js";
import {
	formatToolError,
	summarizeJob,
	textResult,
	type ToolJsonResult,
} from "../format.js";
import type {
	CancelJobArgs,
	GetJobStatusArgs,
	StartJobFileArgs,
	StartJobUrlArgs,
	TranscribeFileArgs,
	TranscribeUrlArgs,
} from "./schemas.js";

export type ClientFactory = () => SpeechWeave;

export type WaitForJobFn = (
	client : SpeechWeave,
	job_id : string,
	opts ?: { timeout_ms ?: number;
		poll_ms ?: number; },
) => Promise<V1Job>;

export type HandlerDeps = {
	waitForJob ?: WaitForJobFn;
};

function assertAbsolutePath( filePath : string ) : string {

	if ( ! path.isAbsolute( filePath ) ) {

		throw new Error( `path must be an absolute filesystem path (got relative: ${ filePath }).` );

	}

	const normalized = path.normalize( filePath );

	if ( ! fs.existsSync( normalized ) ) {

		throw new Error( `File not found at path: ${ normalized }. Please verify the file exists.` );

	}

	return normalized;

}

function createOpts( args : {
	model : string;
	service_mode : string;
	language ?: string;
	task ?: string;
	prompt ?: string;
} ) {

	const task = args.task === "translate" ? "translate" : undefined;

	return {
		model: args.model,
		service_mode: args.service_mode as ServiceMode,
		// Translation always targets English with no `language` param, so never send a
		// source-language hint on a translate job.
		...( task !== "translate" && args.language ? { language: args.language } : {} ),
		...( task ? { task: task as TranscriptionTask } : {} ),
		...( args.prompt ? { prompt: args.prompt } : {} ),
	};

}

async function createFromFile(
	client : SpeechWeave,
	filePath : string,
	opts : ReturnType<typeof createOpts>,
) : Promise<CreateJobResponse> {

	const absolute = assertAbsolutePath( filePath );

	return client.jobs.create( {
		file: absolute,
		...opts,
	} );

}

async function createFromUrl(
	client : SpeechWeave,
	url : string,
	opts : ReturnType<typeof createOpts>,
) : Promise<CreateJobResponse> {

	return client.jobs.create( {
		input_url: url,
		...opts,
	} );

}

/**
 * When `format` is set and the job is completed, fetch the server-formatted transcript
 * (`GET /v1/jobs/:id?format=`, same formatting the OpenAI-compat sync proxy uses) and fold
 * it into the summarized result in place of the default plain transcript. No-ops (falls back
 * to the default summary) when format is omitted or the job isn't completed yet, since Brain
 * itself would reject a formatted read on an incomplete job, so this just avoids the
 * round-trip rather than surfacing that as a tool error.
 */
async function withOptionalFormat(
	client : SpeechWeave,
	job : V1Job | CreateJobResponse,
	format : string | undefined,
	extra : Record<string, unknown> = {},
) : Promise<ToolJsonResult> {

	const status = "status" in job ? job.status : undefined;
	if ( ! format || status !== "completed" ) {

		return textResult( summarizeJob( job, extra ) );

	}

	const formatted = await client.getJobFormatted(
		job.id,
		format as Exclude<TranscriptionResponseFormat, "json">,
	);
	const base = summarizeJob( job, extra );
	if ( typeof formatted === "string" ) {

		return textResult( { ...base,
			transcript: formatted,
			format } );

	}

	return textResult( {
		...base,
		transcript: formatted.text,
		segments: formatted.segments,
		...( formatted.words ? { words: formatted.words } : {} ),
		format,
	} );

}

async function waitOrTimeoutResult(
	client : SpeechWeave,
	created : CreateJobResponse,
	timeout_ms : number,
	waitForJob : WaitForJobFn,
	format ?: string,
) : Promise<ToolJsonResult> {

	try {

		const done = await waitForJob( client, created.id, { timeout_ms } );

		return await withOptionalFormat( client, done, format );

	}
	catch ( err ) {

		if ( err instanceof SpeechWeaveError && err.code === "JOB_WAIT_TIMEOUT" ) {

			let current : V1Job | CreateJobResponse = created;
			try {

				current = await client.jobs.get( created.id );

			}
			catch {

				// Keep create ack if get fails.
			}

			return textResult( summarizeJob( current, {
				job_id: created.id,
				timed_out: true,
				hint: "Wait timed out before the job finished. Call get_job_status with this job_id to continue polling.",
			} ) );

		}

		throw err;

	}

}

/** Build the tool handler map (wait-first + async-create + poll + cancel) backing the MCP tools. */
export function createHandlers(
	getClient : ClientFactory,
	env : NodeJS.ProcessEnv = process.env,
	deps : HandlerDeps = {},
) {

	const waitForJob = deps.waitForJob ?? defaultWaitForJob;

	return {
		async transcribe_file( args : TranscribeFileArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const created = await createFromFile( client, args.path, createOpts( args ) );
				const timeout_ms = args.timeout_ms ?? defaultWaitTimeoutMs( env );

				return await waitOrTimeoutResult( client, created, timeout_ms, waitForJob, args.response_format );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},

		async transcribe_url( args : TranscribeUrlArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const created = await createFromUrl( client, args.url, createOpts( args ) );
				const timeout_ms = args.timeout_ms ?? defaultWaitTimeoutMs( env );

				return await waitOrTimeoutResult( client, created, timeout_ms, waitForJob, args.response_format );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},

		async start_job_file( args : StartJobFileArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const created = await createFromFile( client, args.path, createOpts( args ) );

				return textResult( summarizeJob( created, {
					hint: "Job created. Call get_job_status with this id until status is completed, failed, or cancelled.",
				} ) );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},

		async start_job_url( args : StartJobUrlArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const created = await createFromUrl( client, args.url, createOpts( args ) );

				return textResult( summarizeJob( created, {
					hint: "Job created. Call get_job_status with this id until status is completed, failed, or cancelled.",
				} ) );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},

		async get_job_status( args : GetJobStatusArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const job = await client.jobs.get( args.job_id );

				return await withOptionalFormat( client, job, args.response_format );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},

		async cancel_job( args : CancelJobArgs ) : Promise<ToolJsonResult> {

			try {

				const client = getClient();
				const result = await client.jobs.cancel( args.job_id );

				return textResult( {
					job_id: args.job_id,
					success: result.success,
					status: result.status,
				} );

			}
			catch ( err ) {

				return formatToolError( err );

			}

		},
	};

}

export type Handlers = ReturnType<typeof createHandlers>;
