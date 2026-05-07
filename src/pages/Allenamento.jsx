import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // Aggiunto auth per il salvataggio
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { CheckCircle, ArrowLeft, Activity, Dumbbell, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const Allenamento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [scheda, setScheda] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [logAllenamento, setLogAllenamento] = useState([]);

  useEffect(() => {
    const caricaSessione = async () => {
      try {
        const docRef = doc(db, "workout_templates", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const datiScheda = docSnap.data();
          setScheda(datiScheda);
          
          const logIniziale = datiScheda.esercizi.map(es => {
            const numeroSerie = parseInt(es.serie) || 1;
            return {
              nome: es.nome,
              targetReps: es.ripetizioni,
              note: es.note, // Importante caricare anche le note
              serieFatte: Array.from({ length: numeroSerie }, () => ({ kg: '', reps: '' }))
            };
          });
          
          setLogAllenamento(logIniziale);
        }
      } catch (error) {
        console.error("Errore:", error);
        toast.error("Errore nel caricamento sessione");
      } finally {
        setCaricamento(false);
      }
    };

    caricaSessione();
  }, [id]);

  const aggiornaSerie = (esercizioIndex, serieIndex, campo, valore) => {
    const nuovoLog = [...logAllenamento];
    nuovoLog[esercizioIndex].serieFatte[serieIndex][campo] = valore;
    setLogAllenamento(nuovoLog);
  };

  const terminaAllenamento = async () => {
    try {
      await addDoc(collection(db, "workout_logs"), {
        schedaId: id,
        nomeScheda: scheda.nome,
        data: new Date(),
        risultati: logAllenamento,
        utenteId: auth.currentUser.uid 
      });
      toast.success("Workout completato! Sei un mostro! 💪");
      navigate('/');
    } catch (e) {
      console.error("Errore salvataggio:", e);
      toast.error("Errore nel salvataggio del log.");
    }
  };

  if (caricamento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 font-black uppercase tracking-widest text-base-content/50">Caricamento pesi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 max-w-md mx-auto pb-32">
      
      {/* Header dinamico */}
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => navigate('/')} className="btn btn-circle btn-ghost bg-base-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Workout</span>
          <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{scheda?.nome}</h1>
        </div>
      </div>

      {/* Lista Esercizi */}
      <div className="space-y-8">
        {logAllenamento.map((esercizio, exIndex) => (
          <div key={exIndex} className="card bg-base-200 border border-base-300 shadow-lg overflow-hidden">
            <div className="card-body p-5">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-tight">
                    {esercizio.nome}
                  </h2>
                </div>
                <div className="badge badge-outline font-bold text-[10px] opacity-60 px-3">
                  {esercizio.targetReps} REPS TARGET
                </div>
              </div>

              {/* Box Note (se presenti) */}
              {esercizio.note && (
                <div className="alert alert-info py-2 px-3 rounded-xl mb-6 bg-info/10 border-info/20 text-info text-xs font-semibold flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{esercizio.note}</span>
                </div>
              )}

              {/* Intestazione Mini-Tabella */}
              <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                <div className="col-span-2 text-[10px] font-black text-center opacity-30 uppercase">Set</div>
                <div className="col-span-5 text-[10px] font-black text-center opacity-30 uppercase">Peso (KG)</div>
                <div className="col-span-5 text-[10px] font-black text-center opacity-30 uppercase">Reps</div>
              </div>

              {/* Righe delle Serie */}
              <div className="space-y-3">
                {esercizio.serieFatte.map((serie, setIndex) => (
                  <div key={setIndex} className="grid grid-cols-12 gap-2 items-center bg-base-100 p-2 rounded-2xl border border-base-300/50">
                    <div className="col-span-2 text-center font-black opacity-30">
                      {setIndex + 1}
                    </div>
                    <div className="col-span-5">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={serie.kg}
                        onChange={(e) => aggiornaSerie(exIndex, setIndex, 'kg', e.target.value)}
                        className="input input-bordered w-full text-center font-black text-lg focus:input-primary bg-base-200"
                      />
                    </div>
                    <div className="col-span-5">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={serie.reps}
                        onChange={(e) => aggiornaSerie(exIndex, setIndex, 'reps', e.target.value)}
                        className="input input-bordered w-full text-center font-black text-lg focus:input-primary bg-base-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tasto Fine Allenamento Sticky */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100/90 backdrop-blur-md border-t border-base-300 z-30">
        <div className="max-w-md mx-auto">
          <button 
            onClick={terminaAllenamento}
            className="btn btn-success btn-block btn-lg font-black tracking-widest text-success-content shadow-xl shadow-success/20"
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            FINE SESSIONE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Allenamento;