import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SchedaEditor from './pages/SchedaEditor';
import Allenamento from './pages/Allenamento';
import Statistiche from './pages/Statistiche';
import { Toaster } from 'react-hot-toast';

function App() {
  const [utente, setUtente] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    // Ascolta se l'utente è loggato o no
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUtente(user);
      setCaricamento(false);
    });
    return unsubscribe;
  }, []);

  if (caricamento) return null; // Schermata bianca mentre Firebase controlla il login

  return (
    <Router>
      <div className="min-h-screen bg-base-100 text-base-content">
        
        <Toaster position="top-center" />
      
      <Routes>
        {/* Se non sei loggato, vai a Login. Se sei loggato, vai alla Dashboard */}
        <Route path="/" element={utente ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!utente ? <Login /> : <Navigate to="/" />} />
        <Route path="/scheda" element={utente ? <SchedaEditor /> : <Navigate to="/login" />} />
        <Route path="/allenamento/:id" element={utente ? <Allenamento /> : <Navigate to="/login" />} />
        <Route path="/statistiche" element={utente ? <Statistiche /> : <Navigate to="/login" />} />
        <Route path="/scheda/:id" element={utente ? <SchedaEditor /> : <Navigate to="/login" />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;