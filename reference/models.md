# Models

SpeechWeave offers two transcription model tiers. Set `model` when creating a job, and `service_mode` for latency vs price.

Defaults for native `POST /v1/jobs`: `model: core`, `service_mode: standard`.

## Core (`model: "core"`)

Default tier. Best balance of speed and accuracy for most audio.

- **Best for:** podcasts, clean meetings, voicemails, high-volume processing
- **Performance:** fastest turnaround

## Max (`model: "max"`)

Heavier tier for difficult audio and domain-specific vocabulary.

- **Best for:** heavy background noise, accents, cross-talk, legal or medical work
- **Performance:** highest accuracy, longer compute

## Service modes

Both models support:

### Standard (`service_mode: "standard"`)

Higher-priority queue at the full per-minute rate. Poll `GET /v1/jobs/:id` or use a workspace webhook. The OpenAI-compatible transcription path always uses this queue. `synchronous` is accepted as an alias.

### Deferred (`service_mode: "deferred"`)

Background queue at a lower rate than standard for the same model. Poll or use webhooks.

## MCP usage

Pass `model` and `service_mode` on any MCP create or wait-first tool. Use `get_limits` if you need to check whether a file fits the standard-queue upload cap.
