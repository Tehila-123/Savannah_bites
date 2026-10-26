import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { useCart } from './CartContext';
import { navigationRef } from '../navigation/navigationRef';
import { startGoogleSignIn, parseHandoff, redeemHandoff, API_URL } from '../services/googleAuth';

const GoogleAuthContext = createContext(null);

// Result of a sign-in that arrived before the navigator was mounted.
let pendingUser = null;

export function flushPendingAuth() {
  if (!pendingUser) return;
  pendingUser = null;
  navigationRef.navigate('Main');
}

export function GoogleAuthProvider({ children }) {
  const { setUser, showToast } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const finish = useCallback((user) => {
    setUser({ ...user, phone: user.phone || '+250 788 123 456' });
    setBusy(false);
    setError('');
    showToast(`Welcome, ${String(user.name || '').split(' ')[0]}!`);
    if (Platform.OS === 'web') return;
    if (navigationRef.isReady()) navigationRef.navigate('Main');
    else pendingUser = user;
  }, [setUser, showToast]);

  const fail = useCallback((message) => {
    setBusy(false);
    setError(message);
  }, []);

  // Google returns the user through savannahbites://auth. Listen app-wide, not
  // just on the sign-in screen: the app may have been closed or the user may
  // be on another screen by the time the browser hands the link back.
  // The browser build skips this: its session lives in a cookie and the backend
  // page reloads the app for us.
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const handleUrl = ({ url }) => {
      const handoff = parseHandoff(url);
      if (!handoff) return;
      setBusy(true);
      redeemHandoff(handoff).then(finish).catch((err) => {
        fail(err.message || 'Google sign-in failed');
      });
    };

    // Cold start: the OS launched the app with the handoff link.
    Linking.getInitialURL()
      .then((url) => {
        const handoff = parseHandoff(url);
        if (!handoff) return;
        setBusy(true);
        redeemHandoff(handoff).then(finish).catch((err) => {
          fail(err.message || 'Google sign-in failed');
        });
      })
      .catch(() => {});

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [finish, fail]);

  // Browser: the session lives in a cookie the backend set, so re-read it once
  // on mount. That covers both a fresh sign-in (the page reloads) and a reload.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    let active = true;
    fetch(`${API_URL}/api/me`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.user) finish(data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [finish]);

  const signInWithGoogle = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      await startGoogleSignIn();
    } catch (err) {
      fail(
        Platform.OS === 'web'
          ? 'Could not open Google sign-in.'
          : `Could not open Google sign-in. Is the server running at ${API_URL}?`
      );
    }
  }, [fail]);

  const cancelGoogle = useCallback(() => {
    setBusy(false);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ busy, error, signInWithGoogle, cancelGoogle }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  return ctx;
}
