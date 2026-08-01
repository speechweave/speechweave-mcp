# Changelog

## [1.2.0]

### Changed
- **`@speechweave/node` bumped to `^1.3.0`:** oversized files on `transcribe_file`/`start_job_file` are now rejected before upload with a 413 and a hint to use `service_mode: "deferred"`, instead of failing later after spending a presign/upload.

## [1.1.0]

### Changed
- **`@speechweave/node` bumped to `^1.2.0`:** picks up the new OpenAI-style nested error envelope on wallet/billing `402`s (`error.message`/`.type`/`.param`/`.code`). `formatToolError` now surfaces `error.type` when present and no longer tells an agent to "top up and retry" on `PLATFORM_SPEND_CAP_REACHED`.

## [1.0.1]

### Fixed
- **Bin path:** `speechweave-mcp` now points at `dist/index.js` without a leading `./`, so npm publish no longer rewrites the bin entry.

## [1.0.0]

### Added
- **Initial release:** MCP server exposing SpeechWeave transcription as tools for Cursor, Claude Desktop, LM Studio, and other MCP clients.
- **Wait-first tools:** `transcribe_file` and `transcribe_url` create a job and block until it completes, returning the transcript in one turn. On wait timeout they return `job_id` instead of failing the call.
- **Async + poll tools:** `start_job_file` and `start_job_url` return a `job_id` immediately; `get_job_status` polls it and `cancel_job` cancels a queued or processing job.
- **Library exports:** `createSpeechWeaveMcpServer`, `createClientFromEnv`, `defaultWaitTimeoutMs`, and `createHandlers` exported from the package root for embedding or testing outside the stdio entrypoint.
