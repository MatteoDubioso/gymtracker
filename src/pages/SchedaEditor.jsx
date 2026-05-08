import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Save, ArrowLeft, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Config tipi di serie con badge e campi extra
const TIPI_SERIE = {
  normale: { label: 'Normale', badge: 'badge-ghost', emoji: '⚪' },
  dropset: { label: 'Dropset', badge: 'badge-error', emoji: '🔴' },
  superset: { label: 'Superset', badge: 'badge-warning', emoji: '🟡' },
  giantset: { label: 'Giant Set', badge: 'badge-accent', emoji: '🟣' },
  restpause: { label: 'Rest-Pause', badge: 'badge-info', emoji: '🔵' },
  failure: { label: 'Sfinimento', badge: 'badge-success', emoji: '🟢' },
};

// Componente campi extra per Dropset
const DropsetFields = ({ es, index, handleChange }) => {
  const drops = es.drops || [{ peso: '', reps: '' }];

  const aggiungiDrop = () => {
    handleChange(index, 'drops', [...drops, { peso: '', reps: '' }]);
  };

  const rimuoviDrop = (i) => {
    handleChange(index, 'drops', drops.filter((_, di) => di !== i));
  };

  const handleDropChange = (i, field, value) => {
    const nuovi = [...drops];
    nuovi[i][field] = value;
    handleChange(index, 'drops', nuovi);
  };

  return (
    <div className="mt-3 space-y-2">
      <label className="label py-1">
        <span className="label-text-alt font-black uppercase text-error/70">Drop Sets</span>
      </label>
      {drops.map((drop, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs font-black text-base-content/40 w-12">Drop {i + 1}</span>
          <input
            type="number"
            placeholder="Peso kg"
            value={drop.peso}
            onChange={(e) => handleDropChange(i, 'peso', e.target.value)}
            className="input input-bordered input-sm bg-base-100 font-bold focus:input-error flex-1"
          />
          <input
            type="number"
            placeholder="Reps"
            value={drop.reps}
            onChange={(e) => handleDropChange(i, 'reps', e.target.value)}
            className="input input-bordered input-sm bg-base-100 font-bold focus:input-error flex-1"
          />
          {drops.length > 1 && (
            <button onClick={() => rimuoviDrop(i)} className="btn btn-ghost btn-xs text-error">✕</button>
          )}
        </div>
      ))}
      <button onClick={aggiungiDrop} className="btn btn-outline btn-xs btn-error gap-1 mt-1">
        <Plus className="w-3 h-3" /> Aggiungi Drop
      </button>
    </div>
  );
};

// Componente campi extra per Superset / Giant Set
const SupersetFields = ({ es, index, handleChange, tipo }) => {
  const esercizi = es.pairedExercises || [''];
  const maxEsercizi = tipo === 'giantset' ? 4 : 1;

  const aggiungi = () => {
    if (esercizi.length < maxEsercizi) {
      handleChange(index, 'pairedExercises', [...esercizi, '']);
    }
  };

  const rimuovi = (i) => {
    handleChange(index, 'pairedExercises', esercizi.filter((_, ei) => ei !== i));
  };

  const handlePairChange = (i, value) => {
    const nuovi = [...esercizi];
    nuovi[i] = value;
    handleChange(index, 'pairedExercises', nuovi);
  };

  return (
    <div className="mt-3 space-y-2">
      <label className="label py-1">
        <span className="label-text-alt font-black uppercase text-warning/70">
          {tipo === 'giantset' ? 'Esercizi Abbinati (Giant Set)' : 'Esercizio Abbinato'}
        </span>
      </label>
      {esercizi.map((nome, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs font-black text-base-content/40 w-4">{i + 1}.</span>
          <input
            placeholder={`Es. Curl Manubri`}
            value={nome}
            onChange={(e) => handlePairChange(i, e.target.value)}
            className="input input-bordered input-sm bg-base-100 font-bold focus:input-warning flex-1"
          />
          {esercizi.length > 1 && (
            <button onClick={() => rimuovi(i)} className="btn btn-ghost btn-xs text-error">✕</button>
          )}
        </div>
      ))}
      {esercizi.length < maxEsercizi && (
        <button onClick={aggiungi} className="btn btn-outline btn-xs btn-warning gap-1 mt-1">
          <Plus className="w-3 h-3" /> Abbina Esercizio
        </button>
      )}
    </div>
  );
};

// Componente campi extra per Rest-Pause
const RestPauseFields = ({ es, index, handleChange }) => (
  <div className="mt-3 space-y-2">
    <label className="label py-1">
      <span className="label-text-alt font-black uppercase text-info/70">Parametri Rest-Pause</span>
    </label>
    <div className="grid grid-cols-2 gap-3">
      <div className="form-control">
        <label className="label py-1">
          <span className="label-text-alt font-black uppercase text-base-content/40">Pausa (sec)</span>
        </label>
        <input
          type="number"
          placeholder="15"
          value={es.restPauseSeconds || ''}
          onChange={(e) => handleChange(index, 'restPauseSeconds', e.target.value)}
          className="input input-bordered input-sm bg-base-100 font-bold focus:input-info"
        />
      </div>
      <div className="form-control">
        <label className="label py-1">
          <span className="label-text-alt font-black uppercase text-base-content/40">Mini-set</span>
        </label>
        <input
          type="number"
          placeholder="3"
          value={es.restPauseSets || ''}
          onChange={(e) => handleChange(index, 'restPauseSets', e.target.value)}
          className="input input-bordered input-sm bg-base-100 font-bold focus:input-info"
        />
      </div>
    </div>
  </div>
);

// Componente campi extra per Sfinimento
const FailureFields = ({ es, index, handleChange }) => (
  <div className="mt-3">
    <div className="alert bg-success/10 border border-success/20 py-2 px-3">
      <span className="text-success text-sm font-bold">
        🟢 Spingi fino all'impossibilità di completare un'altra ripetizione pulita.
      </span>
    </div>
    <div className="form-control mt-2">
      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          checked={es.toFailure || false}
          onChange={(e) => handleChange(index, 'toFailure', e.target.checked)}
          className="checkbox checkbox-success checkbox-sm"
        />
        <span className="label-text font-bold">Conferma: questa serie va a sfinimento</span>
      </label>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPALE ---
const SchedaEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [nomeGiorno, setNomeGiorno] = useState('');
  const [esercizi, setEsercizi] = useState([
    { nome: '', serie: '', ripetizioni: '', riposo: '', note: '', modalita: 'fisso', tipoSerie: 'normale' }
  ]);
  const [caricamento, setCaricamento] = useState(id ? true : false);

  useEffect(() => {
    if (id) {
      const caricaScheda = async () => {
        try {
          const docRef = doc(db, "workout_templates", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.utenteId || data.utenteId === auth.currentUser.uid) {
              setNomeGiorno(data.nome);
              setEsercizi(data.esercizi);
            } else {
              toast.error("Accesso negato");
              navigate('/');
            }
          } else {
            toast.error("Scheda non trovata");
            navigate('/');
          }
        } catch (error) {
          console.error("Errore:", error);
          toast.error("Errore di caricamento");
          navigate('/');
        } finally {
          setCaricamento(false);
        }
      };
      caricaScheda();
    }
  }, [id, navigate]);

  const aggiungiEsercizio = () => {
    setEsercizi([...esercizi, {
      nome: '', serie: '', ripetizioni: '', riposo: '', note: '',
      modalita: 'fisso', tipoSerie: 'normale'
    }]);
  };

  const rimuoviEsercizio = (index) => {
    setEsercizi(esercizi.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const nuoviEsercizi = [...esercizi];
    nuoviEsercizi[index][field] = value;
    // Reset campi extra quando cambia il tipo serie
    if (field === 'tipoSerie') {
      delete nuoviEsercizi[index].drops;
      delete nuoviEsercizi[index].pairedExercises;
      delete nuoviEsercizi[index].restPauseSeconds;
      delete nuoviEsercizi[index].restPauseSets;
      delete nuoviEsercizi[index].toFailure;
    }
    setEsercizi(nuoviEsercizi);
  };

  const salvaScheda = async () => {
    if (!nomeGiorno.trim()) return toast.error("Dai un nome alla scheda!");
    try {
      const datiScheda = {
        nome: nomeGiorno,
        esercizi: esercizi,
        utenteId: auth.currentUser.uid,
        aggiornatoIl: new Date()
      };
      if (id) {
        await updateDoc(doc(db, "workout_templates", id), datiScheda);
        toast.success("Scheda aggiornata! ✨");
      } else {
        datiScheda.creatoIl = new Date();
        await addDoc(collection(db, "workout_templates"), datiScheda);
        toast.success("Scheda creata! 💪");
      }
      navigate('/');
    } catch (e) {
      toast.error("Errore nel salvataggio : " + e.message);
    }
  };

  if (caricamento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 font-bold text-base-content/50 uppercase tracking-widest">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-6 max-w-2xl mx-auto pb-32">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm gap-2 normal-case">
          <ArrowLeft className="w-4 h-4" /> Annulla
        </button>
        <div className="badge badge-outline p-4 font-bold opacity-50 uppercase tracking-widest text-xs">
          Editor Workout
        </div>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-primary">
          {id ? 'Modifica Scheda' : 'Nuova Scheda'}
        </h1>
        <input
          type="text"
          value={nomeGiorno}
          onChange={(e) => setNomeGiorno(e.target.value)}
          className="input input-ghost w-full text-2xl font-black p-0 focus:bg-transparent border-b-2 border-primary rounded-none focus:outline-none placeholder:opacity-30"
          placeholder="ES: GIORNO A - PETTO"
        />
      </div>

      <div className="space-y-6">
        {esercizi.map((es, index) => {
          const tipoCorrente = TIPI_SERIE[es.tipoSerie || 'normale'];
          return (
            <div key={index} className="card bg-base-200 border border-base-300 shadow-md relative group">
              <div className="card-body p-5">

                {/* Tasto Rimuovi */}
                <button
                  onClick={() => rimuoviEsercizio(index)}
                  className="btn btn-circle btn-ghost btn-xs absolute top-4 right-4 text-error opacity-30 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-5">
                  {/* Nome Esercizio */}
                  <input
                    placeholder="Nome Esercizio (es. Panca Piana)"
                    value={es.nome}
                    onChange={(e) => handleChange(index, 'nome', e.target.value)}
                    className="input input-ghost font-black text-lg p-0 focus:bg-transparent border-b border-base-content/10 rounded-none w-10/12 focus:outline-none focus:border-primary"
                  />

                  {/* Riga: Modalità + Tipo Serie */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text-alt font-black uppercase text-base-content/40">Modalità</span>
                      </label>
                      <select
                        value={es.modalita || 'fisso'}
                        onChange={(e) => handleChange(index, 'modalita', e.target.value)}
                        className="select select-bordered select-sm bg-base-100 font-bold focus:select-primary"
                      >
                        <option value="fisso">Carico Fisso</option>
                        <option value="ramping">Ramping</option>
                        <option value="backoff">Top Set + Back-off</option>
                        <option value="piramidale">Piramidale</option>
                      </select>
                    </div>

                    {/* NUOVO: Tipo Serie */}
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text-alt font-black uppercase text-base-content/40">Tipo Serie</span>
                      </label>
                      <select
                        value={es.tipoSerie || 'normale'}
                        onChange={(e) => handleChange(index, 'tipoSerie', e.target.value)}
                        className="select select-bordered select-sm bg-base-100 font-bold focus:select-primary"
                      >
                        {Object.entries(TIPI_SERIE).map(([key, val]) => (
                          <option key={key} value={key}>{val.emoji} {val.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Badge tipo serie attivo */}
                  {es.tipoSerie && es.tipoSerie !== 'normale' && (
                    <div className="flex items-center gap-2">
                      <span className={`badge ${tipoCorrente.badge} font-black uppercase tracking-widest text-xs`}>
                        {tipoCorrente.emoji} {tipoCorrente.label}
                      </span>
                    </div>
                  )}

                  {/* Griglia Parametri */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text-alt font-black uppercase text-base-content/40">Serie</span>
                      </label>
                      <input
                        type="number"
                        value={es.serie}
                        onChange={(e) => handleChange(index, 'serie', e.target.value)}
                        className="input input-bordered bg-base-100 font-bold focus:input-primary"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text-alt font-black uppercase text-base-content/40">Reps</span>
                      </label>
                      <input
                        placeholder="8-10"
                        value={es.ripetizioni}
                        onChange={(e) => handleChange(index, 'ripetizioni', e.target.value)}
                        className="input input-bordered bg-base-100 font-bold focus:input-primary"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text-alt font-black uppercase text-base-content/40">Rest</span>
                      </label>
                      <input
                        placeholder="90s"
                        value={es.riposo}
                        onChange={(e) => handleChange(index, 'riposo', e.target.value)}
                        className="input input-bordered bg-base-100 font-bold focus:input-primary"
                      />
                    </div>
                  </div>

                  {/* CAMPI EXTRA dinamici per tipo serie */}
                  {es.tipoSerie === 'dropset' && (
                    <DropsetFields es={es} index={index} handleChange={handleChange} />
                  )}
                  {(es.tipoSerie === 'superset' || es.tipoSerie === 'giantset') && (
                    <SupersetFields es={es} index={index} handleChange={handleChange} tipo={es.tipoSerie} />
                  )}
                  {es.tipoSerie === 'restpause' && (
                    <RestPauseFields es={es} index={index} handleChange={handleChange} />
                  )}
                  {es.tipoSerie === 'failure' && (
                    <FailureFields es={es} index={index} handleChange={handleChange} />
                  )}

                  {/* Note */}
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-info">
                      <Info className="w-4 h-4" />
                    </div>
                    <input
                      placeholder="Note esecuzione (es. presa stretta...)"
                      value={es.note || ''}
                      onChange={(e) => handleChange(index, 'note', e.target.value)}
                      className="input input-bordered w-full pl-10 text-sm bg-info/5 border-info/20 text-info font-medium placeholder:text-info/30 focus:outline-info/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100/90 backdrop-blur-md border-t border-base-300 p-4 z-20">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button onClick={aggiungiEsercizio} className="btn btn-outline flex-1 border-2 font-black">
            <Plus className="w-5 h-5 mr-1" /> ESERCIZIO
          </button>
          <button onClick={salvaScheda} className="btn btn-primary flex-1 font-black shadow-lg shadow-primary/20">
            <Save className="w-5 h-5 mr-1" /> SALVA SCHEDA
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedaEditor;