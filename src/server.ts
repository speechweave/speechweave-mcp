import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createClientFromEnv } from "./client.js";
import { createHandlers } from "./tools/handlers.js";
import {
	cancelJobSchema,
	getJobStatusSchema,
	startJobFileSchema,
	startJobUrlSchema,
	transcribeFileSchema,
	transcribeUrlSchema,
} from "./tools/schemas.js";
import { VERSION } from "./version.js";

/** Build the SpeechWeave MCP server with wait-first and async+poll tools. */
export function createSpeechWeaveMcpServer(
	options : {
		getClient ?: () => ReturnType<typeof createClientFromEnv>;
		env ?: NodeJS.ProcessEnv;
	} = {},
) : McpServer {

	const env = options.env ?? process.env;
	const getClient = options.getClient ?? ( () => createClientFromEnv( env ) );
	const handlers = createHandlers( getClient, env );

	const server = new McpServer( {
		name: "speechweave",
		version: VERSION,
	} );

	server.registerTool(
		"transcribe_file",
		{
			title: "Transcribe local file (wait)",
			description:
				"Upload a local audio/video file and wait until transcription finishes. Prefer for short/medium clips when you need the transcript in this turn. Pass an absolute filesystem path (never raw binary). On wait timeout, returns job_id — then call get_job_status. For long audio you plan to poll yourself, use start_job_file instead.",
			inputSchema: transcribeFileSchema.shape,
		},
		async ( args ) => handlers.transcribe_file( transcribeFileSchema.parse( args ) ),
	);

	server.registerTool(
		"transcribe_url",
		{
			title: "Transcribe URL (wait)",
			description:
				"Start transcription from a public HTTPS URL and wait until it finishes. Prefer for short/medium media when you need the transcript in this turn. On wait timeout, returns job_id — then call get_job_status. For long audio you plan to poll yourself, use start_job_url instead.",
			inputSchema: transcribeUrlSchema.shape,
		},
		async ( args ) => handlers.transcribe_url( transcribeUrlSchema.parse( args ) ),
	);

	server.registerTool(
		"start_job_file",
		{
			title: "Start job from local file (async)",
			description:
				"Upload a local audio/video file and return a job id immediately without waiting. Use for long recordings or when you will poll later with get_job_status. Pass an absolute filesystem path.",
			inputSchema: startJobFileSchema.shape,
		},
		async ( args ) => handlers.start_job_file( startJobFileSchema.parse( args ) ),
	);

	server.registerTool(
		"start_job_url",
		{
			title: "Start job from URL (async)",
			description:
				"Create a transcription job from a public HTTPS URL and return a job id immediately. Use for long media or deferred workflows; poll with get_job_status until completed, failed, or cancelled.",
			inputSchema: startJobUrlSchema.shape,
		},
		async ( args ) => handlers.start_job_url( startJobUrlSchema.parse( args ) ),
	);

	server.registerTool(
		"get_job_status",
		{
			title: "Get job status",
			description:
				"Fetch the current status of a transcription job (and transcript when completed). Poll until status is completed, failed, or cancelled.",
			inputSchema: getJobStatusSchema.shape,
		},
		async ( args ) => handlers.get_job_status( getJobStatusSchema.parse( args ) ),
	);

	server.registerTool(
		"cancel_job",
		{
			title: "Cancel job",
			description:
				"Cancel a queued or processing transcription job. Fails if the job is already terminal.",
			inputSchema: cancelJobSchema.shape,
		},
		async ( args ) => handlers.cancel_job( cancelJobSchema.parse( args ) ),
	);

	return server;

}
