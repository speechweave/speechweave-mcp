import { SpeechWeaveError, type CreateJobResponse, type V1Job } from "@speechweave/node";

export type ToolJsonResult = {
	content : Array<{ type : "text";
		text : string; }>;
	isError ?: boolean;
};

/** Serialize a value as MCP text content (JSON). */
export function textResult(
	payload : unknown,
	isError = false,
) : ToolJsonResult {

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify( payload, null, 2 ),
			},
		],
		...( isError ? { isError: true } : {} ),
	};

}

/** Public-safe job fields for tool responses. */
export function summarizeJob(
	job : V1Job | CreateJobResponse,
	extra : Record<string, unknown> = {},
) : Record<string, unknown> {

	const base : Record<string, unknown> = {
		id: job.id,
		status: job.status,
	};

	if ( "model" in job && job.model != null ) {

		base.model = job.model;

	}
	if ( "service_mode" in job && job.service_mode != null ) {

		base.service_mode = job.service_mode;

	}
	if ( "language" in job && job.language != null ) {

		base.language = job.language;

	}
	if ( "transcript" in job && job.transcript != null ) {

		base.transcript = job.transcript;

	}
	if ( "duration" in job && job.duration != null ) {

		base.duration = job.duration;

	}
	if ( "error" in job && job.error != null ) {

		base.error = job.error;

	}
	if ( "progress" in job && job.progress != null ) {

		base.progress = job.progress;

	}
	if ( "stage" in job && job.stage != null ) {

		base.stage = job.stage;

	}
	if ( "created_at" in job && job.created_at != null ) {

		base.created_at = job.created_at;

	}
	if ( "completed_at" in job && job.completed_at != null ) {

		base.completed_at = job.completed_at;

	}

	return {
		...base,
		...extra, 
	};

}

/** Map a thrown error to a tool error result. Adds a wallet top-up hint on HTTP 402. */
export function formatToolError( err : unknown ) : ToolJsonResult {

	if ( err instanceof SpeechWeaveError ) {

		const payload : Record<string, unknown> = {
			error: err.message,
			status: err.status,
		};
		if ( err.code ) {

			payload.code = err.code;

		}
		if ( err.type ) {

			payload.type = err.type;

		}
		if ( err.retry_after != null ) {

			payload.retry_after = err.retry_after;

		}
		if ( err.status === 402 ) {

			// PLATFORM_SPEND_CAP_REACHED is a hard, non-configurable monthly ceiling.
			// Every other 402 code here is a wallet/cap issue that a top-up clears.
			payload.hint = err.code === "PLATFORM_SPEND_CAP_REACHED"
				? "This is a hard monthly account limit for your trust tier. Topping up the wallet will not lift it. It resets at the start of the next calendar month, or request an increase from Help & Support in the SpeechWeave dashboard."
				: "Top up your wallet or raise spend caps in the SpeechWeave dashboard, then retry.";

		}

		return textResult( payload, true );

	}

	const message = err instanceof Error ? err.message : String( err );

	return textResult( { error: message }, true );

}
