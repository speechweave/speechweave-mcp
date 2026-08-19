# Migrating from OpenAI Whisper

SpeechWeave exposes an OpenAI-compatible `POST /v1/audio/transcriptions` endpoint.

## Key differences

- **Upload cap:** the OpenAI drop-in path has a lower multipart cap than the native jobs API (check `GET /v1/limits` for your account's `proxy_max_bytes`).
- **Always sync on the drop-in path:** there is no deferred mode on `POST /v1/audio/transcriptions`. Use native `POST /v1/jobs` for background processing.
- **Models:** use `core` or `max` instead of OpenAI model names.
- **Webhooks:** configure workspace webhooks in the dashboard; there is no per-job callback URL field on create.

## Minimal swap

Point your client at `https://api.speechweave.com/v1` and use your SpeechWeave API key.

Supported Whisper-style fields include `language`, `prompt`, `response_format` (`json`, `text`, `srt`, `vtt`, `verbose_json`), and `task` (`transcribe` or `translate`).

## Large files

Use the Node or Python SDK presigned upload flow (`POST /v1/uploads` + `POST /v1/jobs`) when files exceed the proxy cap.

## MCP

For agent workflows, `@speechweave/mcp` wraps the native jobs API and handles upload + poll for you.
