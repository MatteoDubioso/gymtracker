import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Activity, Dumbbell } from 'lucide-react';

const Statistiche = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [eserciziDisponibili, setEserciziDisponibili] = useState([]);
  const [esercizioSelezionato, setEsercizioSelezionato] = useState('');
  const [datiGrafico, setDatiGrafico] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const caricaDati = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workout_logs"));
        const datiScaricati = [];
        const setEsercizi = new Set();

        querySnapshot.forEach((doc) => {
          const dato = doc.data();
          datiScaricati.push(dato);
          if (dato.risultati) {
            dato.risultati.forEach(es => setEsercizi.add(es.nome));
          }
        });

        const eserciziArray = Array.from(setEsercizi).sort();
        setLogs(datiScaricati);
        setEserciziDisponibili(eserciziArray);
        
        if (eserciziArray.length > 0) {
          setEsercizioSelezionato(eserciziArray[0]);
        }
      } catch (error) {
        console.error("Errore statistiche:", error);
      } finally {
        setCaricamento(false);
      }
    };
    caricaDati();
  }, []);

  useEffect(() => {
    if (!esercizioSelezionato || logs.length === 0) return;
    const nuoviDatiGrafico = [];

    logs.forEach(log => {
      const dataAllenamento = new Date(log.data.seconds * 1000);
      const etichettaData = dataAllenamento.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
      const risultatoEsercizio = log.risultati?.find(es => es.nome === esercizioSelezionato);
      
      if (risultatoEsercizio) {
        let maxKg = 0;
        risultatoEsercizio.serieFatte.forEach(serie => {
          const kg = parseFloat(serie.kg) || 0;
          if (kg > maxKg) maxKg = kg;
        });

        if (maxKg > 0) {
          nuoviDatiGrafico.push({
            dataObj: dataAllenamento,
            data: etichettaData,
            "Max Kg": maxKg
          });
        }
      }
    });

    nuoviDatiGrafico.sort((a, b) => a.dataObj - b.dataObj);
    setDatiGrafico(nuoviDatiGrafico);
  }, [esercizioSelezionato, logs]);

  if (caricamento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 font-black uppercase tracking-widest text-base-content/50">Analisi dati...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-6 max-w-md mx-auto pb-24">
      
      {/* Header */}
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => navigate('/')} className="btn btn-circle btn-ghost bg-base-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-primary" />
            Statistiche
          </h1>
        </div>
      </div>

      {eserciziDisponibili.length === 0 ? (
        <div className="card bg-base-200 border border-base-300 text-center p-10">
          <Dumbbell className="w-12 h-12 mx-auto opacity-20 mb-4" />
          <p className="font-bold opacity-60">Nessun log trovato.</p>
          <p className="text-sm opacity-40 mt-1">Allenati per visualizzare i progressi!</p>
        </div>
      ) : (
        <>
          {/* Selettore Esercizio */}
          <div className="form-control w-full mb-8">
            <label className="label">
              <span className="label-text font-black uppercase tracking-widest text-xs opacity-50">Seleziona Esercizio</span>
            </label>
            <select 
              value={esercizioSelezionato}
              onChange={(e) => setEsercizioSelezionato(e.target.value)}
              className="select select-bordered select-lg w-full bg-base-200 font-bold focus:select-primary"
            >
              {eserciziDisponibili.map(es => (
                <option key={es} value={es}>{es}</option>
              ))}
            </select>
          </div>

          {/* Grafico Card */}
          <div className="card bg-base-200 border border-base-300 shadow-xl overflow-hidden">
            <div className="card-body p-4 sm:p-6">
              <h3 className="card-title text-sm font-black uppercase tracking-widest flex items-center mb-6 opacity-70">
                <Activity className="w-4 h-4 mr-2 text-success" />
                Progressione Carico (KG)
              </h3>
              
              {datiGrafico.length < 2 ? (
                <div className="h-64 flex items-center justify-center text-center opacity-40 text-sm font-medium italic p-8">
                  Servono almeno 2 sessioni per tracciare la linea di crescita.
                </div>
              ) : (
                <div className="w-full h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datiGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                      <XAxis 
                        dataKey="data" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700, opacity: 0.5 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700, opacity: 0.5 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--b2))', 
                          border: '1px solid hsl(var(--b3))',
                          borderRadius: '12px',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: 'hsl(var(--p))' }}
                      />
                      <Line 
  type="monotone" 
  dataKey="Max Kg" 
  stroke="#3b82f6" // Forza un blu acceso per vedere se appare
  strokeWidth={4}
  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
  activeDot={{ r: 6, fill: '#f97316', strokeWidth: 0 }}
/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistiche;