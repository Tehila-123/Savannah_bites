import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 3000;

function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  // Same machine as the Expo dev server, so a phone on the same Wi-Fi just works.
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.host;
  if (hostUri) return `http://${hostUri.split(':')[0]}:${PORT}`;
  return `http://localhost:${PORT}`;
}

export const API_URL = resolveApiUrl();
export const DEEP_LINK = 'savannahbites://auth';

function parseQuery(url) {
  const query = {};
  const parts = String(url).split('?')[1];
  if (!parts) return query;
  for (const pair of parts.split('&')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(pair.slice(0, idx));
    const val = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
    query[key] = val;
  }
  return query;
}

// Step 1: hand the user to Google. The backend does the rest and redirects back
// once Google has approved them. Native gets the savannahbites:// deep link; the
// browser gets a page that redeems the handoff over fetch and sets a cookie.
export async function startGoogleSignIn() {
  const url = `${API_URL}/auth/google?target=${Platform.OS === 'web' ? 'web' : 'app'}`;
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  await Linking.openURL(url);
}

// Step 2 (native only): read the handoff the backend appended to the deep link.
// Returns null for any other link the app might be opened with. On web the
// session cookie set by the backend page is what carries the login.
export function parseHandoff(url) {
  if (Platform.OS === 'web' || !url || !String(url).startsWith(DEEP_LINK)) return null;
  const { payload, sig } = parseQuery(url);
  if (!payload || !sig) return null;
  return { payload, sig };
}

// Step 3: swap the signed handoff for a real session and get the user back.
export async function redeemHandoff(handoff) {
  const res = await fetch(`${API_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(handoff),
  });
  const data = await res.json();
  if (!data.success || !data.user) {
    throw new Error(data.message || 'Could not complete Google sign-in');
  }
  return data.user;
}
