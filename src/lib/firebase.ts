import { initializeApp } from 'firebase/app'
import { type Auth, GoogleAuthProvider, getAuth } from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'
import { IS_PLUGIN } from './plugin'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// The plugin has no accounts, so it never starts Firebase.
const app = IS_PLUGIN ? undefined : initializeApp(firebaseConfig)

export const auth = (app && getAuth(app)) as Auth
export const googleProvider = new GoogleAuthProvider()
export const db = (app && getFirestore(app)) as Firestore
