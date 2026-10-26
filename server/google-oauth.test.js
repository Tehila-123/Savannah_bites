import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAKE_PORT = 3999;
const APP_PORT = 3111;

let passed = 0;
let failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${extra ? ` -> ${extra}` : ''}`); }
}

// --- Fake Google -----------------------------------------------------------
const fakeGoogle = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url.startsWith('/token')) {
      const params = new URLSearchParams(body);
      if (params.get('code') !== 'valid-code' || !params.get('client_secret')) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'bad code or missing secret' }));
        return;
      }
      res.end(JSON.stringify({ access_token: 'at-123', id_token: 'jwt-abc' }));
      return;
    }
    if (req.url.startsWith('/userinfo')) {
      if (req.headers.authorization !== 'Bearer at-123') {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'invalid_token' }));
        return;
      }
      res.end(JSON.stringify({
        sub: 'google-sub-1',
        name: 'Amara Okafor',
        email: 'amara.oauth.test@gmail.com',
        email_verified: true,
        picture: 'https://example.com/amara.png',
      }));
      return;
    }
    res.writeHead(404); res.end('{}');
  });
});

const app = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
  env: {
    ...process.env,
    PORT: String(APP_PORT),
    GOOGLE_CLIENT_ID: 'test-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    SESSION_SECRET: 'test-handoff-secret',
    GOOGLE_TOKEN_URL: `http://127.0.0.1:${FAKE_PORT}/token`,
    GOOGLE_USERINFO_URL: `http://127.0.0.1:${FAKE_PORT}/userinfo`,
    GOOGLE_REDIRECT_URI: `http://localhost:${APP_PORT}/auth/google/callback`,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
app.stderr.on('data', d => process.stderr.write(`[server] ${d}`));

const base = `http://127.0.0.1:${APP_PORT}`;

function jar(set) {
  return (set || []).map(c => c.split(';')[0]).join('; ');
}
function getCookies(res) {
  return res.headers.getSetCookie ? res.headers.getSetCookie() : [];
}

await new Promise(r => fakeGoogle.listen(FAKE_PORT, '127.0.0.1', r));
await new Promise(r => setTimeout(r, 800));

try {
  // --- Step 1: the app opens the backend ----------------------------------
  console.log('\nStep 1 - request: app -> backend -> Google');
  const start = await fetch(`${base}/auth/google`, { redirect: 'manual' });
  check('redirects to Google', start.status === 302 && start.headers.get('location').startsWith('https://accounts.google.com/o/oauth2/v2/auth?'), start.headers.get('location'));

  const location = new URL(start.headers.get('location'));
  const qs = location.searchParams;
  check('sends client_id', qs.get('client_id') === 'test-id.apps.googleusercontent.com');
  check('sends response_type=code', qs.get('response_type') === 'code');
  check('sends scope', qs.get('scope') === 'openid email profile');
  check('sends state', !!qs.get('state'));
  check('sends redirect_uri', qs.get('redirect_uri') === `http://localhost:${APP_PORT}/auth/google/callback`);

  let cookies = getCookies(start);
  check('sets state cookie', cookies.some(c => c.startsWith('sb_oauth_state=')));

  // --- Step 2: Google sends the code back ---------------------------------
  console.log('\nStep 2 - authorization code returned to the backend');
  const cb = await fetch(`${base}/auth/google/callback?code=valid-code&state=${qs.get('state')}`, {
    redirect: 'manual', headers: { cookie: jar(cookies) },
  });
  const loc = cb.headers.get('location') || '';
  check('redirects into the app via deep link', loc.startsWith('savannahbites://auth?payload='), loc);
  cookies = getCookies(cb);
  check('also sets a browser session cookie', cookies.some(c => c.startsWith('sb_session=')));
  check('clears the state cookie', cookies.some(c => c.startsWith('sb_oauth_state=;') && c.includes('Max-Age=0')));

  const query = new URLSearchParams(loc.split('?')[1] || '');
  const payload = query.get('payload');
  const sig = query.get('sig');
  check('deep link carries payload + sig', !!payload && !!sig);
  check('payload is not raw google tokens', !payload.includes('at-123'));

  // --- State validation ---------------------------------------------------
  console.log('\nStep 3 - rejections');
  const badState = await fetch(`${base}/auth/google/callback?code=valid-code&state=forged`, {
    redirect: 'manual', headers: { cookie: jar(cookies) },
  });
  check('rejects a forged state', badState.status === 400);

  const noCookie = await fetch(`${base}/auth/google/callback?code=valid-code&state=${qs.get('state')}`, { redirect: 'manual' });
  check('rejects a callback with no state cookie', noCookie.status === 400);

  // --- Step 3: app redeems the handoff -----------------------------------
  console.log('\nStep 4 - app redeems the signed handoff');
  const redeem = await fetch(`${base}/api/auth/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, sig }),
  });
  const redeemData = await redeem.json();
  check('redeems the handoff', redeem.status === 200 && redeemData.success === true, JSON.stringify(redeemData));
  check('returns the real Google name', redeemData.user?.name === 'Amara Okafor');
  check('returns the real Google email', redeemData.user?.email === 'amara.oauth.test@gmail.com');
  check('returns the Google avatar', redeemData.user?.avatar === 'https://example.com/amara.png');
  check('never returns the google access token', !JSON.stringify(redeemData).includes('at-123'));

  const sessionCookie = jar(getCookies(redeem));
  const me = await fetch(`${base}/api/me`, { headers: { cookie: sessionCookie } });
  const meData = await me.json();
  check('session works on /api/me', meData.success && meData.user?.email === 'amara.oauth.test@gmail.com');

  // --- Tampering ----------------------------------------------------------
  const tampered = await fetch(`${base}/api/auth/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, sig: sig.slice(0, -2) + 'xy' }),
  });
  check('rejects a tampered signature', tampered.status === 401);

  const forged = Buffer.from(JSON.stringify({ user: { name: 'Hacker', email: 'h@evil.com' }, exp: Date.now() + 99999 }), 'utf8').toString('base64url');
  const forgedRes = await fetch(`${base}/api/auth/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: forged, sig: 'aaaa' }),
  });
  check('rejects a forged payload', forgedRes.status === 401);

  // --- API only: health check and JSON 404 -------------------------------
  console.log('\nStep 5 - API-only backend');
  const health = await fetch(`${base}/api/health`);
  const healthData = await health.json();
  check('reports health', health.status === 200 && healthData.success === true && healthData.googleConfigured === true, JSON.stringify(healthData));
  check('reports the deep link the app listens for', healthData.deepLink === 'savannahbites://auth', healthData.deepLink);

  const missing = await fetch(`${base}/index.html`);
  const missingData = await missing.json();
  check('serves no static files', missing.status === 404 && missingData.success === false, JSON.stringify(missingData));

  // --- OAuth failure surfaces back to the app ----------------------------
  console.log('\nStep 6 - failed google exchange');
  const failStart = await fetch(`${base}/auth/google`, { redirect: 'manual' });
  const failCookies = getCookies(failStart);
  const failState = new URL(failStart.headers.get('location')).searchParams.get('state');
  const failCb = await fetch(`${base}/auth/google/callback?code=nope&state=${failState}`, {
    redirect: 'manual', headers: { cookie: jar(failCookies) },
  });
  const failLoc = failCb.headers.get('location') || '';
  check('failure still deep-links back to the app', failLoc.startsWith('savannahbites://auth?payload='));
  const failQuery = new URLSearchParams(failLoc.split('?')[1] || '');
  const failRedeem = await fetch(`${base}/api/auth/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: failQuery.get('payload'), sig: failQuery.get('sig') }),
  });
  const failData = await failRedeem.json();
  check('app gets the real reason', failRedeem.status === 401 && failData.message === 'bad code or missing secret', JSON.stringify(failData));
} finally {
  app.kill();
  fakeGoogle.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
