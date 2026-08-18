# Changelog

## [1.5.0]

### Changed

- **Default `service_mode` is now `synchronous`:** MCP create/wait-first tools default to the standard queue when `service_mode` is omitted. Pass `deferred` explicitly for the background queue.

## [1.4.0]

### Changed

- Updated `@speechweave/node` to `1.5.0`

### Removed

- `progress`**/**`stage` **removed from** `get_job_status` **output**. Poll `status` instead (`queued` → `processing` → `completed`/`failed`/`cancelled`).

## [1.3.2]

### Changed

- `@speechweave/node` **lockfile refresh to** `1.4.1`**:** picks up the upstream `npm audit fix` dev-dependency patch bump.

## [1.3.1]

### Fixed

- `package-lock.json` **out of sync:** the lockfile still resolved `@speechweave/node` to `1.3.0`. Refreshed the lockfile to resolve `1.4.0`.



## [1.3.0]



### Added

- **Translate task:** `transcribe_file`, `transcribe_url`, and `start_job_file` accept a new `task` argument (`"transcribe"`, the default, or `"translate"` for English translation); `language` is ignored when translating.
- **Custom vocabulary prompt:** the same tools accept an optional `prompt` argument to hint proper nouns, acronyms, or product names for the first ~30s of audio.
- **Formatted transcripts:** `get_job_status` accepts an optional `response_format` (`"text"`, `"srt"`, `"vtt"`, or `"verbose_json"`) to return the transcript in that shape instead of the default plain text, for a completed job.



### Changed

- `@speechweave/node` **bumped to** `^1.4.0`**:** required for the `task`/`prompt`/`response_format` support and `getJobFormatted` above.



## [1.2.0]



### Changed

- `@speechweave/node` **bumped to** `^1.3.0`**:** oversized files on `transcribe_file`/`start_job_file` are now rejected before upload with a 413 and a hint to use `service_mode: "deferred"`, instead of failing later after spending a presign/upload.



## [1.1.0]



### Changed

- `@speechweave/node` **bumped to** `^1.2.0`**:** picks up the new OpenAI-style nested error envelope on wallet/billing `402`s (`error.message`/`.type`/`.param`/`.code`). `formatToolError` now surfaces `error.type` when present and no longer tells an agent to "top up and retry" on `PLATFORM_SPEND_CAP_REACHED`.



## [1.0.1]



### Fixed

- **Bin path:** `speechweave-mcp` now points at `dist/index.js` without a leading `./`, so npm publish no longer rewrites the bin entry.



## [1.0.0]



### Added

- **Initial release:** MCP server exposing SpeechWeave transcription as tools for Cursor, Claude Desktop, LM Studio, and other MCP clients.
- **Wait-first tools:** `transcribe_file` and `transcribe_url` create a job and block until it completes, returning the transcript in one turn. On wait timeout they return `job_id` instead of failing the call.
- **Async + poll tools:** `start_job_file` and `start_job_url` return a `job_id` immediately; `get_job_status` polls it and `cancel_job` cancels a queued or processing job.
- **Library exports:** `createSpeechWeaveMcpServer`, `createClientFromEnv`, `defaultWaitTimeoutMs`, and `createHandlers` exported from the package root for embedding or testing outside the stdio entrypoint.

