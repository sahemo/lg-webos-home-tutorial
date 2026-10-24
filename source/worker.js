const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const APP_ORIGIN = 'https://YOUR_HOMEPAGE.workers.dev';
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function randomHex(bytes = 24) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, n => n.toString(16).padStart(2, '0')).join('');
}
function redirectUri(request) { return `${new URL(request.url).origin}/oauth/callback`; }
function callbackPage(message, ok = false) {
  const text = String(message).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>Still Calendar</title><style>body{margin:0;background:#dce6e5;color:#18262d;font:18px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:32rem;padding:2rem}h1{font-size:1.5rem}</style><main><h1>${ok ? 'Calendar connected' : 'Could not connect Calendar'}</h1><p>${text}</p><p>You can close this page and return to your TV.</p></main>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
function connectPage() {
  return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#dce6e5"><title>Connect your TV calendar</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.2rem;background:#dce6e5;color:#18262d;font:17px system-ui}main{width:min(30rem,100%);padding:2rem;border-radius:1rem;background:#f3f6f2;box-shadow:0 12px 40px #18262d1a}h1{margin-top:0}label{display:block;font-size:.9rem;margin:1rem 0 .4rem}input,button{width:100%;padding:.85rem;border-radius:.6rem;font:inherit}input{border:1px solid #87999b;background:white;color:#18262d;letter-spacing:.3rem;font-size:1.4rem;text-align:center}button{margin-top:1rem;border:0;background:#27745c;color:white;font-weight:700}p{line-height:1.5;color:#52666d}#status{min-height:1.5em}</style><main><h1>Connect your TV calendar</h1><p>Enter the one-time code shown on your TV. Google will ask you to approve read-only Calendar access.</p><form id="form"><label for="code">TV code</label><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{8}" required><button>Continue to Google</button></form><p id="status" role="status"></p><script>document.getElementById('form').addEventListener('submit',async e=>{e.preventDefault();const s=document.getElementById('status');s.textContent='Opening Google sign-in…';try{const r=await fetch('/api/auth/phone',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:document.getElementById('code').value})});const d=await r.json();if(!r.ok)throw Error(d.error||'Code expired. Get a new code from your TV.');location.href=d.url;}catch(x){s.textContent=x.message;}});</script></main></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
function spotifyConnectPage(code = '') {
  const safeCode = String(code).replace(/[^0-9]/g, '').slice(0, 8);
  return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Spotify to Still Home</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.2rem;background:#090d19;color:#f1f5ff;font:17px system-ui}main{width:min(32rem,100%);padding:2rem;border:1px solid #28dff0;border-radius:1rem;background:#131a2a;box-shadow:0 14px 45px #0008}h1{margin-top:0}p{line-height:1.5;color:#b6c2d9}label{display:block;margin:1.2rem 0 .4rem}input,button{width:100%;padding:.9rem;border-radius:.55rem;font:inherit}input{border:1px solid #52627e;background:#090d19;color:#fff;letter-spacing:.22rem;font-size:1.4rem;text-align:center}button{margin-top:1rem;border:0;background:#2bd9e9;color:#07121c;font-weight:800}#status{min-height:1.5em}</style><main><h1>Connect Spotify to Still Home</h1><p>Enter the one-time code shown on your TV. Spotify will ask you to allow the app to read what is currently playing.</p><form id="form"><label for="code">TV code</label><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{8}" required value="${safeCode}"><button>Continue to Spotify</button></form><p id="status" role="status"></p><script>document.getElementById('form').addEventListener('submit',async e=>{e.preventDefault();const s=document.getElementById('status');s.textContent='Opening Spotify sign-in…';try{const r=await fetch('/api/spotify/phone',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:document.getElementById('code').value})});const d=await r.json();if(!r.ok)throw Error(d.error||'Code expired. Get a new code from your TV.');location.href=d.url;}catch(x){s.textContent=x.message;}});</script></main></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
function spotifyResultPage(message, ok = false) {
  const text = String(message).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>Still Home Spotify</title><style>body{margin:0;background:#080b16;color:#f3f5ff;font:18px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:34rem;padding:2rem}h1{color:#37e6ff;font-size:1.6rem}</style><main><h1>${ok ? 'Spotify connected' : 'Could not connect Spotify'}</h1><p>${text}</p><p>You can close this page and return to your TV.</p></main>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
async function spotifyAccessToken(env, session) {
  if (session.accessToken && session.expiresAt > Date.now() + 60_000) return session.accessToken;
  if (!session.refreshToken) throw new Error('Reconnect Spotify from your TV.');
  const response = await fetch(SPOTIFY_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: 'refresh_token', refresh_token: session.refreshToken }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Spotify token refresh failed');
  session.accessToken = data.access_token;
  session.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  if (data.refresh_token) session.refreshToken = data.refresh_token;
  await env.CALENDAR_SESSIONS.put(`spotify-session:${session.id}`, JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 180 });
  return session.accessToken;
}

async function googleJson(url, token, params = {}) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) u.searchParams.set(k, v);
  const response = await fetch(u, { headers: { authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Google Calendar returned ${response.status}`);
  return data;
}
async function accessToken(env, session) {
  if (session.accessToken && session.expiresAt > Date.now() + 60_000) return session.accessToken;
  if (!session.refreshToken) throw new Error('Reconnect Google Calendar from your TV.');
  const response = await fetch(GOOGLE_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: (env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID), client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: session.refreshToken, grant_type: 'refresh_token' }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google token refresh failed');
  session.accessToken = data.access_token;
  session.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  await env.CALENDAR_SESSIONS.put(`session:${session.id}`, JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 180 });
  return session.accessToken;
}
async function handleApi(request, env) {
  const url = new URL(request.url);
  if (!env.CALENDAR_SESSIONS) return json({ error: 'Session storage is not configured yet.' }, 503);

  if (url.pathname === '/api/spotify/start' && request.method === 'POST') {
    const id = randomHex(24);
    let code;
    for (let i = 0; i < 5; i++) { code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000).padStart(8, '0'); if (!await env.CALENDAR_SESSIONS.get(`spotify-pair:${code}`)) break; }
    const verifier = randomHex(32);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    await env.CALENDAR_SESSIONS.put(`spotify-pair:${code}`, JSON.stringify({ id, verifier, challenge }), { expirationTtl: 600 });
    await env.CALENDAR_SESSIONS.put(`spotify-pending:${id}`, JSON.stringify({ createdAt: Date.now() }), { expirationTtl: 600 });
    return json({ id, code, url: `${url.origin}/spotify/connect?code=${code}` });
  }
  if (url.pathname === '/api/spotify/phone' && request.method === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ error: 'Enter the code shown on your TV.' }, 400); }
    const code = String(body.code || '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(code)) return json({ error: 'Enter the eight-digit TV code.' }, 400);
    const pair = await env.CALENDAR_SESSIONS.get(`spotify-pair:${code}`, 'json');
    if (!pair) return json({ error: 'That code has expired. Request a new one from your TV.' }, 410);
    await env.CALENDAR_SESSIONS.delete(`spotify-pair:${code}`);
    const oauthState = randomHex(24);
    await env.CALENDAR_SESSIONS.put(`spotify-oauth:${oauthState}`, JSON.stringify({ id: pair.id, verifier: pair.verifier }), { expirationTtl: 600 });
    const auth = new URL(SPOTIFY_AUTH);
    auth.search = new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, redirect_uri: `${url.origin}/spotify/callback`, response_type: 'code', scope: 'user-read-currently-playing user-read-playback-state', code_challenge_method: 'S256', code_challenge: pair.challenge, state: oauthState }).toString();
    return json({ url: auth.toString() });
  }
  if (url.pathname === '/api/spotify/status' && request.method === 'GET') {
    const id = url.searchParams.get('session') || ''; if (!/^[0-9a-f]{48}$/.test(id)) return json({ error: 'Invalid Spotify TV session.' }, 400);
    if (await env.CALENDAR_SESSIONS.get(`spotify-session:${id}`)) return json({ connected: true });
    return json({ connected: false, expired: !await env.CALENDAR_SESSIONS.get(`spotify-pending:${id}`) });
  }
  if (url.pathname === '/api/spotify/now-playing' && request.method === 'GET') {
    const id = url.searchParams.get('session') || ''; if (!/^[0-9a-f]{48}$/.test(id)) return json({ error: 'Invalid Spotify TV session.' }, 400);
    const session = await env.CALENDAR_SESSIONS.get(`spotify-session:${id}`, 'json'); if (!session) return json({ error: 'Connect Spotify from your TV.' }, 401);
    try {
      let token = await spotifyAccessToken(env, session);
      let endpoint = 'https://api.spotify.com/v1/me/player?market=GB&additional_types=track,episode';
      let response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
      if (response.status === 401) { session.expiresAt = 0; token = await spotifyAccessToken(env, session); response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } }); }
      if (response.status === 204) {
        endpoint = 'https://api.spotify.com/v1/me/player/currently-playing?market=GB&additional_types=track,episode';
        response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
        if (response.status === 401) { session.expiresAt = 0; token = await spotifyAccessToken(env, session); response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } }); }
      }
      if (response.status === 204) return json({ playing: false, message: 'Spotify cannot see an active player on the linked account. Check that playback is on the same Spotify account.' });
      const data = await response.json(); if (!response.ok) return json({ error: data.error?.message || `Spotify returned ${response.status}`, reconnect: response.status === 403 }, response.status);
      const item = data.item; if (!item) return json({ playing: false, message: 'Spotify returned no current track for the linked account.' });
      const artist = item.artists?.map(a => a.name).join(', ') || item.show?.name || 'Spotify';
      return json({ playing: true, isPlaying: !!data.is_playing, title: item.name || 'Unknown track', artist, image: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || item.images?.[0]?.url || '', spotifyUrl: item.external_urls?.spotify || '' });
    } catch (error) { return json({ error: error.message }, 502); }
  }

  if (!env.GOOGLE_CLIENT_SECRET) return json({ error: 'Google sign-in is not configured yet.' }, 503);

  if (url.pathname === '/api/auth/start' && request.method === 'POST') {
    const id = randomHex(24);
    let code;
    for (let i = 0; i < 5; i++) {
      code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000).padStart(8, '0');
      if (!await env.CALENDAR_SESSIONS.get(`pair:${code}`)) break;
    }
    await env.CALENDAR_SESSIONS.put(`pair:${code}`, JSON.stringify({ id }), { expirationTtl: 600 });
    await env.CALENDAR_SESSIONS.put(`pending:${id}`, JSON.stringify({ createdAt: Date.now() }), { expirationTtl: 600 });
    return json({ id, code, url: `${url.origin}/connect` });
  }

  if (url.pathname === '/api/auth/phone' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Enter the code shown on your TV.' }, 400); }
    const code = String(body.code || '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(code)) return json({ error: 'Enter the eight-digit code shown on your TV.' }, 400);
    const pair = await env.CALENDAR_SESSIONS.get(`pair:${code}`, 'json');
    if (!pair) return json({ error: 'That code has expired. Request a new one from your TV.' }, 410);
    await env.CALENDAR_SESSIONS.delete(`pair:${code}`);
    const state = randomHex(24);
    await env.CALENDAR_SESSIONS.put(`oauth:${state}`, JSON.stringify({ id: pair.id }), { expirationTtl: 600 });
    const auth = new URL(GOOGLE_AUTH);
    auth.search = new URLSearchParams({ client_id: (env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID), redirect_uri: redirectUri(request), response_type: 'code', scope: 'https://www.googleapis.com/auth/calendar.readonly', access_type: 'offline', prompt: 'consent', state }).toString();
    return json({ url: auth.toString() });
  }

  if (url.pathname === '/api/auth/status' && request.method === 'GET') {
    const id = url.searchParams.get('session') || '';
    if (!/^[0-9a-f]{48}$/.test(id)) return json({ error: 'Invalid TV session.' }, 400);
    const session = await env.CALENDAR_SESSIONS.get(`session:${id}`, 'json');
    if (session) return json({ connected: true });
    const pending = await env.CALENDAR_SESSIONS.get(`pending:${id}`);
    return json({ connected: false, expired: !pending });
  }

  if (url.pathname === '/api/calendar' && request.method === 'GET') {
    const id = url.searchParams.get('session') || '';
    if (!/^[0-9a-f]{48}$/.test(id)) return json({ error: 'Invalid TV session.' }, 400);
    const session = await env.CALENDAR_SESSIONS.get(`session:${id}`, 'json');
    if (!session) return json({ error: 'Connect Google Calendar from your TV.' }, 401);
    const month = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(Date.UTC(year, monthNumber - 1, 1));
    const gridStart = new Date(first);
    gridStart.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const gridEnd = new Date(gridStart);
    gridEnd.setUTCDate(gridStart.getUTCDate() + 42);
    try {
      const token = await accessToken(env, session);
      const calendars = await googleJson(`${CALENDAR_API}/users/me/calendarList`, token, { maxResults: '250' });
      const selected = (calendars.items || []).filter(c => c.selected !== false);
      const result = await Promise.all(selected.map(async c => {
        const page = await googleJson(`${CALENDAR_API}/calendars/${encodeURIComponent(c.id)}/events`, token, { timeMin: gridStart.toISOString(), timeMax: gridEnd.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250' });
        return (page.items || []).map(e => {
          const begins = e.start?.dateTime || e.start?.date;
          if (!begins) return null;
          return { title: e.summary || 'Untitled event', start: begins, date: e.start?.date || begins.slice(0, 10), allDay: !e.start?.dateTime };
        }).filter(Boolean);
      }));
      return json({ events: result.flat().sort((a, b) => a.start.localeCompare(b.start)), calendars: selected.length });
    } catch (error) {
      return json({ error: error.message }, 502);
    }
  }
  return json({ error: 'Not found.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': APP_ORIGIN, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', 'vary': 'Origin' } });
      const response = await handleApi(request, env);
      const headers = new Headers(response.headers);
      if (origin === APP_ORIGIN) headers.set('access-control-allow-origin', APP_ORIGIN);
      headers.set('vary', 'Origin');
      headers.set('x-content-type-options', 'nosniff');
      return new Response(response.body, { status: response.status, headers });
    }
    if (url.pathname === '/connect') return connectPage();
    if (url.pathname === '/spotify/connect') return spotifyConnectPage(url.searchParams.get('code') || '');
    if (url.pathname === '/spotify/callback') {
      const state = url.searchParams.get('state') || '';
      if (url.searchParams.get('error')) return spotifyResultPage('Spotify did not approve the connection. Return to the TV and try again.');
      const pending = /^[0-9a-f]{48}$/.test(state) ? await env.CALENDAR_SESSIONS?.get(`spotify-oauth:${state}`, 'json') : null;
      if (!pending) return spotifyResultPage('This sign-in link expired. Start again from your TV.');
      await env.CALENDAR_SESSIONS.delete(`spotify-oauth:${state}`);
      const tokenResponse = await fetch(SPOTIFY_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, grant_type: 'authorization_code', code: url.searchParams.get('code') || '', redirect_uri: `${url.origin}/spotify/callback`, code_verifier: pending.verifier }) });
      const tokens = await tokenResponse.json();
      if (!tokenResponse.ok) return spotifyResultPage(tokens.error_description || tokens.error || 'Spotify could not complete sign-in. Check the callback URI.');
      const session = { id: pending.id, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || '', expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000 };
      if (!session.refreshToken) return spotifyResultPage('Spotify did not return a refresh token. Restart the connection from your TV.');
      await env.CALENDAR_SESSIONS.put(`spotify-session:${pending.id}`, JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 180 });
      await env.CALENDAR_SESSIONS.delete(`spotify-pending:${pending.id}`);
      return spotifyResultPage('Spotify is linked. Return to your TV; the card will update shortly.', true);
    }
    if (url.pathname === '/oauth/callback') {
      const state = url.searchParams.get('state') || '';
      const error = url.searchParams.get('error');
      if (error) return callbackPage('Google did not approve access. If this app is in testing, add your Google account as a test user in Google Cloud and try again.');
      const pending = /^[0-9a-f]{48}$/.test(state) ? await env.CALENDAR_SESSIONS?.get(`oauth:${state}`, 'json') : null;
      if (!pending) return callbackPage('This sign-in link expired. Start again from your TV.');
      await env.CALENDAR_SESSIONS.delete(`oauth:${state}`);
      const response = await fetch(GOOGLE_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code') || '', client_id: (env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID), client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(request), grant_type: 'authorization_code' }) });
      const tokens = await response.json();
      if (!response.ok) return callbackPage(tokens.error_description || tokens.error || 'Google could not complete sign-in. Check the OAuth redirect URI and client secret.');
      const prior = await env.CALENDAR_SESSIONS.get(`session:${pending.id}`, 'json');
      const session = { id: pending.id, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || prior?.refreshToken || '', expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000 };
      if (!session.refreshToken) return callbackPage('Google did not return a refresh token. Start again from the TV and approve access.');
      await env.CALENDAR_SESSIONS.put(`session:${pending.id}`, JSON.stringify(session), { expirationTtl: 60 * 60 * 24 * 180 });
      await env.CALENDAR_SESSIONS.delete(`pending:${pending.id}`);
      return callbackPage('Google Calendar is linked. Return to your TV; events should appear shortly.', true);
    }
    return new Response('Not found.', { status: 404 });
  }
};
