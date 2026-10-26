import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.TEST_PORT || 3125;
const base = `http://127.0.0.1:${PORT}`;

const app = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
  env: {
    ...process.env,
    PORT: String(PORT),
    GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 's',
    SESSION_SECRET: 'test-secret',
    DB_FILE: path.join(__dirname, '.test-users.json'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
app.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${extra ? ` -> ${extra}` : ''}`); }
}

async function post(p, body) {
  const res = await fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

const PW_OK = 'Nq7!vZ2kLm';

setTimeout(async () => {
  try {
    console.log('\nRegister: password rules');
    const cases = [
      ['rejects empty password', { password: '' }],
      ['rejects 4-char password', { password: 'Ab1!' }],
      ['rejects missing lowercase', { password: 'ABCDEFGH1!' }],
      ['rejects missing uppercase', { password: 'abcdefgh1!' }],
      ['rejects missing number', { password: 'Abcdefghij!' }],
      ['rejects missing symbol', { password: 'Abcdefgh12' }],
      ['rejects ascending sequence', { password: 'Abcdefgh1!' }],
      ['rejects descending sequence', { password: 'Abcdefg9876!' }],
      ['rejects repeated character', { password: 'Aaaaaaaa1!' }],
    ];
    for (const [name, override] of cases) {
      const { status, data } = await post('/api/auth/register', {
        name: 'A', email: 'a@b.co', phone: '0788123456', ...override,
      });
      check(name, status === 400 && data.success === false && !!data.message, data.message);
    }

    console.log('\nRegister: Rwandan phone rules');
    const phoneCases = [
      ['rejects empty phone', ''],
      ['rejects 9 digits', '078812345'],
      ['rejects 11 digits', '07881234567'],
      ['rejects prefix 070', '0708123456'],
      ['rejects prefix 071', '0718123456'],
      ['rejects prefix 076', '0768123456'],
      ['rejects Nigerian number', '+2348034529182'],
      ['rejects letters', '0788abc456'],
      ['accepts 072', '0722123456'],
      ['accepts 073', '0733123456'],
      ['accepts 078', '0788123456'],
      ['accepts 079', '0799123456'],
    ];
    for (const [name, phone] of phoneCases) {
      const { status, data } = await post('/api/auth/register', {
        name: 'Test User', email: `p${Math.random().toString(36).slice(2, 8)}@example.co`,
        phone, password: PW_OK,
      });
      const shouldPass = name.startsWith('accepts');
      check(name, shouldPass ? status === 200 : status === 400, `status=${status} ${data.message || ''}`);
      if (shouldPass) {
        const want = `+250 ${phone.slice(1, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
        check(`  formats as ${want}`, data.user?.phone === want, data.user?.phone);
      }
    }

    console.log('\nRegister: other fields');
    const noName = await post('/api/auth/register', { name: '  ', email: 'n1@example.co', phone: '0788123456', password: PW_OK });
    check('rejects blank name', noName.status === 400, noName.data.message);
    const badEmail = await post('/api/auth/register', { name: 'A', email: 'nope', phone: '0788123456', password: PW_OK });
    check('rejects invalid email', badEmail.status === 400, badEmail.data.message);
    const normEmail = `norm${Math.random().toString(36).slice(2, 8)}@example.co`;
    const okUser = await post('/api/auth/register', { name: '  Amara Okafor ', email: `  ${normEmail.toUpperCase()} `, phone: '0788123456', password: PW_OK });
    check('trims name and lowercases email', okUser.data.user?.name === 'Amara Okafor' && okUser.data.user?.email === normEmail, JSON.stringify(okUser.data.user));
    const dupe = await post('/api/auth/register', { name: 'A', email: normEmail.toUpperCase(), phone: '0788123456', password: PW_OK });
    check('rejects duplicate email regardless of case', dupe.status === 400 && dupe.data.message === 'Email already registered!', dupe.data.message);

    console.log('\nGoogle sign-in still lands the browser on the redeem page');
    const start = await fetch(`${base}/auth/google?target=web`, { redirect: 'manual' });
    const setCookies = start.headers.getSetCookie ? start.headers.getSetCookie() : [];
    check('remembers web target', setCookies.some((c) => c.startsWith('sb_oauth_target=web')));
    const page = await fetch(`${base}/auth/google/web-complete?payload=abc&sig=def`);
    const html = await page.text();
    check('serves the redeem page', page.status === 200 && html.includes('<!doctype html>'));
    check('page posts the handoff to the API', html.includes("'/api/auth/session'") && html.includes('credentials'));
    check('page rejects a forged signature via the API', html.includes('Sign-in failed'));
    const bare = await fetch(`${base}/auth/google/web-complete`);
    check('bare page still loads (shows a message)', bare.status === 200);
  } catch (err) {
    failed++;
    console.log(`  FAIL  threw -> ${err.message}`);
  } finally {
    app.kill();
    fs.rmSync(path.join(__dirname, '.test-users.json'), { force: true });
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}, 900);