import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Play, TrendingUp, LogOut, Edit2, Trash2, Loader2, Dumbbell, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [schede, setSchede] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const caricaSchede = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workout_templates"));
        const schedeData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.utenteId || data.utenteId === auth.currentUser?.uid) {
            schedeData.push({ id: doc.id, ...data });
          }
        });
        setSchede(schedeData);
      } catch (error) {
        console.error("Errore:", error);
      } finally {
        setCaricamento(false);
      }
    };
    caricaSchede();
  }, []);

  return (
    <div className="min-h-screen pb-28 bg-base-100 text-base-content">
      
      {/* Header stile DaisyUI */}
      <header className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 sticky top-0 z-10 px-4">
        <div className="flex-1">
          <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">GymTracker</h1>
            <p className="text-xs font-bold text-base-content/50 uppercase tracking-widest">
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex-none">
          <button 
            onClick={() => signOut(auth)}
            className="btn btn-ghost btn-circle text-base-content/70"
            title="Esci"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-8">
        
        {/* Card Statistiche */}
        <button 
          onClick={() => navigate('/statistiche')}
          className="w-full bg-base-200 border border-base-300 rounded-3xl p-4 flex items-center justify-between mb-8 hover:bg-base-300 transition-all active:scale-95"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base-content">Analisi Progressione</p>
              <p className="text-xs text-base-content/60 font-medium">Traccia i tuoi volumi</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-base-content/40" />
        </button>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-base-content">Le tue routine</h2>
          <span className="badge badge-primary badge-lg font-bold">
            {schede.length}
          </span>
        </div>

        {caricamento ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-sm font-bold text-base-content/50 uppercase tracking-widest">Sincronizzazione...</p>
          </div>
        ) : schede.length === 0 ? (
          <div className="border-2 border-dashed border-base-300 rounded-3xl p-10 text-center bg-base-200/50">
            <div className="bg-base-300 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-base-content/40" />
            </div>
            <p className="text-base-content font-bold mb-1">Nessuna routine</p>
            <p className="text-base-content/60 text-sm">Inizia a costruire il tuo fisico ora.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schede.map((scheda) => (
              <div key={scheda.id} className="card bg-base-200 border border-base-300 shadow-xl">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="card-title font-black text-base-content uppercase tracking-tight">
                        {scheda.nome}
                      </h3>
                      <p className="text-sm font-semibold text-base-content/60 flex items-center mt-1">
                        <span className="w-2 h-2 rounded-sm bg-primary mr-2"></span>
                        {scheda.esercizi?.length || 0} ESERCIZI
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => navigate(`/scheda/${scheda.id}`)}
                        className="btn btn-sm btn-square btn-ghost"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if(window.confirm('Eliminare definitivamente questa scheda?')) {
                            await deleteDoc(doc(db, "workout_templates", scheda.id));
                            setSchede(schede.filter(s => s.id !== scheda.id));
                          }
                        }}
                        className="btn btn-sm btn-square btn-ghost text-error hover:bg-error/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button 
                      onClick={() => navigate(`/allenamento/${scheda.id}`)}
                      className="btn btn-primary w-full tracking-widest"
                    >
                      <Play className="w-5 h-5 mr-1 fill-current" />
                      AVVIA WORKOUT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Barra inferiore fissa */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100/90 backdrop-blur-md border-t border-base-300 p-4 pb-safe z-20">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => navigate('/scheda')}
            className="btn btn-accent btn-block btn-lg font-black tracking-widest shadow-xl"
          >
            + CREA NUOVA SCHEDA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;