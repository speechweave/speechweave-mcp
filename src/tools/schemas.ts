import { z } from "zod";

export const modelSchema = z
	.enum( [
		"core",
		"max", 
	] )
	.default( "core" )
	.describe( "Transcription model tier. core = default balance of speed/accuracy; max = hardest audio." );

export const serviceModeSchema = z
	.enum( [
		"deferred",
		"synchronous", 
	] )
	.default( "deferred" )
	.describe( "deferred = background queue (default, better for long audio); synchronous = higher-priority path with a smaller size cap." );

export const languageSchema = z
	.string()
	.min( 2 )
	.max( 16 )
	.optional()
	.describe( "Optional two-letter ISO language code (e.g. en, es)." );

export const timeoutMsSchema = z
	.number()
	.int()
	.positive()
	.optional()
	.describe( "Max milliseconds to wait for completion (default 1 hour). On timeout, returns job_id so you can call get_job_status." );

export const pathSchema = z
	.string()
	.min( 1 )
	.describe( "Absolute local filesystem path to an audio or video file. Relative paths are rejected. Do not pass raw binary over MCP." );

export const urlSchema = z
	.string()
	.url()
	.refine( ( value ) => value.startsWith( "https://" ), {
		message: "url must be an HTTPS URL",
	} )
	.describe( "Publicly reachable HTTPS URL of the audio or video to transcribe." );

export const jobIdSchema = z
	.string()
	.min( 1 )
	.describe( "Job id returned by a create or wait-first transcription tool." );

export const transcribeFileSchema = z.object( {
	path: pathSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
	timeout_ms: timeoutMsSchema,
} );

export const transcribeUrlSchema = z.object( {
	url: urlSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
	timeout_ms: timeoutMsSchema,
} );

export const startJobFileSchema = z.object( {
	path: pathSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
} );

export const startJobUrlSchema = z.object( {
	url: urlSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
} );

export const getJobStatusSchema = z.object( {
	job_id: jobIdSchema,
} );

export const cancelJobSchema = z.object( {
	job_id: jobIdSchema,
} );

export type TranscribeFileArgs = z.infer<typeof transcribeFileSchema>;
export type TranscribeUrlArgs = z.infer<typeof transcribeUrlSchema>;
export type StartJobFileArgs = z.infer<typeof startJobFileSchema>;
export type StartJobUrlArgs = z.infer<typeof startJobUrlSchema>;
export type GetJobStatusArgs = z.infer<typeof getJobStatusSchema>;
export type CancelJobArgs = z.infer<typeof cancelJobSchema>;
