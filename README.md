# Build your own LG webOS TV home dashboard

A practical guide to creating a personal, ad-free dashboard for an LG smart TV: favourite apps, a digital clock, a compact weekly calendar, local weather, and Spotify now playing.

The project was developed for an LG TV running webOS 24. Other models and versions may behave differently. The cleaned project in [`source/`](source/) has no personalised welcome banner, private Wi-Fi QR code, account credentials, or TV pairing keys.

**Last reviewed: 24 October 2026.** Provider dashboards and developer policies change; official documentation is linked throughout.

## Set it up with an AI assistant

Prefer an AI assistant to handle the setup? Copy the [complete AI setup prompt](AI_SETUP_PROMPT.md) into a coding assistant with terminal access. It covers this repository, account configuration, deployment, TV installation, and checks, and identifies the sign-in steps that need your participation.

## Contents

1. [What this app does](#1-what-this-app-does)
2. [Requirements](#2-requirements)
3. [Get the project and tools](#3-get-the-project-and-tools)
4. [Understand the files](#4-understand-the-files)
5. [Choose your own addresses](#5-choose-your-own-addresses)
6. [Create the calendar backend](#6-create-the-calendar-backend)
7. [Configure Google Calendar](#7-configure-google-calendar)
8. [Configure Spotify](#8-configure-spotify)
9. [Publish the homepage](#9-publish-the-homepage)
10. [Install the app on your TV](#10-install-the-app-on-your-tv)
11. [Personalise apps, weather, and layout](#11-personalise-apps-weather-and-layout)
12. [Optional private Wi-Fi QR code](#12-optional-private-wi-fi-qr-code)
13. [Updates and everyday use](#13-updates-and-everyday-use)
14. [Troubleshooting](#14-troubleshooting)
15. [Security and publishing](#15-security-and-publishing)
16. [Final checklist](#16-final-checklist)

## 1. What this app does

The dashboard runs as a web page. A small installed webOS application opens that page on the TV. Cloudflare provides its HTTPS address and a separate backend for phone-assisted account connections.

```text
LG TV app → HTTPS dashboard → calendar / Spotify backend → provider APIs
                                      ↕
                              private session storage

Phone scans the TV's QR → Google / Spotify sign-in → backend saves session
```

Features include:

- A clock and date.
- A week view with previous/next navigation and upcoming calendar events.
- Weather, feels-like temperature, precipitation, rain probability, sunrise, sunset, and wind direction.
- App tiles with remote-control focus navigation.
- Spotify track information using the linked account's playback status.
- An optional Wi-Fi QR image stored only inside your local TV package.

The dashboard itself has no advertising. It does **not** remove advertisements from LG Home, Netflix, YouTube, or other apps. It does not replace webOS, unlock the TV, or guarantee that a sideloaded app starts at power-on. Native app launching must be checked on your own model; it is not available in an ordinary desktop browser.

This is a personal project, not a hardened multi-user hosting service. Run your own deployment and link your own accounts.

## 2. Requirements

You will need:

- An LG webOS TV with the **Developer Mode** app available.
- An LG developer account.
- A computer and TV on the same local network.
- A phone for scanning the account-connection QR codes.
- Node.js and npm; Git if cloning this repository.
- A Cloudflare account with Workers and Workers KV available.
- A Google account and Google Cloud project for calendar access.
- Optionally, a Spotify developer app and an eligible Spotify account.

As of Spotify's February 2026 development-mode changes, the app owner needs an active Premium subscription. New development apps have restricted user limits; check the [current migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) before relying on the integration.

There are two Node.js compatibility requirements: current Wrangler and LG's CLI. Check each tool's requirements. If they require different Node versions on your machine, use a Node version manager and switch between them. Do not install an unsupported old Node release simply because an older tutorial recommends it.

## 3. Get the project and tools

Download this repository as a ZIP from GitHub, or clone it using the repository's **Code** button. Open a terminal inside the downloaded folder, then enter:

```sh
cd source
node --version
npm --version
```

Install Node.js from [nodejs.org](https://nodejs.org/) if these commands are unavailable.

Install LG's current CLI and select the TV profile:

```sh
npm install -g @webos-tools/cli
ares -V
ares-config --profile tv
```

See [LG's CLI installation instructions](https://webostv.developer.lge.com/develop/tools/cli-installation) for platform-specific setup. If npm reports a permissions error, use a user-owned Node installation or npm prefix instead of repeatedly running npm with administrator privileges.

Wrangler can run through npm without a global install:

```sh
npx wrangler@4 --version
npx wrangler@4 login
```

Approve Cloudflare's browser authorization. Deploying this project requires permission to modify Workers and use KV in the selected account.

## 4. Understand the files

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard layout and account-connection dialogs |
| `styles.css` | Main theme, spacing, and screen scaling |
| `widgets.css` | App, calendar, weather, and logo styling |
| `app.js` | Clock, settings, remote navigation, API calls, and app launching |
| `calendar-status.css`, `calendar-selection.css` | Calendar status and selection styling |
| `qrcode.js` | Generates the sign-in QR codes locally |
| `worker.js` | Google/Spotify OAuth callbacks and API backend |
| `wrangler.toml` | Backend Worker and KV configuration |
| `wrangler.app.toml` | Hosted dashboard configuration |
| `still-tv-home-webos/` | The small installable TV wrapper and icons |
| `scripts/generate-local-wifi-qr.cjs` | Optional private Wi-Fi QR generator |

The LG `webOSTV.js` SDK is **not bundled**. Obtain the library from LG's [webOSTV.js documentation](https://webostv.developer.lge.com/develop/references/webostvjs-introduction), review its terms, and place the main script here:

```text
source/webOSTVjs-1.2.13/webOSTV.js
```

The directory name matches the existing HTML reference. If you use a different SDK directory, change the `<script src>` path in `index.html` and the asset-copy command below. A missing SDK will prevent native app-launch calls from working even if the dashboard itself looks correct.

## 5. Choose your own addresses

Use your own Workers subdomain. Throughout this guide:

```text
APP_URL = https://still-tv-home.YOUR_SUBDOMAIN.workers.dev
API_URL = https://still-tv-calendar-api.YOUR_SUBDOMAIN.workers.dev
```

These are examples. Copy the actual HTTPS addresses shown by Cloudflare after deployment. You do not need to buy a domain or obtain an HTTPS certificate yourself when using `workers.dev`.

Replace the following strings throughout the cleaned source files:

| Placeholder | Replace with |
| --- | --- |
| `https://YOUR_HOMEPAGE.workers.dev` | Your complete `APP_URL`, without a trailing slash |
| `https://YOUR_CALENDAR_API.workers.dev` | Your complete `API_URL`, without a trailing slash |
| `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` | Your Google Web OAuth client ID |
| `YOUR_SPOTIFY_CLIENT_ID` | Your Spotify app client ID, if using Spotify |
| `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` | Your own KV namespace ID |

The important locations are:

- `app.js`: `CALENDAR_API_ORIGIN`, `DEFAULT_GOOGLE_CLIENT_ID`, `DEFAULT_SPOTIFY_CLIENT_ID`.
- `worker.js`: `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, `SPOTIFY_CLIENT_ID`.
- `index.html`: explanatory connection URLs displayed to the user.
- `still-tv-home-webos/index.html`: the iframe's dashboard URL.

The backend's `APP_ORIGIN` must exactly match the dashboard origin because it controls browser CORS responses. Changing a client ID in the dashboard's Settings alone does **not** reconfigure the backend's OAuth client.

## 6. Create the calendar backend

This backend also handles Spotify, despite its calendar-based name.

From `source/`, create a KV namespace:

```sh
npx wrangler@4 kv namespace create CALENDAR_SESSIONS
```

Copy the returned namespace ID into `wrangler.toml`:

```toml
name = "still-tv-calendar-api"
main = "worker.js"
compatibility_date = "2026-10-24"
workers_dev = true

[[kv_namespaces]]
binding = "CALENDAR_SESSIONS"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"
```

Deploy:

```sh
npx wrangler@4 deploy --config wrangler.toml
```

Record the reported Worker address as `API_URL`. Update the source placeholders if the address differs from your planned URL. This first deployment creates the Worker; Google connection will become usable after you add its secret.

KV stores OAuth session records and refresh tokens. It is not a public asset folder. You may see a short delay after an account links because KV updates can take time to become visible across locations.

## 7. Configure Google Calendar

### Create the Cloud project and enable the API

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project for the dashboard or select one you control.
3. Open **APIs & Services → Library**.
4. Search for **Google Calendar API** and enable it.

### Configure the consent screen

Google may label these pages under **Google Auth Platform**: Branding, Audience, Data Access, and Clients.

1. Set an application name and support/contact email.
2. Choose the audience appropriate to your account. A personal Gmail setup generally uses External.
3. Add the read-only scope `https://www.googleapis.com/auth/calendar.readonly` under Data Access.
4. While the app is in **Testing**, add the Google account you will use to its **Test users** list.

A developer-approved-testers `403: access_denied` usually means the account signing in has not been added to that list or you selected a different Cloud project.

### Create a Web application OAuth client

Create an OAuth client with type **Web application**.

Add this **Authorized redirect URI**, using your own API address:

```text
https://still-tv-calendar-api.YOUR_SUBDOMAIN.workers.dev/oauth/callback
```

The callback belongs to the **backend**, not the dashboard. It must match exactly, including scheme, hostname, and path. Do not add an extra trailing slash.

This project redirects the phone to Google and handles the callback on the backend. It does not depend on Google's JavaScript popup flow, so adding a JavaScript origin alone does not replace the required redirect URI. A `file://` address is not your OAuth callback.

Copy the client ID into both `app.js` and `worker.js`. Keep the client secret out of browser files and GitHub.

### Add the client secret to the correct Worker

Run:

```sh
npx wrangler@4 secret put GOOGLE_CLIENT_SECRET --config wrangler.toml
```

Paste the secret into Wrangler's prompt. This stores it on **`still-tv-calendar-api`**, not `still-tv-home`.

The backend also accepts a `GOOGLE_CLIENT_ID` environment override. If using that override, set it to the same client as your secret; otherwise update its constant in `worker.js`.

Deploy the edited backend:

```sh
npx wrangler@4 deploy --config wrangler.toml
```

The exchange uses offline access so the Worker can refresh access tokens. See [Google's server-side OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server).

### Connect from the TV

After deploying the dashboard in section 9:

1. Select **Connect Google Calendar**.
2. Scan the QR code using your phone.
3. Enter the one-time code if the page asks for it.
4. Sign in with the approved Google account and grant read-only calendar access.
5. Keep the TV dialog open until it detects the completed connection.

The TV stores a random session ID in local storage; the backend stores the refresh token. The current implementation requests events from the account's selected calendars.

**Testing-mode expiry:** Google states that refresh tokens for external apps in Testing expire after seven days for scopes such as Calendar. Reconnect when required. Publishing the consent screen may involve verification requirements; do not assume switching status automatically grants unrestricted public use. See [Google's OAuth token guidance](https://developers.google.com/identity/protocols/oauth2).

## 8. Configure Spotify

Spotify is optional. The weather and app launcher do not require it.

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create an app, subject to your account's developer eligibility.
3. Enable/use the Web API as appropriate in its settings.
4. Register this redirect URI with your own backend hostname:

   ```text
   https://still-tv-calendar-api.YOUR_SUBDOMAIN.workers.dev/spotify/callback
   ```

5. Put its client ID in `SPOTIFY_CLIENT_ID` in `worker.js` and `DEFAULT_SPOTIFY_CLIENT_ID` in `app.js`.
6. Add any permitted development users in Spotify's user-access settings.
7. Redeploy both the backend and dashboard after editing their files.

Spotify requires valid redirect URIs; see its [redirect URI rules](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

This project uses Authorization Code with PKCE for Spotify. It does **not** require a Spotify client secret. Its read scopes are:

```text
user-read-currently-playing
user-read-playback-state
```

Select **Connect** on the Spotify card and scan its QR code. Sign in to the same Spotify account that is actually playing music. Playing on a phone or another Spotify Connect device should still be associated with that account; an unrelated account's activity will not appear.

After the first successful link, reload the dashboard once so this source snapshot starts its regular polling timer. The source polls while the dashboard is visible. It is not a live audio player and does not play music by itself. The card can show paused playback when Spotify returns it.

## 9. Publish the homepage

Create `dist/` from a deliberate list of public assets. Run these commands inside `source/`:

```sh
mkdir -p dist
cp index.html app.js styles.css widgets.css calendar-status.css calendar-selection.css qrcode.js dist/
cp -R webOSTVjs-1.2.13 dist/
npx wrangler@4 deploy --config wrangler.app.toml
```

If you have not downloaded the LG SDK yet, finish that step before copying it. The current QR dialogs generate their own images; no pre-generated OAuth QR image is required.

Record the deployed URL as `APP_URL`. If the address differs from the placeholder you replaced earlier, update the Worker origin and TV wrapper, then redeploy the backend.

Open the homepage on a computer. Confirm that the clock, weather, app tiles, and calendar dialog appear. To test OAuth and CORS, use this deployed HTTPS page rather than opening `index.html` with `file://`.

Do not copy the complete project directory into `dist/`. The Worker code, local Wi-Fi configuration, generated Wi-Fi QR image, and `.ipk` packages are not dashboard assets.

## 10. Install the app on your TV

### Enable Developer Mode

1. Connect the TV and computer to the same local network.
2. Find **Developer Mode** in the TV's app store and install it.
3. Sign in with your LG developer account.
4. Enable **Dev Mode Status** and follow the reboot instructions.
5. Open the Developer Mode app again and enable **Key Server**.
6. Note the TV's IP address and the displayed passphrase privately.

LG's [Developer Mode guide](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) explains the current setup and expiry behaviour. The development session is time-limited; use its displayed remaining time rather than assuming an unlimited installation.

### Pair the computer

Run the interactive setup:

```sh
ares-setup-device
```

Add a device with these values, using your own address:

```text
Name: tv
Host/IP: YOUR_TV_IP
Port: 9922
User: prisoner
Connection: ssh
Profile: tv
```

Get the key:

```sh
ares-novacom --device tv --getkey
```

Enter the passphrase from the TV when prompted. Do not publish that passphrase or the downloaded SSH key.

### Configure the local wrapper

In `still-tv-home-webos/index.html`, set the iframe's `src` to your deployed `APP_URL`.

Review `still-tv-home-webos/appinfo.json`. A minimal example is:

```json
{
  "id": "com.example.stillhome",
  "version": "1.0.0",
  "vendor": "Your name",
  "type": "web",
  "main": "index.html",
  "title": "Still Home",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png",
  "resolution": "1920x1080"
}
```

Choose an app ID you control and use the same ID when launching. The tutorial source defaults to `com.still.tvhome`; change it if you want your own identifier. The icons referenced by the manifest must exist in the package folder. Changing `title` and the icons controls the installed launcher tile.

### Package, install, and open

```sh
ares-package still-tv-home-webos
```

Use the exact `.ipk` filename that command prints:

```sh
ares-install --device tv YOUR_GENERATED_PACKAGE.ipk
ares-launch --device tv com.example.stillhome
```

Replace the launch ID with the value in your manifest. The homepage should open inside the installed application.

Use the remote's arrow buttons to move focus and **OK** to activate the focused control. Pointer navigation can also work depending on the remote.

### What about startup?

A normal sideloaded webOS app does not have a supported, guaranteed way to replace LG Home or launch on every boot through this project. This tutorial does not include an autostart service. Startup settings differ by model and firmware.

For convenient access, move the app near the beginning of the TV's launcher. If your model offers a remote shortcut/Quick Access assignment for the installed app, configure that in the TV's own interface. This is a shortcut, not a guarantee of automatic launch at power-on.

## 11. Personalise apps, weather, and layout

### App tiles

Open **Settings → Favourite apps**. Each line has this format:

```text
Name | webOS application ID | fallback symbol | colour
```

For example:

```text
Netflix | netflix | N | #e50914
YouTube | youtube.leanback.v4 | ▶ | #ff0033
Spotify | spotify | ≋ | #1ed760
```

These IDs are examples from one setup. Installed IDs may differ. Inspect your TV's installed apps:

```sh
ares-install --device tv --list
```

Try `--listfull` for additional metadata if supported by your CLI. Keep the original TV remote available while testing. A streaming app must already be installed for its tile to open it.

A desktop browser can display tiles but cannot call LG's native application launch service. On the TV, verify that `webOSTV.js` loads and that native services are available in the installed/hosted context. An HTTPS iframe on some configurations may not have the native bridge. If so, use an LG-supported hosted-app approach or an origin-checked native bridge in the local wrapper; simply changing an app ID cannot repair a missing bridge. Do not give an arbitrary remote page unrestricted native launch access.

### Weather

Enter a city in Settings and save. The default in this cleaned source is `London, UK`; change it to your own location.

The app geocodes the city and requests [Open-Meteo](https://open-meteo.com/en/docs) data. There is no weather API key in this implementation. The display uses Celsius, km/h, millimetres, and the forecast location's timezone. Weather availability and permitted usage depend on the provider's current terms. Include the provider's required attribution when distributing or adapting the app.

Precipitation is the current reported amount; rain chance comes from the matching hourly probability. These are different measurements. Sunrise and sunset come from the daily forecast.

### Calendar

Use the previous/next buttons to change weeks. Select a day to see its events. All-day entries are displayed separately from timed entries. If the selected week has no events, try a date you know contains one and check that the same Google account is linked.

### Appearance

Edit the theme variables and layout in `styles.css`, and widget-specific rules in `widgets.css`.

The source includes a 90% dashboard scale on wide screens:

```css
@media (min-width: 1200px) {
  .screen {
    transform: scale(.9);
    transform-origin: center center;
  }
}
```

Use `1` for full size or `.95` for 95%. A CSS transform changes the rendered size; it does not repair an overflowing underlying layout. Check the real TV's viewport, text wrapping, safe margins, and focus outlines after changes. The original project targets landscape TV use; portrait/mobile layouts need additional work.

The public source has no personalised welcome banner. To add your own, create a heading in `index.html` and style it for your available space rather than adding fixed widths that push the weather off-screen.

## 12. Optional private Wi-Fi QR code

This is optional and disabled in the cleaned TV wrapper. The public homepage must not contain your network password or its QR image.

Create `source/wifi-private.json` locally:

```json
{
  "ssid": "YOUR_WIFI_NAME",
  "security": "WPA",
  "password": "YOUR_WIFI_PASSWORD"
}
```

Run:

```sh
node scripts/generate-local-wifi-qr.cjs
```

It generates `still-tv-home-webos/wifi-qr-static.svg`. For secured WPA networks, `WPA` is the payload label commonly used by phone QR scanners. Test compatibility on your phone. The generator also accepts WEP and open-network input; modern secured Wi-Fi is preferable.

To display it, add this inside the local wrapper's `<body>`, after the iframe:

```html
<aside class="qr-card" aria-label="Wi-Fi QR code">
  <div class="qr-frame">
    <img src="wifi-qr-static.svg" alt="Scan to join Wi-Fi">
  </div>
  <div class="qr-label">SCAN ME<br>FOR WIFI</div>
</aside>
```

The wrapper already includes basic QR-card styles. Its position may overlap dashboard content; choose a reserved area on your TV and hide the local card when the dashboard's sign-in dialog is open if necessary.

Keep both files out of Git and out of `dist/`. The repository's ignore rules cover these paths. Remove `wifi-private.json` after generating the QR if you no longer need it. The QR is still a representation of the password, so anyone who can view it or extract the TV package can recover the Wi-Fi details. “Local only” is not encryption.

Repackage and reinstall the wrapper after adding/changing a local QR image.

## 13. Updates and everyday use

For dashboard edits, copy the changed public files into `dist/` again and deploy with `wrangler.app.toml`.

For backend edits or client-ID changes, deploy with `wrangler.toml`.

For app name, icon, wrapper, or local QR changes, increase the manifest's version, run `ares-package`, and reinstall the new package. Hosted dashboard changes usually do not require a new TV package; reload/reopen the dashboard to fetch them.

Watch the Developer Mode app's remaining session time. If the session expires or Developer Mode is disabled, LG may remove development apps. Renew/extend it through the supported Developer Mode workflow and reinstall if needed.

Browser settings and linked-session IDs live on each device. Clearing site data, uninstalling the app, or changing its origin can require reconnecting accounts.

## 14. Troubleshooting

| Problem | Checks and fixes |
| --- | --- |
| `Failed to fetch` when connecting | Confirm the API address is deployed and reachable, the frontend uses that address, and `APP_ORIGIN` exactly matches the homepage origin. Check CORS and Worker errors. |
| Google `403: access_denied` / testers-only message | Add the actual signing-in account as a test user in the correct Cloud project. |
| Google `redirect_uri_mismatch` | Compare the registered redirect URI with `API_URL/oauth/callback`, character for character. |
| Google sign-in is not configured | Set `GOOGLE_CLIENT_SECRET` on the backend Worker and check the KV binding. |
| Google connection stops after roughly a week | Testing-mode refresh tokens can expire after seven days; reconnect or review Google's publishing requirements. |
| Calendar connected, but empty | Check account, selected calendars, selected week/day, event visibility, and timezone. Inspect backend errors. |
| Spotify has no playback | Verify the linked account matches the account playing music, user access is allowed, scopes were approved, and the app owner meets development-mode eligibility. Reconnect after scope/client changes. |
| Spotify does not refresh | Keep the dashboard visible; inspect its polling requests and backend responses. Reload after deploying changes. Rate limits or provider responses can delay updates. |
| QR dialog is covered by the Wi-Fi QR | Hide the local wrapper overlay while a dialog is open, using origin-checked messages, or remove/reposition the overlay. |
| App tiles do nothing | Test on the installed TV app, verify the SDK/native bridge, then check the installed app ID. |
| Installed app says “Bare App” or has a globe icon | Check `appinfo.json` title/icon paths, package the correct folder, increase version, and reinstall. |
| Right edge or footer is clipped | Check browser zoom, viewport dimensions, flex/grid widths, TV aspect/overscan settings, and widget minimum heights. Keep a margin for focus outlines. |
| Cannot pair with the TV | Check IP, same network, port 9922, Key Server, Developer Mode remaining time, and the current passphrase. Guest Wi-Fi isolation can block local access. |
| Old app remains visible after an update | Reopen it; confirm the latest assets were copied to `dist/`, and reinstall for wrapper/manifest changes. |

Useful diagnostic commands:

```sh
npx wrangler@4 tail --config wrangler.toml
ares-inspect --device tv com.example.stillhome
```

Use the app ID from your manifest. Treat logs and remote-inspector access as private; do not share OAuth codes, callback query strings, session URLs, or tokens in screenshots/logs.

LG's developer tools do not provide a general supported real-TV screen-capture API. A phone photo is often the simplest way to check real-screen spacing. An emulator capture does not prove the same layout fits a particular TV.

## 15. Security and publishing

Before pushing a fork to GitHub:

- Keep the Google client secret in Worker secrets.
- Exclude local `.env`/`.dev.vars` files, SSH keys, Wi-Fi input and QR files, `.ipk` packages containing private QR data, and browser/session exports.
- Use your own client IDs, Worker addresses, KV namespace, and account settings. Client IDs are public identifiers, but another person's configuration is not a reusable shared authentication service.
- Revoke provider account access when retiring the dashboard. Clearing TV storage alone does not revoke provider access; remove unused backend sessions/deployments too.
- Review token retention, rate limiting, error handling, and access controls before offering the backend to other households. CORS is a browser control, not API authentication.
- Check usage limits and pricing for Cloudflare, Spotify eligibility, and API-provider terms before sharing a deployment widely.

This guide intentionally leaves the existing project's personal configuration and screenshots out of the public copy. The QR generator's original license header is retained; see [third-party notices](THIRD_PARTY_NOTICES.md) for asset and SDK notes.

## 16. Final checklist

- [ ] Backend deployed to your own HTTPS address.
- [ ] `CALENDAR_SESSIONS` bound to your own KV namespace.
- [ ] Google Calendar API enabled, Web client created, callback exact, and test user added.
- [ ] Google client secret saved on the backend Worker.
- [ ] Spotify callback/client ID and user eligibility configured, if using Spotify.
- [ ] Homepage deployed with the right API address and matching CORS origin.
- [ ] LG SDK present at the referenced public asset path.
- [ ] TV paired, wrapper points to your homepage, and app package installed.
- [ ] Remote focus, app launching, calendar events, and weather checked on the real TV.
- [ ] No secret, private Wi-Fi QR, or pairing key included in public hosting or Git.
- [ ] Developer Mode expiry and startup limitations understood.

Start with the clock, weather, and visual layout. Then connect Calendar, add Spotify, and finish by checking native app launching on the TV. Each layer can be diagnosed independently.
