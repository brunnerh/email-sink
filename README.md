# Email Sink

Email Sink is a SvelteKit application for capturing emails in test and staging
environments.

Each sink exposes POST endpoints for ingesting emails in either raw text format
or structured form-data and provides a UI for viewing messages, metadata, and
attachments. The emails are not sent/forwarded anywhere.

## What it does

- Create sinks with optional API key authentication.
- Receive emails via a sink-specific HTTP endpoint.
- View emails by sender/recipient grouping, inspect raw headers, and download
  attachments.
- Log in via email link; only `ADMIN_EMAIL` can manage sinks.

## Configuration

The application is configured via environment variables. For development, create
a `.env` file in the project root; you can copy `.env.example` as a starting
point.

In production, you need to change the default `EMAIL_MODE` from `log` to either
`brevo` or `smtp` and provide the corresponding configuration variables to
receive login emails.

### List of environment variables

| Variable        | Required           | Description                                            |
| --------------- | ------------------ | ------------------------------------------------------ |
| `ADMIN_EMAIL`   | yes                | Email address of admin user.                           |
| `APP_BASE_URL`  |                    | Public base URL used to build login links.             |
| `BREVO_API_KEY` | `EMAIL_MODE=brevo` | Brevo API key for transactional email.                 |
| `DATABASE_URL`  | yes                | Postgres connection string.                            |
| `EMAIL_FROM`    | yes                | Sender address for login emails.                       |
| `EMAIL_MODE`    |                    | `log` (default), `brevo`, or `smtp` for SMTP delivery. |
| `SMTP_HOST`     | `EMAIL_MODE=smtp`  | SMTP server host name.                                 |
| `SMTP_PASS`     | `EMAIL_MODE=smtp`  | SMTP password, if the server requires authentication.  |
| `SMTP_PORT`     | `EMAIL_MODE=smtp`  | SMTP server port (default: `587`).                     |
| `SMTP_SECURE`   | `EMAIL_MODE=smtp`  | Set to `true` for implicit TLS (usually port `465`).   |
| `SMTP_USER`     | `EMAIL_MODE=smtp`  | SMTP username, if the server requires authentication.  |

## Deployment

Currently configured for Vercel, but the
[adapter](https://svelte.dev/docs/kit/adapters) can be changed fairly easily.

## Ingest endpoints

When authentication is enabled for a sink, send `Authorization: bearer <key>`.

### Raw email

POST raw email text to:

```
POST /api/ingest/:slug/raw
```

Example:

```shell
curl -X POST "http://localhost:5173/api/ingest/my-sink/raw" \
  -H "Authorization: bearer <key>" \
  -H "Content-Type: message/rfc822" \
  --data-binary @email.eml
```

### Form-data

POST structured fields and optional attachments to:

```
POST /api/ingest/:slug/form
```

Required fields:

- `from` (string, e.g. `Name <email@domain.com>`)
- `to` (string or repeated field)
- `text` or `html`

Optional fields:

- `cc`, `bcc` (string or repeated field)
- `subject`, `messageId`, `receivedAt`
- `headers.*` (dot/bracket notation, e.g. `headers.x-custom=foo`)
- `attachments` (file, can repeat)

Example:

```shell
curl -X POST "http://localhost:5173/api/ingest/my-sink/form" \
  -H "Authorization: bearer <key>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -F "from=Sender <sender@example.com>" \
  -F "to=person@example.com" \
  -F "subject=Hello" \
  -F "text=Hello from form-data" \
  -F "headers.x-custom=demo"
```
