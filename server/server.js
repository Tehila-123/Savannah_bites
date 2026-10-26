import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
// DB_FILE lets the tests point at a scratch file instead of the real users.json.
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'users.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
// Public origin the browser uses to reach this server, for the web sign-in page.
const API_ORIGIN = process.env.API_ORIGIN || `http://localhost:${PORT}`;

// Google OAuth
// Load .env into process.env (no dependency). Real env vars win.
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const rawLine of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_AUTH_URL = process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = process.env.GOOGLE_USERINFO_URL || 'https://www.googleapis.com/oauth2/v3/userinfo';
const SESSION_COOKIE = 'sb_session';
const STATE_COOKIE = 'sb_oauth_state';
const TARGET_COOKIE = 'sb_oauth_target';
// The web build (browser) cannot follow a savannahbites:// deep link, so it asks
// for target=web and gets redirected back to the app's own page instead. Same
// session, different way home. Set APP_WEB_URL to override the default.
const WEB_TARGET_URL = process.env.APP_WEB_URL || 'http://localhost:8081';
const WEB_COMPLETE_PATH = '/auth/google/web-complete';

const DEEP_LINK = process.env.APP_DEEP_LINK || 'savannahbites://auth';
// Signs the handoff that carries the signed-in user back into the mobile app,
// so the app never has to trust (or even receive) a Google token.
const HANDOFF_SECRET = process.env.SESSION_SECRET || GOOGLE_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');
const HANDOFF_TTL_MS = 10 * 60 * 1000;

// In-memory sessions. Lost on server restart; use a real store (Redis/DB) in production.
const SESSIONS = new Map();

function signHandoff(data) {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', HANDOFF_SECRET).update(payload).digest('base64url');
  return { payload, sig };
}

function readHandoff(payload, sig) {
  if (typeof payload !== 'string' || typeof sig !== 'string') return null;
  const expected = crypto.createHmac('sha256', HANDOFF_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (err) {
    return null;
  }
  if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
  return data;
}

// Rwanda only: 10 digits starting 072/073/078/079, stored as +250 788 123 456.
const RWANDA_CODE = '+250';
function normalizeRwandanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 10 || !/^07[2389]/.test(digits)) return null;
  return `${RWANDA_CODE} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

// Same rules the app enforces in src/utils/validation.js.
const PASSWORD_MIN_LENGTH = 10;
function passwordProblem(pw) {
  const value = String(pw || '');
  if (value.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[a-z]/.test(value)) return 'Password needs a lowercase letter.';
  if (!/[A-Z]/.test(value)) return 'Password needs an uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password needs a number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password needs a symbol.';
  for (let i = 0; i + 2 < value.length; i++) {
    const a = value.charCodeAt(i), b = value.charCodeAt(i + 1), c = value.charCodeAt(i + 2);
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) {
      return 'Password contains an obvious sequence like "abc" or "123".';
    }
  }
  if (/(.)\1{3,}/.test(value)) return 'Password repeats the same character too many times.';
  return null;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  SESSIONS.set(token, { user, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return token;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    acc[key] = decodeURIComponent(part.slice(idx + 1).trim());
    return acc;
  }, {});
}

function getSessionUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    SESSIONS.delete(token);
    return null;
  }
  return session.user;
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

// Helper to read DB
function readDB(file) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  return [];
}

// Helper to write DB
function writeDB(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API: Health check. Handy from the phone to confirm the backend is reachable.
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, googleConfigured: !!GOOGLE_CLIENT_ID, deepLink: DEEP_LINK }));
    return;
  }

  // The browser build runs on :8081 and calls this API on another port, so it
  // needs CORS and credentialed cookies. The native app is unaffected.
  res.setHeader('Access-Control-Allow-Origin', WEB_TARGET_URL);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Register User
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, email, phone, password } = JSON.parse(body);
        const cleanEmail = String(email || '').trim().toLowerCase();

        const bad = (message) => {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message }));
        };

        if (!name || !String(name).trim()) return bad('Please enter your full name.');
        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return bad('Please enter a valid email address.');

        const cleanPhone = normalizeRwandanPhone(phone);
        if (!phone) return bad('Please enter your phone number.');
        if (!cleanPhone) {
          return bad('Enter a valid Rwandan number: 10 digits starting 072, 073, 078 or 079.');
        }

        const pwProblem = passwordProblem(password);
        if (!password) return bad('Please choose a password.');
        if (pwProblem) return bad(pwProblem);

        const users = readDB(DB_FILE);
        const existing = users.find(u => u.email === cleanEmail);
        if (existing) {
          return bad('Email already registered!');
        }

        const newUser = {
          id: Date.now(),
          name: String(name).trim(),
          email: cleanEmail,
          phone: cleanPhone,
          password,
          provider: 'password',
          verified: true,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeDB(DB_FILE, users);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { name: newUser.name, email: newUser.email, phone: newUser.phone }, message: 'User registered successfully in database!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
      }
    });
    return;
  }

  // API: Sign In User
  if (req.method === 'POST' && pathname === '/api/auth/signin') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const users = readDB(DB_FILE);

        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid email or password!' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { name: user.name, email: user.email, phone: user.phone }, message: 'Signed in successfully!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
      }
    });
    return;
  }

  // API: Save Order
  if (req.method === 'POST' && pathname === '/api/orders') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body);
        let orders = readDB(ORDERS_FILE);
        orders.unshift(orderData);
        writeDB(ORDERS_FILE, orders);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Order saved to database!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid order data' }));
      }
    });
    return;
  }

  // API: Current session
  if (req.method === 'GET' && pathname === '/api/me') {
    const user = getSessionUser(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user }));
    return;
  }

  // API: Log out
  if (req.method === 'POST' && pathname === '/auth/logout') {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) SESSIONS.delete(token);
    res.setHeader('Set-Cookie', cookie(SESSION_COOKIE, '', 0));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // API: Turn the signed handoff from the Google callback into a real session.
  // The mobile app opens the browser, Google sends the code to this server, and
  // the server hands the user back through a deep link. This endpoint lets the
  // app swap that signed handoff for its own session cookie.
  if (req.method === 'POST' && pathname === '/api/auth/session') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { payload, sig } = JSON.parse(body);
        const handoff = readHandoff(payload, sig);
        if (!handoff) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid or expired sign-in handoff' }));
          return;
        }
        if (handoff.error) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: handoff.error }));
          return;
        }
        if (!handoff.user || !handoff.user.email) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Google sign-in did not return a usable account' }));
          return;
        }

        const token = createSession(handoff.user);
        res.setHeader('Set-Cookie', cookie(SESSION_COOKIE, token, 604800));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: handoff.user }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
      }
    });
    return;
  }

  // Google OAuth: step 1 - send the user to Google's sign-in page
  if (req.method === 'GET' && pathname === '/auth/google') {
    if (!GOOGLE_CLIENT_ID) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>Google sign-in is not configured</h1><p>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env, then restart the server.</p>');
      return;
    }
    const target = parsedUrl.searchParams.get('target') === 'web' ? 'web' : 'app';
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://${req.headers.host}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });
    res.setHeader('Set-Cookie', [
      cookie(STATE_COOKIE, state, 600),
      cookie(TARGET_COOKIE, target, 600),
    ]);
    res.writeHead(302, { Location: `${GOOGLE_AUTH_URL}?${params.toString()}` });
    res.end();
    return;
  }

  // Google OAuth: step 2 - Google redirects back with an auth code
  if (req.method === 'GET' && pathname === '/auth/google/callback') {
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const cookies = parseCookies(req);
    const expectedState = cookies[STATE_COOKIE];
    const target = cookies[TARGET_COOKIE] === 'web' ? 'web' : 'app';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://${req.headers.host}/auth/google/callback`;

    if (!code || !state || !expectedState || state !== expectedState) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Sign-in failed</h1><p>Invalid or expired OAuth state. Please try again.</p>');
      return;
    }

    let sessionUser;
    try {
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) throw new Error(tokens.error_description || 'Token exchange failed');

      const infoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await infoRes.json();
      if (!profile.email) throw new Error('Google did not return an email address');

      const users = readDB(DB_FILE);
      let user = users.find(u => u.email === profile.email);
      if (user) {
        user.name = profile.name || user.name;
        user.avatar = profile.picture || user.avatar;
        user.googleId = profile.sub;
        user.lastLoginAt = new Date().toISOString();
      } else {
        user = {
          id: Date.now(),
          name: profile.name || profile.email,
          email: profile.email,
          phone: '',
          provider: 'google',
          googleId: profile.sub,
          avatar: profile.picture || '',
          verified: profile.email_verified !== false,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
      }
      writeDB(DB_FILE, users);

      sessionUser = { name: user.name, email: user.email, phone: user.phone, avatar: user.avatar };
    } catch (err) {
      console.error('Google OAuth error:', err.message);
      if (target === 'web') {
        const failure = signHandoff({ error: err.message, exp: Date.now() + HANDOFF_TTL_MS });
        res.setHeader('Set-Cookie', [cookie(STATE_COOKIE, '', 0), cookie(TARGET_COOKIE, '', 0)]);
        res.writeHead(302, { Location: `${WEB_TARGET_URL}${WEB_COMPLETE_PATH}?payload=${failure.payload}&sig=${failure.sig}` });
        res.end();
        return;
      }
      const failure = signHandoff({ error: err.message, exp: Date.now() + HANDOFF_TTL_MS });
      res.setHeader('Set-Cookie', cookie(STATE_COOKIE, '', 0));
      res.writeHead(302, { Location: `${DEEP_LINK}?payload=${failure.payload}&sig=${failure.sig}` });
      res.end();
      return;
    }

    const token = createSession(sessionUser);
    // The mobile app cannot read this browser cookie, so the session is handed back
    // through a signed deep link that the app redeems at /api/auth/session.
    const handoff = signHandoff({ user: sessionUser, exp: Date.now() + HANDOFF_TTL_MS });
    res.setHeader('Set-Cookie', [
      cookie(SESSION_COOKIE, token, 604800),
      cookie(STATE_COOKIE, '', 0),
      cookie(TARGET_COOKIE, '', 0),
    ]);

    if (target === 'web') {
      res.writeHead(302, { Location: `${WEB_TARGET_URL}${WEB_COMPLETE_PATH}?payload=${handoff.payload}&sig=${handoff.sig}` });
      res.end();
      return;
    }

    res.writeHead(302, { Location: `${DEEP_LINK}?payload=${handoff.payload}&sig=${handoff.sig}` });
    res.end();
    return;
  }

  // Google OAuth: step 3 (web only) - the page the browser lands back on. It hands
  // the signed handoff straight back to this server over fetch, which sets the
  // session cookie, then reloads the app.
  if (req.method === 'GET' && pathname === WEB_COMPLETE_PATH) {
    const payload = parsedUrl.searchParams.get('payload');
    const sig = parsedUrl.searchParams.get('sig');
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Signing you in</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
         background:#1B3B2B; color:#fff; text-align:center; padding:24px; }
  .box { max-width:360px; }
  h1 { font-size:18px; margin:0 0 8px; }
  p { font-size:13px; opacity:.8; margin:0; line-height:1.5; }
  .dot { width:10px; height:10px; border-radius:50%; background:#fff; margin:20px auto 0;
         animation:pulse 1s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
</style>
</head>
<body>
  <div class="box">
    <h1 id="msg">Finishing sign-in...</h1>
    <p id="sub">One moment while we confirm your Google account.</p>
    <div class="dot"></div>
  </div>
<script>
(function () {
  var HREF = ${JSON.stringify(API_ORIGIN)};
  var COMPLETE = ${JSON.stringify(WEB_COMPLETE_PATH)};
  var msg = document.getElementById('msg');
  var sub = document.getElementById('sub');
  function done(ok, text, detail) {
    msg.textContent = text;
    sub.textContent = detail || '';
    document.querySelector('.dot').style.display = 'none';
    if (ok) setTimeout(function () { location.replace('/'); }, 900);
  }
  if (!${JSON.stringify(Boolean(payload))} || !${JSON.stringify(Boolean(sig))}) {
    done(false, 'Sign-in link is incomplete.', 'Go back and try the button again.');
    return;
  }
  fetch(HREF + '/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ payload: ${JSON.stringify(payload)}, sig: ${JSON.stringify(sig)} })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.success, data: d }; }); })
    .then(function (res) {
      if (res.ok) done(true, 'Welcome back!', 'Taking you to Savanna Bites...');
      else done(false, 'Sign-in failed.', (res.data && res.data.message) || 'Please try again.');
    })
    .catch(function (err) { done(false, 'Could not reach the server.', String(err && err.message || err)); });
})();
</script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // API only: no static files, this backend serves the app's API alone.
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message: `No API route for ${req.method} ${pathname}` }));
});

server.listen(PORT, () => {
  console.log(`Savannah Bites server with JSON Database running at http://localhost:${PORT}`);
});
