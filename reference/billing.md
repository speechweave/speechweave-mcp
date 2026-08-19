# Billing and limits

SpeechWeave uses a prepaid USD wallet. Jobs settle against your balance.

## Trust tiers

Each workspace has a trust tier that sets max single top-up and monthly API spend cap:

| Tier | Max top-up | Monthly spend cap | Graduates at |
|---|---|---|---|
| 1 | $50 | $150 | Default on signup |
| 2 | $250 | $1,000 | $50 net paid + 7 days old |
| 3 | $1,000 | $5,000 | $250 net paid + 7 days old |
| 4 | $5,000 | Unlimited | $1,000 net paid + 7 days old |

Minimum top-up: $5.00 across all tiers.

## Upload limits

Upload ceilings vary per account. **Never hard-code them.** Call:

- MCP tool `get_limits`, or
- API `GET /v1/limits`

Response fields (bytes):

- `max_input_bytes`: largest input in any mode
- `sync_max_bytes`: cap for `service_mode: standard` (and `synchronous` alias)
- `proxy_max_bytes`: cap for the OpenAI-compatible multipart proxy

For files above the sync cap, use deferred mode or the presigned upload + jobs flow via the SDK.

## HTTP 402 errors

Insufficient wallet balance or spend caps return HTTP 402. Top up or raise caps in the dashboard, then retry. A hard monthly platform spend cap (`PLATFORM_SPEND_CAP_REACHED`) is not lifted by topping up; it resets monthly or via support.

## MCP tip

Call `get_limits` before `transcribe_file` or `start_job_file` when file size is close to typical caps.
