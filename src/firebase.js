import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- Aggiungi questo
// Sostituisci questi valori con quelli che ti dà Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_Rl6GsIFYB6CpmChdMslW7E7G7I3lhXY",
  authDomain: "gym-tracker-9eae8.firebaseapp.com",
  projectId: "gym-tracker-9eae8",
  storageBucket: "gym-tracker-9eae8.firebasestorage.app",
  messagingSenderId: "136318282",
  appId: "1:136318282:web:31a5c3146abc2b374805b3"
};
// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firestore (il database)
export const db = getFirestore(app);
export const auth = getAuth(app); 