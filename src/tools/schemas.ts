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

export const taskSchema = z
	.enum( [
		"transcribe",
		"translate",
	] )
	.default( "transcribe" )
	.describe( "transcribe (default) keeps the audio's original language. translate produces an English translation instead, the language param is ignored when translating." );

export const promptSchema = z
	.string()
	.max( 2000 )
	.optional()
	.describe( "Custom vocabulary hint: proper nouns, acronyms, or product names to spell correctly (e.g. 'SpeechWeave, Acme Corp'). Only reliably influences the first ~30s of audio, not a full glossary." );

export const responseFormatSchema = z
	.enum( [
		"text",
		"srt",
		"vtt",
		"verbose_json",
	] )
	.optional()
	.describe( "Optional transcript format. Omit for the default plain transcript. 'srt'/'vtt' return subtitle-file text; 'verbose_json' includes timestamped segments." );

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
	task: taskSchema,
	prompt: promptSchema,
	response_format: responseFormatSchema,
	timeout_ms: timeoutMsSchema,
} );

export const transcribeUrlSchema = z.object( {
	url: urlSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
	task: taskSchema,
	prompt: promptSchema,
	response_format: responseFormatSchema,
	timeout_ms: timeoutMsSchema,
} );

export const startJobFileSchema = z.object( {
	path: pathSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
	task: taskSchema,
	prompt: promptSchema,
} );

export const startJobUrlSchema = z.object( {
	url: urlSchema,
	model: modelSchema,
	service_mode: serviceModeSchema,
	language: languageSchema,
	task: taskSchema,
	prompt: promptSchema,
} );

export const getJobStatusSchema = z.object( {
	job_id: jobIdSchema,
	response_format: responseFormatSchema,
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
