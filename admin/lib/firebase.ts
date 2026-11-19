// Google sign-in through Firebase (same project as the website). Firebase proves who you are;
// the API checks you're an admin and sets the session cookie. Public config, not secrets.
import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: "AIzaSyBtfYHYNA_l1yyWqUL4NGwmaYjreEOK81M",
      authDomain: "ezhupira.firebaseapp.com",
      projectId: "ezhupira",
      storageBucket: "ezhupira.firebasestorage.app",
      messagingSenderId: "351058896286",
      appId: "1:351058896286:web:ddf3127948e758bff5e28f",
    });
const auth = getAuth(app);
const ready = setPersistence(auth, inMemoryPersistence);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function googleIdToken() {
  await ready;
  const { user } = await signInWithPopup(auth, provider);
  const token = await user.getIdToken();
  await signOut(auth);
  return token;
}
