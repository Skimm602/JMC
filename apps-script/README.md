# Support relay — deployment

`Code.gs` is the mailbox behind the support button on the site. It runs as the
Google account that owns it, so nothing in this repository ever holds a mail
password.

Script project: <https://script.google.com/d/1k9kSgX8A8zMGg1rJaa7m7XA2FlNHeDwHAVxXU_bZZM5Ddn6O6pl9e5vR/edit>

## 1. Get the code into the project

Either paste `Code.gs` into the editor, or push it:

```bash
npx clasp login      # opens a browser, once per machine
npx clasp push       # uses .clasp.json at the repo root
```

`clasp push` also uploads `appsscript.json`, which is what sets the OAuth
scopes and the web app defaults. If you paste by hand instead, turn on
**Project Settings → Show "appsscript.json" manifest file in editor** and paste
that too — otherwise Apps Script asks for broader permissions than the script
needs.

## 2. Script properties

**Project Settings → Script Properties → Add script property**

| Property        | Required | Value                                                                |
| --------------- | -------- | -------------------------------------------------------------------- |
| `SHARED_TOKEN`  | yes      | A long random string. Must equal `SUPPORT_SCRIPT_TOKEN` in `.env.local`. |
| `SUPPORT_INBOX` | no       | Comma-separated fallback addresses, used only when the site sends no roster. |

`SHARED_TOKEN` is not optional. The deployment has to be open to "Anyone" for
the site to reach it without an OAuth dance, which makes the URL a public
endpoint — the token is the only thing between it and a stranger with a mail
cannon.

## 3. Deploy

**Deploy → New deployment → gear icon → Web app**

- **Execute as:** Me
- **Who has access:** Anyone

Authorize when prompted. Google shows an "unverified app" warning because the
script is yours rather than a published add-on; **Advanced → Go to (unsafe)**
is the way through it.

Copy the **Web app URL**. It ends in `/exec`. The `/dev` URL will not work —
that one requires a signed-in Google session, which the server does not have.

## 4. Point the site at it

In `.env.local`:

```
SUPPORT_SCRIPT_URL=https://script.google.com/macros/s/AKfycb…/exec
SUPPORT_SCRIPT_TOKEN=<the same string as SHARED_TOKEN>
```

Restart `npm run dev`. Environment variables are read at boot.

## Re-deploying after an edit

Editing `Code.gs` does **not** change what `/exec` serves. Use
**Deploy → Manage deployments → pencil → Version: New version → Deploy**, which
keeps the same URL. Choosing "New deployment" instead mints a different URL and
`.env.local` has to be updated to match.

## Checking it

Opening the `/exec` URL in a browser should return
`{"ok":true,"service":"VIP Solar support relay","status":200}`. Anything else —
particularly a Google sign-in page — means the deployment is set to "Only
myself" rather than "Anyone".

Failures on the site are logged to the server console with a `[support]` prefix,
and the script's own errors are in **Executions** in the Apps Script editor.

## Quota

A consumer Gmail account can send 100 emails a day through `MailApp`; Workspace
accounts get 1,500. One button press is one email regardless of how many admins
are on it, because they go out as a single message with several recipients.

The relay reports its remaining quota with every send, and the site logs a
`[support]` warning once fewer than 20 are left — running out is otherwise
silent, and looks from the outside like the button simply broke.
