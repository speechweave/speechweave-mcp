# Migrating from AssemblyAI

SpeechWeave provides transcription and English translation via a jobs API and an OpenAI-compatible sync endpoint.

## Mapping concepts

- **Upload + transcript:** native flow is presigned upload (`POST /v1/uploads`) then `POST /v1/jobs`, or sync multipart on `POST /v1/audio/transcriptions` for smaller files.
- **Polling vs webhooks:** poll `GET /v1/jobs/:id` or configure workspace webhooks (no per-job webhook URL on create).
- **Translation:** set `task: translate` for English output.
- **Subtitles:** `response_format` of `srt` or `vtt` on completed jobs.

## Authentication

`Authorization: Bearer sk_live_...`

## Limits

Call `GET /v1/limits` (or MCP `get_limits`) before uploading; caps are account-specific.

## SDK helpers

Node and Python SDKs ship AssemblyAI-shaped compatibility helpers. See package docs.

## MCP

`@speechweave/mcp` exposes wait-first and async tools for agent-driven transcription workflows.
