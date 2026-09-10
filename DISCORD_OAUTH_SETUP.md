# Discord Login setup for Hufflepuff Hogworlds

The project now uses Discord OAuth2 Authorization Code flow.

## Discord Developer Portal

In **Discord Developer Portal → Your Application → OAuth2 → Redirects**, keep this exact redirect URL:

`https://hufflepuffhogworlds.vercel.app/`

This matches the URL already present in the login link:

`https://discord.com/oauth2/authorize?client_id=1547653660845285406&response_type=code&redirect_uri=https%3A%2F%2Fhufflepuffhogworlds.vercel.app%2F&scope=identify`

## Vercel Environment Variables

Add these variables to the Vercel project:

- `DISCORD_CLIENT_ID` = `1547653660845285406`
- `DISCORD_CLIENT_SECRET` = the **Reset Secret** value from the Discord Developer Portal
- `APP_URL` = `https://hufflepuffhogworlds.vercel.app`

Set them for the environment you deploy to (Production, and Preview if you test Preview deployments).

## What changed

- Added Vercel Functions under `api/auth/discord/`.
- Login now uses `response_type=code`.
- The browser never receives `DISCORD_CLIENT_SECRET`.
- The site accepts Discord's `?code=...` redirect on the home page and exchanges that code server-side.
- Added a random OAuth `state` value in the browser to detect mismatched callbacks.
- Kept the same root redirect URL, so the Discord OAuth URL can continue to use `/`.
- Updated the local Express server with the same `/api/auth/discord/exchange` endpoint.
