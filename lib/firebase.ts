// Firebase Auth, used only for "Continue with Google". Firebase proves who the user is; the
// API server then sets its own session cookie, so the Firebase session is dropped right away.
// These config values are public identifiers (they ship to every browser), not secrets.
import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtfYHYNA_l1yyWqUL4NGwmaYjreEOK81M",
  authDomain: "ezhupira.firebaseapp.com",
  projectId: "ezhupira",
  storageBucket: "ezhupira.firebasestorage.app",
  messagingSenderId: "351058896286",
  appId: "1:351058896286:web:ddf3127948e758bff5e28f",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
// Nothing persisted in the browser: the API's httpOnly cookie is the real session.
const ready = setPersistence(auth, inMemoryPersistence);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

/** Opens Google's account picker and returns a Firebase ID token for the API to verify. */
export async function googleIdToken() {
  await ready;
  const { user } = await signInWithPopup(auth, provider);
  const token = await user.getIdToken();
  await signOut(auth);
  return token;
}
