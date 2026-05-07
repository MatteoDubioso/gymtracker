import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_Rl6GsIFYB6CpmChdMslW7E7G7I3lhXY",
  authDomain: "gym-tracker-9eae8.firebaseapp.com",
  projectId: "gym-tracker-9eae8",
  storageBucket: "gym-tracker-9eae8.firebasestorage.app",
  messagingSenderId: "136318282",
  appId: "1:136318282:web:31a5c3146abc2b374805b3"
};

// 1. Inizializza l'App
const app = initializeApp(firebaseConfig);

// 2. Inizializza i servizi
const db = getFirestore(app); // Fondamentale per salvare le schede!
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 3. Configura opzioni extra per Google (opzionale ma consigliato)
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forza la scelta dell'account ogni volta
});

// 4. Esporta tutto
export { db, auth, googleProvider };