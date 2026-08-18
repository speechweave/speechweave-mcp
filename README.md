# @speechweave/mcp

[![npm version](https://img.shields.io/npm/v/@speechweave/mcp.svg)](https://www.npmjs.com/package/@speechweave/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official [Model Context Protocol](https://modelcontextprotocol.io) server for [SpeechWeave](https://speechweave.com). Use to transcribe local files and URLs from Cursor, Claude Desktop, Claude Code, Windsurf, and other MCP clients.

SpeechWeave handles short clips and long-form audio without client-side chunking. This MCP server exposes both **wait-first** tools (get a transcript in one turn) and **async create + poll** tools (start a job, then check status).

**Docs:** [speechweave.com/docs/mcp](https://speechweave.com/docs/mcp) · [API reference](https://speechweave.com/docs/api)

## Install / run

Requires Node.js 18+ and a SpeechWeave API key (`sk_live_…`).

```bash
export SPEECHWEAVE_API_KEY="sk_live_..."
npx -y @speechweave/mcp
```

## Cursor / Claude Desktop

Add to your MCP config (e.g. `.cursor/mcp.json`, `claude_desktop_config.json`):

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

## Tools

| Tool | Mode | When to use |
|---|---|---|
| `transcribe_file` | Wait-first | Absolute local path; wait until transcript is ready |
| `transcribe_url` | Wait-first | Public HTTPS URL; wait until transcript is ready |
| `start_job_file` | Async | Absolute local path; return `job_id` immediately |
| `start_job_url` | Async | Public HTTPS URL; return `job_id` immediately |
| `get_job_status` | Poll | Fetch status / transcript for a job id |
| `cancel_job` | Control | Cancel a queued or processing job |

**Never pass raw audio bytes over MCP.** Use absolute file paths (local clients) or HTTPS URLs.

### Configuration & Arguments

All transcription and job-start tools accept the following optional arguments:
* `model`: Choose `core` (default) or `max`.
* `service_mode`: Choose `standard` (default) or `deferred` for the background queue. `synchronous` is accepted as an alias for `standard`.
* `language`: Optional ISO language code to force language detection.
* `task`: Choose `transcribe` (default) or `translate` to produce an English translation instead; `language` is ignored when translating.
* `prompt`: Optional custom vocabulary hint (proper nouns, acronyms, product names) for the first ~30s of audio.

**Formatted transcripts:** `transcribe_file`, `transcribe_url`, and `get_job_status` also accept an optional `response_format` (`text`, `srt`, `vtt`, or `verbose_json`) to return the transcript in that shape instead of the default plain text.

**Timeout behavior:** Wait-first tools accept an optional `timeout_ms`. If the transcription exceeds the timeout, the tool gracefully returns a `job_id` and instructs the client to switch to `get_job_status` polling.

## Example Prompts

After adding the server and restarting your client, try asking your AI assistant:

### Short clip (wait-first)
> "Use SpeechWeave to transcribe `/Users/me/recordings/standup.mp3` and summarize action items."

*The assistant will call `transcribe_file` with the absolute path and summarize the returned `transcript`.*

### Long podcast (async + poll)
> "Start a SpeechWeave job for `https://cdn.example.com/three_hour_podcast.mp3`, then check back until it completes."

*The assistant will call `start_job_url`, then periodically call `get_job_status` until the status reaches `completed`.*

### Translate to subtitles (wait-first)
> "Translate `/Users/me/recordings/spanish_interview.mp3` into English SRT subtitles using SpeechWeave."

*The assistant will call `transcribe_file` with `task: "translate"` and `response_format: "srt"`.*