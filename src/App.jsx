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
  // Abbiamo chiamato lo stato "user"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-base-100 text-base-content">
        <Toaster position="top-center" reverseOrder={false} />
      
        <Routes>
          {/* Ho corretto "utente" in "user" in tutte le rotte */}
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          
          {/* Rotte protette */}
          <Route path="/scheda" element={user ? <SchedaEditor /> : <Navigate to="/login" />} />
          <Route path="/scheda/:id" element={user ? <SchedaEditor /> : <Navigate to="/login" />} />
          <Route path="/allenamento/:id" element={user ? <Allenamento /> : <Navigate to="/login" />} />
          <Route path="/statistiche" element={user ? <Statistiche /> : <Navigate to="/login" />} />

          {/* Rotta di fallback: se scrivi un URL a caso, ti rimanda alla home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;