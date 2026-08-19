# Data retention

SpeechWeave stores uploaded audio, job metadata, and webhook delivery logs. Retention is configurable per workspace.

## Tiers

### Standard (default)

Full transcript text in job metadata and webhook delivery logs until TTL expires. Webhook replay is available from the dashboard.

### Metadata-only

Enable in Project settings. Transcript text is erased after each successful webhook delivery (or after retries exhaust on failure). HTTP status, timestamps, and errors remain.

### Zero-persistence (Premium)

Strictly in-memory processing: transcripts never enter queryable storage; sync API returns text in the HTTP response only. Available soon as a dashboard add-on, or contact sales for custom compliance paperwork.

## Webhook delivery logs

Configure endpoints in Dashboard → Webhooks.

- Successful deliveries: kept **72 hours** (privacy first) or **30 days** (extended debugging), per workspace setting
- Failed / in-retry deliveries: capped at **30 days** regardless of mode
- **Replay** creates a new delivery from a stored payload (standard mode only)

## Job metadata

Completed and failed job rows age out of the live database after ~30 days. Transcript text is removed at that point; metadata envelope (timings, model, status) may remain. Metadata-only workspaces scrub transcript fields sooner when webhooks succeed.

## Audio uploads

Source audio is deleted when a job reaches a terminal state (completed or failed). A storage backstop removes any remaining source audio within 30 days.

**Debug mode** (Project settings): retains source audio for **failed** jobs only in an isolated staging area for 24 hours so you can download from Job Logs. Successful jobs still wipe immediately.
