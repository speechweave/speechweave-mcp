# Quickstart and SDKs

SpeechWeave exposes an OpenAI-compatible transcription API plus a native jobs API for large or async workloads.

## Authentication

Send your API key on every request:

```
Authorization: Bearer sk_live_...
```

Create keys in the SpeechWeave dashboard.

## Official SDKs

- **Node.js:** `npm install @speechweave/node`
- **Python:** `pip install speechweave`
- **MCP (Cursor / Claude Desktop):** `npx -y @speechweave/mcp`

Default API base URL: `https://api.speechweave.com/v1`

## Completion styles

- **Standard** (`service_mode: standard`): higher-priority queue. Poll `GET /v1/jobs/:id` or use a workspace webhook.
- **Deferred** (`service_mode: deferred`): background queue at a lower rate. Poll or webhook.
- **OpenAI-compatible path** (`POST /v1/audio/transcriptions`): always uses the standard queue.

## Typical native flow

1. Optional: `GET /v1/limits` for upload ceilings for your account.
2. For small files: `POST /v1/audio/transcriptions` (multipart upload, sync response).
3. For larger files: `POST /v1/uploads` (presigned URL) then `POST /v1/jobs` with the returned upload id.
4. Poll `GET /v1/jobs/:id` until status is terminal, or receive a workspace webhook.

## MCP shortcut

If you are in Cursor or Claude Desktop with `@speechweave/mcp` configured, use `transcribe_file` / `transcribe_url` for short media (wait-first) or `start_job_*` + `get_job_status` for long/async work. Call `get_limits` before uploading large local files.

## Also see

- `models`: core vs max and standard vs deferred
- `billing`: wallet, trust tiers, and limits overview
- `api`: live OpenAPI reference index
