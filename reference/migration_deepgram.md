# Migrating from Deepgram

SpeechWeave is not a drop-in Deepgram replacement, but covers the same core use case: speech-to-text over HTTP.

## Mapping concepts

- **Async jobs:** use `POST /v1/jobs` + poll or webhooks (similar to Deepgram prerecorded callbacks).
- **Models:** choose `core` (default) or `max` for difficult audio.
- **Language:** pass optional ISO `language` on create; omit for auto-detect.
- **Timestamps / subtitles:** request `response_format` of `verbose_json`, `srt`, or `vtt` on read (`GET /v1/jobs/:id?format=...` or the OpenAI-compatible sync path).

## Authentication

`Authorization: Bearer sk_live_...` on every request.

## SDK helpers

The Node and Python SDKs include compatibility helpers for common Deepgram request shapes. See package READMEs on npm/PyPI.

## MCP

Use `@speechweave/mcp` in Cursor or Claude Desktop for file/URL transcription without writing integration code.
