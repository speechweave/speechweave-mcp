# MCP server

Official package: `@speechweave/mcp` (bin: `speechweave-mcp`).

## Setup

Requires Node.js 18+ and `SPEECHWEAVE_API_KEY`.

```json
{
  "mcpServers": {
    "speechweave": {
      "command": "npx",
      "args": ["-y", "@speechweave/mcp"],
      "env": {
        "SPEECHWEAVE_API_KEY": "sk_live_..."
      }
    }
  }
}
```

Optional: `SPEECHWEAVE_JOB_WAIT_MS` overrides the default one-hour wait timeout on wait-first tools.

## Tools

| Tool | Mode | When to use |
|---|---|---|
| `transcribe_file` | Wait-first | Absolute local path; wait for transcript |
| `transcribe_url` | Wait-first | Public HTTPS URL; wait for transcript |
| `start_job_file` | Async | Long local file; returns `job_id` immediately |
| `start_job_url` | Async | Long URL; returns `job_id` immediately |
| `get_job_status` | Poll | Status and transcript until terminal |
| `cancel_job` | Control | Cancel queued or processing job |
| `get_limits` | Info | Account upload ceilings before submitting audio |
| `fetch_doc` | Info | Public SpeechWeave documentation by slug |

**Never pass raw audio bytes over MCP.** Use absolute file paths or HTTPS URLs.

## Shared transcription arguments

All create/wait tools accept:

- `model`: `core` (default) or `max`
- `service_mode`: `standard` (default) or `deferred` (`synchronous` is an alias for `standard`)
- `language`: optional ISO code (ignored when `task` is `translate`)
- `task`: `transcribe` (default) or `translate` (English output)
- `prompt`: optional vocabulary hint for the first ~30s of audio

Formatted output: `response_format` of `text`, `srt`, `vtt`, or `verbose_json` on wait-first tools and `get_job_status`.

Wait-first tools accept `timeout_ms`. On timeout they return `job_id` and a hint to call `get_job_status`.

## Example prompts

- "Use SpeechWeave to transcribe `/Users/me/standup.mp3` and summarize action items."
- "Start a SpeechWeave job for this podcast URL, poll until done, then summarize themes."
- "Translate `/Users/me/interview.mp3` into English SRT subtitles using SpeechWeave."

## Docs helper

Call `fetch_doc` with slug `list` to see available pages, or `api` for the live OpenAPI index.
