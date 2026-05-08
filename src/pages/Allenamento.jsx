import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { 
  CheckCircle, ArrowLeft, Activity, Dumbbell, Info, 
  TrendingUp, ChevronsUp, Target, Zap, Link, PauseCircle, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';

// Config tipi di serie (stessa del Editor)
const TIPI_SERIE = {
  normale:   { label: 'Normale',    badge: 'badge-ghost',     color: 'text-base-content/40', emoji: '⚪' },
  dropset:   { label: 'Dropset',    badge: 'badge-error',     color: 'text-error',            emoji: '🔴' },
  superset:  { label: 'Superset',   badge: 'badge-warning',   color: 'text-warning',          emoji: '🟡' },
  giantset:  { label: 'Giant Set',  badge: 'badge-accent',    color: 'text-accent',           emoji: '🟣' },
  restpause: { label: 'Rest-Pause', badge: 'badge-info',      color: 'text-info',             emoji: '🔵' },
  failure:   { label: 'Sfinimento', badge: 'badge-success',   color: 'text-success',          emoji: '🟢' },
};

// Istruzioni dinamiche per tipo serie
const IstruzioneTipoSerie = ({ tipoSerie, esercizio }) => {
  if (!tipoSerie || tipoSerie === 'normale') return null;

  const configs = {
    dropset: {
      icon: <Zap className="w-3 h-3" />,
      color: 'text-error',
      testo: esercizio.drops?.length
        ? `${esercizio.drops.length} drop: riduci il peso senza pausa`
        : 'Riduci il peso senza pausa tra i drop',
    },
    superset: {
      icon: <Link className="w-3 h-3" />,
      color: 'text-warning',
      testo: esercizio.pairedExercises?.length
        ? `Abbinato con: ${esercizio.pairedExercises.join(', ')}`
        : 'Esegui subito dopo l\'esercizio abbinato',
    },
    giantset: {
      icon: <Link className="w-3 h-3" />,
      color: 'text-accent',
      testo: esercizio.pairedExercises?.length
        ? `Giant set con: ${esercizio.pairedExercises.join(' → ')}`
        : 'Esegui in sequenza senza riposo',
    },
    restpause: {
      icon: <PauseCircle className="w-3 h-3" />,
      color: 'text-info',
      testo: esercizio.restPauseSeconds && esercizio.restPauseSets
        ? `${esercizio.restPauseSets} mini-set con ${esercizio.restPauseSeconds}s di pausa`
        : 'Mini pause intra-serie senza scaricare il bilanciere',
    },
    failure: {
      icon: <Flame className="w-3 h-3" />,
      color: 'text-success',
      testo: 'Spingi fino all\'ultima ripetizione pulita possibile',
    },
  };

  const cfg = configs[tipoSerie];
  if (!cfg) return null;

  return (
    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
      {cfg.icon}
      <span>{cfg.testo}</span>
    </div>
  );
};

// Sezione drop per Dropset durante il live
const DropsetLive = ({ drops, exIndex, logAllenamento, setLogAllenamento }) => {
  if (!drops?.length) return null;

  const aggiornaDropLog = (dropIndex, campo, valore) => {
    const nuovoLog = [...logAllenamento];
    if (!nuovoLog[exIndex].dropsLog) {
      nuovoLog[exIndex].dropsLog = drops.map(() => ({ kg: '', reps: '' }));
    }
    nuovoLog[exIndex].dropsLog[dropIndex][campo] = valore;
    setLogAllenamento(nuovoLog);
  };

  const dropsLog = logAllenamento[exIndex].dropsLog || drops.map(() => ({ kg: '', reps: '' }));

  return (
    <div className="mt-4 space-y-2">
      <div className="text-[10px] font-black uppercase tracking-wider text-error/70 px-1">Drop Sets</div>
      {drops.map((drop, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-error/5 border border-error/20 p-2 rounded-2xl">
          <div className="col-span-2 text-center font-black text-error/50 text-xs">D{i + 1}</div>
          <div className="col-span-5">
            <input
              type="number"
              placeholder={drop.peso || '0'}
              value={dropsLog[i]?.kg || ''}
              onChange={(e) => aggiornaDropLog(i, 'kg', e.target.value)}
              className="input input-bordered input-sm w-full text-center font-black focus:input-error bg-base-200"
            />
          </div>
          <div className="col-span-5">
            <input
              type="number"
              placeholder={drop.reps || '0'}
              value={dropsLog[i]?.reps || ''}
              onChange={(e) => aggiornaDropLog(i, 'reps', e.target.value)}
              className="input input-bordered input-sm w-full text-center font-black focus:input-error bg-base-200"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Info Rest-Pause live
const RestPauseLive = ({ restPauseSeconds, restPauseSets }) => {
  if (!restPauseSeconds && !restPauseSets) return null;
  return (
    <div className="mt-3 alert bg-info/10 border-info/20 py-2 px-3 rounded-xl">
      <PauseCircle className="w-4 h-4 text-info shrink-0" />
      <span className="text-info text-xs font-bold">
        {restPauseSets} mini-set · {restPauseSeconds}s pausa · stesso peso, no scarico
      </span>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
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

          const logIniziale = datiScheda.esercizi.map(es => ({
            nome: es.nome,
            targetReps: es.ripetizioni,
            modalita: es.modalita || 'fisso',
            tipoSerie: es.tipoSerie || 'normale',
            note: es.note,
            // Campi extra tipo serie
            drops: es.drops || null,
            pairedExercises: es.pairedExercises || null,
            restPauseSeconds: es.restPauseSeconds || null,
            restPauseSets: es.restPauseSets || null,
            toFailure: es.toFailure || false,
            serieFatte: Array.from({ length: parseInt(es.serie) || 1 }, () => ({ kg: '', reps: '' }))
          }));

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
    if (!auth.currentUser) return toast.error("Devi essere loggato!");
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

      {/* Header */}
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
        {logAllenamento.map((esercizio, exIndex) => {
          const tipoInfo = TIPI_SERIE[esercizio.tipoSerie] || TIPI_SERIE.normale;

          return (
            <div key={exIndex} className="card bg-base-200 border border-base-300 shadow-lg overflow-hidden">
              <div className="card-body p-5">

                {/* Header esercizio */}
                <div className="flex flex-col mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-black uppercase tracking-tight leading-tight">
                        {esercizio.nome}
                      </h2>
                    </div>

                    {/* Badges modalità + tipo serie */}
                    <div className="flex flex-col gap-1 items-end">
                      {esercizio.modalita && (
                        <div className={`badge badge-sm font-bold uppercase ${
                          esercizio.modalita === 'ramping'    ? 'badge-warning' :
                          esercizio.modalita === 'backoff'    ? 'badge-secondary' :
                          esercizio.modalita === 'piramidale' ? 'badge-accent' : 'badge-ghost'
                        }`}>
                          {esercizio.modalita}
                        </div>
                      )}
                      {esercizio.tipoSerie && esercizio.tipoSerie !== 'normale' && (
                        <div className={`badge badge-sm font-bold uppercase ${tipoInfo.badge}`}>
                          {tipoInfo.emoji} {tipoInfo.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Istruzioni dinamiche modalità */}
                  <div className="mt-3 px-1 space-y-1">
                    {esercizio.modalita === 'ramping' && (
                      <div className="flex items-center gap-2 text-[10px] text-warning font-black uppercase tracking-wider animate-pulse">
                        <TrendingUp className="w-3 h-3" /><span>Sali col peso ogni serie fino al limite</span>
                      </div>
                    )}
                    {esercizio.modalita === 'backoff' && (
                      <div className="flex items-center gap-2 text-[10px] text-secondary font-black uppercase tracking-wider">
                        <Activity className="w-3 h-3" /><span>1ª serie Top Set, poi scendi del 10-20%</span>
                      </div>
                    )}
                    {esercizio.modalita === 'piramidale' && (
                      <div className="flex items-center gap-2 text-[10px] text-accent font-black uppercase tracking-wider">
                        <ChevronsUp className="w-3 h-3" /><span>Sali col peso, scendi con le reps</span>
                      </div>
                    )}
                    {(esercizio.modalita === 'fisso' || !esercizio.modalita) && (
                      <div className="flex items-center gap-2 text-[10px] text-base-content/40 font-black uppercase tracking-wider">
                        <Target className="w-3 h-3" /><span>Mantieni lo stesso peso</span>
                      </div>
                    )}
                    {/* Istruzione tipo serie */}
                    <IstruzioneTipoSerie tipoSerie={esercizio.tipoSerie} esercizio={esercizio} />
                  </div>

                  {/* Target Reps */}
                  <div className="badge badge-outline font-bold text-[10px] opacity-40 mt-3">
                    Pianificato: {esercizio.targetReps} reps
                  </div>
                </div>

                {/* Note */}
                {esercizio.note && (
                  <div className="alert alert-info py-2 px-3 rounded-xl mb-4 bg-info/10 border-info/20 text-info text-xs font-semibold flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{esercizio.note}</span>
                  </div>
                )}

                {/* Alert sfinimento */}
                {esercizio.toFailure && (
                  <div className="alert bg-success/10 border-success/20 py-2 px-3 rounded-xl mb-4">
                    <Flame className="w-4 h-4 text-success shrink-0" />
                    <span className="text-success text-xs font-bold">Serie a sfinimento — spingi al massimo!</span>
                  </div>
                )}

                {/* Info Rest-Pause */}
                {esercizio.tipoSerie === 'restpause' && (
                  <RestPauseLive
                    restPauseSeconds={esercizio.restPauseSeconds}
                    restPauseSets={esercizio.restPauseSets}
                  />
                )}

                {/* Intestazione tabella */}
                <div className="grid grid-cols-12 gap-2 mb-2 px-2 mt-2">
                  <div className="col-span-2 text-[10px] font-black text-center opacity-30 uppercase">Set</div>
                  <div className="col-span-5 text-[10px] font-black text-center opacity-30 uppercase">Peso (KG)</div>
                  <div className="col-span-5 text-[10px] font-black text-center opacity-30 uppercase">Reps</div>
                </div>

                {/* Righe serie */}
                <div className="space-y-3">
                  {esercizio.serieFatte.map((serie, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center bg-base-100 p-2 rounded-2xl border border-base-300/50">
                      <div className="col-span-2 text-center font-black opacity-30 text-xs">
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

                {/* Dropset live (sotto le serie normali) */}
                {esercizio.tipoSerie === 'dropset' && esercizio.drops?.length > 0 && (
                  <DropsetLive
                    drops={esercizio.drops}
                    exIndex={exIndex}
                    logAllenamento={logAllenamento}
                    setLogAllenamento={setLogAllenamento}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer fine sessione */}
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