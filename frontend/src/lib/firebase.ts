import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazily initialized, browser-only. Next.js executes client-page modules
// once on the server too (to render the initial HTML shell), and
// initializeApp()/getAuth() throw immediately when the config is missing —
// which it always is unless NEXT_PUBLIC_FIREBASE_* env vars are set. Google
// sign-in is only ever invoked from a browser click handler, so it's safe
// (and necessary) to defer initialization until then.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth is only available in the browser.");
  }
  if (!auth) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}

export const firebaseAuth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getFirebaseAuth(), prop, receiver);
  },
});
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
